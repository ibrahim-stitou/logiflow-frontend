import { DecimalPipe } from "@angular/common";
import { httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideArchive,
  lucideCalendarCheck,
  lucideCalendarClock,
  lucideChevronRight,
  lucideCircleAlert,
  lucideCircleCheck,
  lucideCircleX,
  lucideClipboardPen,
  lucideContainer,
  lucideFlag,
  lucideFolderOpen,
  lucideFuel,
  lucideGlobe,
  lucideHistory,
  lucideInbox,
  lucideLocateFixed,
  lucideMap,
  lucideMapPin,
  lucidePackage,
  lucidePackageCheck,
  lucidePencil,
  lucidePlay,
  lucideRepeat,
  lucideRoute,
  lucideShare2,
  lucideTriangleAlert,
  lucideTruck,
  lucideUserCheck,
  lucideUsers,
} from "@ng-icons/lucide";
import { ZardAlertComponent } from "@/shared/components/alert";
import { ZardBadgeComponent } from "@/shared/components/badge";
import { ZardButtonComponent } from "@/shared/components/button";
import {
  ZardCardComponent,
  ZardCardContentComponent,
  ZardCardDescriptionComponent,
  ZardCardHeaderComponent,
  ZardCardTitleComponent,
} from "@/shared/components/card/card.component";
import { ZardInputComponent } from "@/shared/components/input";
import {
  ZardTabComponent,
  ZardTabGroupComponent,
} from "@/shared/components/tabs";
import { environment } from "../../environments/environment";
import {
  formatLitres,
  formatMontantTtc,
  formatPriseShortId,
  type PriseCarburant,
  statutPriseLabel,
  statutPriseTone,
} from "../carburant/prise-carburant";
import {
  type ChauffeurListItem,
  chauffeurLabelFromLookup,
} from "../chauffeurs/chauffeur";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { bindShellBreadcrumbLeaf } from "../core/nav/shell-breadcrumb-leaf";
import type { Dossier } from "../dossiers/dossier";
import { canCalculerItineraire } from "../ia/itineraire";
import { ItineraireApi } from "../ia/itineraire-api";
import type { RemorqueListItem } from "../remorques/remorque";
import { FICHE_PAGE_IMPORTS } from "../shared/ui/fiche-page";
import {
  type GeoMapPathPoint,
  GeoMarkersMap,
} from "../shared/ui/geo-markers-map";
import { voyageStatutIcon } from "../shared/ui/list-statut-icons";
import { OpsTimeline } from "../shared/ui/ops-timeline";
import type { StatutTone } from "../shared/ui/statut-chip";
import { StatutChip } from "../shared/ui/statut-chip";
import { ToastService } from "../shared/ui/toast";
import type { Site } from "../sites/site";
import { voyageStatutTone } from "../tableau/apercu";
import { type VehiculeLookup, vehiculeLabel } from "../vehicules/vehicule";
import { type ArretCarte, ItineraireCarte } from "./itineraire-carte";
import { RemorqueCapacityView } from "./remorque-capacity-view";
import {
  affectationRoleLabel,
  compareDatetimeLocal,
  datetimeLocalToIso,
  type Etape,
  type EvenementVoyage,
  formatDatetimeLocalForDisplay,
  formatDureeMin,
  formatInstant,
  type GeoPoint,
  isTypeEvenement,
  lifecycleStepPhase,
  maxDatetimeLocal,
  minEvenementHorodatageLocal,
  nextStatuts,
  type Portee,
  porteeLabel,
  primaryVoyageTransition,
  remplissageLabel,
  type StatutVoyage,
  statutVoyageLabel,
  suggestedEvenementHorodatageLocal,
  TYPE_EVENEMENTS,
  type TypeEtape,
  type TypeEvenement,
  type TypeVoyage,
  toDatetimeLocal,
  typeEtapeLabel,
  typeEvenementIcon,
  typeEvenementLabel,
  typeVoyageLabel,
  VOYAGE_LIFECYCLE_STEPS,
  type Voyage,
  voyageStatutActionLabel,
} from "./voyage";
import { VoyageAjouterDossierForm } from "./voyage-ajouter-dossier-form";
import { VoyageApi } from "./voyage-api";
import {
  capaciteTronconTone,
  capaciteTronconToneClass,
} from "./voyage-capacite";
import type { ArretVoyage } from "./voyage-planification";
import {
  voyageItinerairePath,
  voyageItinerairePoints,
  voyageSiteMarkers,
} from "./voyage-sites-map-markers";
import {
  voyageActualTimelineEntries,
  voyagePlannedTimelineEntries,
} from "./voyage-timeline";

