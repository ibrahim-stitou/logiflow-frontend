import { httpResource } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideCircleAlert, lucideCircleCheck } from "@ng-icons/lucide";
import { ZardAlertComponent } from "@/shared/components/alert";
import { ZardButtonComponent } from "@/shared/components/button";
import {
  ZardCardComponent,
  ZardCardContentComponent,
  ZardCardDescriptionComponent,
  ZardCardHeaderComponent,
  ZardCardTitleComponent,
} from "@/shared/components/card/card.component";
import { ZardInputComponent } from "@/shared/components/input";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import type { Dossier } from "../dossiers/dossier";
import {
  FieldSelectComponent,
  type FieldSelectOption,
} from "../shared/ui/field-select";
import { FormActions } from "../shared/ui/form-actions";
import { FormFieldShell } from "../shared/ui/form-field";
import { ToastService } from "../shared/ui/toast";
import { formatDossierVoyageLabel } from "./voyage";
import {
  type AjouterDossierVoyageWrite,
  capaciteAjoutDossierMessage,
  deviationAjoutDossierMessage,
  type VerifierAjoutDossierResult,
} from "./voyage-ajouter-dossier";
import { VoyageApi } from "./voyage-api";
import type { VoyageCapacite } from "./voyage-capacite";

type ArretMode = "existing" | "new";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FieldSelectComponent,
    FormActions,
    FormFieldShell,
    ZardAlertComponent,
    ZardButtonComponent,
    ZardInputComponent,
    ZardCardComponent,
    ZardCardContentComponent,
    ZardCardDescriptionComponent,
    ZardCardHeaderComponent,
    ZardCardTitleComponent,
  ],
  providers: [provideIcons({ lucideCircleAlert, lucideCircleCheck })],
  selector: "app-voyage-ajouter-dossier-form",
  templateUrl: "./voyage-ajouter-dossier-form.html",
})
export class VoyageAjouterDossierForm {
  private readonly api = inject(VoyageApi);
  private readonly toast = inject(ToastService);

  readonly voyageId = input.required<string>();
  readonly dossierIdsOnVoyage = input<string[]>([]);
  readonly dossierAdded = output<void>();

  protected readonly deviationAjoutDossierMessage =
    deviationAjoutDossierMessage;
  protected readonly capaciteAjoutDossierMessage = capaciteAjoutDossierMessage;

  protected readonly dossierId = signal("");
  protected readonly chargementMode = signal<ArretMode>("existing");
  protected readonly chargementArretId = signal("");
  protected readonly chargementLibelle = signal("");
  protected readonly chargementLatitude = signal("");
  protected readonly chargementLongitude = signal("");
  protected readonly dechargementMode = signal<ArretMode>("existing");
  protected readonly dechargementArretId = signal("");
  protected readonly dechargementLibelle = signal("");
  protected readonly dechargementLatitude = signal("");
  protected readonly dechargementLongitude = signal("");

  protected readonly checkResult = signal<VerifierAjoutDossierResult | null>(
    null
  );
  protected readonly checkPending = signal(false);
  protected readonly checkError = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitting = signal(false);

  private debounceTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  protected readonly dossiers = httpResource<PageResponse<Dossier>>(() => ({
    params: { page: 0, size: 50 },
    url: `${environment.apiBaseUrl}/dossiers`,
  }));

  protected readonly capacite = httpResource<VoyageCapacite>(() => ({
    url: `${environment.apiBaseUrl}/voyages/${this.voyageId()}/capacite`,
  }));

  protected readonly dossierOptions = computed(
    (): readonly FieldSelectOption[] => {
      const dejaPlanifies = new Set(this.dossierIdsOnVoyage());
      return (this.dossiers.value()?.content ?? [])
        .filter(
          (dossier) =>
            dossier.statut === "CREE" && !dejaPlanifies.has(dossier.id)
        )
        .map((dossier) => ({
          label: formatDossierVoyageLabel(dossier),
          value: dossier.id,
        }));
    }
  );

  protected readonly arretOptions = computed((): readonly FieldSelectOption[] =>
    (this.capacite.value()?.arrets ?? []).map((arret) => ({
      label: `${arret.libelle} (#${arret.indiceSequence})`,
      value: arret.id,
    }))
  );

  protected readonly canSubmit = computed(() => {
    if (this.submitting() || this.checkPending()) {
      return false;
    }
    if (this.buildPayload() === null) {
      return false;
    }
    return this.checkResult()?.compatible === true;
  });

