import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import { KeycloakSessionService } from "../core/auth/keycloak-session";
import { SessionUtilisateur } from "../core/auth/session";
import type {
  ConversationCopilote,
  ConversationCopiloteDetail,
  EtatCopilote,
  EvenementCopilote,
} from "./copilote";
import { decoderEvenement, ParseurSse } from "./copilote-sse";

/** Échec HTTP du flux (avant son ouverture) : statut + message lisible. */
export class CopiloteFluxError extends Error {
  readonly status: number;

  constructor(message: string, options: ErrorOptions & { status: number }) {
    super(message, { cause: options.cause });
    this.name = "CopiloteFluxError";
    this.status = options.status;
  }
}

const MESSAGE_INDISPONIBLE =
  "Le copilote est momentanément indisponible. Réessayez dans quelques instants.";

/**
 * Façade du copilote — /api/v1/ia/copilote/**. Spring relaie vers le service IA ;
 * les réponses sont streamées en text/event-stream et lues avec fetch
 * (EventSource ne sait pas envoyer de POST).
 */
@Service()
export class CopiloteApi {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionUtilisateur);
  private readonly baseUrl = `${environment.apiBaseUrl}/ia/copilote`;

  etat(): Promise<EtatCopilote> {
    return firstValueFrom(this.http.get<EtatCopilote>(`${this.baseUrl}/etat`));
  }

  listerConversations(): Promise<ConversationCopilote[]> {
    return firstValueFrom(
      this.http.get<ConversationCopilote[]>(`${this.baseUrl}/conversations`)
    );
  }

  creerConversation(titre?: string): Promise<ConversationCopilote> {
    return firstValueFrom(
      this.http.post<ConversationCopilote>(`${this.baseUrl}/conversations`, {
        titre: titre ?? null,
      })
    );
  }

  obtenirConversation(id: string): Promise<ConversationCopiloteDetail> {
    return firstValueFrom(
      this.http.get<ConversationCopiloteDetail>(this.urlConversation(id))
    );
  }

  renommerConversation(
    id: string,
    titre: string
  ): Promise<ConversationCopilote> {
    return firstValueFrom(
      this.http.patch<ConversationCopilote>(this.urlConversation(id), {
        titre,
      })
    );
  }

  async supprimerConversation(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(this.urlConversation(id)));
  }

  async noterMessage(messageId: string, note: -1 | 1): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        `${this.baseUrl}/messages/${encodeURIComponent(messageId)}/feedback`,
        { note }
      )
    );
  }

  /**
   * Envoie une question et appelle `surEvenement` pour chaque événement du flux,
   * jusqu'à sa fin. `signal` interrompt la lecture (bouton Stop) : Spring ferme
   * alors la connexion au service IA, qui arrête la génération.
   */
  async envoyerMessage(
    conversationId: string,
    question: string,
    surEvenement: (evenement: EvenementCopilote) => void,
    signal?: AbortSignal
  ): Promise<void> {
    let reponse: Response;
    try {
      reponse = await this.fetchFluxMessages(
        conversationId,
        question,
        signal,
        false
      );
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      throw new CopiloteFluxError(MESSAGE_INDISPONIBLE, {
        cause: error,
        status: 0,
      });
    }
    if (reponse.status === 401 && !signal?.aborted) {
      const keycloak =
        this.session instanceof KeycloakSessionService ? this.session : null;
      if (keycloak) {
        await keycloak.forcerRenouvellement();
        reponse = await this.fetchFluxMessages(
          conversationId,
          question,
          signal,
          true
        );
      }
    }

    if (!(reponse.ok && reponse.body)) {
      throw new CopiloteFluxError(await detailErreur(reponse), {
        status: reponse.status,
      });
    }

    const lecteur = reponse.body.getReader();
    const decodeur = new TextDecoder();
    const parseur = new ParseurSse();
    const emettre = (bruts: ReturnType<ParseurSse["pousser"]>): void => {
      for (const brut of bruts) {
        const evenement = decoderEvenement(brut);
        if (evenement) {
          surEvenement(evenement);
        }
      }
    };
    // biome-ignore lint/performance/noAwaitInLoops: lecture séquentielle d'un flux, fragment après fragment.
    for (let lu = await lecteur.read(); !lu.done; lu = await lecteur.read()) {
      emettre(parseur.pousser(decodeur.decode(lu.value, { stream: true })));
    }
    emettre(parseur.pousser(decodeur.decode()));
    emettre(parseur.terminer());
  }

  private urlConversation(id: string): string {
    return `${this.baseUrl}/conversations/${encodeURIComponent(id)}`;
  }

  private async fetchFluxMessages(
    conversationId: string,
    question: string,
    signal: AbortSignal | undefined,
    apresRenouvellement: boolean
  ): Promise<Response> {
    const jeton = await this.session.jetonAcces();
    return fetch(`${this.urlConversation(conversationId)}/messages`, {
      body: JSON.stringify({ question }),
      credentials: "same-origin",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
        ...(apresRenouvellement ? { "X-Logiflow-Auth-Retry": "1" } : {}),
      },
      method: "POST",
      signal,
    });
  }
}

async function detailErreur(reponse: Response): Promise<string> {
  if (reponse.status >= 502) {
    return MESSAGE_INDISPONIBLE;
  }
  try {
    const corps: unknown = await reponse.json();
    if (typeof corps === "object" && corps !== null && "detail" in corps) {
      const { detail } = corps as { detail: unknown };
      if (typeof detail === "string" && detail.length > 0) {
        return detail;
      }
    }
  } catch {
    // Corps non JSON : message générique ci-dessous.
  }
  return `Le copilote n'a pas pu répondre (HTTP ${reponse.status}).`;
}
