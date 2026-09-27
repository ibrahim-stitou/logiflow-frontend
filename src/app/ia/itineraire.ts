import type { Dossier } from "../dossiers/dossier";
import type { Site } from "../sites/site";
import { isValidLocalisation } from "../sites/site-localisation";

export interface ItinerairePoint {
  latitude: number;
  libelle?: string;
  longitude: number;
}

export interface ItineraireSegment {
  arrivee: ItinerairePoint;
  depart: ItinerairePoint;
  distanceKm: number;
  dureeMin: number;
}

export interface ItineraireGeometriePoint {
  latitude: number;
  longitude: number;
}

export interface ItineraireGeometrie {
  geometrie: ItineraireGeometriePoint[];
}

export interface ItineraireCalcule {
  distanceKm: number;
  dureeMin: number;
  geometrie: ItineraireGeometriePoint[];
  segments: ItineraireSegment[];
}

const SEGMENT_KIND_LABEL: Record<string, string> = {
  CHARGEMENT: "Chargement",
  DECHARGEMENT: "Déchargement",
  ESCALE: "Escale",
};

/** Ordered geolocated stops from selected dossiers (min. 2 for IA routing). */
export function buildItinerairePoints(
  dossierIds: readonly string[],
  dossiersById: ReadonlyMap<string, Pick<Dossier, "segments">>,
  sitesById: ReadonlyMap<
    string,
    Pick<Site, "code" | "libelle" | "localisation">
  >
): ItinerairePoint[] {
  const points: ItinerairePoint[] = [];
  let lastSiteId: string | null = null;

  for (const dossierId of dossierIds) {
    const dossier = dossiersById.get(dossierId);
    if (!dossier) {
      continue;
    }

    const segments = [...dossier.segments].sort(
      (left, right) => left.ordre - right.ordre
    );

    for (const segment of segments) {
      if (segment.siteId === lastSiteId) {
        continue;
      }

      const site = sitesById.get(segment.siteId);
      if (!site) {
        continue;
      }

      const { latitude, longitude } = site.localisation;
      if (!isValidLocalisation(latitude, longitude)) {
        continue;
      }

      const kindLabel = SEGMENT_KIND_LABEL[segment.type] ?? "Site";
      points.push({
        latitude,
        libelle: `${kindLabel} · ${site.code} — ${site.libelle}`,
        longitude,
      });
      lastSiteId = segment.siteId;
    }
  }

  return points;
}

export function canCalculerItineraire(
  points: readonly ItinerairePoint[]
): boolean {
  return points.length >= 2;
}

export function roundDistanceKm(distanceKm: number): number {
  return Math.max(0, Math.round(distanceKm));
}

export function roundDureeConduiteMin(dureeMin: number): number {
  return Math.max(0, Math.round(dureeMin));
}
