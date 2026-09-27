import { httpResource } from "@angular/common/http";
import { Component, computed, effect, signal, untracked } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { ZardTableImports } from "@/shared/components/table/table.imports";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { ListEmptyState } from "../shared/ui/list-empty-state";
import { statutOptionsFrom } from "../shared/ui/list-filter";
import { ListPagination } from "../shared/ui/list-pagination";
import { ListStatutFilter } from "../shared/ui/list-statut-filter";
import { LIST_TABLE_ROW_ICON_PROVIDERS } from "../shared/ui/list-table-row-icons";
import { ListTableSkeleton } from "../shared/ui/list-table-skeleton";
import { ListToolbarCta } from "../shared/ui/list-toolbar-cta";
import { StatutChip } from "../shared/ui/statut-chip";
import {
  formatEcheance,
  formatPeriodicite,
  libelle,
  libelleEngin,
  type PlanEntretien,
  parametresRequete,
  TYPES_ENGIN,
  toneEcheance,
} from "./maintenance";
import { creerLookupsMaintenance } from "./maintenance-lookups";
import { MaintenanceTabs } from "./maintenance-tabs";

/** Plans d'entretien de la flotte et leur prochaine échéance. */
@Component({
  imports: [
    NgIcon,
    RouterLink,
    StatutChip,
    ListStatutFilter,
    ListToolbarCta,
    ListPagination,
    ListEmptyState,
    ListTableSkeleton,
    MaintenanceTabs,
    ...ZardTableImports,
  ],
  selector: "app-plans-page",
  templateUrl: "./plans-page.html",
  viewProviders: [LIST_TABLE_ROW_ICON_PROVIDERS],
})
export class PlansPage {
  protected readonly lookups = creerLookupsMaintenance();
  protected readonly libelle = libelle;
  protected readonly libelleEngin = libelleEngin;
  protected readonly formatPeriodicite = formatPeriodicite;
  protected readonly formatEcheance = formatEcheance;
  protected readonly toneEcheance = toneEcheance;

  protected readonly vueOptions = [
    { label: "Tous les plans", value: "tous" },
  ] as const;
  protected readonly enginTypeOptions = statutOptionsFrom(TYPES_ENGIN, libelle);

  /**
   * null = échéances à 30 jours (défaut) ; « tous » = liste paginée.
   * Réutilise le filtre liste (allLabel = vue échéances).
   */
  protected readonly vueFilter = signal<string | null>(null);
  protected readonly typeEngin = signal<string | null>(null);
  protected readonly page = signal(0);

  protected readonly vue = computed<"echeances" | "tous">(() =>
    this.vueFilter() === "tous" ? "tous" : "echeances"
  );

  protected readonly echeances = httpResource<PlanEntretien[]>(() =>
    this.vue() === "echeances"
      ? {
          params: { horizonJours: 30 },
          url: `${environment.apiBaseUrl}/maintenance/plans/echeances`,
        }
      : undefined
  );

  protected readonly plans = httpResource<PageResponse<PlanEntretien>>(() => {
    if (this.vue() !== "tous") {
      return;
    }
    const params = parametresRequete({
      page: this.page(),
      size: 20,
      typeEngin: this.typeEngin() ?? "",
    });
    return { params, url: `${environment.apiBaseUrl}/maintenance/plans` };
  });

  protected readonly lignes = computed<readonly PlanEntretien[]>(() => {
    if (this.vue() === "echeances") {
      const type = this.typeEngin();
      return (this.echeances.value() ?? []).filter(
        (p) => !type || p.engin.type === type
      );
    }
    return this.plans.value()?.content ?? [];
  });

  protected readonly chargement = computed(() =>
    this.vue() === "echeances"
      ? this.echeances.isLoading()
      : this.plans.isLoading()
  );
  protected readonly erreur = computed(() => {
    const e =
      this.vue() === "echeances" ? this.echeances.error() : this.plans.error();
    return e ? httpErrorMessage(e) : null;
  });

  constructor() {
    effect(() => {
      this.vueFilter();
      this.typeEngin();
      untracked(() => this.page.set(0));
    });
  }
}
