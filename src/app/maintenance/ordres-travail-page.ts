import { httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  effect,
  input,
  signal,
  untracked,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { ZardTableImports } from "@/shared/components/table/table.imports";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { statutOptionsFrom } from "../shared/ui/list-filter";
import { ListEmptyState } from "../shared/ui/list-empty-state";
import { DEFAULT_LIST_PAGE_SIZE } from "../shared/ui/list-page-size";
import { ListPagination } from "../shared/ui/list-pagination";
import { ListSearchBar } from "../shared/ui/list-search-bar";
import { ListStatutFilter } from "../shared/ui/list-statut-filter";
import { LIST_TABLE_ROW_ICON_PROVIDERS } from "../shared/ui/list-table-row-icons";
import { ListTableSkeleton } from "../shared/ui/list-table-skeleton";
import { ListToolbarCta } from "../shared/ui/list-toolbar-cta";
import { StatutChip } from "../shared/ui/statut-chip";
import {
  formatDateHeure,
  formatMontant,
  libelle,
  libelleEngin,
  NATURES,
  type OrdreTravail,
  parametresRequete,
  STATUTS_OT,
  TYPES_ENGIN,
  TYPES_INTERVENTION,
  toneStatutOT,
} from "./maintenance";
import { creerLookupsMaintenance } from "./maintenance-lookups";
import { MaintenanceTabs } from "./maintenance-tabs";

/** Liste filtrable des ordres de travail. */
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
    ListTableSkeleton,
    MaintenanceTabs,
    ...ZardTableImports,
  ],
  selector: "app-ordres-travail-page",
  templateUrl: "./ordres-travail-page.html",
  viewProviders: [LIST_TABLE_ROW_ICON_PROVIDERS],
})
export class OrdresTravailPage {
  /** Filtre facultatif sur un engin (paramètre de requête, depuis les coûts ou une fiche). */
  readonly enginId = input<string>();

  protected readonly lookups = creerLookupsMaintenance();
  protected readonly libelle = libelle;
  protected readonly libelleEngin = libelleEngin;
  protected readonly formatMontant = formatMontant;
  protected readonly formatDateHeure = formatDateHeure;
  protected readonly toneStatutOT = toneStatutOT;

  protected readonly statutOptions = statutOptionsFrom(STATUTS_OT, libelle);
  protected readonly typeOptions = statutOptionsFrom(
    TYPES_INTERVENTION,
    libelle
  );
  protected readonly natureOptions = statutOptionsFrom(NATURES, libelle);
  protected readonly enginTypeOptions = statutOptionsFrom(TYPES_ENGIN, libelle);

  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  protected readonly statut = signal<string | null>(null);
  protected readonly type = signal<string | null>(null);
  protected readonly nature = signal<string | null>(null);
  protected readonly typeEngin = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(DEFAULT_LIST_PAGE_SIZE);

  protected readonly ordres = httpResource<PageResponse<OrdreTravail>>(() => {
    const params = parametresRequete({
      enginId: this.enginId(),
      nature: this.nature() ?? "",
      page: this.page(),
      q: this.search(),
      size: this.pageSize(),
      statut: this.statut() ?? "",
      type: this.type() ?? "",
      typeEngin: this.typeEngin() ?? "",
    });
    return {
      params,
      url: `${environment.apiBaseUrl}/maintenance/ordres-travail`,
    };
  });

  protected readonly filtresActifs = computed(
    () =>
      Boolean(this.search().trim()) ||
      this.statut() !== null ||
      this.type() !== null ||
      this.nature() !== null ||
      this.typeEngin() !== null
  );
  protected readonly errorMessage = computed(() =>
    httpErrorMessage(this.ordres.error())
  );

  constructor() {
    effect(() => {
      this.search();
      this.statut();
      this.type();
      this.nature();
      this.typeEngin();
      untracked(() => this.page.set(0));
    });
  }

  protected reinitialiser(): void {
    this.searchDraft.set("");
    this.search.set("");
    this.statut.set(null);
    this.type.set(null);
    this.nature.set(null);
    this.typeEngin.set(null);
  }

  protected changerTaillePage(taille: number): void {
    this.pageSize.set(taille);
    this.page.set(0);
  }
}
