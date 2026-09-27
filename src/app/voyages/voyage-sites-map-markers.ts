import type { Dossier } from "../dossiers/dossier";
import { buildItinerairePoints, type ItinerairePoint } from "../ia/itineraire";
import type {
  GeoMapMarker,
  GeoMapPathPoint,
} from "../shared/ui/geo-markers-map";
import type { Site } from "../sites/site";
import type { Voyage } from "./voyage";

/** Ordered geolocated stops for a voyage (same order as IA itinerary calculation). */
export function voyageItinerairePoints(
  voyage: Voyage | null | undefined,
  dossiersById: ReadonlyMap<string, Pick<Dossier, "segments">>,
  sitesById: ReadonlyMap<
    string,
    Pick<Site, "code" | "libelle" | "localisation">
  >
): ItinerairePoint[] {
  if (!voyage) {
    return [];
  }
  return buildItinerairePoints(voyage.dossierIds, dossiersById, sitesById);
}

export function voyageItinerairePath(
  voyage: Voyage | null | undefined,
  dossiersById: ReadonlyMap<string, Pick<Dossier, "segments">>,
  sitesById: ReadonlyMap<
    string,
    Pick<Site, "code" | "libelle" | "localisation">
  >
): GeoMapPathPoint[] {
  return voyageItinerairePoints(voyage, dossiersById, sitesById);
}

/** Map markers for each ordered stop on the voyage itinerary. */
export function voyageSiteMarkers(
  voyage: Voyage | null | undefined,
  dossiersById: ReadonlyMap<string, Pick<Dossier, "segments">>,
  sitesById: ReadonlyMap<
    string,
    Pick<Site, "code" | "libelle" | "localisation">
  >
): GeoMapMarker[] {
  return voyageItinerairePoints(voyage, dossiersById, sitesById).map(
    (point, index) => ({
      id: String(index),
      label: point.libelle ?? `Arrêt ${index + 1}`,
      latitude: point.latitude,
      longitude: point.longitude,
    })
  );
}
