import { DatePipe } from "@angular/common";
import { httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { FormField, form, required, submit } from "@angular/forms/signals";
import { RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { VOYAGES_PLAN_ROLES } from "../core/auth/role";
import { SessionUtilisateur } from "../core/auth/session";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import { bindShellBreadcrumbLeaf } from "../core/nav/shell-breadcrumb-leaf";
import { DocumentsSection } from "../shared/ui/documents-section";
import { FICHE_PAGE_IMPORTS } from "../shared/ui/fiche-page";
import { statutOptionsFrom } from "../shared/ui/list-filter";
import { statutIconForValue } from "../shared/ui/list-statut-filter";
import { priseCarburantStatutIcon } from "../shared/ui/list-statut-icons";
import { StatutChip } from "../shared/ui/statut-chip";
import { ToastService } from "../shared/ui/toast";
import {
  formatLitres,
  formatMontantTtc,
  formatPriseShortId,
  formatPrixUnitaire,
  type PriseCarburant,
  type PriseCarburantMaj,
  STATUT_PRISES,
  statutPriseLabel,
  statutPriseTone,
  TYPE_CARBURANTS,
  typeCarburantLabel,
} from "./prise-carburant";
import { PriseCarburantApi } from "./prise-carburant-api";
import type { Station } from "./station";

interface PriseEditDraft {
  litrage: string;
  montantTtc: string;
  stationId: string;
  typeCarburant: (typeof TYPE_CARBURANTS)[number];
}

@Component({
  imports: [
    DatePipe,
    DocumentsSection,
    FormField,
    NgIcon,
    RouterLink,
    StatutChip,
    ...FICHE_PAGE_IMPORTS,
  ],
  selector: "app-prise-detail-page",
  templateUrl: "./prise-detail-page.html",
  viewProviders: [provideIcons({ lucideCheck })],
})
export class PriseDetailPage {
  private readonly api = inject(PriseCarburantApi);
  private readonly session = inject(SessionUtilisateur);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  protected readonly formatLitres = formatLitres;
  protected readonly formatMontantTtc = formatMontantTtc;
  protected readonly formatPrixUnitaire = formatPrixUnitaire;
  protected readonly formatPriseShortId = formatPriseShortId;
  protected readonly statutOptions = statutOptionsFrom(
    STATUT_PRISES,
    statutPriseLabel,
    priseCarburantStatutIcon
  );
  protected readonly statutPriseLabel = statutPriseLabel;
  protected readonly statutPriseTone = statutPriseTone;

  protected statutChipIcon(statut: string): string | null {
    return statutIconForValue(this.statutOptions, statut);
  }
  protected readonly typeCarburantLabel = typeCarburantLabel;
  protected readonly fuelTypes = TYPE_CARBURANTS;
  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;

  protected readonly formError = signal<string | null>(null);
  protected readonly validateError = signal<string | null>(null);

  protected readonly prise = httpResource<PriseCarburant>(() => ({
    url: `${environment.apiBaseUrl}/prises-carburant/${this.id()}`,
  }));

  protected readonly stations = httpResource<PageResponse<Station>>(() => ({
    params: { page: 0, size: 100 },
    url: `${environment.apiBaseUrl}/stations`,
  }));

  protected readonly editDraft = signal<PriseEditDraft>({
    litrage: "",
    montantTtc: "",
    stationId: "",
    typeCarburant: "DIESEL",
  });

  protected readonly canValidate = computed(() => {
    const roles = this.session.utilisateur()?.roles ?? [];
    return roles.some((role) => VOYAGES_PLAN_ROLES.includes(role));
  });

  protected readonly isEditable = computed(
    () => this.prise.value()?.statut === "BROUILLON"
  );

  protected readonly loadError = computed(() =>
    httpErrorMessage(this.prise.error())
  );

  protected readonly editForm = form(this.editDraft, (path) => {
    required(path.stationId, { message: "La station est obligatoire." });
    required(path.litrage, { message: "Le litrage est obligatoire." });
    required(path.montantTtc, { message: "Le montant est obligatoire." });
  });

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() =>
        this.prise.hasValue() ? formatPriseShortId(this.prise.value().id) : null
      )
    );

    effect(() => {
      const current = this.prise.value();
      if (!current) {
        return;
      }
      this.editDraft.set({
        litrage: String(current.litrage),
        montantTtc: String(current.montantTtc),
        stationId: current.stationId,
        typeCarburant: current.typeCarburant,
      });
    });
  }

  protected onStationChange(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLSelectElement) {
      this.editDraft.update((current) => ({
        ...current,
        stationId: target.value,
      }));
    }
  }

  protected onTypeChange(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLSelectElement) {
      this.editDraft.update((current) => ({
        ...current,
        typeCarburant: target.value as PriseEditDraft["typeCarburant"],
      }));
    }
  }

  protected async saveEdits(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    await submit(this.editForm, async () => {
      try {
        const draft = this.editDraft();
        const body: PriseCarburantMaj = {
          litrage: Number(draft.litrage),
          montantTtc: Number(draft.montantTtc),
          stationId: draft.stationId,
          typeCarburant: draft.typeCarburant,
        };
        await this.api.update(this.id(), body);
        this.toast.success("Prise mise à jour.");
        this.prise.reload();
      } catch (error) {
        this.formError.set(httpErrorMessage(error));
      }
    });
  }

  protected async valider(): Promise<void> {
    this.validateError.set(null);
    try {
      await this.api.valider(this.id());
      this.toast.success("Prise validée.");
      this.prise.reload();
    } catch (error) {
      this.validateError.set(httpErrorMessage(error));
    }
  }
}
