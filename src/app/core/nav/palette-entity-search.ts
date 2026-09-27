import type { Chauffeur } from "../../chauffeurs/chauffeur";
import { formatChauffeurLabel } from "../../chauffeurs/chauffeur";
import type { Client } from "../../clients/client";
import { formatClientLabel } from "../../clients/client";
import type { Commande } from "../../commandes/commande";
import { formatCommandeLabel } from "../../commandes/commande";
import type { Dossier } from "../../dossiers/dossier";
import type { Marchandise } from "../../marchandises/marchandise";
import { formatMarchandiseLabel } from "../../marchandises/marchandise";
import type { Remorque } from "../../remorques/remorque";
import { formatRemorqueLabel } from "../../remorques/remorque";
import type { Site } from "../../sites/site";
import type { Utilisateur } from "../../utilisateurs/utilisateur";
import type { Vehicule } from "../../vehicules/vehicule";
import type { Voyage } from "../../voyages/voyage";
import type { PageResponse } from "../api/page-response";
import type { Role } from "../auth/role";
import { DESTINATION_NAV_ICON } from "./nav-icon";
import type { PaletteItem } from "./palette-items";
import {
  destinationsForRoles,
  type WorkDestinationId,
} from "./work-destination";

export const PALETTE_ENTITY_MIN_QUERY_LENGTH = 2;
export const PALETTE_ENTITY_PAGE_SIZE = 8;
export const PALETTE_ENTITY_CLIENT_SCAN_SIZE = 50;

export type PaletteEntitySourceId = Exclude<
  WorkDestinationId,
  "maintenance" | "carburant"
>;

export interface PaletteEntitySource {
  readonly badge: string;
  readonly id: PaletteEntitySourceId;
  readonly serverSearch: boolean;
}

const PALETTE_ENTITY_SOURCES: readonly PaletteEntitySource[] = [
  { badge: "Site", id: "sites", serverSearch: true },
  { badge: "Marchandise", id: "marchandises", serverSearch: true },
  { badge: "Véhicule", id: "vehicules", serverSearch: true },
  { badge: "Remorque", id: "remorques", serverSearch: true },
  { badge: "Chauffeur", id: "chauffeurs", serverSearch: true },
  { badge: "Client", id: "clients", serverSearch: true },
  { badge: "Commande", id: "commandes", serverSearch: true },
  { badge: "Dossier", id: "dossiers", serverSearch: true },
  { badge: "Voyage", id: "voyages", serverSearch: true },
  { badge: "Utilisateur", id: "utilisateurs", serverSearch: true },
];

/** Role-scoped entity list endpoints to query from the palette. */
export function paletteEntitySourcesForRoles(
  roles: readonly Role[]
): PaletteEntitySource[] {
  const allowedIds = new Set(
    destinationsForRoles(roles).map((destination) => destination.id)
  );
  return PALETTE_ENTITY_SOURCES.filter((source) => allowedIds.has(source.id));
}

export function paletteEntityQueryReady(query: string): boolean {
  return query.trim().length >= PALETTE_ENTITY_MIN_QUERY_LENGTH;
}

function entityItem(
  source: PaletteEntitySource,
  label: string,
  path: string,
  keywords: readonly string[]
): PaletteItem {
  return {
    badge: source.badge,
    icon: DESTINATION_NAV_ICON[source.id],
    keywords,
    kind: "entity",
    label,
    path,
    section: "Références",
  };
}

export function siteToPaletteItem(
  source: PaletteEntitySource,
  site: Site
): PaletteItem {
  return entityItem(
    source,
    `${site.code} — ${site.libelle}`,
    `/sites/${site.id}`,
    [site.code, site.libelle]
  );
}

export function marchandiseToPaletteItem(
  source: PaletteEntitySource,
  marchandise: Marchandise
): PaletteItem {
  return entityItem(
    source,
    formatMarchandiseLabel(marchandise),
    `/marchandises/${marchandise.id}`,
    [marchandise.code, marchandise.libelle, marchandise.famille ?? ""]
  );
}

export function vehiculeToPaletteItem(
  source: PaletteEntitySource,
  vehicule: Vehicule
): PaletteItem {
  return entityItem(
    source,
    vehicule.immatriculation,
    `/vehicules/${vehicule.id}`,
    [vehicule.immatriculation, vehicule.type]
  );
}

