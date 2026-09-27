import {
  clampDatetimeLocal,
  combineDatetimeLocal,
  compareDatetimeLocal,
  datetimeLocalToIso,
  formatDatetimeLocalForDisplay,
  maxDatetimeLocal,
  splitDatetimeLocal,
  toDatetimeLocal,
} from "./iso-datetime";

describe("iso-datetime helpers", () => {
  it("formats and splits datetime-local values", () => {
    const value = toDatetimeLocal(new Date(2026, 8, 25, 14, 30));
    expect(value).toBe("2026-09-25T14:30");
    expect(splitDatetimeLocal(value)).toEqual({
      date: "2026-09-25",
      time: "14:30",
    });
  });

  it("combines date and time parts", () => {
    expect(combineDatetimeLocal("2026-09-25", "08:00")).toBe(
      "2026-09-25T08:00"
    );
    expect(combineDatetimeLocal("", "")).toBe("");
  });

  it("formats datetime-local for French display", () => {
    expect(formatDatetimeLocalForDisplay("2026-09-25T08:00")).toBe(
      "25/09/2026 08:00"
    );
  });

  it("converts datetime-local to ISO for the API", () => {
    const iso = datetimeLocalToIso("2026-09-25T08:00");
    expect(iso).toContain("2026-09-25");
  });

  it("picks the latest datetime-local value", () => {
    expect(maxDatetimeLocal("2026-09-22T23:56", "2026-09-23T00:07")).toBe(
      "2026-09-23T00:07"
    );
    expect(
      compareDatetimeLocal("2026-09-22T23:56", "2026-09-23T00:07")
    ).toBeLessThan(0);
  });

  it("clamps datetime-local values to a minimum", () => {
    expect(clampDatetimeLocal("2026-09-22T23:50", "2026-09-23T00:07")).toBe(
      "2026-09-23T00:07"
    );
    expect(clampDatetimeLocal("2026-09-23T00:10", "2026-09-23T00:07")).toBe(
      "2026-09-23T00:10"
    );
  });
});
