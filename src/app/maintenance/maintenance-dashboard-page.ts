import { HttpClient, httpResource } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideBanknote,
  lucideCalendarClock,
  lucidePlus,
  lucideTriangleAlert,
  lucideWrench,
} from "@ng-icons/lucide";
import { firstValueFrom } from "rxjs";
import { ZardTableImports } from "@/shared/components/table/table.imports";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { InnerPageHeader } from "../shared/ui/inner-page-header";
import { StatutChip } from "../shared/ui/statut-chip";
import { bornesPeriode } from "./couts-page";
import {
  type CoutsMaintenance,
  formatDate,
  formatDateHeure,
  formatEcheance,
  formatMontant,
  libelle,
  type OrdreTravail,
  type PlanEntretien,
  PRIORITES,
  type Sinistre,
  TYPES_INTERVENTION,
  toneEcheance,
  toneStatutOT,
  toneStatutSinistre,
} from "./maintenance";
import { creerLookupsMaintenance } from "./maintenance-lookups";
import { MaintenanceTabs } from "./maintenance-tabs";

// ─── Contrat de l'agent de maintenance prédictive (POST /ia/maintenance/analyse) ─

export interface RecommandationIA {
  avantLe: string | null;
  creneauDebut: string | null;
  creneauFin: string | null;
  dejaPlanifie: boolean;
  dureeMin: number;
  justification: string;
  libelle: string;
  priorite: string;
  type: string;
}

export interface AnalyseVehiculeIA {
  anomalies: string[];
  explication: string;
  immatriculation: string;
  kmParJour: number;
  recommandations: RecommandationIA[];
  score: number;
  statut: string;
  /** VEHICULE ou REMORQUE (absent : ancien contrat, véhicule). */
  typeEngin?: "VEHICULE" | "REMORQUE";
  vehiculeId: string;
}

export interface ResultatMaintenanceIA {
  sourceRedaction: string;
  synthese: string;
  vehicules: AnalyseVehiculeIA[];
}

/** Paramètres du formulaire d'OT pré-rempli à partir d'une recommandation de l'agent. */
export interface ParametresOtIA {
  debut?: string;
  enginId: string;
  fin?: string;
  justification: string;
  origine: "AGENT_IA";
  priorite?: string;
  titre: string;
  type: string;
  typeEngin: "VEHICULE" | "REMORQUE";
}

export function parametresOtDepuisRecommandation(
  vehicule: Pick<AnalyseVehiculeIA, "typeEngin" | "vehiculeId">,
  r: RecommandationIA
): ParametresOtIA {
  const type = (TYPES_INTERVENTION as readonly string[]).includes(r.type)
    ? r.type
    : "ENTRETIEN_PREVENTIF";
  const prioriteConnue = (PRIORITES as readonly string[]).includes(r.priorite);
  return {
    enginId: vehicule.vehiculeId,
    justification: r.justification,
    origine: "AGENT_IA",
    titre: r.libelle,
    type,
    typeEngin: vehicule.typeEngin ?? "VEHICULE",
    ...(prioriteConnue ? { priorite: r.priorite } : {}),
    ...(r.creneauDebut ? { debut: r.creneauDebut } : {}),
    ...(r.creneauFin ? { fin: r.creneauFin } : {}),
  };
}

export function toneStatutIA(
  statut: string
): "brake" | "amber" | "pine" | "muted" {
  switch (statut) {
    case "CRITIQUE":
      return "brake";
    case "A_PLANIFIER":
    case "SURVEILLER":
      return "amber";
    case "BON":
      return "pine";
    default:
      return "muted";
  }
}

/** Tableau de bord du module : échéances, atelier, sinistres, coûts du mois, analyse IA. */
@Component({
  imports: [
    RouterLink,
    NgIcon,
    StatutChip,
    InnerPageHeader,
    MaintenanceTabs,
    ...ZardTableImports,
  ],
  selector: "app-maintenance-dashboard-page",
  templateUrl: "./maintenance-dashboard-page.html",
  viewProviders: [
    provideIcons({
      lucideBanknote,
      lucideCalendarClock,
      lucidePlus,
      lucideTriangleAlert,
      lucideWrench,
    }),
  ],
})
export class MaintenanceDashboardPage {
  private readonly http = inject(HttpClient);

