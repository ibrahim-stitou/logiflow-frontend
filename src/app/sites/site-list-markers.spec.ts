import type { Site } from "./site";
import { siteListMarkers } from "./site-list-markers";
import { isValidLocalisation } from "./site-localisation";

describe("siteListMarkers", () => {
  const paris: Site = {
    actif: true,
    adresse: null,
    clientId: null,
    code: "SITE-PARIS",
    contraintesAcces: null,
    id: "site-paris",
    libelle: "Paris Nord",
    localisation: { latitude: 48.86, longitude: 2.35 },
  };

  const invalid: Site = {
    ...paris,
    code: "SITE-BAD",
    id: "site-bad",
    localisation: { latitude: Number.NaN, longitude: 0 },
  };

  it("keeps only geolocated sites", () => {
    const markers = siteListMarkers([paris, invalid]);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.id).toBe("site-paris");
    expect(markers[0]?.label).toContain("SITE-PARIS");
    expect(
      isValidLocalisation(markers[0]!.latitude, markers[0]!.longitude)
    ).toBe(true);
  });
});
