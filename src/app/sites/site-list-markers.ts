import type { GeoMapMarker } from "../shared/ui/geo-markers-map";
import type { Site } from "./site";
import { isValidLocalisation } from "./site-localisation";

/** Builds map markers for the sites currently visible on the list page. */
export function siteListMarkers(sites: readonly Site[]): GeoMapMarker[] {
  const markers: GeoMapMarker[] = [];
  for (const site of sites) {
    const { latitude, longitude } = site.localisation;
    if (!isValidLocalisation(latitude, longitude)) {
      continue;
    }
    markers.push({
      id: site.id,
      label: `${site.code} — ${site.libelle}`,
      latitude,
      longitude,
    });
  }
  return markers;
}
