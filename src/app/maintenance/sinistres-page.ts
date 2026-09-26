import { httpResource } from "@angular/common/http";
import { Component, computed, effect, signal, untracked } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { ZardTableImports } from "@/shared/components/table/table.imports";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { statutOptionsFrom } from "../shared/ui/list-filter";
import { ListEmptyState } from "../shared/ui/list-empty-state";
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
  parametresRequete,
  type Sinistre,
  STATUTS_SINISTRE,
  TYPES_SINISTRE,
  toneStatutSinistre,
} from "./maintenance";
import { creerLookupsMaintenance } from "./maintenance-lookups";
import { MaintenanceTabs } from "./maintenance-tabs";

/** Liste des sinistres avec coût net et alertes de déclaration tardive. */
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
  selector: "app-sinistres-page",
  templateUrl: "./sinistres-page.html",
  viewProviders: [LIST_TABLE_ROW_ICON_PROVIDERS],
})
export class SinistresPage {
  protected readonly lookups = creerLookupsMaintenance();
  protected readonly libelle = libelle;
  protected readonly formatMontant = formatMontant;
  protected readonly formatDateHeure = formatDateHeure;
  protected readonly toneStatutSinistre = toneStatutSinistre;

  protected readonly statutOptions = statutOptionsFrom(STATUTS_SINISTRE, libelle);
  protected readonly typeOptions = statutOptionsFrom(TYPES_SINISTRE, libelle);

  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  protected readonly statut = signal<string | null>(null);
  protected readonly type = signal<string | null>(null);
  protected readonly page = signal(0);

  protected readonly sinistres = httpResource<PageResponse<Sinistre>>(() => {
    const params = parametresRequete({
      page: this.page(),
      q: this.search(),
      size: 20,
      statut: this.statut() ?? "",
      type: this.type() ?? "",
    });
    return { params, url: `${environment.apiBaseUrl}/maintenance/sinistres` };
  });

  protected readonly erreur = computed(() =>
    httpErrorMessage(this.sinistres.error())
  );

  constructor() {
    effect(() => {
      this.search();
      this.statut();
      this.type();
      untracked(() => this.page.set(0));
    });
  }

  protected engins(s: Sinistre): string {
    return [s.vehiculeId, s.remorqueId]
      .filter((id): id is string => Boolean(id))
      .map((id) => this.lookups.engins().get(id)?.immatriculation ?? "…")
      .join(" + ");
  }
}
