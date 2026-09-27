import type { Dossier } from "../dossiers/dossier";
import type { Site } from "../sites/site";
import { buildCapacitePreview } from "./voyage-capacite-preview";

function dossier(
  id: string,
  chargementSiteId: string,
  dechargementSiteId: string,
  poidsBrutKg: number,
  volumeM3: number
): Dossier {
  return {
    carrosserieRequise: "TAUTLINER",
    commandeId: "cmd",
    contientAdr: false,
    documents: [],
    familleMarchandise: "Test",
    groupable: true,
    id,
    lignesMarchandise: [],
    nbPalettes: 1,
    poidsBrutKg,
    reference: id,
    segments: [
      {
        fenetre: { debut: "2026-01-01T08:00:00Z", fin: "2026-01-01T10:00:00Z" },
        ordre: 0,
        realiseLe: null,
        siteId: chargementSiteId,
        type: "CHARGEMENT",
      },
      {
        fenetre: { debut: "2026-01-02T08:00:00Z", fin: "2026-01-02T10:00:00Z" },
        ordre: 1,
        realiseLe: null,
        siteId: dechargementSiteId,
        type: "DECHARGEMENT",
      },
    ],
    statut: "CREE",
    temperatureRequise: null,
    typeTransport: "NATIONAL",
    volumeM3,
  };
}

describe("buildCapacitePreview", () => {
  const sites = new Map<string, Pick<Site, "libelle">>([
    ["site-a", { libelle: "Lyon" }],
    ["site-b", { libelle: "Marseille" }],
    ["site-c", { libelle: "Nice" }],
  ]);

  it("returns null when no dossier is selected", () => {
    expect(buildCapacitePreview(22_000, 96, [], new Map(), sites)).toBeNull();
  });

  it("computes leg utilization for one dossier across two stops", () => {
    const dossiers = new Map([
      ["d1", dossier("d1", "site-a", "site-b", 800, 3)],
    ]);

    const preview = buildCapacitePreview(22_000, 96, ["d1"], dossiers, sites);
    expect(preview).not.toBeNull();
    expect(preview?.arrets).toHaveLength(2);
    expect(preview?.troncons).toHaveLength(1);
    expect(preview?.troncons[0]?.poidsUtiliseKg).toBe(800);
    expect(preview?.troncons[0]?.pourcentageMax).toBeCloseTo(3.636, 2);
  });

  it("chains stops when dossiers share a hub", () => {
    const dossiers = new Map([
      ["d1", dossier("d1", "site-a", "site-b", 800, 3)],
      ["d2", dossier("d2", "site-b", "site-c", 450, 2.5)],
    ]);

    const preview = buildCapacitePreview(
      22_000,
      96,
      ["d1", "d2"],
      dossiers,
      sites
    );

    expect(preview?.arrets.map((arret) => arret.libelle)).toEqual([
      "Lyon",
      "Marseille",
      "Nice",
    ]);
    expect(preview?.troncons[1]?.poidsUtiliseKg).toBe(450);
  });
});