  protected onDossierId(value: string): void {
    this.dossierId.set(value);
    this.scheduleCheck();
  }

  protected onChargementMode(mode: ArretMode): void {
    this.chargementMode.set(mode);
    this.scheduleCheck();
  }

  protected onDechargementMode(mode: ArretMode): void {
    this.dechargementMode.set(mode);
    this.scheduleCheck();
  }

  protected onChargementArretId(value: string): void {
    this.chargementArretId.set(value);
    this.scheduleCheck();
  }

  protected onDechargementArretId(value: string): void {
    this.dechargementArretId.set(value);
    this.scheduleCheck();
  }

  protected onChargementLibelle(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.chargementLibelle.set(target.value);
      this.scheduleCheck();
    }
  }

  protected onChargementLatitude(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.chargementLatitude.set(target.value);
      this.scheduleCheck();
    }
  }

  protected onChargementLongitude(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.chargementLongitude.set(target.value);
      this.scheduleCheck();
    }
  }

  protected onDechargementLibelle(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.dechargementLibelle.set(target.value);
      this.scheduleCheck();
    }
  }

  protected onDechargementLatitude(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.dechargementLatitude.set(target.value);
      this.scheduleCheck();
    }
  }

  protected onDechargementLongitude(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.dechargementLongitude.set(target.value);
      this.scheduleCheck();
    }
  }

  protected async submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitError.set(null);
    const payload = this.buildPayload();
    if (payload === null) {
      return;
    }
    this.submitting.set(true);
    try {
      await this.api.ajouterDossier(this.voyageId(), payload);
      this.toast.success("Dossier ajouté au voyage.");
      this.resetForm();
      this.dossierAdded.emit();
    } catch (error) {
      this.submitError.set(httpErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private scheduleCheck(): void {
    if (this.debounceTimer !== null) {
      globalThis.clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = globalThis.setTimeout(() => {
      this.debounceTimer = null;
      void this.runCheck();
    }, 400);
  }

  private async runCheck(): Promise<void> {
    const payload = this.buildPayload();
    if (payload === null) {
      this.checkResult.set(null);
      this.checkError.set(null);
      return;
    }
    this.checkPending.set(true);
    this.checkError.set(null);
    try {
      const result = await this.api.verifierAjoutDossier(
        this.voyageId(),
        payload
      );
      this.checkResult.set(result);
    } catch (error) {
      this.checkResult.set(null);
      this.checkError.set(httpErrorMessage(error));
    } finally {
      this.checkPending.set(false);
    }
  }

  private buildPayload(): AjouterDossierVoyageWrite | null {
    const dossierId = this.dossierId().trim();
    if (dossierId.length === 0) {
      return null;
    }

    const chargement = this.buildSelection(
      this.chargementMode(),
      this.chargementArretId(),
      this.chargementLibelle(),
      this.chargementLatitude(),
      this.chargementLongitude()
    );
    const dechargement = this.buildSelection(
      this.dechargementMode(),
      this.dechargementArretId(),
      this.dechargementLibelle(),
      this.dechargementLatitude(),
      this.dechargementLongitude()
    );
    if (chargement === null || dechargement === null) {
      return null;
    }

    return {
      chargement,
      dechargement,
      dossierId,
    };
  }

  private buildSelection(
    mode: ArretMode,
    arretId: string,
    libelle: string,
    latitudeRaw: string,
    longitudeRaw: string
  ): AjouterDossierVoyageWrite["chargement"] | null {
    if (mode === "existing") {
      const id = arretId.trim();
      return id.length > 0 ? { arretId: id } : null;
    }

    const libelleTrim = libelle.trim();
    const lat = Number(latitudeRaw.trim());
    const lng = Number(longitudeRaw.trim());
    if (
      libelleTrim.length === 0 ||
      latitudeRaw.trim().length === 0 ||
      longitudeRaw.trim().length === 0 ||
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      return null;
    }
    return {
      nouvelArret: {
        latitude: lat,
        libelle: libelleTrim,
        longitude: lng,
      },
    };
  }

  private resetForm(): void {
    this.dossierId.set("");
    this.chargementMode.set("existing");
    this.chargementArretId.set("");
    this.chargementLibelle.set("");
    this.chargementLatitude.set("");
    this.chargementLongitude.set("");
    this.dechargementMode.set("existing");
    this.dechargementArretId.set("");
    this.dechargementLibelle.set("");
    this.dechargementLatitude.set("");
    this.dechargementLongitude.set("");
    this.checkResult.set(null);
    this.checkError.set(null);
  }
}
