import type { PriseCarburant } from "../carburant/prise-carburant";
import type { Commande } from "../commandes/commande";
import { DESTINATION_NAV_ICON } from "../core/nav/nav-icon";
import {
  WORK_DESTINATION_IDS,
  type WorkDestinationId,
} from "../core/nav/work-destination";
import type { Dossier } from "../dossiers/dossier";
import type { Vehicule } from "../vehicules/vehicule";
import type { Voyage } from "../voyages/voyage";
import type { ApercuTone } from "./apercu";

const BARRE_INITIALE = /^\//;

export const FILE_DU_JOUR_SECTION_ID = "file-du-jour";

export interface FileDuJourItem {
  count: number;
  detail: string;
  id: string;
  path: string;
  title: string;
  tone: ApercuTone;
}

export interface FileDuJourSummary {
  categoryCount: number;
  topTone: ApercuTone | null;
  totalCount: number;
}

export interface FileDuJourInput {
  allowedIds: ReadonlySet<WorkDestinationId>;
  commandes: readonly Pick<Commande, "statut">[] | null;
  dossiers: readonly Pick<Dossier, "statut">[] | null;
  prisesCarburant: readonly Pick<PriseCarburant, "statut">[] | null;
  vehicules: readonly Pick<Vehicule, "statut">[] | null;
  voyages: readonly Pick<Voyage, "statut">[] | null;
}

const TONE_RANK: Record<ApercuTone, number> = {
  amber: 1,
  brake: 0,
  ink: 2,
  muted: 4,
  pine: 3,
};

const TONE_SECTION_LABEL: Record<ApercuTone, string> = {
  amber: "À risque",
  brake: "Priorité",
  ink: "Attention",
  muted: "À faire",
  pine: "En cours",
};

const COMPACT_TONES = new Set<ApercuTone>(["muted", "pine"]);

export interface FileDuJourTier {
  compact: boolean;
  items: FileDuJourItem[];
  label: string;
  tone: ApercuTone;
}

export interface FileDuJourToneCount {
  count: number;
  label: string;
  tone: ApercuTone;
}

/** Section label for a file-du-jour urgency tier. */
export function fileDuJourToneLabel(tone: ApercuTone): string {
  return TONE_SECTION_LABEL[tone];
}

/** Groups sorted queue items into urgency tiers for the dashboard inbox. */
export function groupFileDuJourByTone(
  items: readonly FileDuJourItem[]
): FileDuJourTier[] {
  const tiers: FileDuJourTier[] = [];
  let currentTone: ApercuTone | null = null;
  let currentItems: FileDuJourItem[] = [];

  for (const entree of items) {
    if (entree.tone !== currentTone) {
      if (currentTone !== null && currentItems.length > 0) {
        tiers.push({
          compact: COMPACT_TONES.has(currentTone),
          items: currentItems,
          label: TONE_SECTION_LABEL[currentTone],
          tone: currentTone,
        });
      }
      currentTone = entree.tone;
      currentItems = [entree];
      continue;
    }
    currentItems.push(entree);
  }

  if (currentTone !== null && currentItems.length > 0) {
    tiers.push({
      compact: COMPACT_TONES.has(currentTone),
      items: currentItems,
      label: TONE_SECTION_LABEL[currentTone],
      tone: currentTone,
    });
  }

  return tiers;
}

/** Per-tier totals for the inbox header summary. */
export function fileDuJourToneCounts(
  items: readonly FileDuJourItem[]
): FileDuJourToneCount[] {
  const totals = new Map<ApercuTone, number>();

  for (const entree of items) {
    totals.set(entree.tone, (totals.get(entree.tone) ?? 0) + entree.count);
  }

  return Array.from(totals.entries())
    .sort(([left], [right]) => TONE_RANK[left] - TONE_RANK[right])
    .map(([tone, count]) => ({
      count,
      label: TONE_SECTION_LABEL[tone],
      tone,
    }));
}

/** Lucide icon for a file-du-jour deep link path. */
export function fileDuJourIcon(path: string): string {
  const [segment] = path.replace(BARRE_INITIALE, "").split("/");
  if (
    segment &&
    (WORK_DESTINATION_IDS as readonly string[]).includes(segment)
  ) {
    return DESTINATION_NAV_ICON[segment as WorkDestinationId];
  }
  return "lucideInbox";
}

function countBy<T extends string>(
  values: readonly T[],
  match: ReadonlySet<T>
): number {
  let total = 0;
  for (const value of values) {
    if (match.has(value)) {
      total += 1;
    }
  }
  return total;
}

function item(
  id: string,
  title: string,
  detail: string,
  path: string,
  tone: ApercuTone,
  count: number
): FileDuJourItem | null {
  if (count <= 0) {
    return null;
  }
  return { count, detail, id, path, title, tone };
}

