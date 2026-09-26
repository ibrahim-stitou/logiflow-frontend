import { httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  inject,
  input,
  signal,
  booleanAttribute,
} from "@angular/core";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideExternalLink,
  lucideFileText,
  lucideTrash2,
  lucideUpload,
} from "@ng-icons/lucide";
import { environment } from "../../../environments/environment";
import {
  etatValidite,
  etatValiditeLabel,
  etatValiditeTone,
} from "../../chauffeurs/chauffeur";
import { httpErrorMessage } from "../../core/api/http-error";
import {
  DOCUMENT_TYPES_PAR_ENTITE,
  type Document,
  type DocumentType,
  documentSuitExpiration,
  documentTypeLabel,
  formatDocumentExpiration,
  isDocumentType,
  type TypeEntiteDocumentable,
} from "../../documents/document";
import { DocumentApi } from "../../documents/document-api";
import { enumToSelectOptions } from "./field-select";
import { FORM_PAGE_IMPORTS } from "./form-page";
import { StatutChip } from "./statut-chip";
import { ToastService } from "./toast";

/**
 * Pièces justificatives d'une entité (liste, ouverture, suppression, téléversement).
 * Ouverture via GET authentifié `/documents/{id}/contenu` (blob), pas via `/fichiers/**`.
 */