export function remorqueToPaletteItem(
  source: PaletteEntitySource,
  remorque: Remorque
): PaletteItem {
  return entityItem(
    source,
    formatRemorqueLabel(remorque),
    `/remorques/${remorque.id}`,
    [remorque.immatriculation, remorque.carrosserie, remorque.statut]
  );
}

export function chauffeurToPaletteItem(
  source: PaletteEntitySource,
  chauffeur: Chauffeur
): PaletteItem {
  return entityItem(
    source,
    formatChauffeurLabel(chauffeur),
    `/chauffeurs/${chauffeur.id}`,
    [chauffeur.matricule, chauffeur.nom, chauffeur.prenom]
  );
}

export function clientToPaletteItem(
  source: PaletteEntitySource,
  client: Client
): PaletteItem {
  return entityItem(
    source,
    formatClientLabel(client),
    `/clients/${client.id}`,
    [client.code, client.raisonSociale]
  );
}

export function commandeToPaletteItem(
  source: PaletteEntitySource,
  commande: Commande
): PaletteItem {
  return entityItem(
    source,
    formatCommandeLabel(commande),
    `/commandes/${commande.id}`,
    [commande.reference, commande.dateSouhaitee]
  );
}

export function dossierToPaletteItem(
  source: PaletteEntitySource,
  dossier: Dossier
): PaletteItem {
  return entityItem(source, dossier.reference, `/dossiers/${dossier.id}`, [
    dossier.reference,
    dossier.statut,
  ]);
}

export function voyageToPaletteItem(
  source: PaletteEntitySource,
  voyage: Voyage
): PaletteItem {
  return entityItem(source, voyage.reference, `/voyages/${voyage.id}`, [
    voyage.reference,
    voyage.statut,
  ]);
}

export function utilisateurToPaletteItem(
  source: PaletteEntitySource,
  utilisateur: Utilisateur
): PaletteItem {
  return entityItem(
    source,
    utilisateur.login,
    `/utilisateurs/${utilisateur.id}`,
    [utilisateur.login, utilisateur.email]
  );
}

export function paletteItemsFromPage(
  source: PaletteEntitySource,
  page: PageResponse<unknown>,
  _query: string
): PaletteItem[] {
  const { content } = page;
  switch (source.id) {
    case "sites":
      return content
        .filter(
          (item): item is Site => typeof item === "object" && item !== null
        )
        .map((site) => siteToPaletteItem(source, site));
    case "marchandises":
      return content
        .filter(
          (item): item is Marchandise =>
            typeof item === "object" && item !== null
        )
        .map((marchandise) => marchandiseToPaletteItem(source, marchandise));
    case "vehicules":
      return content
        .filter(
          (item): item is Vehicule => typeof item === "object" && item !== null
        )
        .map((vehicule) => vehiculeToPaletteItem(source, vehicule));
    case "remorques":
      return content
        .filter(
          (item): item is Remorque => typeof item === "object" && item !== null
        )
        .map((remorque) => remorqueToPaletteItem(source, remorque));
    case "chauffeurs":
      return content
        .filter(
          (item): item is Chauffeur => typeof item === "object" && item !== null
        )
        .map((chauffeur) => chauffeurToPaletteItem(source, chauffeur));
    case "clients":
      return content
        .filter(
          (item): item is Client => typeof item === "object" && item !== null
        )
        .map((client) => clientToPaletteItem(source, client));
    case "commandes":
      return content
        .filter(
          (item): item is Commande => typeof item === "object" && item !== null
        )
        .map((commande) => commandeToPaletteItem(source, commande));
    case "dossiers":
      return content
        .filter(
          (item): item is Dossier => typeof item === "object" && item !== null
        )
        .map((dossier) => dossierToPaletteItem(source, dossier));
    case "voyages":
      return content
        .filter(
          (item): item is Voyage => typeof item === "object" && item !== null
        )
        .map((voyage) => voyageToPaletteItem(source, voyage));
    case "utilisateurs":
      return content
        .filter(
          (item): item is Utilisateur =>
            typeof item === "object" && item !== null
        )
        .map((utilisateur) => utilisateurToPaletteItem(source, utilisateur));
    default: {
      const _exhaustive: never = source.id;
      return _exhaustive;
    }
  }
}
