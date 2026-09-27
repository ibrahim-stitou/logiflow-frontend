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
import { DOSSIERS_PLAN_ROLES } from "../core/auth/role";
import { SessionUtilisateur } from "../core/auth/session";
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
import { dossierStatutIcon } from "../shared/ui/list-statut-icons";
import {
  DESTINATION_NAV_ICON,
  LIST_TABLE_ROW_ICON_PROVIDERS,
} from "../shared/ui/list-table-row-icons";
import { ListTableSkeleton } from "../shared/ui/list-table-skeleton";
import { ListToolbarCta } from "../shared/ui/list-toolbar-cta";
import { StatutChip } from "../shared/ui/statut-chip";
import { dossierStatutTone } from "../tableau/apercu";
import {
  type Dossier,
  STATUT_DOSSIERS,
  statutDossierLabel,
  typeTransportLabel,
} from "./dossier";

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
  selector: "app-dossiers-page",
  templateUrl: "./dossiers-page.html",
  viewProviders: [LIST_TABLE_ROW_ICON_PROVIDERS],
})
export class DossiersPage {
  private readonly session = inject(SessionUtilisateur);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statutDossierLabel = statutDossierLabel;
  protected readonly dossierStatutTone = dossierStatutTone;
  protected readonly typeTransportLabel = typeTransportLabel;
  protected readonly statutOptions = statutOptionsFrom(
    STATUT_DOSSIERS,
    statutDossierLabel,
    dossierStatutIcon
  );
  protected readonly rowIcon = DESTINATION_NAV_ICON.dossiers;
  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  protected readonly statutFilter = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSizeOptions = LIST_PAGE_SIZE_OPTIONS;
  protected readonly pageSize = signal(DEFAULT_LIST_PAGE_SIZE);
  protected readonly activeRowId = signal<string | null>(null);

  protected readonly canPlan = computed(() =>
    this.session.hasAnyRole(DOSSIERS_PLAN_ROLES)
  );

  protected readonly dossiers = httpResource<PageResponse<Dossier>>(() => ({
    params: {
      page: this.page(),
      q: this.search().trim(),
      size: resolveListPageSize(this.pageSize()),
    },
    url: `${environment.apiBaseUrl}/dossiers`,
  }));

  protected readonly visibleDossiers = computed(() => {
    if (!this.dossiers.hasValue()) {
      return [];
    }
    return filterByStatut(
      this.dossiers.value().content,
      this.statutFilter(),
      (dossier) => dossier.statut
    );
  });

  protected readonly errorMessage = computed(() =>
    httpErrorMessage(this.dossiers.error())
  );

  protected readonly keyboardRows = computed(() =>
    listKeyboardRows(
      this.visibleDossiers(),
      (dossier) => `/dossiers/${dossier.id}`
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
      { searchResetsPage: true, statutValues: STATUT_DOSSIERS }
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
