import {
  CARBURANT_PRISES_ALLOWED_ROLES,
  CHAUFFEURS_ALLOWED_ROLES,
  CLIENTS_ALLOWED_ROLES,
  DOSSIERS_ALLOWED_ROLES,
  MARCHANDISES_ALLOWED_ROLES,
  REMORQUES_ALLOWED_ROLES,
  type Role,
  SITES_ALLOWED_ROLES,
} from "../auth/role";

export const WORK_DESTINATION_IDS = [
  "clients",
  "sites",
  "marchandises",
  "vehicules",
  "remorques",
  "chauffeurs",
  "commandes",
  "dossiers",
  "voyages",
  "carburant",
  "maintenance",
  "utilisateurs",
] as const;

export type WorkDestinationId = (typeof WORK_DESTINATION_IDS)[number];

export interface WorkDestination {
  apiHint: string;
  blurb: string;
  id: WorkDestinationId;
  label: string;
  live: boolean;
  path: string;
  roles: readonly Role[];
  section: string;
}

export const WORK_DESTINATIONS: Record<WorkDestinationId, WorkDestination> = {
  carburant: {
    apiHint: "/api/v1/prises-carburant",
    blurb: "Prises de carburant et stations.",
    id: "carburant",
    label: "Carburant",
    live: true,
    path: "carburant",
    roles: CARBURANT_PRISES_ALLOWED_ROLES,
    section: "Exploitation",
  },
  chauffeurs: {
    apiHint: "/api/v1/chauffeurs",
    blurb: "Chauffeurs, permis, habilitations, disponibilité.",
    id: "chauffeurs",
    label: "Chauffeurs",
    live: true,
    path: "chauffeurs",
    roles: CHAUFFEURS_ALLOWED_ROLES,
    section: "Flotte",
  },
  clients: {
    apiHint: "/api/v1/clients",
    blurb: "Tiers donneurs d'ordre pour les commandes.",
    id: "clients",
    label: "Clients",
    live: true,
    path: "clients",
    roles: CLIENTS_ALLOWED_ROLES,
    section: "Commercial",
  },
  commandes: {
    apiHint: "/api/v1/commandes",
    blurb: "Demandes clients à transporter.",
    id: "commandes",
    label: "Commandes",
    live: true,
    path: "commandes",
    roles: CLIENTS_ALLOWED_ROLES,
    section: "Commercial",
  },
  dossiers: {
    apiHint: "/api/v1/dossiers",
    blurb: "Fiches transport issues des commandes confirmées.",
    id: "dossiers",
    label: "Dossiers",
    live: true,
    path: "dossiers",
    roles: DOSSIERS_ALLOWED_ROLES,
    section: "Exploitation",
  },
  maintenance: {
    apiHint: "/api/v1/maintenance/ordres-travail",
    blurb:
      "Ordres de travail, plans d'entretien, sinistres, assurances et coûts.",
    id: "maintenance",
    label: "Maintenance",
    live: true,
    path: "maintenance",
    roles: ["ADMINISTRATEUR", "RESPONSABLE_EXPLOITATION", "ATELIER"],
    section: "Atelier",
  },
  marchandises: {
    apiHint: "/api/v1/marchandises",
    blurb: "Catalogue référentiel pour les lignes de commande.",
    id: "marchandises",
    label: "Marchandises",
    live: true,
    path: "marchandises",
    roles: MARCHANDISES_ALLOWED_ROLES,
    section: "Référentiel",
  },
  remorques: {
    apiHint: "/api/v1/remorques",
    blurb: "Semi-remorques, capacité, compteurs.",
    id: "remorques",
    label: "Remorques",
    live: true,
    path: "remorques",
    roles: REMORQUES_ALLOWED_ROLES,
    section: "Flotte",
  },
  sites: {
    apiHint: "/api/v1/sites",
    blurb: "Quais de chargement et de déchargement.",
    id: "sites",
    label: "Sites",
    live: true,
    path: "sites",
    roles: SITES_ALLOWED_ROLES,
    section: "Référentiel",
  },
  utilisateurs: {
    apiHint: "/api/v1/utilisateurs",
    blurb: "Provisioning des comptes.",
    id: "utilisateurs",
    label: "Utilisateurs",
    live: true,
    path: "utilisateurs",
    roles: ["ADMINISTRATEUR"],
    section: "IAM",
  },
  vehicules: {
    apiHint: "/api/v1/vehicules",
    blurb: "Parc, documents, compteurs.",
    id: "vehicules",
    label: "Véhicules",
    live: true,
    path: "vehicules",
    roles: [
      "ADMINISTRATEUR",
      "RESPONSABLE_EXPLOITATION",
      "EXPLOITANT",
      "ATELIER",
    ],
    section: "Flotte",
  },
  voyages: {
    apiHint: "/api/v1/voyages",
    blurb: "Exécution physique des dossiers.",
    id: "voyages",
    label: "Voyages",
    live: true,
    path: "voyages",
    roles: [
      "ADMINISTRATEUR",
      "RESPONSABLE_EXPLOITATION",
      "EXPLOITANT",
      "CHAUFFEUR",
    ],
    section: "Planning",
  },
};

export function workDestination(id: WorkDestinationId): WorkDestination {
  return WORK_DESTINATIONS[id];
}

export function destinationsForRoles(
  roles: readonly Role[]
): WorkDestination[] {
  return WORK_DESTINATION_IDS.map((id) => WORK_DESTINATIONS[id]).filter(
    (destination) => roles.some((role) => destination.roles.includes(role))
  );
}

/** Sidebar grouping order (visual only — no section labels in the shell). */
export const NAV_SECTION_DISPLAY_ORDER = [
  "Référentiel",
  "Commercial",
  "Flotte",
  "Exploitation",
  "Planning",
  "Atelier",
  "IAM",
] as const;

export type NavSectionName = (typeof NAV_SECTION_DISPLAY_ORDER)[number];

export interface NavDestinationGroup {
  items: WorkDestination[];
  section: NavSectionName;
}

export function destinationNavGroupsForRoles(
  roles: readonly Role[]
): NavDestinationGroup[] {
  const buckets = new Map<NavSectionName, WorkDestination[]>();

  for (const destination of destinationsForRoles(roles)) {
    const section = destination.section as NavSectionName;
    const list = buckets.get(section) ?? [];
    list.push(destination);
    buckets.set(section, list);
  }

  return NAV_SECTION_DISPLAY_ORDER.flatMap((section) => {
    const items = buckets.get(section);
    return items && items.length > 0 ? [{ items, section }] : [];
  });
}
