import {
  draftToWrite,
  emptyDossierDraft,
  manualNextStatuts,
  nextStatuts,
} from "./dossier";

describe("dossier domain helpers", () => {
  it("maps a draft to the backend write shape", () => {
    const draft = emptyDossierDraft("11111111-1111-1111-1111-111111111111");
    draft.lignes[0].marchandiseId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    draft.chargementSiteId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    draft.dechargementSiteId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    const body = draftToWrite(draft);

    expect(body.commandeId).toBe("11111111-1111-1111-1111-111111111111");
    expect(body.lignesMarchandise).toHaveLength(1);
    expect(body.lignesMarchandise[0]?.marchandiseId).toBe(
      "dddddddd-dddd-dddd-dddd-dddddddddddd"
    );
    expect(body.documents).toEqual([]);
    expect(body.segments).toHaveLength(2);
    expect(body.segments[0]?.type).toBe("CHARGEMENT");
    expect(body.segments[1]?.type).toBe("DECHARGEMENT");
  });

  it("exposes allowed statut transitions from CREE", () => {
    expect(nextStatuts("CREE")).toEqual(["PLANIFIE", "ANNULE"]);
  });

  it("hides voyage-owned transitions from manual UI", () => {
    expect(manualNextStatuts("CREE")).toEqual(["ANNULE"]);
    expect(manualNextStatuts("PLANIFIE")).toEqual(["EN_CHARGEMENT", "ANNULE"]);
  });
});