@Component({
  imports: [NgIcon, StatutChip, ...FORM_PAGE_IMPORTS],
  selector: "app-documents-section",
  viewProviders: [
    provideIcons({
      lucideExternalLink,
      lucideFileText,
      lucideTrash2,
      lucideUpload,
    }),
  ],
  template: `
    <app-form-section [description]="description()" title="Documents">
      @if (documents.isLoading()) {
        <p class="text-sm text-muted" role="status">Chargement…</p>
      } @else if (documents.error()) {
        <div class="alert-panel" role="alert">
          <p>{{ erreurChargement() }}</p>
          <button
            (click)="documents.reload()"
            class="pressable mt-2 font-medium text-ink underline underline-offset-2"
            type="button"
          >
            Réessayer
          </button>
        </div>
      } @else if (documents.hasValue()) {
        @if (documents.value().length === 0) {
          <div
            class="flex flex-col items-center gap-2 rounded-[calc(var(--radius-xl)-1rem)] border border-dashed border-line/90 bg-canvas/60 px-4 py-8 text-center"
          >
            <ng-icon
              aria-hidden="true"
              class="size-8 text-muted opacity-70"
              name="lucideFileText"
            />
            <p class="text-sm font-medium text-ink">Aucun document</p>
            <p class="max-w-sm text-xs text-muted">{{ emptyHint() }}</p>
          </div>
        } @else {
          <ul class="flex flex-col gap-2">
            @for (document of documents.value(); track document.id) {
              <li
                class="group flex items-center gap-3 rounded-[calc(var(--radius-xl)-1rem)] border border-line/80 bg-canvas px-3 py-2.5 shadow-[inset_0_1px_2px_oklch(0_0_0/0.02)] transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:border-pine/35"
              >
                <div
                  class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pine/8 text-pine"
                >
                  <ng-icon
                    aria-hidden="true"
                    class="size-5"
                    name="lucideFileText"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                    <span class="truncate">{{
                      documentTypeLabel(document.typeDocument)
                    }}</span>
                    @if (dateExpirationSuivie(document); as dateExp) {
                      <app-statut-chip
                        [label]="etatLabel(dateExp)"
                        [tone]="etatTone(dateExp)"
                      />
                    }
                  </p>
                  @if (document.reference) {
                    <p class="mt-0.5 truncate text-xs text-muted">
                      {{ document.reference }}
                    </p>
                  }
                  @if (dateExpirationSuivie(document); as dateExp) {
                    <p class="mt-0.5 font-mono text-[0.7rem] tabular-nums text-muted">
                      Expire le {{ formatDocumentExpiration(dateExp) }}
                    </p>
                  }
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    (click)="ouvrir(document)"
                    [attr.aria-label]="'Ouvrir ' + documentTypeLabel(document.typeDocument)"
                    [disabled]="ouvertureId() === document.id"
                    class="pressable inline-flex size-10 items-center justify-center rounded-lg text-pine transition-[background-color,color,opacity] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-pine/10 disabled:opacity-50"
                    type="button"
                  >
                    <ng-icon
                      aria-hidden="true"
                      class="size-4"
                      name="lucideExternalLink"
                    />
                  </button>
                  @if (modifiable()) {
                    <button
                      (click)="supprimer(document.id)"
                      [attr.aria-label]="'Supprimer ' + documentTypeLabel(document.typeDocument)"
                      class="pressable inline-flex size-10 items-center justify-center rounded-lg text-brake transition-[background-color,opacity] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-brake/8"
                      type="button"
                    >
                      <ng-icon
                        aria-hidden="true"
                        class="size-4"
                        name="lucideTrash2"
                      />
                    </button>
                  }
                </div>
              </li>
            }
          </ul>
        }

        @if (modifiable()) {
          <div
            class="rounded-[calc(var(--radius-xl)-1rem)] border border-line/80 bg-canvas/80 p-3 sm:p-4"
          >
            <p class="mb-3 text-xs font-medium tracking-wide text-muted uppercase">
              Téléverser
            </p>
            <form (submit)="televerser($event)" class="flex flex-col gap-3" novalidate>
              <label
                [attr.for]="prefixe() + '-fichier'"
                class="pressable flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-line/90 bg-surface px-4 py-5 text-center transition-[border-color,background-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:border-pine/40 hover:bg-pine/4"
              >
                <ng-icon
                  aria-hidden="true"
                  class="size-6 text-pine"
                  name="lucideUpload"
                />
                <span class="text-sm font-medium text-ink">
                  @if (fichier(); as f) {
                    {{ f.name }}
                  } @else {
                    Choisir un fichier
                  }
                </span>
                <span class="text-xs text-muted">PDF, PNG, JPG ou WebP</span>
                <input
                  (change)="onFichier($event)"
                  [id]="prefixe() + '-fichier'"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  class="sr-only"
                  type="file"
                />
              </label>

              <div
                [class]="
                  saisieExpiration()
                    ? 'grid grid-cols-1 gap-3 sm:grid-cols-3'
                    : 'grid grid-cols-1 gap-3 sm:grid-cols-2'
                "
              >
                <app-form-field [inputId]="prefixe() + '-type'" label="Type">
                  <app-field-select
                    (selectValueChange)="onType($event)"
                    [inputId]="prefixe() + '-type'"
                    [options]="typeOptions()"
                    [selectValue]="typeDocument()"
                  />
                </app-form-field>
                <app-form-field
                  [inputId]="prefixe() + '-reference'"
                  label="Référence"
                >
                  <input
                    (input)="onReference($event)"
                    [id]="prefixe() + '-reference'"
                    [value]="reference()"
                    class="field"
                    placeholder="Facultatif"
                    type="text"
                  />
                </app-form-field>
                @if (saisieExpiration()) {
                  <app-form-field
                    [inputId]="prefixe() + '-expiration'"
                    label="Expiration"
                  >
                    <app-iso-date-input
                      (isoDateChange)="expiration.set($event)"
                      [inputId]="prefixe() + '-expiration'"
                      [isoDate]="expiration()"
                    />
                  </app-form-field>
                }
              </div>

              @if (erreur()) {
                <div class="alert-panel" role="alert">{{ erreur() }}</div>
              }

              <div class="flex justify-end">
                <button
                  [disabled]="envoi() || !fichier()"
                  class="btn-toolbar pressable"
                  type="submit"
                >
                  <ng-icon
                    aria-hidden="true"
                    class="btn-toolbar__icon"
                    name="lucideUpload"
                  />
                  <span>{{ envoi() ? "Envoi…" : "Téléverser" }}</span>
                </button>
              </div>
            </form>
          </div>
        }
      }
    </app-form-section>
  `,
})
export class DocumentsSection {
  private readonly documentApi = inject(DocumentApi);
  private readonly toast = inject(ToastService);

  readonly typeEntite = input.required<TypeEntiteDocumentable>();
  readonly entiteId = input.required<string>();
  readonly description = input(
    "Pièces facultatives. L'expiration n'est suivie que pour les titres à durée limitée."
  );
  /** When false, hide upload and delete (read-only fiche). */
  readonly modifiable = input(true, { transform: booleanAttribute });

  protected readonly documentTypeLabel = documentTypeLabel;
  protected readonly formatDocumentExpiration = formatDocumentExpiration;

