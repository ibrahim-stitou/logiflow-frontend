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
import { NgIcon } from "@ng-icons/core";
import { ZardTableImports } from "@/shared/components/table/table.imports";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { GeoMarkersMap } from "../shared/ui/geo-markers-map";
import { ListEmptyState } from "../shared/ui/list-empty-state";
import { filterByStatut } from "../shared/ui/list-filter";
import {
  DEFAULT_LIST_PAGE_SIZE,
  LIST_PAGE_SIZE_OPTIONS,
  resolveListPageSize,
} from "../shared/ui/list-page-size";
import { ListPagination } from "../shared/ui/list-pagination";
import { connectListQueryState } from "../shared/ui/list-query-state";
import {
  ListRowKeyboard,
  listKeyboardRows,
  syncListKeyboardActiveId,
} from "../shared/ui/list-row-keyboard";
import { ListSearchBar } from "../shared/ui/list-search-bar";
import {
  ListStatutFilter,
  type ListStatutOption,
} from "../shared/ui/list-statut-filter";
import {
  DESTINATION_NAV_ICON,
  LIST_TABLE_ROW_ICON_PROVIDERS,
} from "../shared/ui/list-table-row-icons";
import {
  ListTableSkeleton,
  MapAsideSkeleton,
} from "../shared/ui/list-table-skeleton";
import { ListToolbarCta } from "../shared/ui/list-toolbar-cta";
import {
  actifIcon,
  actifLabel,
  actifTone,
  StatutChip,
} from "../shared/ui/statut-chip";
import type { Site } from "./site";
import { siteListMarkers } from "./site-list-markers";

const ACTIF_OPTIONS: readonly ListStatutOption[] = [
  { label: "Actif", value: "true" },
  { label: "Inactif", value: "false" },
];

@Component({
  imports: [
    NgIcon,
    RouterLink,
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
  selector: "app-sites-page",
  templateUrl: "./sites-page.html",
  viewProviders: [LIST_TABLE_ROW_ICON_PROVIDERS],
})
export class SitesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly actifIcon = actifIcon;
  protected readonly actifLabel = actifLabel;
  protected readonly actifTone = actifTone;
  protected readonly rowIcon = DESTINATION_NAV_ICON.sites;
  protected readonly actifOptions = ACTIF_OPTIONS;
  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  protected readonly actifFilter = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSizeOptions = LIST_PAGE_SIZE_OPTIONS;
  protected readonly pageSize = signal(DEFAULT_LIST_PAGE_SIZE);
  protected readonly selectedSiteId = signal<string | null>(null);
  protected readonly mapVisible = signal(false);

  protected readonly sites = httpResource<PageResponse<Site>>(() => ({
    params: {
      page: this.page(),
      q: this.search().trim(),
      size: resolveListPageSize(this.pageSize()),
    },
    url: `${environment.apiBaseUrl}/sites`,
  }));

  protected readonly visibleSites = computed(() => {
    if (!this.sites.hasValue()) {
      return [];
    }
    return filterByStatut(
      this.sites.value().content,
      this.actifFilter(),
      (site) => (site.actif ? "true" : "false")
    );
  });

  protected readonly mapMarkers = computed(() =>
    siteListMarkers(this.visibleSites())
  );

  protected readonly mapHint = computed(() => {
    const count = this.mapMarkers().length;
    if (count === 0) {
      return "Aucun site géolocalisé sur cette page.";
    }
    if (this.selectedSiteId()) {
      return "Site sélectionné mis en avant sur la carte.";
    }
    return `${count} site(s) affiché(s) sur la carte.`;
  });

  protected readonly errorMessage = computed(() =>
    httpErrorMessage(this.sites.error())
  );

  protected readonly keyboardRows = computed(() =>
    listKeyboardRows(this.visibleSites(), (site) => `/sites/${site.id}`)
  );

  protected readonly listWithMapLayoutClass = computed(() =>
    this.mapVisible()
      ? "grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]"
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
        statut: this.actifFilter,
      },
      { searchResetsPage: true, statutValues: ["true", "false"] }
    );

    effect(() => {
      syncListKeyboardActiveId(this.keyboardRows(), this.selectedSiteId);
    });
  }

  protected clearFilters(): void {
    this.searchDraft.set("");
    this.search.set("");
    this.actifFilter.set(null);
    this.page.set(0);
  }

  protected selectSite(siteId: string): void {
    this.selectedSiteId.set(siteId);
  }

  protected toggleMapVisible(): void {
    this.mapVisible.update((visible) => !visible);
  }
}
