import { httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideArrowRight,
  lucideInbox,
  lucideMap,
  lucidePackage,
  lucideRepeat,
  lucideRoute,
  lucideShare2,
  lucideTruck,
  lucideX,
} from "@ng-icons/lucide";
import { ZardTableImports } from "@/shared/components/table/table.imports";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { SessionUtilisateur } from "../core/auth/session";
import { VOYAGES_PLAN_ROLES } from "../core/auth/role";
import type { Dossier } from "../dossiers/dossier";
import { filterByStatut, statutOptionsFrom } from "../shared/ui/list-filter";
import { voyageStatutIcon } from "../shared/ui/list-statut-icons";
import { ListEmptyState } from "../shared/ui/list-empty-state";
import {
  ListTableSkeleton,
  MapAsideSkeleton,
} from "../shared/ui/list-table-skeleton";
import { LIST_TABLE_ROW_ICON_PROVIDERS } from "../shared/ui/list-table-row-icons";
import { connectListQueryState } from "../shared/ui/list-query-state";
import {
  listKeyboardRows,
  ListRowKeyboard,
  syncListKeyboardActiveId,
} from "../shared/ui/list-row-keyboard";
import {
  DEFAULT_LIST_PAGE_SIZE,
  LIST_PAGE_SIZE_OPTIONS,
  resolveListPageSize,
} from "../shared/ui/list-page-size";
import { ListPagination } from "../shared/ui/list-pagination";
import { ListSearchBar } from "../shared/ui/list-search-bar";
import { ListStatutFilter } from "../shared/ui/list-statut-filter";
import { ListToolbarCta } from "../shared/ui/list-toolbar-cta";
import { statutIconForValue } from "../shared/ui/list-statut-filter";
import { StatutChip } from "../shared/ui/statut-chip";
import type { Site } from "../sites/site";
import { voyageStatutTone } from "../tableau/apercu";
import {
  formatInstant,
  porteeLabel,
  STATUT_VOYAGES,
  statutVoyageLabel,
  typeVoyageLabel,
  type StatutVoyage,
  type TypeVoyage,
  type Voyage,
} from "./voyage";
import { ItineraireApi } from "../ia/itineraire-api";
import { canCalculerItineraire } from "../ia/itineraire";
import type { GeoMapPathPoint } from "../shared/ui/geo-markers-map";
import { GeoMarkersMap } from "../shared/ui/geo-markers-map";
import {
  voyageItinerairePath,
  voyageItinerairePoints,
  voyageSiteMarkers,
} from "./voyage-sites-map-markers";

const LOOKUP_PAGE_SIZE = 100;

@Component({
  imports: [
    RouterLink,
    NgIcon,
    StatutChip,
    ListSearchBar,
    ListStatutFilter,
    ListToolbarCta,
    ListPagination,
    ListEmptyState,
    ListRowKeyboard,
    ListTableSkeleton,
    MapAsideSkeleton,
    GeoMarkersMap,
    ...ZardTableImports,
  ],
  selector: "app-voyages-page",
  templateUrl: "./voyages-page.html",
  styleUrl: "./voyages-page.css",
  viewProviders: [
    LIST_TABLE_ROW_ICON_PROVIDERS,
    provideIcons({
      lucideArrowRight,
      lucideInbox,
      lucideMap,
      lucidePackage,
      lucideRepeat,
      lucideRoute,
      lucideShare2,
      lucideTruck,
      lucideX,
    }),
  ],
})
export class VoyagesPage {
  private readonly session = inject(SessionUtilisateur);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly itineraireApi = inject(ItineraireApi);

  protected readonly formatInstant = formatInstant;
  protected readonly porteeLabel = porteeLabel;
  protected readonly statutVoyageLabel = statutVoyageLabel;
  protected readonly typeVoyageLabel = typeVoyageLabel;
  protected readonly voyageStatutTone = voyageStatutTone;
  protected readonly statutOptions = statutOptionsFrom(
    STATUT_VOYAGES,
    statutVoyageLabel,
    voyageStatutIcon
  );
  protected readonly pageSizeOptions = LIST_PAGE_SIZE_OPTIONS;
  protected readonly pageSize = signal(DEFAULT_LIST_PAGE_SIZE);
  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  protected readonly statutFilter = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly selectedVoyageId = signal<string | null>(null);
  /** Itinerary map is on by default — core to the voyages list. */
  protected readonly mapVisible = signal(true);
  protected readonly mapRoadPath = signal<readonly GeoMapPathPoint[]>([]);
  protected readonly mapRoadPathLoading = signal(false);
  protected readonly mapRoadPathUnavailable = signal(false);

