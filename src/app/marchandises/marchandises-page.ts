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
import { ListTableSkeleton } from "../shared/ui/list-table-skeleton";
import { ListToolbarCta } from "../shared/ui/list-toolbar-cta";
import {
  actifIcon,
  actifLabel,
  actifTone,
  StatutChip,
} from "../shared/ui/statut-chip";
import {
  formatMarchandiseLabel,
  gerbableLabel,
  type Marchandise,
} from "./marchandise";

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
    ...ZardTableImports,
  ],
  selector: "app-marchandises-page",
  templateUrl: "./marchandises-page.html",
  viewProviders: [LIST_TABLE_ROW_ICON_PROVIDERS],
})
export class MarchandisesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly actifIcon = actifIcon;
  protected readonly actifLabel = actifLabel;
  protected readonly actifTone = actifTone;
  protected readonly rowIcon = DESTINATION_NAV_ICON.marchandises;
  protected readonly actifOptions = ACTIF_OPTIONS;
  protected readonly formatMarchandiseLabel = formatMarchandiseLabel;
  protected readonly gerbableLabel = gerbableLabel;
  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  protected readonly actifFilter = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSizeOptions = LIST_PAGE_SIZE_OPTIONS;
  protected readonly pageSize = signal(DEFAULT_LIST_PAGE_SIZE);
  protected readonly activeRowId = signal<string | null>(null);

  protected readonly marchandises = httpResource<PageResponse<Marchandise>>(
    () => ({
      params: {
        page: this.page(),
        q: this.search().trim(),
        size: resolveListPageSize(this.pageSize()),
      },
      url: `${environment.apiBaseUrl}/marchandises`,
    })
  );

  protected readonly visibleMarchandises = computed(() => {
    if (!this.marchandises.hasValue()) {
      return [];
    }
    return filterByStatut(
      this.marchandises.value().content,
      this.actifFilter(),
      (marchandise) => (marchandise.actif ? "true" : "false")
    );
  });

  protected readonly errorMessage = computed(() =>
    httpErrorMessage(this.marchandises.error())
  );

  protected readonly keyboardRows = computed(() =>
    listKeyboardRows(
      this.visibleMarchandises(),
      (marchandise) => `/marchandises/${marchandise.id}`
    )
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
      syncListKeyboardActiveId(this.keyboardRows(), this.activeRowId);
    });
  }

  protected clearFilters(): void {
    this.searchDraft.set("");
    this.search.set("");
    this.actifFilter.set(null);
    this.page.set(0);
  }
}