  protected readonly lookups = creerLookupsMaintenance();
  protected readonly libelle = libelle;
  protected readonly formatMontant = formatMontant;
  protected readonly formatDate = formatDate;
  protected readonly formatDateHeure = formatDateHeure;
  protected readonly formatEcheance = formatEcheance;
  protected readonly toneEcheance = toneEcheance;
  protected readonly toneStatutOT = toneStatutOT;
  protected readonly toneStatutSinistre = toneStatutSinistre;
  protected readonly toneStatutIA = toneStatutIA;
  protected readonly parametresOt = parametresOtDepuisRecommandation;

  private readonly api = `${environment.apiBaseUrl}/maintenance`;

  protected readonly echeances = httpResource<PlanEntretien[]>(() => ({
    params: { horizonJours: 30 },
    url: `${this.api}/plans/echeances`,
  }));
  protected readonly atelier = httpResource<PageResponse<OrdreTravail>>(() => ({
    params: { page: 0, size: 50 },
    url: `${this.api}/ordres-travail`,
  }));
  protected readonly sinistres = httpResource<PageResponse<Sinistre>>(() => ({
    params: { page: 0, size: 50 },
    url: `${this.api}/sinistres`,
  }));
  protected readonly coutsMois = httpResource<CoutsMaintenance>(() => ({
    params: bornesPeriode("MOIS"),
    url: `${this.api}/couts`,
  }));

  protected readonly echus = computed(
    () =>
      (this.echeances.value() ?? []).filter((p) => p.echeance?.etat === "ECHU")
        .length
  );
  protected readonly enAlerte = computed(
    () =>
      (this.echeances.value() ?? []).filter(
        (p) => p.echeance?.etat === "ALERTE"
      ).length
  );
  protected readonly otOuverts = computed(() =>
    (this.atelier.value()?.content ?? []).filter(
      (ot) => ot.statut !== "TERMINE" && ot.statut !== "ANNULE"
    )
  );
  protected readonly enginsImmobilises = computed(
    () =>
      new Set(
        this.otOuverts()
          .filter((ot) => ot.immobilisation && ot.statut !== "PLANIFIE")
          .map((ot) => ot.engin.id)
      ).size
  );
  protected readonly sinistresOuverts = computed(() =>
    (this.sinistres.value()?.content ?? []).filter(
      (s) => s.statut !== "CLOS" && s.statut !== "CLASSE_SANS_SUITE"
    )
  );

  // Analyse prédictive (à la demande : l'appel LLM prend quelques secondes)
  protected readonly analyse = signal<ResultatMaintenanceIA | null>(null);
  protected readonly analyseEnCours = signal(false);
  protected readonly analyseErreur = signal<string | null>(null);

  protected async lancerAnalyse(): Promise<void> {
    this.analyseErreur.set(null);
    this.analyseEnCours.set(true);
    try {
      this.analyse.set(
        await firstValueFrom(
          this.http.post<ResultatMaintenanceIA>(
            `${environment.apiBaseUrl}/ia/maintenance/analyse`,
            { enregistrerScores: true, horizonJours: 30 }
          )
        )
      );
    } catch (error) {
      this.analyseErreur.set(
        `${httpErrorMessage(error)} Les échéances ci-dessus restent calculées sans l'agent.`
      );
    } finally {
      this.analyseEnCours.set(false);
    }
  }

  protected lienFiche(v: AnalyseVehiculeIA): string[] {
    return [
      v.typeEngin === "REMORQUE" ? "/remorques" : "/vehicules",
      v.vehiculeId,
    ];
  }

  protected enginLibelle(sinistre: Sinistre): string {
    return [sinistre.vehiculeId, sinistre.remorqueId]
      .filter((id): id is string => Boolean(id))
      .map((id) => this.lookups.engins().get(id)?.immatriculation ?? "…")
      .join(" + ");
  }
}