  protected readonly prefixe = computed(
    () => `doc-${this.typeEntite().toLowerCase()}`
  );
  protected readonly typeOptions = computed(() =>
    enumToSelectOptions(
      DOCUMENT_TYPES_PAR_ENTITE[this.typeEntite()],
      documentTypeLabel
    )
  );

  protected readonly fichier = signal<File | null>(null);
  protected readonly typeDocumentChoisi = signal<DocumentType | null>(null);
  protected readonly typeDocument = computed(
    () =>
      this.typeDocumentChoisi() ??
      DOCUMENT_TYPES_PAR_ENTITE[this.typeEntite()][0] ??
      "AUTRE"
  );
  /** Expiration field for the type currently selected in the upload form. */
  protected readonly saisieExpiration = computed(() =>
    documentSuitExpiration(this.typeEntite(), this.typeDocument())
  );
  protected readonly emptyHint = computed(() =>
    documentSuitExpiration(this.typeEntite())
      ? "Titres et pièces — l'expiration est suivie lorsqu'elle s'applique."
      : "Justificatifs et pièces jointes — sans suivi d'expiration."
  );
  protected readonly reference = signal("");
  protected readonly expiration = signal("");
  protected readonly erreur = signal<string | null>(null);
  protected readonly envoi = signal(false);
  protected readonly ouvertureId = signal<string | null>(null);

  protected readonly documents = httpResource<Document[]>(() => ({
    params: { entiteId: this.entiteId(), typeEntite: this.typeEntite() },
    url: `${environment.apiBaseUrl}/documents`,
  }));

  protected readonly erreurChargement = computed(() =>
    httpErrorMessage(this.documents.error())
  );

  private readonly aujourdhui = new Date();

  protected dateExpirationSuivie(document: Document): string | null {
    if (
      !document.dateExpiration ||
      !documentSuitExpiration(document.typeEntite, document.typeDocument)
    ) {
      return null;
    }
    return document.dateExpiration;
  }

  protected etatLabel(dateExpiration: string): string {
    return etatValiditeLabel(etatValidite(dateExpiration, this.aujourdhui));
  }

  protected etatTone(dateExpiration: string) {
    return etatValiditeTone(etatValidite(dateExpiration, this.aujourdhui));
  }

  protected onType(valeur: string): void {
    if (isDocumentType(valeur)) {
      this.typeDocumentChoisi.set(valeur);
      if (!documentSuitExpiration(this.typeEntite(), valeur)) {
        this.expiration.set("");
      }
    }
  }

  protected onReference(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.reference.set(event.target.value);
    }
  }

  protected onFichier(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.fichier.set(event.target.files?.[0] ?? null);
    }
  }

  protected async ouvrir(document: Document): Promise<void> {
    this.erreur.set(null);
    this.ouvertureId.set(document.id);
    try {
      await this.documentApi.ouvrir(document.id);
    } catch (error) {
      this.erreur.set(httpErrorMessage(error));
      this.toast.error("Impossible d'ouvrir le fichier.");
    } finally {
      this.ouvertureId.set(null);
    }
  }

  protected async televerser(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.erreur.set(null);
    const fichier = this.fichier();
    if (!fichier) {
      this.erreur.set("Choisissez un fichier à téléverser.");
      return;
    }
    this.envoi.set(true);
    try {
      const typeDocument = this.typeDocument();
      await this.documentApi.televerser({
        dateExpiration: documentSuitExpiration(this.typeEntite(), typeDocument)
          ? this.expiration() || undefined
          : undefined,
        entiteId: this.entiteId(),
        fichier,
        reference: this.reference(),
        typeDocument,
        typeEntite: this.typeEntite(),
      });
      this.fichier.set(null);
      this.reference.set("");
      this.expiration.set("");
      if (event.target instanceof HTMLFormElement) {
        event.target.reset();
      }
      this.documents.reload();
      this.toast.success("Document téléversé.");
    } catch (error) {
      this.erreur.set(httpErrorMessage(error));
    } finally {
      this.envoi.set(false);
    }
  }

  protected async supprimer(documentId: string): Promise<void> {
    this.erreur.set(null);
    try {
      await this.documentApi.supprimer(documentId);
      this.documents.reload();
      this.toast.success("Document supprimé.");
    } catch (error) {
      this.erreur.set(httpErrorMessage(error));
    }
  }
}
