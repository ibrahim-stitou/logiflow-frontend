import { computed, inject, Service, signal } from "@angular/core";
import { httpErrorMessage } from "../core/api/http-error";
import type {
  ConversationCopilote,
  EtatCopilote,
  EvenementCopilote,
  MessageCopilote,
  SourceCopilote,
  StatutMessage,
  StatutOutil,
} from "./copilote";
import { CopiloteApi } from "./copilote-api";

export interface OutilVue {
  libelle: string;
  nom: string;
  statut: StatutOutil;
}

/**
 * Message tel qu'affiché : enrichi de l'état du flux (outils, erreur, avis).
 * Pour un message utilisateur, `statut` est son statut d'envoi : `en_cours`
 * (envoi…), `complet` (reçu par le copilote) ou `erreur` (échec d'envoi).
 */
export interface MessageVue {
  contenu: string;
  creeLe: string;
  erreur: string | null;
  id: string;
  note: -1 | 1 | null;
  outils: OutilVue[];
  role: MessageCopilote["role"];
  sources: SourceCopilote[];
  statut: StatutMessage;
}

let compteurTemporaire = 0;
function idTemporaire(prefixe: string): string {
  compteurTemporaire += 1;
  return `${prefixe}-${compteurTemporaire}`;
}

function versVue(message: MessageCopilote): MessageVue {
  return {
    contenu: message.contenu,
    creeLe: message.creeLe,
    erreur: null,
    id: message.id,
    note: null,
    outils: [],
    role: message.role,
    sources: message.sources,
    statut: message.statut,
  };
}

/**
 * État du copilote (signals), partagé par le bouton du header et le panneau :
 * ouverture, disponibilité du service, conversations, messages et flux en cours.
 */
@Service()
export class CopiloteStore {
  private readonly api = inject(CopiloteApi);
  private controleur: AbortController | null = null;

  readonly ouvert = signal(false);
  readonly etat = signal<EtatCopilote | null>(null);
  readonly conversations = signal<ConversationCopilote[]>([]);
  readonly conversationsChargees = signal(false);
  readonly conversationActiveId = signal<string | null>(null);
  readonly messages = signal<MessageVue[]>([]);
  readonly chargement = signal(false);
  readonly enCours = signal(false);
  /** Horodatage (ms) du début de la réponse en cours, pour le chronomètre. */
  readonly debutReponse = signal<number | null>(null);
  readonly erreur = signal<string | null>(null);

  readonly conversationActive = computed(
    () =>
      this.conversations().find((c) => c.id === this.conversationActiveId()) ??
      null
  );

  basculer(): void {
    this.ouvert.update((ouvert) => !ouvert);
  }

  /** Ouvre le panneau (sheet) sans basculer. */
  ouvrirPanneau(): void {
    this.ouvert.set(true);
  }

  fermer(): void {
    this.ouvert.set(false);
  }

  async verifierEtat(): Promise<void> {
    try {
      this.etat.set(await this.api.etat());
    } catch {
      // L'appel à Spring lui-même a échoué : distinct d'un service IA hors ligne.
      this.etat.set({
        backendJoignable: false,
        base: "INCONNU",
        llm: "INCONNU",
        modele: null,
        operationnel: false,
        serviceIa: false,
      });
    }
  }

  async chargerConversations(): Promise<void> {
    try {
      this.conversations.set(await this.api.listerConversations());
    } catch (error) {
      this.erreur.set(httpErrorMessage(error));
    } finally {
      this.conversationsChargees.set(true);
    }
  }