  protected readonly canPlan = computed(() =>
    this.session.hasAnyRole(VOYAGES_PLAN_ROLES)
  );

  protected readonly voyages = httpResource<PageResponse<Voyage>>(() => ({
    params: {
      page: this.page(),
      q: this.search().trim(),
      size: resolveListPageSize(this.pageSize()),
    },
    url: `${environment.apiBaseUrl}/voyages`,
  }));

  protected readonly dossiers = httpResource<PageResponse<Dossier>>(() => ({
    params: {
      page: 0,
      size: LOOKUP_PAGE_SIZE,
    },
    url: `${environment.apiBaseUrl}/dossiers`,
  }));

  protected readonly sites = httpResource<PageResponse<Site>>(() => ({
    params: {
      page: 0,
      size: LOOKUP_PAGE_SIZE,
    },
    url: `${environment.apiBaseUrl}/sites`,
  }));

  protected readonly visibleVoyages = computed(() => {
    if (!this.voyages.hasValue()) {
      return [];
    }
    return filterByStatut(
      this.voyages.value().content,
      this.statutFilter(),
      (voyage) => voyage.statut
    );
  });

  protected readonly selectedVoyage = computed(() => {
    const id = this.selectedVoyageId();
    if (id === null) {
      return null;
    }
    return this.visibleVoyages().find((voyage) => voyage.id === id) ?? null;
  });

  protected readonly mapMarkers = computed(() => {
    const lookup = this.voyageMapLookup();
    if (!lookup) {
      return [];
    }
    return voyageSiteMarkers(
      this.selectedVoyage(),
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
      this.selectedVoyage(),
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
      this.selectedVoyage(),
      lookup.dossiersById,
      lookup.sitesById
    );
  });

  protected readonly mapHint = computed(() => {
    if (this.selectedVoyageId() === null) {
      return "Sélectionnez un voyage pour afficher son itinéraire.";
    }
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

  protected readonly errorMessage = computed(() =>
    httpErrorMessage(this.voyages.error())
  );

  protected readonly hasActiveFilters = computed(
    () => this.search().trim() !== "" || this.statutFilter() !== null
  );

  protected readonly activeStatutLabel = computed(() => {
    const statut = this.statutFilter();
    if (statut === null) {
      return null;
    }
    return statutVoyageLabel(statut as StatutVoyage);
  });

  protected readonly keyboardRows = computed(() =>
    listKeyboardRows(
      this.visibleVoyages(),
      (voyage) => `/voyages/${voyage.id}`
    )
  );

  protected readonly listWithMapLayoutClass = computed(() =>
    this.mapVisible()
      ? "grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] xl:items-start"
      : ""
  );

  constructor() {
    connectListQueryState(
      this.route,
      this.router,
      this.destroyRef,
      {
        page: this.page,
        q: this.search,
        searchDraft: this.searchDraft,
        statut: this.statutFilter,
      },
      { searchResetsPage: true, statutValues: STATUT_VOYAGES }
    );

    effect(() => {
      syncListKeyboardActiveId(this.keyboardRows(), this.selectedVoyageId);
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

  protected clearFilters(): void {
    this.searchDraft.set("");
    this.search.set("");
    this.statutFilter.set(null);
    this.page.set(0);
  }

  protected toggleMapVisible(): void {
    this.mapVisible.update((visible) => !visible);
  }

  protected statutChipIcon(statut: StatutVoyage): string | null {
    return statutIconForValue(this.statutOptions, statut);
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

  protected selectVoyage(voyageId: string): void {
    this.selectedVoyageId.set(voyageId);
    if (!this.mapVisible()) {
      this.mapVisible.set(true);
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
}
