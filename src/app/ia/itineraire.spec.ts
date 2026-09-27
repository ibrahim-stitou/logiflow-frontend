import type { Dossier } from "../dossiers/dossier";
import type { Site } from "../sites/site";
import { buildItinerairePoints, canCalculerItineraire } from "./itineraire";

describe("buildItinerairePoints", () => {
  const siteDepart: Site = {
    actif: true,
    adresse: null,
    clientId: null,
    code: "SITE-PARIS",
    contraintesAcces: null,
    id: "site-depart",
    libelle: "Paris Nord",
    localisation: { latitude: 48.86, longitude: 2.35 },
  };

  const siteArrivee: Site = {
    actif: true,
    adresse: null,
    clientId: null,
    code: "SITE-LYON",
    contraintesAcces: null,
    id: "site-arrivee",
    libelle: "Lyon Sud",
    localisation: { latitude: 45.75, longitude: 4.85 },
  };

  const dossier: Dossier = {
    carrosserieRequise: null,
    commandeId: "cmd-1",
    contientAdr: false,
    documents: [],
    familleMarchandise: "GENERAL",
    groupable: true,
    id: "dossier-1",
    lignesMarchandise: [],
    nbPalettes: 0,
    poidsBrutKg: 1000,
    reference: "DOS-1",
    segments: [
      {
        fenetre: { debut: "2026-09-01T08:00:00Z", fin: "2026-09-01T10:00:00Z" },
        ordre: 1,
        realiseLe: null,
        siteId: "site-depart",
        type: "CHARGEMENT",
      },
      {
        fenetre: { debut: "2026-09-01T16:00:00Z", fin: "2026-09-01T18:00:00Z" },
        ordre: 2,
        realiseLe: null,
        siteId: "site-arrivee",
        type: "DECHARGEMENT",
      },
    ],
    statut: "CREE",
    temperatureRequise: null,
    typeTransport: "NATIONAL",
    volumeM3: 10,
  };

  it("returns ordered points for a selected dossier", () => {
    const points = buildItinerairePoints(
      ["dossier-1"],
      new Map([["dossier-1", dossier]]),
      new Map([
        ["site-depart", siteDepart],
        ["site-arrivee", siteArrivee],
      ])
    );

    expect(points).toHaveLength(2);
    expect(points[0]?.libelle).toContain("Chargement");
    expect(points[1]?.libelle).toContain("Déchargement");
    expect(canCalculerItineraire(points)).toBe(true);
  });

  it("returns fewer than two points when sites are missing", () => {
    const points = buildItinerairePoints(
      ["dossier-1"],
      new Map([["dossier-1", dossier]]),
      new Map()
    );

    expect(points).toHaveLength(0);
    expect(canCalculerItineraire(points)).toBe(false);
  });
});
