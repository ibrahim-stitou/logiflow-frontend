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
import {
  FormField,
  form,
  max,
  min,
  required,
  submit,
} from "@angular/forms/signals";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import { SessionUtilisateur } from "../core/auth/session";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import { bindShellBreadcrumbLeaf } from "../core/nav/shell-breadcrumb-leaf";
import { WORK_DESTINATIONS } from "../core/nav/work-destination";
import { EnginMaintenanceSection } from "../maintenance/engin-maintenance-section";
import {
  draftToWrite,
  emptyScoreSanteDraft,
  formatDate,
  SCORE_SANTE_MAX,
  type ScoreSante,
  statutSanteLabel,
  statutSanteTone,
} from "../maintenance/score-sante";
import { ScoreSanteApi } from "../maintenance/score-sante-api";
import { DocumentsSection } from "../shared/ui/documents-section";
import { FICHE_PAGE_IMPORTS } from "../shared/ui/fiche-page";
import { statutOptionsFrom } from "../shared/ui/list-filter";
import { statutIconForValue } from "../shared/ui/list-statut-filter";
import { vehiculeStatutIcon } from "../shared/ui/list-statut-icons";
import { StatutChip } from "../shared/ui/statut-chip";
import { ToastService } from "../shared/ui/toast";
import { vehiculeStatutTone } from "../tableau/apercu";
import {
  carrosserieDisplay,
  energieDisplay,
  formatMarqueModele,
  formatVehiculeDate,
  statutLabel,
  typeLabel,
  VEHICULE_STATUTS,
  type Vehicule,
} from "./vehicule";
import { VehiculeApi } from "./vehicule-api";

@Component({
  imports: [
    DocumentsSection,
    EnginMaintenanceSection,
    FormField,
    NgIcon,
    StatutChip,
    ...FICHE_PAGE_IMPORTS,
  ],
  selector: "app-vehicule-detail-page",
  templateUrl: "./vehicule-detail-page.html",
  viewProviders: [provideIcons({ lucideCheck })],
})
export class VehiculeDetailPage {
  private readonly api = inject(VehiculeApi);
  private readonly scoreApi = inject(ScoreSanteApi);
  private readonly session = inject(SessionUtilisateur);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  protected readonly statutOptions = statutOptionsFrom(
    VEHICULE_STATUTS,
    statutLabel,
    vehiculeStatutIcon
  );
  protected readonly typeLabel = typeLabel;
  protected readonly statutLabel = statutLabel;
  protected readonly energieDisplay = energieDisplay;
  protected readonly carrosserieDisplay = carrosserieDisplay;
  protected readonly formatMarqueModele = formatMarqueModele;
  protected readonly formatVehiculeDate = formatVehiculeDate;
  protected readonly vehiculeStatutTone = vehiculeStatutTone;

  protected statutChipIcon(statut: string): string | null {
    return statutIconForValue(this.statutOptions, statut);
  }

  protected readonly statutSanteLabel = statutSanteLabel;
  protected readonly statutSanteTone = statutSanteTone;
  protected readonly formatScoreDate = formatDate;
  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;

  protected readonly canMaintenance = computed(() =>
    this.session.hasAnyRole(WORK_DESTINATIONS.maintenance.roles)
  );

  protected readonly compteursError = signal<string | null>(null);
  protected readonly scoreError = signal<string | null>(null);

  protected readonly vehicule = httpResource<Vehicule>(() => ({
    url: `${environment.apiBaseUrl}/vehicules/${this.id()}`,
  }));

  protected readonly scoreSante = httpResource<ScoreSante | null>(() => ({
    params: { vehiculeId: this.id() },
    url: `${environment.apiBaseUrl}/scores-sante/dernier`,
  }));

  protected readonly loadError = computed(() => {
    const error = this.vehicule.error();
    return error ? httpErrorMessage(error) : null;
  });

  protected readonly scoreLoadError = computed(() => {
    const error = this.scoreSante.error();
    return error ? httpErrorMessage(error) : null;
  });

  protected readonly scoreDraft = signal(emptyScoreSanteDraft());

  protected readonly scoreForm = form(this.scoreDraft, (path) => {
    required(path.score, { message: "Le score est obligatoire." });
    min(path.score, 0, { message: "Le score ne peut pas être négatif." });
    max(path.score, SCORE_SANTE_MAX, {
      message: `Le score ne peut pas dépasser ${SCORE_SANTE_MAX}.`,
    });
    required(path.dateEcheanceProjetee, {
      message: "La date d'échéance est obligatoire.",
    });
  });

  protected readonly compteursDraft = signal({
    heuresMoteur: 0,
    kilometrage: 0,
  });

  protected readonly compteursForm = form(this.compteursDraft, (path) => {
    required(path.kilometrage, { message: "Le kilométrage est obligatoire." });
    min(path.kilometrage, 0, {
      message: "Le kilométrage ne peut pas être négatif.",
    });
    required(path.heuresMoteur, {
      message: "Les heures moteur sont obligatoires.",
    });
    min(path.heuresMoteur, 0, {
      message: "Les heures moteur ne peuvent pas être négatives.",
    });
  });

  private seededForId = "";

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() =>
        this.vehicule.hasValue() ? this.vehicule.value().immatriculation : null
      )
    );

    effect(() => {
      const id = this.id();
      const current = this.vehicule.value();
      if (!current || current.id !== id || this.seededForId === id) {
        return;
      }
      this.seededForId = id;
      this.compteursDraft.set({
        heuresMoteur: current.heuresMoteur,
        kilometrage: current.kilometrage,
      });
    });
  }

  protected async saveCompteurs(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.compteursError.set(null);
    await submit(this.compteursForm, async () => {
      const draft = this.compteursDraft();
      try {
        const updated = await this.api.relever(
          this.id(),
          draft.kilometrage,
          draft.heuresMoteur
        );
        this.compteursDraft.set({
          heuresMoteur: updated.heuresMoteur,
          kilometrage: updated.kilometrage,
        });
        this.vehicule.reload();
        this.toast.success("Compteurs enregistrés.");
      } catch (error) {
        this.compteursError.set(httpErrorMessage(error));
      }
    });
  }

  protected async enregistrerScore(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.scoreError.set(null);
    await submit(this.scoreForm, async () => {
      try {
        await this.scoreApi.calculer(
          draftToWrite(this.id(), this.scoreDraft())
        );
        this.scoreSante.reload();
        this.toast.success("Score de santé enregistré.");
      } catch (error) {
        this.scoreError.set(httpErrorMessage(error));
      }
    });
  }
}
