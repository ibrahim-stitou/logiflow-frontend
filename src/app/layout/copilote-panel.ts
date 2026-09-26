import {
  afterNextRender,
  Component,
  computed,
  type ElementRef,
  effect,
  Injector,
  inject,
  type OnDestroy,
  signal,
  untracked,
  viewChild,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideCheck,
  lucideCircleAlert,
  lucideClock,
  lucideLoaderCircle,
  lucideMessageSquare,
  lucidePanelLeft,
  lucidePencil,
  lucidePlus,
  lucideRefreshCw,
  lucideSend,
  lucideSparkles,
  lucideSquare,
  lucideThumbsDown,
  lucideThumbsUp,
  lucideTrash2,
  lucideWrench,
} from "@ng-icons/lucide";
import { ZardButtonComponent } from "@/shared/components/button";
import {
  afficherEtat,
  COPILOTE_QUESTION_MAX_LENGTH,
  COPILOTE_SUGGESTIONS,
  type ConversationCopilote,
  canSubmitCopiloteQuestion,
  formatDateRelative,
  formatDuree,
  formatHeure,
  libelleTypeSource,
  routeSource,
} from "../ia/copilote";
import { renderMarkdown } from "../ia/copilote-markdown";
import { CopiloteStore } from "../ia/copilote-store";

/** Rafraîchissement de la pastille d'état tant que le panneau est ouvert. */
const INTERVALLE_ETAT_MS = 30_000;
const INTERVALLE_HORLOGE_MS = 1000;

/**
 * Contenu du copilote projeté dans un Zard sheet (panneau droit) :
 * historique, fil de messages et saisie. Fermeture : Escape, croix sheet, clic masque.
 */
@Component({
  imports: [NgIcon, RouterLink, ZardButtonComponent],
  providers: [
    provideIcons({
      lucideCheck,
      lucideCircleAlert,
      lucideClock,
      lucideLoaderCircle,
      lucideMessageSquare,
      lucidePanelLeft,
      lucidePencil,
      lucidePlus,
      lucideRefreshCw,
      lucideSend,
      lucideSparkles,
      lucideSquare,
      lucideThumbsDown,
      lucideThumbsUp,
      lucideTrash2,
      lucideWrench,
    }),
  ],
  selector: "app-copilote-panel",
  styleUrl: "./copilote-panel.css",
  templateUrl: "./copilote-panel.html",
})
export class CopilotePanel implements OnDestroy {
  protected readonly store = inject(CopiloteStore);
  private readonly injector = inject(Injector);

  private readonly saisie =
    viewChild<ElementRef<HTMLTextAreaElement>>("saisie");
  private readonly fil = viewChild<ElementRef<HTMLElement>>("fil");

  protected readonly questionMaxLength = COPILOTE_QUESTION_MAX_LENGTH;
  protected readonly suggestions = COPILOTE_SUGGESTIONS;
  protected readonly routeSource = routeSource;
  protected readonly libelleTypeSource = libelleTypeSource;
  protected readonly formatHeure = formatHeure;

  protected readonly question = signal("");
  /** Colonne historique visible sur petit écran (toujours visible en large). */
  protected readonly historiqueMobile = signal(false);
  protected readonly renommageId = signal<string | null>(null);
  protected readonly suppressionId = signal<string | null>(null);
  protected readonly maintenant = signal(Date.now());

  protected readonly etat = computed(() => afficherEtat(this.store.etat()));
  protected readonly peutEnvoyer = computed(
    () => canSubmitCopiloteQuestion(this.question()) && !this.store.enCours()
  );
  protected readonly titre = computed(
    () => this.store.conversationActive()?.titre ?? "Nouvelle conversation"
  );
  protected readonly dureeReponse = computed(() => {
    const debut = this.store.debutReponse();
    return debut === null ? "" : formatDuree(this.maintenant() - debut);
  });

  /** Rendu Markdown mémoïsé par contenu (les tokens arrivent un à un). */
  private readonly cacheMarkdown = new Map<string, string>();

  constructor() {
    effect((onCleanup) => {
      untracked(() => {
        if (!this.store.conversationsChargees()) {
          this.store.chargerConversations();
        }
        this.store.verifierEtat();
      });
      const minuterie = setInterval(
        () => this.store.verifierEtat(),
        INTERVALLE_ETAT_MS
      );
      this.focaliserSaisie();
      onCleanup(() => clearInterval(minuterie));
    });

    effect((onCleanup) => {
      if (!this.store.enCours()) {
        return;
      }
      this.maintenant.set(Date.now());
      const horloge = setInterval(
        () => this.maintenant.set(Date.now()),
        INTERVALLE_HORLOGE_MS
      );
      onCleanup(() => clearInterval(horloge));
    });

    effect(() => {
      this.store.messages();
      afterNextRender(
        () => {
          const fil = this.fil()?.nativeElement;
          if (fil) {
            fil.scrollTop = fil.scrollHeight;
          }
        },
        { injector: this.injector }
      );
    });
  }

  ngOnDestroy(): void {
    this.store.arreter();
  }

  protected dateRelative(conversation: ConversationCopilote): string {
    return formatDateRelative(conversation.modifieLe, this.maintenant());
  }

  protected html(contenu: string): string {
    let rendu = this.cacheMarkdown.get(contenu);
    if (rendu === undefined) {
      rendu = renderMarkdown(contenu);
      if (this.cacheMarkdown.size > 200) {
        this.cacheMarkdown.clear();
      }
      this.cacheMarkdown.set(contenu, rendu);
    }
    return rendu;
  }

  protected onQuestionInput(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLTextAreaElement) {
      this.question.set(target.value);
    }
  }

  protected onQuestionKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.envoyer();
    }
  }

  protected onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.envoyer();
  }

  protected poser(suggestion: string): void {
    this.question.set(suggestion);
    this.envoyer();
  }

  protected envoyer(): void {
    if (!this.peutEnvoyer()) {
      return;
    }
    const question = this.question();
    this.question.set("");
    this.store.envoyer(question);
    this.focaliserSaisie();
  }

  protected nouvelle(): void {
    this.store.nouvelle();
    this.historiqueMobile.set(false);
    this.focaliserSaisie();
  }

  protected async ouvrirConversation(
    conversation: ConversationCopilote
  ): Promise<void> {
    this.historiqueMobile.set(false);
    if (conversation.id === this.store.conversationActiveId()) {
      return;
    }
    await this.store.ouvrir(conversation.id);
    this.focaliserSaisie();
  }

  protected async validerRenommage(id: string, event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const champ = form.elements.namedItem("titre");
    if (champ instanceof HTMLInputElement) {
      await this.store.renommer(id, champ.value);
    }
    this.renommageId.set(null);
  }

  protected async confirmerSuppression(id: string): Promise<void> {
    this.suppressionId.set(null);
    await this.store.supprimer(id);
  }

  private focaliserSaisie(): void {
    afterNextRender(() => this.saisie()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }
}
