import {
  formatEcheance,
  formatPeriodicite,
  libelle,
  lignesValides,
  natureParDefaut,
  nombreOuNull,
  otModifiable,
  peutCloturer,
  texteOuNull,
  totauxLignes,
  transitionsOT,
  transitionsSinistre,
} from "./maintenance";

const PERIODICITE_ATTENDUE = /40\s000 km · 12 mois/;
const ECHEANCE_ATTENDUE = /dépassée de 1\s200 km · le 12\/11\/2026/;

describe("maintenance", () => {
  it("traduit les énumérations et garde la valeur inconnue", () => {
    expect(libelle("EN_ATTENTE_PIECES")).toBe("Attente pièces");
    expect(libelle("DECLARE_ASSUREUR")).toBe("Déclaré à l'assureur");
    expect(libelle("INCONNU")).toBe("INCONNU");
    expect(libelle(null)).toBe("—");
  });

  it("totalise les lignes de coût HT, TVA et TTC", () => {
    const totaux = totauxLignes([
      {
        designation: "MO",
        prixUnitaireHt: 65,
        quantite: 2,
        referencePiece: null,
        tauxTva: 20,
        type: "MAIN_OEUVRE",
      },
      {
        designation: "Filtre",
        prixUnitaireHt: 12.5,
        quantite: 1,
        referencePiece: "F-1",
        tauxTva: 20,
        type: "PIECE",
      },
    ]);
    expect(totaux).toEqual({ ht: 142.5, ttc: 171, tva: 28.5 });
  });

  it("refuse les lignes sans désignation ou de quantité nulle", () => {
    const ligne = {
      designation: "MO",
      prixUnitaireHt: 10,
      quantite: 1,
      referencePiece: null,
      tauxTva: 20,
      type: "MAIN_OEUVRE" as const,
    };
    expect(lignesValides([ligne])).toBe(true);
    expect(lignesValides([{ ...ligne, designation: " " }])).toBe(false);
    expect(lignesValides([{ ...ligne, quantite: 0 }])).toBe(false);
  });

  it("ne termine un OT que par la clôture", () => {
    expect(transitionsOT("EN_COURS")).not.toContain("TERMINE");
    expect(peutCloturer("EN_COURS")).toBe(true);
    expect(peutCloturer("PLANIFIE")).toBe(false);
    expect(otModifiable("TERMINE")).toBe(false);
    expect(transitionsOT("ANNULE")).toEqual([]);
  });

  it("enchaîne le workflow assurance du sinistre", () => {
    expect(transitionsSinistre("DECLARE")).toContain("DECLARE_ASSUREUR");
    expect(transitionsSinistre("EN_REPARATION")).toEqual(["CLOS"]);
    expect(transitionsSinistre("CLOS")).toEqual([]);
  });

  it("déduit la nature de l'intervention", () => {
    expect(natureParDefaut("CONTROLE_TECHNIQUE")).toBe("REGLEMENTAIRE");
    expect(natureParDefaut("PNEUMATIQUES")).toBe("PREVENTIF");
    expect(natureParDefaut("CARROSSERIE")).toBe("CORRECTIF");
  });

  it("met en forme périodicité et échéance", () => {
    expect(
      formatPeriodicite({
        periodiciteHeures: null,
        periodiciteKm: 40_000,
        periodiciteMois: 12,
      })
    ).toMatch(PERIODICITE_ATTENDUE);
    expect(
      formatEcheance({
        dateEcheance: "2026-11-12",
        etat: "ECHU",
        heuresRestantes: null,
        immatriculation: "AB-123-CD",
        kilometrageActuel: 100_000,
        kmParJour: 300,
        kmRestant: -1200,
      })
    ).toMatch(ECHEANCE_ATTENDUE);
    expect(formatEcheance(null)).toBe("—");
    // API JSON omits null numeric fields → undefined (must not throw).
    expect(
      formatEcheance({
        dateEcheance: "2026-09-18",
        etat: "ECHU",
        heuresRestantes: undefined as unknown as null,
        immatriculation: "TG-011-KJ",
        kilometrageActuel: 65_070,
        kmParJour: 250,
        kmRestant: undefined as unknown as null,
      })
    ).toMatch(/le /);
  });

  it("lit les saisies facultatives", () => {
    expect(nombreOuNull("12,5")).toBe(12.5);
    expect(nombreOuNull(" ")).toBeNull();
    expect(nombreOuNull("abc")).toBeNull();
    expect(texteOuNull("  ")).toBeNull();
    expect(texteOuNull(" x ")).toBe("x");
  });
});
