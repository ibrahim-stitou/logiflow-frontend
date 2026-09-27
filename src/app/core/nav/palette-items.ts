import {
  DOSSIERS_PLAN_ROLES,
  MARCHANDISES_ALLOWED_ROLES,
  REMORQUES_ALLOWED_ROLES,
  type Role,
  SITES_ALLOWED_ROLES,
  VOYAGES_PLAN_ROLES,
} from "../auth/role";
import { DESTINATION_NAV_ICON, TABLEAU_NAV_ICON } from "./nav-icon";
import { destinationsForRoles, workDestination } from "./work-destination";

const ESPACES = /\s+/;

export type PaletteItemKind = "module" | "action" | "entity";
export type PaletteSection = "Modules" | "Actions" | "Références";

export interface PaletteItem {
  readonly badge?: string;
  readonly icon: string;
  readonly keywords: readonly string[];
  readonly kind: PaletteItemKind;
  readonly label: string;
  readonly path: string;
  readonly section: PaletteSection;
}

interface PaletteActionDef {
  readonly icon: string;
  readonly keywords: readonly string[];
  readonly label: string;
  readonly path: string;
  readonly roles: readonly Role[];
}

const CREATE_ACTIONS: readonly PaletteActionDef[] = [
  {
    icon: DESTINATION_NAV_ICON.sites,
    keywords: ["nouveau", "créer", "create", "site"],
    label: "Nouveau site",
    path: "/sites/nouveau",
    roles: SITES_ALLOWED_ROLES,
  },
  {
    icon: DESTINATION_NAV_ICON.marchandises,
    keywords: ["nouvelle", "créer", "marchandise", "catalogue"],
    label: "Nouvelle marchandise",
    path: "/marchandises/nouveau",
    roles: MARCHANDISES_ALLOWED_ROLES,
  },
  {
    icon: DESTINATION_NAV_ICON.vehicules,
    keywords: ["nouveau", "créer", "véhicule", "vehicule"],
    label: "Nouveau véhicule",
    path: "/vehicules/nouveau",
    roles: workDestination("vehicules").roles,
  },
  {
    icon: DESTINATION_NAV_ICON.remorques,
    keywords: ["nouvelle", "créer", "remorque", "semi"],
    label: "Nouvelle remorque",
    path: "/remorques/nouveau",
    roles: REMORQUES_ALLOWED_ROLES,
  },
  {
    icon: DESTINATION_NAV_ICON.chauffeurs,
    keywords: ["nouveau", "créer", "chauffeur", "conducteur"],
    label: "Nouveau chauffeur",
    path: "/chauffeurs/nouveau",
    roles: workDestination("chauffeurs").roles,
  },
  {
    icon: DESTINATION_NAV_ICON.commandes,
    keywords: ["nouvelle", "créer", "commande"],
    label: "Nouvelle commande",
    path: "/commandes/nouveau",
    roles: workDestination("commandes").roles,
  },
  {
    icon: DESTINATION_NAV_ICON.dossiers,
    keywords: ["nouveau", "créer", "dossier"],
    label: "Nouveau dossier",
    path: "/dossiers/nouveau",
    roles: DOSSIERS_PLAN_ROLES,
  },
  {
    icon: DESTINATION_NAV_ICON.voyages,
    keywords: ["nouveau", "créer", "voyage"],
    label: "Nouveau voyage",
    path: "/voyages/nouveau",
    roles: VOYAGES_PLAN_ROLES,
  },
  {
    icon: DESTINATION_NAV_ICON.carburant,
    keywords: ["nouvelle", "créer", "prise", "carburant", "plein"],
    label: "Nouvelle prise de carburant",
    path: "/carburant/nouveau",
    roles: workDestination("carburant").roles,
  },
  {
    icon: DESTINATION_NAV_ICON.maintenance,
    keywords: ["nouvel", "créer", "ordre", "maintenance", "atelier"],
    label: "Nouvel ordre de travail",
    path: "/maintenance/ordres-travail/nouveau",
    roles: workDestination("maintenance").roles,
  },
  {
    icon: DESTINATION_NAV_ICON.maintenance,
    keywords: ["nouveau", "créer", "plan", "entretien", "préventif"],
    label: "Nouveau plan d'entretien",
    path: "/maintenance/plans/nouveau",
    roles: workDestination("maintenance").roles,
  },
  {
    icon: DESTINATION_NAV_ICON.maintenance,
    keywords: [
      "déclarer",
      "sinistre",
      "accident",
      "accrochage",
      "assurance",
      "constat",
    ],
    label: "Déclarer un sinistre",
    path: "/maintenance/sinistres/nouveau",
    roles: workDestination("maintenance").roles,
  },
  {
    icon: DESTINATION_NAV_ICON.maintenance,
    keywords: ["coûts", "maintenance", "budget", "dépenses", "atelier"],
    label: "Coûts de maintenance",
    path: "/maintenance/couts",
    roles: workDestination("maintenance").roles,
  },
  {
    icon: DESTINATION_NAV_ICON.utilisateurs,
    keywords: ["nouvel", "créer", "utilisateur", "compte"],
    label: "Nouvel utilisateur",
    path: "/utilisateurs/nouveau",
    roles: workDestination("utilisateurs").roles,
  },
];

function roleAllowed(
  roles: readonly Role[],
  allowed: readonly Role[]
): boolean {
  return roles.some((role) => allowed.includes(role));
}

/** Role-scoped modules + create actions for the App Shell palette (Ctrl/Cmd+K). */
export function paletteItemsForRoles(roles: readonly Role[]): PaletteItem[] {
  const modules: PaletteItem[] = [
    {
      icon: TABLEAU_NAV_ICON,
      keywords: ["accueil", "dashboard", "tableau"],
      kind: "module",
      label: "Tableau de bord",
      path: "/",
      section: "Modules",
    },
    ...destinationsForRoles(roles).map(
      (destination): PaletteItem => ({
        icon: DESTINATION_NAV_ICON[destination.id],
        keywords: [destination.path, destination.section],
        kind: "module",
        label: destination.label,
        path: `/${destination.path}`,
        section: "Modules",
      })
    ),
  ];

  const actions: PaletteItem[] = CREATE_ACTIONS.filter((action) =>
    roleAllowed(roles, action.roles)
  ).map((action) => ({
    badge: "Nouveau",
    icon: action.icon,
    keywords: action.keywords,
    kind: "action" as const,
    label: action.label,
    path: action.path,
    section: "Actions" as const,
  }));

  return [...modules, ...actions];
}

/** Case-insensitive match on label or keywords (all query words must hit). */
export function filterPaletteItems(
  items: readonly PaletteItem[],
  query: string
): PaletteItem[] {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(ESPACES)
    .filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return [...items];
  }
  return items.filter((item) => {
    const haystack = [item.label, ...item.keywords].join(" ").toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}
