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
import { commandeStatutIcon } from "../shared/ui/list-statut-icons";
import {
  DESTINATION_NAV_ICON,
  LIST_TABLE_ROW_ICON_PROVIDERS,
} from "../shared/ui/list-table-row-icons";
import { ListTableSkeleton } from "../shared/ui/list-table-skeleton";
import { ListToolbarCta } from "../shared/ui/list-toolbar-cta";
import { StatutChip } from "../shared/ui/statut-chip";
import { commandeStatutTone } from "../tableau/apercu";
import {
  type Commande,
  formatDate,
  formatMoney,
  STATUT_COMMANDES,
  statutCommandeLabel,
} from "./commande";

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
  selector: "app-commandes-page",
  templateUrl: "./commandes-page.html",
  viewProviders: [LIST_TABLE_ROW_ICON_PROVIDERS],
})
export class CommandesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly formatDate = formatDate;
  protected readonly formatMoney = formatMoney;
  protected readonly statutCommandeLabel = statutCommandeLabel;
  protected readonly commandeStatutTone = commandeStatutTone;
  protected readonly statutOptions = statutOptionsFrom(
    STATUT_COMMANDES,
    statutCommandeLabel,
    commandeStatutIcon
  );
  protected readonly rowIcon = DESTINATION_NAV_ICON.commandes;
  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  protected readonly statutFilter = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSizeOptions = LIST_PAGE_SIZE_OPTIONS;
  protected readonly pageSize = signal(DEFAULT_LIST_PAGE_SIZE);
  protected readonly activeRowId = signal<string | null>(null);

  protected readonly commandes = httpResource<PageResponse<Commande>>(() => ({
    params: {
      page: this.page(),
      q: this.search().trim(),
      size: resolveListPageSize(this.pageSize()),
    },
    url: `${environment.apiBaseUrl}/commandes`,
  }));

  protected readonly visibleCommandes = computed(() => {
    if (!this.commandes.hasValue()) {
      return [];
    }
    return filterByStatut(
      this.commandes.value().content,
      this.statutFilter(),
      (commande) => commande.statut
    );
  });

  protected readonly errorMessage = computed(() =>
    httpErrorMessage(this.commandes.error())
  );

  protected readonly keyboardRows = computed(() =>
    listKeyboardRows(
      this.visibleCommandes(),
      (commande) => `/commandes/${commande.id}`
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
      { searchResetsPage: true, statutValues: STATUT_COMMANDES }
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
