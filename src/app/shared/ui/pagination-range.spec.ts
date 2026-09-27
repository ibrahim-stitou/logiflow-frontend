import { buildPaginationRange } from "./pagination-range";

describe("buildPaginationRange", () => {
  it("returns empty for a single page", () => {
    expect(buildPaginationRange(0, 1)).toEqual([]);
  });

  it("returns all pages when total is small", () => {
    expect(buildPaginationRange(2, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it("collapses distant pages with ellipsis", () => {
    expect(buildPaginationRange(0, 10)).toEqual([0, 1, "ellipsis", 9]);
    expect(buildPaginationRange(9, 10)).toEqual([0, "ellipsis", 8, 9]);
    expect(buildPaginationRange(4, 10)).toEqual([
      0,
      "ellipsis",
      3,
      4,
      5,
      "ellipsis",
      9,
    ]);
  });
});
