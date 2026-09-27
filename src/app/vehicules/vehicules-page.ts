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
import { filterByStatut, statutOptionsFrom } from "../shared/ui/list-filter";
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
  statutIconForValue,
} from "../shared/ui/list-statut-filter";
import { vehiculeStatutIcon } from "../shared/ui/list-statut-icons";
import {
  DESTINATION_NAV_ICON,
  LIST_TABLE_ROW_ICON_PROVIDERS,
} from "../shared/ui/list-table-row-icons";
import { ListTableSkeleton } from "../shared/ui/list-table-skeleton";
import { ListToolbarCta } from "../shared/ui/list-toolbar-cta";
import { StatutChip } from "../shared/ui/statut-chip";
import { vehiculeStatutTone } from "../tableau/apercu";
import {
  formatMarqueModele,
  statutLabel,
  typeLabel,
  VEHICULE_STATUTS,
  type Vehicule,
} from "./vehicule";

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
  selector: "app-vehicules-page",
  templateUrl: "./vehicules-page.html",
  viewProviders: [LIST_TABLE_ROW_ICON_PROVIDERS],
})
export class VehiculesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly typeLabel = typeLabel;
  protected readonly statutLabel = statutLabel;
  protected readonly formatMarqueModele = formatMarqueModele;
  protected readonly vehiculeStatutTone = vehiculeStatutTone;
  protected readonly statutOptions = statutOptionsFrom(
    VEHICULE_STATUTS,
    statutLabel,
    vehiculeStatutIcon
  );
  protected readonly rowIcon = DESTINATION_NAV_ICON.vehicules;

  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  protected readonly statutFilter = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSizeOptions = LIST_PAGE_SIZE_OPTIONS;
  protected readonly pageSize = signal(DEFAULT_LIST_PAGE_SIZE);
  protected readonly activeRowId = signal<string | null>(null);

  protected readonly vehicules = httpResource<PageResponse<Vehicule>>(() => ({
    params: {
      page: this.page(),
      q: this.search().trim(),
      size: resolveListPageSize(this.pageSize()),
    },
    url: `${environment.apiBaseUrl}/vehicules`,
  }));

  protected readonly visibleVehicules = computed(() => {
    if (!this.vehicules.hasValue()) {
      return [];
    }
    return filterByStatut(
      this.vehicules.value().content,
      this.statutFilter(),
      (vehicule) => vehicule.statut
    );
  });

  protected readonly errorMessage = computed(() =>
    httpErrorMessage(this.vehicules.error())
  );

  protected readonly keyboardRows = computed(() =>
    listKeyboardRows(
      this.visibleVehicules(),
      (vehicule) => `/vehicules/${vehicule.id}`
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
        statut: this.statutFilter,
      },
      { searchResetsPage: true, statutValues: VEHICULE_STATUTS }
    );

    effect(() => {
      syncListKeyboardActiveId(this.keyboardRows(), this.activeRowId);
    });
  }

  protected statutChipIcon(statut: string): string | null {
    return statutIconForValue(this.statutOptions, statut);
  }

  protected clearFilters(): void {
    this.searchDraft.set("");
    this.search.set("");
    this.statutFilter.set(null);
    this.page.set(0);
  }
}