const LOOKUP_PAGE_SIZE = 100;
const CARTE_TAB_INDEX = 0;

const ETAPE_DOT_CLASS: Record<TypeEtape, string> = {
  CARBURANT: "bg-amber",
  CHARGEMENT: "bg-pine",
  DECHARGEMENT: "bg-pine",
  DEPOT: "bg-muted",
  FRONTIERE: "bg-ink",
  PAUSE: "bg-muted",
  REPOS: "bg-muted",
};

@Component({
  imports: [
    DecimalPipe,
    NgIcon,
    RouterLink,
    ZardAlertComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardInputComponent,
    OpsTimeline,
    StatutChip,
    RemorqueCapacityView,
    ItineraireCarte,
    VoyageAjouterDossierForm,
    GeoMarkersMap,
    ZardCardComponent,
    ZardCardContentComponent,
    ZardCardDescriptionComponent,
    ZardCardHeaderComponent,
    ZardCardTitleComponent,
    ZardTabComponent,
    ZardTabGroupComponent,
    ...FICHE_PAGE_IMPORTS,
  ],
  providers: [
    provideIcons({
      lucideArchive,
      lucideCalendarCheck,
      lucideCalendarClock,
      lucideChevronRight,
      lucideCircleAlert,
      lucideCircleCheck,
      lucideCircleX,
      lucideClipboardPen,
      lucideContainer,
      lucideFlag,
      lucideFolderOpen,
      lucideFuel,
      lucideGlobe,
      lucideHistory,
      lucideInbox,
      lucideLocateFixed,
      lucideMap,
      lucideMapPin,
      lucidePackage,
      lucidePackageCheck,
      lucidePencil,
      lucidePlay,
      lucideRepeat,
      lucideRoute,
      lucideShare2,
      lucideTriangleAlert,
      lucideTruck,
      lucideUserCheck,
      lucideUsers,
    }),
  ],
  selector: "app-voyage-detail-page",
  styleUrl: "./voyage-detail-page.css",
  templateUrl: "./voyage-detail-page.html",
})
export class VoyageDetailPage {
  private readonly api = inject(VoyageApi);
  private readonly itineraireApi = inject(ItineraireApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly capacityView = viewChild(RemorqueCapacityView);
  private readonly detailMap = viewChild(GeoMarkersMap);

  readonly id = input.required<string>();

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() =>
        this.voyage.hasValue() ? this.voyage.value().reference : null
      )
    );

    effect(() => {
      const suggested = suggestedEvenementHorodatageLocal(
        this.evenements.value() ?? []
      );
      const minimum = this.minEventHorodatage();
      const current = this.eventHorodatage();
      if (current.length === 0) {
        this.eventHorodatage.set(suggested);
        return;
      }
      if (minimum && compareDatetimeLocal(current, minimum) < 0) {
        this.eventHorodatage.set(suggested);
      }
    });

    effect((onCleanup) => {
      const stops = this.mapStops();
      this.mapRoadPath.set([]);
      this.mapRoadPathUnavailable.set(false);

      if (!canCalculerItineraire(stops)) {
        this.mapRoadPathLoading.set(false);
        return;
      }

      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });

      this.mapRoadPathLoading.set(true);
      void this.itineraireApi
        .calculerGeometrie(stops)
        .then((result) => {
          if (cancelled) {
            return;
          }
          this.mapRoadPath.set(result.geometrie);
          this.mapRoadPathUnavailable.set(result.geometrie.length < 2);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          this.mapRoadPath.set([]);
          this.mapRoadPathUnavailable.set(true);
        })
        .finally(() => {
          if (!cancelled) {
            this.mapRoadPathLoading.set(false);
          }
        });
    });
  }

  protected readonly affectationRoleLabel = affectationRoleLabel;
  protected readonly capaciteTronconTone = capaciteTronconTone;
  protected readonly capaciteTronconToneClass = capaciteTronconToneClass;
  protected readonly formatDureeMin = formatDureeMin;
  protected readonly formatInstant = formatInstant;
  protected readonly nextStatuts = nextStatuts;
  protected readonly porteeLabel = porteeLabel;
  protected readonly remplissageLabel = remplissageLabel;
  protected readonly statutVoyageLabel = statutVoyageLabel;
  protected readonly voyageStatutActionLabel = voyageStatutActionLabel;
  protected readonly voyageStatutTone = voyageStatutTone;
  protected readonly typeEtapeLabel = typeEtapeLabel;
  protected readonly typeEvenementLabel = typeEvenementLabel;
  protected readonly typeVoyageLabel = typeVoyageLabel;
  protected readonly eventTypes = TYPE_EVENEMENTS;
  protected readonly lifecycleSteps = VOYAGE_LIFECYCLE_STEPS;
  protected readonly eventTypeOptions = TYPE_EVENEMENTS.map((type) => ({
    icon: typeEvenementIcon(type),
    label: typeEvenementLabel(type),
    value: type,
  }));

  protected readonly statutError = signal<string | null>(null);
  protected readonly eventError = signal<string | null>(null);
  protected readonly eventType = signal<TypeEvenement>("DEPART");
  protected readonly eventHorodatage = signal("");
  protected readonly eventComment = signal("");
  protected readonly eventLatitude = signal("");
  protected readonly eventLongitude = signal("");
  protected readonly activeDetailTabIndex = signal(CARTE_TAB_INDEX);
  protected readonly mapRoadPath = signal<readonly GeoMapPathPoint[]>([]);
  protected readonly mapRoadPathLoading = signal(false);
  protected readonly mapRoadPathUnavailable = signal(false);

  protected readonly isCarteTabActive = computed(
    () => this.activeDetailTabIndex() === CARTE_TAB_INDEX
  );

  protected readonly voyage = httpResource<Voyage>(() => ({
    url: `${environment.apiBaseUrl}/voyages/${this.id()}`,
  }));

  /** Arrêts persistés (construits à la création depuis les sites des dossiers). */
  protected readonly arrets = httpResource<ArretVoyage[]>(() => ({
    url: `${environment.apiBaseUrl}/voyages/${this.id()}/arrets`,
  }));

  protected readonly arretsCarte = computed<readonly ArretCarte[]>(() =>
    (this.arrets.value() ?? []).map((arret) => ({
      id: arret.id,
      latitude: arret.latitude,
      libelle: arret.libelle,
      longitude: arret.longitude,
    }))
  );

  /** Libellé de l'arrêt correspondant à une étape, quand trajet et arrêts sont alignés. */
  protected arretLibelle(ordre: number): string | null {
    const arrets = this.arrets.value() ?? [];
    const etapes = this.voyage.value()?.trajet.etapes.length ?? 0;
    return arrets.length === etapes ? (arrets[ordre]?.libelle ?? null) : null;
  }

  protected readonly vehicules = httpResource<PageResponse<VehiculeLookup>>(
    () => ({
      params: { page: 0, size: 50 },
      url: `${environment.apiBaseUrl}/vehicules`,
    })
  );

  protected readonly remorques = httpResource<PageResponse<RemorqueListItem>>(
    () => ({
      params: { page: 0, size: 50 },
      url: `${environment.apiBaseUrl}/remorques`,
    })
  );

  protected readonly chauffeurs = httpResource<PageResponse<ChauffeurListItem>>(
    () => ({
      params: { page: 0, size: 50 },
      url: `${environment.apiBaseUrl}/chauffeurs`,
    })
  );

  protected readonly chauffeursById = computed(() => {
    const map = new Map<
      string,
      Pick<ChauffeurListItem, "matricule" | "nom" | "prenom">
    >();
    for (const chauffeur of this.chauffeurs.value()?.content ?? []) {
      map.set(chauffeur.id, chauffeur);
    }
    return map;
  });

  protected readonly dossiers = httpResource<PageResponse<Dossier>>(() => ({
    params: { page: 0, size: LOOKUP_PAGE_SIZE },
    url: `${environment.apiBaseUrl}/dossiers`,
  }));

  protected readonly sites = httpResource<PageResponse<Site>>(() => ({
    params: { page: 0, size: LOOKUP_PAGE_SIZE },
    url: `${environment.apiBaseUrl}/sites`,
  }));

  protected readonly dossiersById = computed(() => {
    const map = new Map<string, Dossier>();
    for (const dossier of this.dossiers.value()?.content ?? []) {
      map.set(dossier.id, dossier);
    }
    return map;
  });

  protected readonly mapMarkers = computed(() => {
    const lookup = this.voyageMapLookup();
    if (!lookup) {
      return [];
    }
    return voyageSiteMarkers(
      this.voyage.value(),
      lookup.dossiersById,
      lookup.sitesById
    );
  });

  protected readonly mapStops = computed(() => {
    const lookup = this.voyageMapLookup();
    if (!lookup) {
      return [];
    }
    return voyageItinerairePoints(
      this.voyage.value(),
      lookup.dossiersById,
      lookup.sitesById
    );
  });

  protected readonly mapPath = computed(() => {
    const road = this.mapRoadPath();
    if (road.length >= 2) {
      return road;
    }
    const lookup = this.voyageMapLookup();
    if (!lookup) {
      return [];
    }
    return voyageItinerairePath(
      this.voyage.value(),
      lookup.dossiersById,
      lookup.sitesById
    );
  });

  protected readonly mapHint = computed(() => {
    const stopCount = this.mapMarkers().length;
    if (stopCount === 0) {
      return "Aucun arrêt géolocalisé pour ce voyage.";
    }
    if (stopCount === 1) {
      return "1 arrêt — ajoutez un second dossier pour tracer l'itinéraire.";
    }
    if (this.mapRoadPathLoading()) {
      return `${stopCount} arrêt(s) — calcul de l'itinéraire routier…`;
    }
    if (this.mapRoadPath().length >= 2) {
      return `${stopCount} arrêt(s) — itinéraire routier (OSRM).`;
    }
    if (this.mapRoadPathUnavailable()) {
      return `${stopCount} arrêt(s) — routage indisponible, tracé direct affiché.`;
    }
    return `${stopCount} arrêt(s) sur le trajet.`;
  });

  protected readonly evenements = httpResource<EvenementVoyage[]>(() => ({
    url: `${environment.apiBaseUrl}/voyages/${this.id()}/evenements`,
  }));

  protected readonly prisesCarburant = httpResource<
    PageResponse<PriseCarburant>
  >(() => ({
    params: { page: 0, size: 20, voyageId: this.id() },
    url: `${environment.apiBaseUrl}/prises-carburant`,
  }));

  protected readonly formatLitres = formatLitres;
  protected readonly formatMontantTtc = formatMontantTtc;
  protected readonly formatPriseShortId = formatPriseShortId;
  protected readonly statutPriseLabel = statutPriseLabel;
  protected readonly statutPriseTone = statutPriseTone;

  protected readonly plannedTimelineEntries = computed(() => {
    const voyage = this.voyage.value();
    if (!voyage) {
      return [];
    }
    return voyagePlannedTimelineEntries(voyage);
  });

  protected readonly actualTimelineEntries = computed(() =>
    voyageActualTimelineEntries(this.evenements.value() ?? [])
  );

  protected readonly minEventHorodatage = computed(() =>
    minEvenementHorodatageLocal(this.evenements.value() ?? [])
  );

  protected readonly eventHorodatageHint = computed(() => {
    const minimum = this.minEventHorodatage();
    if (!minimum) {
      return null;
    }
    return `Au plus tôt : ${formatDatetimeLocalForDisplay(minimum)} (dernier événement enregistré).`;
  });

  protected readonly loadError = computed(() =>
    httpErrorMessage(this.voyage.error())
  );

  protected readonly eventsError = computed(() => {
    const error = this.evenements.error();
    return error ? httpErrorMessage(error) : null;
  });

  protected onDetailTabChange(event: { index: number }): void {
    this.activeDetailTabIndex.set(event.index);
    if (event.index === CARTE_TAB_INDEX) {
      queueMicrotask(() => this.detailMap()?.refreshLayout());
    }
  }

  protected dossierLabel(dossierId: string): string {
    return this.dossiersById().get(dossierId)?.reference ?? dossierId;
  }

  protected titulaireChauffeurId(): string | null {
    const voyage = this.voyage.value();
    if (!voyage) {
      return null;
    }
    return (
      voyage.affectations.find(
        (affectation) => affectation.role === "TITULAIRE"
      )?.chauffeurId ??
      voyage.affectations[0]?.chauffeurId ??
      null
    );
  }

  protected chauffeurLabel(chauffeurId: string): string {
    return chauffeurLabelFromLookup(chauffeurId, this.chauffeursById());
  }

  protected affectedVehiculeLabel(): string {
    const voyage = this.voyage.value();
    if (!voyage) {
      return "";
    }
    return vehiculeLabel(
      voyage.vehiculeId,
      this.vehicules.value()?.content ?? []
    );
  }

  protected affectedRemorqueLabel(remorqueId: string): string {
    const remorque = this.remorques
      .value()
      ?.content.find((entry) => entry.id === remorqueId);
    return remorque?.immatriculation ?? remorqueId;
  }

  protected remplissagePercent(): number {
    const voyage = this.voyage.value();
    if (!voyage) {
      return 0;
    }
    return Math.min(Math.max(Math.round(voyage.tauxRemplissage * 100), 0), 100);
  }

  protected remplissageTone(): ReturnType<typeof capaciteTronconTone> {
    return capaciteTronconTone(this.remplissagePercent());
  }

  protected etapeDotClass(type: TypeEtape): string {
    return ETAPE_DOT_CLASS[type];
  }

  protected etapeTimesLabel(etape: Etape): string {
    const parts = [`ETA ${formatInstant(etape.eta)}`];
    if (etape.etd) {
      parts.push(`ETD ${formatInstant(etape.etd)}`);
    }
    return parts.join(" · ");
  }

  protected statutChipIcon(statut: StatutVoyage): string {
    return voyageStatutIcon(statut);
  }

  protected statutChipTone(statut: StatutVoyage): StatutTone {
    return voyageStatutTone(statut);
  }

  protected lifecycleIconWellClass(statut: StatutVoyage): string {
    const base =
      "flex size-8 shrink-0 items-center justify-center rounded-md [&_ng-icon]:size-4";
    switch (voyageStatutTone(statut)) {
      case "pine":
        return `${base} bg-pine/10 text-pine`;
      case "amber":
        return `${base} bg-amber/10 text-amber`;
      case "ink":
        return `${base} bg-ink/5 text-ink`;
      case "brake":
        return `${base} bg-brake/10 text-brake`;
      case "muted":
        return `${base} bg-canvas text-muted`;
      default:
        return base;
    }
  }

  protected isCancelTransition(statut: StatutVoyage): boolean {
    return statut === "ANNULE";
  }

  protected isPrimaryTransition(
    target: StatutVoyage,
    current: StatutVoyage
  ): boolean {
    return primaryVoyageTransition(nextStatuts(current)) === target;
  }

  protected lifecycleStepMarkerClass(
    step: StatutVoyage,
    current: StatutVoyage
  ): string {
    const base =
      "flex size-7 items-center justify-center rounded-full [&_ng-icon]:size-3.5";
    switch (lifecycleStepPhase(step, current)) {
      case "past":
        return `${base} bg-pine/15 text-pine`;
      case "current":
        return `${base} bg-primary text-primary-foreground shadow-[0_1px_2px_oklch(0_0_0/0.08),0_4px_12px_color-mix(in_oklch,var(--color-pine)_25%,transparent)]`;
      case "future":
        return `${base} border border-line/80 bg-canvas text-muted`;
      default:
        return base;
    }
  }

  protected lifecycleStepConnectorClass(
    step: StatutVoyage,
    current: StatutVoyage
  ): string {
    const base = "mx-0.5 mt-3.5 h-px w-3 shrink-0 sm:w-4";
    const phase = lifecycleStepPhase(step, current);
    if (phase === "past") {
      return `${base} bg-pine/35`;
    }
    return `${base} bg-line/70`;
  }

  protected lifecycleActionRowClass(
    target: StatutVoyage,
    current: StatutVoyage
  ): string {
    const base =
      "pressable flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-[border-color,box-shadow,transform,background-color] duration-150 ease-out active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:transform-none";
    if (this.isPrimaryTransition(target, current)) {
      return `${base} border border-primary/35 bg-primary text-primary-foreground shadow-[0_1px_2px_oklch(0_0_0/0.06),0_4px_12px_color-mix(in_oklch,var(--color-pine)_22%,transparent)] hover:border-primary/50`;
    }
    return `${base} border border-line/75 bg-canvas hover:border-pine/30 hover:shadow-[0_1px_2px_oklch(0_0_0/0.03)]`;
  }

  protected lifecycleActionLabelClass(
    target: StatutVoyage,
    current: StatutVoyage
  ): string {
    return this.isPrimaryTransition(target, current)
      ? "text-sm font-medium text-primary-foreground"
      : "text-sm font-medium text-ink";
  }

  protected lifecycleActionMetaClass(
    target: StatutVoyage,
    current: StatutVoyage
  ): string {
    return this.isPrimaryTransition(target, current)
      ? "text-xs text-primary-foreground/80"
      : "text-xs text-muted";
  }

  protected lifecycleActionIconWellClass(
    target: StatutVoyage,
    current: StatutVoyage
  ): string {
    if (this.isPrimaryTransition(target, current)) {
      return "flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15 text-primary-foreground [&_ng-icon]:size-4";
    }
    return this.lifecycleIconWellClass(target);
  }

  protected typeVoyageIcon(type: TypeVoyage): string {
    switch (type) {
      case "SIMPLE":
        return "lucideTruck";
      case "GROUPAGE":
        return "lucidePackage";
      case "RAMASSE":
        return "lucideInbox";
      case "DISTRIBUTION":
        return "lucideShare2";
      case "NAVETTE":
        return "lucideRepeat";
      default: {
        const _exhaustive: never = type;
        return _exhaustive;
      }
    }
  }

  protected porteeIcon(portee: Portee): string {
    return portee === "INTERNATIONAL" ? "lucideGlobe" : "lucideMapPin";
  }

  protected onEventType(value: string): void {
    if (isTypeEvenement(value)) {
      this.eventType.set(value);
    }
  }

  protected onEventComment(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.eventComment.set(target.value);
    }
  }

  protected onEventLatitude(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.eventLatitude.set(target.value);
    }
  }

  protected onEventLongitude(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.eventLongitude.set(target.value);
    }
  }

  protected onDossierAjoute(): void {
    this.voyage.reload();
    this.dossiers.reload();
    this.capacityView()?.reload();
  }

  protected async changerStatut(valeur: StatutVoyage): Promise<void> {
    this.statutError.set(null);
    try {
      await this.api.changerStatut(this.id(), valeur);
      this.voyage.reload();
      this.toast.success("Statut du voyage mis à jour.");
    } catch (error) {
      // Second statut change 500s until VoyageRepositoryAdapter updates
      // in place (same pattern as VehiculeRepositoryAdapter).
      this.statutError.set(httpErrorMessage(error));
    }
  }

  protected async declarerEvenement(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.eventError.set(null);
    const commentaire = this.eventComment().trim();
    const horodatageLocal = this.eventHorodatage().trim();
    if (horodatageLocal.length === 0) {
      this.eventError.set("La date et l'heure sont obligatoires.");
      return;
    }
    const minimum = this.minEventHorodatage();
    if (minimum && compareDatetimeLocal(horodatageLocal, minimum) < 0) {
      this.eventError.set(
        `La date et l'heure doivent être postérieures ou égales au dernier événement (${formatDatetimeLocalForDisplay(minimum)}).`
      );
      return;
    }
    let horodatage: string;
    try {
      horodatage = datetimeLocalToIso(horodatageLocal);
    } catch {
      this.eventError.set("Date ou heure invalide.");
      return;
    }
    const position = this.parseEventPosition();
    if (position === undefined) {
      return;
    }
    try {
      await this.api.declarerEvenement({
        commentaire: commentaire.length > 0 ? commentaire : null,
        horodatage,
        position,
        type: this.eventType(),
        voyageId: this.id(),
      });
      this.evenements.reload();
      this.eventHorodatage.set(
        maxDatetimeLocal(horodatageLocal, toDatetimeLocal(new Date()))
      );
      this.eventComment.set("");
      this.eventLatitude.set("");
      this.eventLongitude.set("");
      this.toast.success("Événement enregistré.");
    } catch (error) {
      this.eventError.set(httpErrorMessage(error));
    }
  }

  private voyageMapLookup(): {
    dossiersById: Map<string, Dossier>;
    sitesById: Map<string, Site>;
  } | null {
    if (!(this.dossiers.hasValue() && this.sites.hasValue())) {
      return null;
    }
    return {
      dossiersById: new Map(
        this.dossiers
          .value()
          .content.map((dossier) => [dossier.id, dossier] as const)
      ),
      sitesById: new Map(
        this.sites.value().content.map((site) => [site.id, site] as const)
      ),
    };
  }

  private parseEventPosition(): GeoPoint | null | undefined {
    const latRaw = this.eventLatitude().trim();
    const lngRaw = this.eventLongitude().trim();
    if (latRaw.length === 0 && lngRaw.length === 0) {
      return null;
    }
    const latitude = Number(latRaw);
    const longitude = Number(lngRaw);
    if (Number.isNaN(latitude) || latRaw.length === 0) {
      this.eventError.set("La latitude doit être un nombre valide.");
      return undefined;
    }
    if (Number.isNaN(longitude) || lngRaw.length === 0) {
      this.eventError.set("La longitude doit être un nombre valide.");
      return undefined;
    }
    if (latitude < -90 || latitude > 90) {
      this.eventError.set("La latitude doit être comprise entre -90 et 90.");
      return undefined;
    }
    if (longitude < -180 || longitude > 180) {
      this.eventError.set("La longitude doit être comprise entre -180 et 180.");
      return undefined;
    }
    return { latitude, longitude };
  }
}