  async ouvrir(id: string): Promise<void> {
    if (this.enCours()) {
      this.arreter();
    }
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      const detail = await this.api.obtenirConversation(id);
      this.conversationActiveId.set(detail.id);
      this.messages.set(detail.messages.map(versVue));
    } catch (error) {
      this.erreur.set(httpErrorMessage(error));
    } finally {
      this.chargement.set(false);
    }
  }

  nouvelle(): void {
    if (this.enCours()) {
      this.arreter();
    }
    this.conversationActiveId.set(null);
    this.messages.set([]);
    this.erreur.set(null);
  }

  async envoyer(question: string): Promise<void> {
    const texte = question.trim();
    if (!texte || this.enCours()) {
      return;
    }
    this.erreur.set(null);
    this.enCours.set(true);
    const maintenant = new Date();
    this.debutReponse.set(maintenant.getTime());

    const questionId = idTemporaire("user");
    const reponseId = idTemporaire("assistant");
    this.messages.update((messages) => [
      ...messages,
      {
        contenu: texte,
        creeLe: maintenant.toISOString(),
        erreur: null,
        id: questionId,
        note: null,
        outils: [],
        role: "user",
        sources: [],
        statut: "en_cours",
      },
      {
        contenu: "",
        creeLe: maintenant.toISOString(),
        erreur: null,
        id: reponseId,
        note: null,
        outils: [],
        role: "assistant",
        sources: [],
        statut: "en_cours",
      },
    ]);

    const controleur = new AbortController();
    this.controleur = controleur;
    let idCourant = reponseId;
    try {
      const conversationId = await this.conversationPourEnvoi();
      await this.api.envoyerMessage(
        conversationId,
        texte,
        (evenement) => {
          if (evenement.nom === "meta") {
            // Le service IA a enregistré la question : elle est « envoyée ».
            this.modifier(questionId, (m) => ({ ...m, statut: "complet" }));
          }
          idCourant = this.appliquer(idCourant, evenement);
        },
        controleur.signal
      );
      this.modifier(idCourant, (m) =>
        m.statut === "en_cours" ? { ...m, statut: "complet" } : m
      );
    } catch (error) {
      if (controleur.signal.aborted) {
        this.modifier(idCourant, (m) => ({ ...m, statut: "interrompu" }));
      } else {
        const message = httpErrorMessage(error);
        this.modifier(idCourant, (m) => ({
          ...m,
          erreur: message,
          statut: "erreur",
        }));
      }
      // Question jamais parvenue au service IA : échec d'envoi.
      this.modifier(questionId, (m) =>
        m.statut === "en_cours" ? { ...m, statut: "erreur" } : m
      );
    } finally {
      this.controleur = null;
      this.enCours.set(false);
      this.debutReponse.set(null);
      this.toucherConversationActive();
    }
  }

  arreter(): void {
    this.controleur?.abort();
  }

  async renommer(id: string, titre: string): Promise<void> {
    const nouveauTitre = titre.trim();
    if (!nouveauTitre) {
      return;
    }
    try {
      const renommee = await this.api.renommerConversation(id, nouveauTitre);
      this.conversations.update((liste) =>
        liste.map((c) => (c.id === id ? renommee : c))
      );
    } catch (error) {
      this.erreur.set(httpErrorMessage(error));
    }
  }

  async supprimer(id: string): Promise<void> {
    try {
      await this.api.supprimerConversation(id);
      this.conversations.update((liste) => liste.filter((c) => c.id !== id));
      if (this.conversationActiveId() === id) {
        this.nouvelle();
      }
    } catch (error) {
      this.erreur.set(httpErrorMessage(error));
    }
  }

  async noter(messageId: string, note: -1 | 1): Promise<void> {
    const precedente =
      this.messages().find((m) => m.id === messageId)?.note ?? null;
    this.modifier(messageId, (m) => ({ ...m, note }));
    try {
      await this.api.noterMessage(messageId, note);
    } catch (error) {
      this.modifier(messageId, (m) => ({ ...m, note: precedente }));
      this.erreur.set(httpErrorMessage(error));
    }
  }

  private async conversationPourEnvoi(): Promise<string> {
    const active = this.conversationActiveId();
    if (active) {
      return active;
    }
    const conversation = await this.api.creerConversation();
    this.conversations.update((liste) => [conversation, ...liste]);
    this.conversationActiveId.set(conversation.id);
    return conversation.id;
  }

  /** Remonte la conversation active en tête de l'historique (dernière activité). */
  private toucherConversationActive(): void {
    const id = this.conversationActiveId();
    if (!id) {
      return;
    }
    const maintenant = new Date().toISOString();
    this.conversations.update((liste) => {
      const active = liste.find((c) => c.id === id);
      if (!active) {
        return liste;
      }
      return [
        { ...active, modifieLe: maintenant },
        ...liste.filter((c) => c.id !== id),
      ];
    });
  }

  /** Applique un événement du flux ; renvoie l'identifiant (définitif) du message. */
  private appliquer(id: string, evenement: EvenementCopilote): string {
    switch (evenement.nom) {
      case "meta": {
        const { messageId } = evenement.donnees;
        this.modifier(id, (m) => ({ ...m, id: messageId }));
        return messageId;
      }
      case "token":
        this.modifier(id, (m) => ({
          ...m,
          contenu: m.contenu + evenement.donnees.texte,
        }));
        return id;
      case "outil": {
        const outil = evenement.donnees;
        this.modifier(id, (m) => ({
          ...m,
          outils: [...m.outils.filter((o) => o.nom !== outil.nom), outil],
        }));
        return id;
      }
      case "sources":
        this.modifier(id, (m) => ({
          ...m,
          sources: evenement.donnees.sources,
        }));
        return id;
      case "titre": {
        const conversationId = this.conversationActiveId();
        this.conversations.update((liste) =>
          liste.map((c) =>
            c.id === conversationId
              ? { ...c, titre: evenement.donnees.titre }
              : c
          )
        );
        return id;
      }
      case "fin":
        this.modifier(id, (m) => ({ ...m, statut: "complet" }));
        return id;
      case "erreur":
        this.modifier(id, (m) => ({
          ...m,
          erreur: evenement.donnees.message,
          statut: "erreur",
        }));
        return id;
      default:
        return id;
    }
  }

  private modifier(
    id: string,
    transformation: (m: MessageVue) => MessageVue
  ): void {
    this.messages.update((messages) =>
      messages.map((m) => (m.id === id ? transformation(m) : m))
    );
  }
}
