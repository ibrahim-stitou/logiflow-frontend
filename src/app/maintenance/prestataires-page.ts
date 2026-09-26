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
  libelle,
  type Prestataire,
  parametresRequete,
  TYPES_PRESTATAIRE,
} from "./maintenance";
import { MaintenanceTabs } from "./maintenance-tabs";

/** Répertoire des prestataires (garages, carrossiers, experts, assureurs…). */
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
  selector: "app-prestataires-page",
  templateUrl: "./prestataires-page.html",
  viewProviders: [LIST_TABLE_ROW_ICON_PROVIDERS],
})
export class PrestatairesPage {
  protected readonly libelle = libelle;
  protected readonly typeOptions = statutOptionsFrom(TYPES_PRESTATAIRE, libelle);

  protected readonly searchDraft = signal("");
  protected readonly search = signal("");
  protected readonly type = signal<string | null>(null);
  protected readonly page = signal(0);

  protected readonly prestataires = httpResource<PageResponse<Prestataire>>(
    () => {
      const params = parametresRequete({
        page: this.page(),
        q: this.search(),
        size: 20,
        type: this.type() ?? "",
      });
      return {
        params,
        url: `${environment.apiBaseUrl}/maintenance/prestataires`,
      };
    }
  );

  protected readonly erreur = computed(() =>
    httpErrorMessage(this.prestataires.error())
  );

  constructor() {
    effect(() => {
      this.search();
      this.type();
      untracked(() => this.page.set(0));
    });
  }
}
