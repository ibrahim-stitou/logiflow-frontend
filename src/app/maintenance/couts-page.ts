import { httpResource } from "@angular/common/http";
import { Component, computed, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import { statutOptionsFrom } from "../shared/ui/list-filter";
import { ListStatutFilter } from "../shared/ui/list-statut-filter";
import { ListTableSkeleton } from "../shared/ui/list-table-skeleton";
import {
  type CoutsMaintenance,
  formatDate,
  formatMontant,
  libelle,
  parametresRequete,
  type Repartition,
  TYPES_ENGIN,
} from "./maintenance";
import { MaintenanceTabs } from "./maintenance-tabs";

type Periode = "MOIS" | "TRIMESTRE" | "ANNEE_CIVILE" | "DOUZE_MOIS";

const PERIODES: readonly { label: string; value: Periode }[] = [
  { label: "Mois en cours", value: "MOIS" },
  { label: "3 derniers mois", value: "TRIMESTRE" },
  { label: "Année en cours", value: "ANNEE_CIVILE" },
];

function iso(d: Date): string {
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

/** Bornes (incluses) d'une période relative à aujourd'hui. */
export function bornesPeriode(
  periode: Periode,
  aujourdHui = new Date()
): { debut: string; fin: string } {
  const fin = iso(aujourdHui);
  const a = aujourdHui.getFullYear();
  const m = aujourdHui.getMonth();
  switch (periode) {
    case "MOIS":
      return { debut: iso(new Date(a, m, 1)), fin };
    case "TRIMESTRE":
      return { debut: iso(new Date(a, m - 2, 1)), fin };
    case "ANNEE_CIVILE":
      return { debut: iso(new Date(a, 0, 1)), fin };
    default:
      return { debut: iso(new Date(a - 1, m, aujourdHui.getDate() + 1)), fin };
  }
}

/** Part de chaque répartition dans le total (pour les barres). */
export function avecParts(
  lignes: readonly Repartition[]
): (Repartition & { part: number })[] {
  const max = Math.max(0, ...lignes.map((l) => l.totalHt));
  return lignes.map((l) => ({
    ...l,
    part: max > 0 ? Math.round((l.totalHt / max) * 100) : 0,
  }));
}

/** Coûts de maintenance et sinistralité sur une période. */
@Component({
  imports: [
    RouterLink,
    ListStatutFilter,
    ListTableSkeleton,
    MaintenanceTabs,
  ],
  selector: "app-couts-page",
  templateUrl: "./couts-page.html",
})
export class CoutsPage {
  protected readonly libelle = libelle;
  protected readonly formatMontant = formatMontant;
  protected readonly formatDate = formatDate;
  /** null = 12 derniers mois (allLabel). */
  protected readonly periodeOptions = PERIODES;
  protected readonly typeEnginOptions = statutOptionsFrom(TYPES_ENGIN, libelle);

  protected readonly periodeFilter = signal<string | null>(null);
  protected readonly typeEngin = signal<string | null>(null);

  protected readonly periode = computed<Periode>(() => {
    const v = this.periodeFilter();
    if (v === "MOIS" || v === "TRIMESTRE" || v === "ANNEE_CIVILE") {
      return v;
    }
    return "DOUZE_MOIS";
  });

  protected readonly couts = httpResource<CoutsMaintenance>(() => {
    const params = parametresRequete({
      ...bornesPeriode(this.periode()),
      typeEngin: this.typeEngin() ?? "",
    });
    return { params, url: `${environment.apiBaseUrl}/maintenance/couts` };
  });

  protected readonly erreur = computed(() =>
    httpErrorMessage(this.couts.error())
  );
  protected readonly parType = computed(() =>
    avecParts(this.couts.value()?.parType ?? [])
  );
  protected readonly parNature = computed(() =>
    avecParts(this.couts.value()?.parNature ?? [])
  );
  protected readonly parMois = computed(() =>
    avecParts(this.couts.value()?.parMois ?? [])
  );
  protected readonly parEngin = computed(() =>
    avecParts(this.couts.value()?.parEngin ?? [])
  );
  protected readonly ecartBudget = computed(() => {
    const c = this.couts.value();
    return c && c.budgetEstime > 0 ? c.totalHt - c.budgetEstime : null;
  });
  protected readonly ecartLibelle = computed(() => {
    const ecart = this.ecartBudget();
    if (ecart === null) {
      return "—";
    }
    return `${ecart > 0 ? "+" : ""}${formatMontant(ecart)}`;
  });
  /** Coût total pour l'entreprise : maintenance (HT) + coût net des sinistres. */
  protected readonly coutGlobal = computed(() => {
    const c = this.couts.value();
    return c ? c.totalHt + c.coutNetSinistres : null;
  });
}
