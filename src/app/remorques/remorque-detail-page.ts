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
import { FormField, form, min, required, submit } from "@angular/forms/signals";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import { DemoSessionService } from "../core/auth/demo-session";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import { bindShellBreadcrumbLeaf } from "../core/nav/shell-breadcrumb-leaf";
import { WORK_DESTINATIONS } from "../core/nav/work-destination";
import { EnginMaintenanceSection } from "../maintenance/engin-maintenance-section";
import { DocumentsSection } from "../shared/ui/documents-section";
import { FICHE_PAGE_IMPORTS } from "../shared/ui/fiche-page";
import { statutOptionsFrom } from "../shared/ui/list-filter";
import { statutIconForValue } from "../shared/ui/list-statut-filter";
import { vehiculeStatutIcon } from "../shared/ui/list-statut-icons";
import { StatutChip } from "../shared/ui/statut-chip";
import { ToastService } from "../shared/ui/toast";
import {
  carrosserieDisplay,
  formatMarqueModele,
  formatRemorqueDate,
  type Remorque,
  remorqueStatutLabel,
  remorqueStatutTone,
  typeRemorqueDisplay,
  VEHICULE_STATUTS,
} from "./remorque";
import { RemorqueApi } from "./remorque-api";

@Component({
  imports: [
    DocumentsSection,
    EnginMaintenanceSection,
    FormField,
    NgIcon,
    StatutChip,
    ...FICHE_PAGE_IMPORTS,
  ],
  selector: "app-remorque-detail-page",
  templateUrl: "./remorque-detail-page.html",
  viewProviders: [provideIcons({ lucideCheck })],
})
export class RemorqueDetailPage {
  private readonly api = inject(RemorqueApi);
  private readonly toast = inject(ToastService);
  private readonly session = inject(DemoSessionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  protected readonly canMaintenance = computed(() =>
    this.session.hasAnyRole(WORK_DESTINATIONS.maintenance.roles)
  );

  protected readonly statutOptions = statutOptionsFrom(
    VEHICULE_STATUTS,
    remorqueStatutLabel,
    vehiculeStatutIcon
  );
  protected readonly carrosserieDisplay = carrosserieDisplay;
  protected readonly formatMarqueModele = formatMarqueModele;
  protected readonly formatRemorqueDate = formatRemorqueDate;
  protected readonly remorqueStatutLabel = remorqueStatutLabel;
  protected readonly remorqueStatutTone = remorqueStatutTone;

  protected statutChipIcon(statut: string): string | null {
    return statutIconForValue(this.statutOptions, statut);
  }
  protected readonly typeRemorqueDisplay = typeRemorqueDisplay;
  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly compteursError = signal<string | null>(null);

  protected readonly remorque = httpResource<Remorque>(() => ({
    url: `${environment.apiBaseUrl}/remorques/${this.id()}`,
  }));

  protected readonly loadError = computed(() => {
    const error = this.remorque.error();
    return error ? httpErrorMessage(error) : null;
  });

  protected readonly compteursDraft = signal({
    heuresGroupeFroid: 0,
    kilometrage: 0,
  });

  protected readonly compteursForm = form(this.compteursDraft, (path) => {
    required(path.kilometrage, { message: "Le kilométrage est obligatoire." });
    min(path.kilometrage, 0, {
      message: "Le kilométrage ne peut pas être négatif.",
    });
    required(path.heuresGroupeFroid, {
      message: "Les heures groupe froid sont obligatoires.",
    });
    min(path.heuresGroupeFroid, 0, {
      message: "Les heures groupe froid ne peuvent pas être négatives.",
    });
  });

  private seededForId = "";

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() =>
        this.remorque.hasValue() ? this.remorque.value().immatriculation : null
      )
    );

    effect(() => {
      const id = this.id();
      const current = this.remorque.value();
      if (!current || current.id !== id || this.seededForId === id) {
        return;
      }
      this.seededForId = id;
      this.compteursDraft.set({
        heuresGroupeFroid: current.heuresGroupeFroid,
        kilometrage: current.kilometrage,
      });
    });
  }

  protected async releverCompteurs(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.compteursError.set(null);
    await submit(this.compteursForm, async () => {
      const draft = this.compteursDraft();
      try {
        await this.api.relever(
          this.id(),
          draft.kilometrage,
          draft.heuresGroupeFroid
        );
        this.remorque.reload();
        this.toast.success("Compteurs enregistrés.");
      } catch (error) {
        this.compteursError.set(httpErrorMessage(error));
      }
    });
  }
}
