import { DatePipe } from "@angular/common";
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
import { lucideGauge, lucideReceipt } from "@ng-icons/lucide";
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
import { priseCarburantStatutIcon } from "../shared/ui/list-statut-icons";
import {
  DESTINATION_NAV_ICON,
  LIST_TABLE_ROW_ICON_PROVIDERS,
} from "../shared/ui/list-table-row-icons";
import { ListTableSkeleton } from "../shared/ui/list-table-skeleton";
import { ListToolbarCta } from "../shared/ui/list-toolbar-cta";
import { StatutChip } from "../shared/ui/statut-chip";
import { CarburantTabs } from "./carburant-tabs";
import {
  formatLitres,
  formatMontantTtc,
  formatPriseShortId,
  type PriseCarburant,
  type PriseCarburantStats,
  STATUT_PRISES,
  statutPriseLabel,
  statutPriseTone,
  typeCarburantLabel,
} from "./prise-carburant";

@Component({
  imports: [
    DatePipe,
    NgIcon,
    RouterLink,
    StatutChip,
    CarburantTabs,
    ListSearchBar,
    ListStatutFilter,
    ListToolbarCta,
    ListPagination,
    ListEmptyState,
    ListRowKeyboard,
    ListTableSkeleton,
    ...ZardTableImports,
  ],
  selector: "app-prises-carburant-page",
  templateUrl: "./prises-carburant-page.html",
  viewProviders: [
    LIST_TABLE_ROW_ICON_PROVIDERS,
    provideIcons({ lucideGauge, lucideReceipt }),
  ],
})
export class PrisesCarburantPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly formatLitres = formatLitres;
  protected readonly formatMontantTtc = formatMontantTtc;
  protected readonly formatPriseShortId = formatPriseShortId;
  protected readonly statutPriseLabel = statutPriseLabel;
  protected readonly statutPriseTone = statutPriseTone;
  protected readonly typeCarburantLabel = typeCarburantLabel;
  protected readonly statutOptions = statutOptionsFrom(
    STATUT_PRISES,
    statutPriseLabel,
    priseCarburantStatutIcon
  );
  protected readonly rowIcon = DESTINATION_NAV_ICON.carburant;
  protected readonly statsSkeletonTiles = [0, 1, 2] as const;

  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  protected readonly statutFilter = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSizeOptions = LIST_PAGE_SIZE_OPTIONS;
  protected readonly pageSize = signal(DEFAULT_LIST_PAGE_SIZE);
  protected readonly selectedPriseId = signal<string | null>(null);

  protected readonly prises = httpResource<PageResponse<PriseCarburant>>(() => {
    const params: Record<string, string | number> = {
      page: this.page(),
      q: this.search().trim(),
      size: resolveListPageSize(this.pageSize()),
    };
    const statut = this.statutFilter();
    if (statut) {
      params["statut"] = statut;
    }
    return {
      params,
      url: `${environment.apiBaseUrl}/prises-carburant`,
    };
  });

  protected readonly stats = httpResource<PriseCarburantStats>(() => {
    const params: Record<string, string> = { q: this.search().trim() };
    const statut = this.statutFilter();
    if (statut) {
      params["statut"] = statut;
    }
    return {
      params,
      url: `${environment.apiBaseUrl}/prises-carburant/stats`,
    };
  });

  protected readonly visiblePrises = computed(() => {
    if (!this.prises.hasValue()) {
      return [];
    }
    return filterByStatut(
      this.prises.value().content,
      this.statutFilter(),
      (prise) => prise.statut
    );
  });

  protected readonly errorMessage = computed(() =>
    httpErrorMessage(this.prises.error())
  );

  protected readonly keyboardRows = computed(() =>
    listKeyboardRows(this.visiblePrises(), (prise) => `/carburant/${prise.id}`)
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
      { searchResetsPage: true, statutValues: [...STATUT_PRISES] }
    );

    effect(() => {
      syncListKeyboardActiveId(this.keyboardRows(), this.selectedPriseId);
    });
  }

  protected statutChipIcon(statut: string): string | null {
    return statutIconForValue(this.statutOptions, statut);
  }

  protected resetFilters(): void {
    this.searchDraft.set("");
    this.search.set("");
    this.statutFilter.set(null);
    this.page.set(0);
  }

  protected selectPrise(priseId: string): void {
    this.selectedPriseId.set(priseId);
  }
}
