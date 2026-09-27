import { httpResource } from "@angular/common/http";
import { computed, Injectable, inject } from "@angular/core";
import { environment } from "../../environments/environment";
import type { PriseCarburant } from "../carburant/prise-carburant";
import type { Commande } from "../commandes/commande";
import type { PageResponse } from "../core/api/page-response";
import { SessionUtilisateur } from "../core/auth/session";
import { destinationsForRoles } from "../core/nav/work-destination";
import type { Dossier } from "../dossiers/dossier";
import type { Vehicule } from "../vehicules/vehicule";
import type { Voyage } from "../voyages/voyage";
import { APERCU_CHART_PAGE_SIZE } from "./apercu";
import {
  buildFileDuJour,
  type FileDuJourItem,
  type FileDuJourSummary,
  fileDuJourSummary,
} from "./file-du-jour";

type FileDuJourModuleId =
  | "carburant"
  | "commandes"
  | "dossiers"
  | "vehicules"
  | "voyages";

/** Shared file-du-jour data for the Tableau de bord and App Shell badge. */
@Injectable({ providedIn: "root" })
export class FileDuJourStore {
  private readonly session = inject(SessionUtilisateur);

  private readonly destinations = computed(() =>
    destinationsForRoles(this.session.utilisateur()?.roles ?? [])
  );

  readonly allowedIds = computed(
    () => new Set(this.destinations().map((destination) => destination.id))
  );

  readonly commandes = httpResource<PageResponse<Commande>>(() =>
    this.listRequest("commandes")
  );

  readonly dossiers = httpResource<PageResponse<Dossier>>(() =>
    this.listRequest("dossiers")
  );

  readonly vehicules = httpResource<PageResponse<Vehicule>>(() =>
    this.listRequest("vehicules")
  );

  readonly voyages = httpResource<PageResponse<Voyage>>(() =>
    this.listRequest("voyages")
  );

  readonly prisesCarburant = httpResource<PageResponse<PriseCarburant>>(() =>
    this.listRequest("carburant")
  );

  readonly items = computed((): FileDuJourItem[] =>
    buildFileDuJour({
      allowedIds: this.allowedIds(),
      commandes: this.commandes.value()?.content ?? null,
      dossiers: this.dossiers.value()?.content ?? null,
      prisesCarburant: this.prisesCarburant.value()?.content ?? null,
      vehicules: this.vehicules.value()?.content ?? null,
      voyages: this.voyages.value()?.content ?? null,
    })
  );

  readonly loading = computed(() => {
    const ids = this.allowedIds();
    return (
      (ids.has("commandes") && this.commandes.isLoading()) ||
      (ids.has("dossiers") && this.dossiers.isLoading()) ||
      (ids.has("vehicules") && this.vehicules.isLoading()) ||
      (ids.has("voyages") && this.voyages.isLoading()) ||
      (ids.has("carburant") && this.prisesCarburant.isLoading())
    );
  });

  readonly summary = computed(
    (): FileDuJourSummary => fileDuJourSummary(this.items())
  );

  private listRequest(
    id: FileDuJourModuleId
  ):
    | { params: { page: number; q?: string; size: number }; url: string }
    | undefined {
    if (!this.allowedIds().has(id)) {
      return undefined;
    }
    const needsQuery = id === "vehicules";
    return {
      params: needsQuery
        ? { page: 0, q: "", size: APERCU_CHART_PAGE_SIZE }
        : { page: 0, size: APERCU_CHART_PAGE_SIZE },
      url: `${environment.apiBaseUrl}/${id === "carburant" ? "prises-carburant" : id}`,
    };
  }
}
