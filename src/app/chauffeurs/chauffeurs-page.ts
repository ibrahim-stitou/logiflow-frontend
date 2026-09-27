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
import { lucideTriangleAlert } from "@ng-icons/lucide";
import { ZardTableImports } from "@/shared/components/table/table.imports";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { ListEmptyState } from "../shared/ui/list-empty-state";
import { statutOptionsFrom } from "../shared/ui/list-filter";
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
import {
  chauffeurDisponibiliteIcon,
  chauffeurStatutIcon,
} from "../shared/ui/list-statut-icons";
import {
  DESTINATION_NAV_ICON,
  LIST_TABLE_ROW_ICON_PROVIDERS,
} from "../shared/ui/list-table-row-icons";
import { ListTableSkeleton } from "../shared/ui/list-table-skeleton";
import { ListToolbarCta } from "../shared/ui/list-toolbar-cta";
import { StatutChip } from "../shared/ui/statut-chip";
import {
  alertesChauffeur,
  CHAUFFEUR_DISPONIBILITES,
  CHAUFFEUR_STATUTS,
  type Chauffeur,
  chauffeurDisponibiliteLabel,
  chauffeurDisponibiliteTone,
  chauffeurStatutLabel,
  chauffeurStatutTone,
  formatSoldeConduite,
  habilitationsValides,
} from "./chauffeur";

/** Pastilles d'habilitations mises en avant dans la liste. */
const HABILITATIONS_CLES = ["ADR_BASE", "ADR_CITERNE"] as const;

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
  selector: "app-chauffeurs-page",
  templateUrl: "./chauffeurs-page.html",
  viewProviders: [
    LIST_TABLE_ROW_ICON_PROVIDERS,
    provideIcons({ lucideTriangleAlert }),
  ],
})
export class ChauffeursPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly chauffeurStatutLabel = chauffeurStatutLabel;
  protected readonly chauffeurStatutTone = chauffeurStatutTone;
  protected readonly chauffeurDisponibiliteLabel = chauffeurDisponibiliteLabel;
  protected readonly chauffeurDisponibiliteTone = chauffeurDisponibiliteTone;
  protected readonly formatSoldeConduite = formatSoldeConduite;
  protected readonly rowIcon = DESTINATION_NAV_ICON.chauffeurs;

  protected readonly disponibiliteOptions = statutOptionsFrom(
    CHAUFFEUR_DISPONIBILITES,
    chauffeurDisponibiliteLabel,
    chauffeurDisponibiliteIcon
  );
  protected readonly statutOptions = statutOptionsFrom(
    CHAUFFEUR_STATUTS,
    chauffeurStatutLabel,
    chauffeurStatutIcon
  );

  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  /** Filtre « statut » de l'URL = disponibilité opérationnelle (le plus utile au quotidien). */
  protected readonly disponibiliteFilter = signal<string | null>(null);
  protected readonly statutFilter = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSizeOptions = LIST_PAGE_SIZE_OPTIONS;
  protected readonly pageSize = signal(DEFAULT_LIST_PAGE_SIZE);
  protected readonly activeRowId = signal<string | null>(null);

  private readonly aujourdhui = new Date();

  protected readonly chauffeurs = httpResource<PageResponse<Chauffeur>>(() => {
    const params: {
      disponibilite?: string;
      page: number;
      q: string;
      size: number;
      statut?: string;
    } = {
      page: this.page(),
      q: this.search().trim(),
      size: resolveListPageSize(this.pageSize()),
    };
    const disponibilite = this.disponibiliteFilter();
    if (disponibilite) {
      params.disponibilite = disponibilite;
    }
    const statut = this.statutFilter();
    if (statut) {
      params.statut = statut;
    }
    return { params, url: `${environment.apiBaseUrl}/chauffeurs` };
  });

  protected readonly lignes = computed(() => {
    if (!this.chauffeurs.hasValue()) {
      return [];
    }
    return this.chauffeurs.value().content.map((chauffeur) => ({
      alertes: alertesChauffeur(chauffeur, this.aujourdhui),
      chauffeur,
      habilitationsCles: habilitationsValides(
        chauffeur.habilitations,
        this.aujourdhui
      ).filter((type) =>
        (HABILITATIONS_CLES as readonly string[]).includes(type)
      ),
    }));
  });

  protected readonly filtresActifs = computed(
    () =>
      this.search().length > 0 ||
      this.disponibiliteFilter() !== null ||
      this.statutFilter() !== null
  );

  protected readonly errorMessage = computed(() =>
    httpErrorMessage(this.chauffeurs.error())
  );

  protected readonly keyboardRows = computed(() =>
    listKeyboardRows(
      this.lignes().map((ligne) => ligne.chauffeur),
      (chauffeur) => `/chauffeurs/${chauffeur.id}`
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
        statut: this.disponibiliteFilter,
      },
      { searchResetsPage: true, statutValues: [...CHAUFFEUR_DISPONIBILITES] }
    );

    effect(() => {
      syncListKeyboardActiveId(this.keyboardRows(), this.activeRowId);
    });
  }

  protected disponibiliteChipIcon(disponibilite: string): string | null {
    return statutIconForValue(this.disponibiliteOptions, disponibilite);
  }

  protected statutChipIcon(statut: string): string | null {
    return statutIconForValue(this.statutOptions, statut);
  }

  protected clearFilters(): void {
    this.searchDraft.set("");
    this.search.set("");
    this.disponibiliteFilter.set(null);
    this.statutFilter.set(null);
    this.page.set(0);
  }
}
