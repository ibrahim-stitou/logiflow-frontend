import type { OpsTimelineEntry } from "../shared/ui/ops-timeline";
import {
  type EvenementVoyage,
  formatInstant,
  typeEtapeLabel,
  typeEvenementLabel,
  type Voyage,
} from "./voyage";

interface SortableEntry extends OpsTimelineEntry {
  readonly sortKey: string;
}

function sortEntries(entries: SortableEntry[]): OpsTimelineEntry[] {
  return [...entries]
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey))
    .map(({ sortKey: _sortKey, ...entry }) => entry);
}

function dated(
  id: string,
  kind: OpsTimelineEntry["kind"],
  label: string,
  iso: string,
  detail?: string | null
): SortableEntry {
  return {
    at: formatInstant(iso),
    detail: detail ?? null,
    id,
    kind,
    label,
    sortKey: iso,
  };
}

function evenementDetail(evenement: EvenementVoyage): string | null {
  const parts: string[] = [];
  if (evenement.commentaire?.trim()) {
    parts.push(evenement.commentaire.trim());
  }
  if (evenement.position) {
    parts.push(
      `${evenement.position.latitude.toFixed(5)}, ${evenement.position.longitude.toFixed(5)}`
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Planned schedule: départ, arrivée and étapes (ETA/ETD). */
export function voyagePlannedTimelineEntries(
  voyage: Voyage
): OpsTimelineEntry[] {
  const entries: SortableEntry[] = [
    dated("planned-depart", "planned", "Départ prévu", voyage.departPrevu),
    dated("planned-arrivee", "planned", "Arrivée prévue", voyage.arriveePrevue),
  ];

  for (const etape of voyage.trajet.etapes) {
    entries.push(
      dated(
        `etape-${etape.ordre}-eta`,
        "planned",
        `${typeEtapeLabel(etape.type)} (ETA)`,
        etape.eta
      )
    );
    if (etape.etd) {
      entries.push(
        dated(
          `etape-${etape.ordre}-etd`,
          "planned",
          `${typeEtapeLabel(etape.type)} (ETD)`,
          etape.etd
        )
      );
    }
  }

  return sortEntries(entries);
}

/** Actual execution: declared événements ordered by horodatage. */
export function voyageActualTimelineEntries(
  evenements: readonly EvenementVoyage[]
): OpsTimelineEntry[] {
  const entries: SortableEntry[] = [];

  for (const evenement of evenements) {
    if (evenement.type === "POSITION") {
      continue;
    }
    entries.push(
      dated(
        `evenement-${evenement.id}`,
        "actual",
        typeEvenementLabel(evenement.type),
        evenement.horodatage,
        evenementDetail(evenement)
      )
    );
  }

  return sortEntries(entries);
}
