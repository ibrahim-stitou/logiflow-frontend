import {
  draftToWrite,
  emptyScoreSanteDraft,
  isScoreSanteInRange,
  SCORE_SANTE_MAX,
  SCORE_SANTE_MIN,
} from "./score-sante";

describe("score-sante helpers", () => {
  it("defines score bounds aligned with backend domain", () => {
    expect(SCORE_SANTE_MIN).toBe(0);
    expect(SCORE_SANTE_MAX).toBe(100);
  });

  it("validates score range", () => {
    expect(isScoreSanteInRange(0)).toBe(true);
    expect(isScoreSanteInRange(100)).toBe(true);
    expect(isScoreSanteInRange(-1)).toBe(false);
    expect(isScoreSanteInRange(100.1)).toBe(false);
  });

  it("maps draft to write payload", () => {
    const draft = emptyScoreSanteDraft();
    draft.recommandation = "  Contrôle freins ";

    expect(draftToWrite("11111111-1111-1111-1111-111111111111", draft)).toEqual(
      {
        dateEcheanceProjetee: draft.dateEcheanceProjetee,
        kmAvantEcheance: draft.kmAvantEcheance,
        recommandation: "Contrôle freins",
        score: draft.score,
        vehiculeId: "11111111-1111-1111-1111-111111111111",
      }
    );
  });
});
