import { httpResource } from "@angular/common/http";
import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormField, form, required, submit } from "@angular/forms/signals";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck, lucidePlus } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import {
  enumToSelectOptions,
  type FieldSelectOption,
} from "../shared/ui/field-select";
import { FORM_PAGE_IMPORTS } from "../shared/ui/form-page";
import { ToastService } from "../shared/ui/toast";
import type { Voyage } from "../voyages/voyage";
import {
  draftToWrite,
  emptyPriseCarburantDraft,
  TYPE_CARBURANTS,
  typeCarburantLabel,
} from "./prise-carburant";
import { PriseCarburantApi } from "./prise-carburant-api";
import {
  emptyStationDraft,
  type Station,
  draftToWrite as stationDraftToWrite,
} from "./station";
import { StationApi } from "./station-api";

/** Sentinel in the station select — not a real station id. */
const STATION_SELECT_NEW = "__new_station__";

@Component({
  imports: [FormField, NgIcon, RouterLink, ...FORM_PAGE_IMPORTS],
  selector: "app-prise-create-page",
  templateUrl: "./prise-create-page.html",
  viewProviders: [provideIcons({ lucideCheck, lucidePlus })],
})
export class PriseCreatePage {
  private readonly api = inject(PriseCarburantApi);
  private readonly stationApi = inject(StationApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly typeOptions = enumToSelectOptions(
    TYPE_CARBURANTS,
    typeCarburantLabel
  );
  protected readonly formError = signal<string | null>(null);
  protected readonly stationFormError = signal<string | null>(null);
  protected readonly stationSaving = signal(false);
  /** Expanded when the user picks « Créer une station… » in the select. */
  protected readonly stationCreateOpen = signal(false);
  protected readonly stationDraft = signal(emptyStationDraft());
  /** Stations créées ici avant le rechargement de la liste HTTP. */
  private readonly stationsCreatedLocally = signal<readonly Station[]>([]);
  private stationIdBeforeCreate = "";

  private readonly voyageIdFromQuery = signal(
    this.route.snapshot.queryParamMap.get("voyageId") ?? ""
  );

  protected readonly draft = signal(
    emptyPriseCarburantDraft(this.voyageIdFromQuery())
  );

  protected readonly voyages = httpResource<PageResponse<Voyage>>(() => ({
    params: { page: 0, size: 100 },
    url: `${environment.apiBaseUrl}/voyages`,
  }));

  protected readonly stations = httpResource<PageResponse<Station>>(() => ({
    params: { page: 0, size: 100 },
    url: `${environment.apiBaseUrl}/stations`,
  }));

  protected readonly selectedVoyage = computed(() => {
    const { voyageId } = this.draft();
    const page = this.voyages.value();
    if (!(voyageId && page)) {
      return null;
    }
    return page.content.find((voyage) => voyage.id === voyageId) ?? null;
  });

  protected readonly voyageSelectOptions = computed<
    readonly FieldSelectOption[]
  >(() =>
    (this.voyages.value()?.content ?? []).map((voyage) => ({
      label: voyage.reference,
      value: voyage.id,
    }))
  );

  protected readonly activeStations = computed(() => {
    const fromApi = (this.stations.value()?.content ?? []).filter(
      (station) => station.actif
    );
    const knownIds = new Set(fromApi.map((station) => station.id));
    const local = this.stationsCreatedLocally().filter(
      (station) => station.actif && !knownIds.has(station.id)
    );
    return [...local, ...fromApi];
  });

  protected readonly stationsLoadedEmpty = computed(
    () => this.stations.hasValue() && this.activeStations().length === 0
  );

  protected readonly stationSelectOptions = computed<
    readonly FieldSelectOption[]
  >(() => [
    ...this.activeStations().map((station) => ({
      label: `${station.code} — ${station.libelle}`,
      value: station.id,
    })),
    {
      icon: "lucidePlus",
      label: "Créer une nouvelle station…",
      value: STATION_SELECT_NEW,
    },
  ]);

  protected readonly stationSelectValue = computed(() =>
    this.stationCreateOpen() ? STATION_SELECT_NEW : this.draft().stationId
  );

  constructor() {
    effect(() => {
      if (this.stationsLoadedEmpty()) {
        this.stationIdBeforeCreate = "";
        this.stationCreateOpen.set(true);
      }
    });
  }

  protected readonly enginOptions = computed<readonly FieldSelectOption[]>(
    () => {
      const voyage = this.selectedVoyage();
      if (!voyage) {
        return [];
      }
      const options: FieldSelectOption[] = [
        { label: "Véhicule du voyage", value: "vehicule" },
      ];
      if (voyage.remorqueId) {
        options.push({ label: "Remorque du voyage", value: "remorque" });
      }
      return options;
    }
  );

  protected readonly voyageLocked = computed(
    () => this.voyageIdFromQuery().length > 0
  );

  protected readonly backLink = computed(() =>
    this.voyageLocked() ? `/voyages/${this.draft().voyageId}` : "/carburant"
  );

  protected readonly createForm = form(this.draft, (path) => {
    required(path.voyageId, { message: "Le voyage est obligatoire." });
    required(path.stationId, {
      message: "La station est obligatoire.",
      when: () => !this.stationCreateOpen(),
    });
    required(path.litrage, { message: "Le litrage est obligatoire." });
    required(path.montantTtc, { message: "Le montant est obligatoire." });
    required(path.datePrise, { message: "La date est obligatoire." });
  });

  protected onVoyageIdChange(_voyageId: string): void {
    if (this.draft().engin !== "vehicule") {
      this.draft.update((current) => ({ ...current, engin: "vehicule" }));
    }
  }

  protected onStationSelectChange(value: string): void {
    if (value === STATION_SELECT_NEW) {
      this.stationIdBeforeCreate = this.draft().stationId;
      this.draft.update((current) => ({ ...current, stationId: "" }));
      this.stationFormError.set(null);
      this.stationCreateOpen.set(true);
      return;
    }

    this.stationCreateOpen.set(false);
    this.stationFormError.set(null);
    this.stationDraft.set(emptyStationDraft());
    this.draft.update((current) => ({ ...current, stationId: value }));
  }

  protected cancelStationCreate(): void {
    if (this.stationsLoadedEmpty()) {
      return;
    }
    this.stationCreateOpen.set(false);
    this.stationFormError.set(null);
    this.stationDraft.set(emptyStationDraft());
    this.draft.update((current) => ({
      ...current,
      stationId: this.stationIdBeforeCreate,
    }));
  }

  protected updateStationDraft(
    field: "code" | "libelle" | "adresse",
    event: Event
  ): void {
    const { value } = event.target as HTMLInputElement;
    this.stationDraft.update((current) => ({ ...current, [field]: value }));
  }

  protected async onCreateStation(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.stationFormError.set(null);

    const draft = this.stationDraft();
    if (!draft.code.trim()) {
      this.stationFormError.set("Le code est obligatoire.");
      return;
    }
    if (!draft.libelle.trim()) {
      this.stationFormError.set("Le libellé est obligatoire.");
      return;
    }

    this.stationSaving.set(true);
    try {
      const created = await this.stationApi.create(stationDraftToWrite(draft));
      this.toast.success("Station créée.");
      this.stationsCreatedLocally.update((current) => [created, ...current]);
      this.stations.reload();
      this.draft.update((current) => ({ ...current, stationId: created.id }));
      this.stationDraft.set(emptyStationDraft());
      this.stationCreateOpen.set(false);
      this.stationIdBeforeCreate = created.id;
    } catch (error) {
      this.stationFormError.set(httpErrorMessage(error));
    } finally {
      this.stationSaving.set(false);
    }
  }

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    if (this.stationCreateOpen()) {
      this.formError.set(
        "Terminez la création de la station ou choisissez-en une dans la liste."
      );
      return;
    }
    const voyage = this.selectedVoyage();
    if (!voyage) {
      this.formError.set("Sélectionnez un voyage valide.");
      return;
    }
    if (this.draft().engin === "remorque" && !voyage.remorqueId) {
      this.formError.set("Ce voyage n'a pas de remorque.");
      return;
    }
    await submit(this.createForm, async () => {
      try {
        const created = await this.api.create(
          draftToWrite(this.draft(), voyage)
        );
        this.toast.success("Prise enregistrée en brouillon.");
        await this.router.navigate(["/carburant", created.id]);
      } catch (error) {
        this.formError.set(httpErrorMessage(error));
      }
    });
  }
}
