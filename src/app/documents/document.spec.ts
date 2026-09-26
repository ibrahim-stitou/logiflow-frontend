import { documentSuitExpiration, documentTypeLabel } from "./document";

describe("document helpers", () => {
  it("labels administrative document types", () => {
    expect(documentTypeLabel("CARTE_GRISE")).toBe("Carte grise");
    expect(documentTypeLabel("PHOTO")).toBe("Photo");
  });

  it("tracks expiration only for compliance credentials", () => {
    expect(documentSuitExpiration("VEHICULE", "CARTE_GRISE")).toBe(true);
    expect(documentSuitExpiration("CHAUFFEUR", "PERMIS_CONDUIRE")).toBe(true);
    expect(documentSuitExpiration("CONTRAT_ASSURANCE", "ATTESTATION_ASSURANCE")).toBe(
      true
    );
    expect(documentSuitExpiration("VEHICULE", "PHOTO")).toBe(false);
    expect(documentSuitExpiration("PRISE_CARBURANT", "JUSTIFICATIF_CARBURANT")).toBe(
      false
    );
    expect(documentSuitExpiration("ORDRE_TRAVAIL", "FACTURE")).toBe(false);
    expect(documentSuitExpiration("SINISTRE", "CONSTAT_AMIABLE")).toBe(false);
  });
});