/**
 * Builds the role-scoped “file du jour”: exceptions first, then work waiting.
 * Aggregates from list pages already loaded for the Aperçu — no extra API.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: une section linéaire par liste chargée (dossiers, voyages, véhicules…), sans imbrication métier.
export function buildFileDuJour(input: FileDuJourInput): FileDuJourItem[] {
  const items: FileDuJourItem[] = [];

  if (input.allowedIds.has("dossiers") && input.dossiers) {
    const { dossiers } = input;
    const incident = item(
      "dossiers-incident",
      "Dossiers en incident",
      "À traiter en priorité",
      "/dossiers",
      "brake",
      countBy(
        dossiers.map((d) => d.statut),
        new Set(["INCIDENT"])
      )
    );
    const aPlanifier = item(
      "dossiers-creer",
      "Dossiers à planifier",
      "Statut Créé — pas encore sur un voyage",
      "/dossiers",
      "muted",
      countBy(
        dossiers.map((d) => d.statut),
        new Set(["CREE"])
      )
    );
    const enCours = item(
      "dossiers-en-cours",
      "Dossiers en cours",
      "Chargement, transit ou livraison",
      "/dossiers",
      "pine",
      countBy(
        dossiers.map((d) => d.statut),
        new Set(["EN_CHARGEMENT", "CHARGE", "EN_TRANSIT", "EN_LIVRAISON"])
      )
    );
    if (incident) {
      items.push(incident);
    }
    if (aPlanifier) {
      items.push(aPlanifier);
    }
    if (enCours) {
      items.push(enCours);
    }
  }

  if (input.allowedIds.has("voyages") && input.voyages) {
    const { voyages } = input;
    const enCours = item(
      "voyages-en-cours",
      "Voyages en cours",
      "Exécution terrain",
      "/voyages",
      "pine",
      countBy(
        voyages.map((v) => v.statut),
        new Set(["EN_COURS"])
      )
    );
    const aDemarrer = item(
      "voyages-a-demarrer",
      "Voyages à démarrer",
      "Planifiés ou affectés",
      "/voyages",
      "amber",
      countBy(
        voyages.map((v) => v.statut),
        new Set(["PLANIFIE", "AFFECTE"])
      )
    );
    if (enCours) {
      items.push(enCours);
    }
    if (aDemarrer) {
      items.push(aDemarrer);
    }
  }

  if (input.allowedIds.has("commandes") && input.commandes) {
    const aConfirmer = item(
      "commandes-recue",
      "Commandes à confirmer",
      "Reçues — pas encore confirmées",
      "/commandes",
      "amber",
      countBy(
        input.commandes.map((c) => c.statut),
        new Set(["RECUE"])
      )
    );
    if (aConfirmer) {
      items.push(aConfirmer);
    }
  }

  if (input.allowedIds.has("carburant") && input.prisesCarburant) {
    const aValider = item(
      "prises-brouillon",
      "Prises à valider",
      "Brouillons carburant en attente d'exploitation",
      "/carburant",
      "amber",
      countBy(
        input.prisesCarburant.map((prise) => prise.statut),
        new Set(["BROUILLON"])
      )
    );
    if (aValider) {
      items.push(aValider);
    }
  }

  if (input.allowedIds.has("vehicules") && input.vehicules) {
    const { vehicules } = input;
    const bloque = item(
      "vehicules-bloque",
      "Véhicules indisponibles",
      "Immobilisés ou hors service",
      "/vehicules",
      "brake",
      countBy(
        vehicules.map((v) => v.statut),
        new Set(["IMMOBILISE", "HORS_SERVICE"])
      )
    );
    const atelier = item(
      "vehicules-atelier",
      "Véhicules en maintenance",
      "Indisponibles pour l’exploitation",
      "/vehicules",
      "amber",
      countBy(
        vehicules.map((v) => v.statut),
        new Set(["EN_MAINTENANCE"])
      )
    );
    if (bloque) {
      items.push(bloque);
    }
    if (atelier) {
      items.push(atelier);
    }
  }

  return items.sort((a, b) => {
    const toneDiff = TONE_RANK[a.tone] - TONE_RANK[b.tone];
    if (toneDiff !== 0) {
      return toneDiff;
    }
    return b.count - a.count;
  });
}

/** Aggregate counts for the utility-bar badge. */
export function fileDuJourSummary(
  items: readonly FileDuJourItem[]
): FileDuJourSummary {
  if (items.length === 0) {
    return { categoryCount: 0, topTone: null, totalCount: 0 };
  }
  return {
    categoryCount: items.length,
    topTone: items[0]?.tone ?? null,
    totalCount: items.reduce((sum, entree) => sum + entree.count, 0),
  };
}

/** Accessible label for the shell file-du-jour shortcut. */
export function fileDuJourBadgeLabel(summary: FileDuJourSummary): string {
  if (summary.totalCount <= 0) {
    return "File du jour";
  }
  const plural = summary.totalCount === 1 ? "" : "s";
  return `${summary.totalCount} élément${plural} dans la file du jour — ouvrir le tableau de bord`;
}
