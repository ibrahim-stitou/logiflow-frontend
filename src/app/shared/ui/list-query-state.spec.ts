import { convertToParamMap } from "@angular/router";
import {
  buildListQueryParams,
  parseListPage,
  parseListSearch,
  parseListStatut,
} from "./list-query-state";

describe("list query parsers", () => {
  it("parses a 1-based page query into a 0-based index", () => {
    expect(parseListPage(convertToParamMap({ page: "3" }))).toBe(2);
    expect(parseListPage(convertToParamMap({}))).toBe(0);
    expect(parseListPage(convertToParamMap({ page: "0" }))).toBe(0);
  });

  it("ignores unknown statut values when an allow-list is provided", () => {
    expect(
      parseListStatut(convertToParamMap({ statut: "CREE" }), [
        "CREE",
        "PLANIFIE",
      ])
    ).toBe("CREE");
    expect(
      parseListStatut(convertToParamMap({ statut: "INVALID" }), ["CREE"])
    ).toBeNull();
  });

  it("trims search text from q", () => {
    expect(parseListSearch(convertToParamMap({ q: "  lyon  " }))).toBe("lyon");
  });
});

describe("buildListQueryParams", () => {
  it("omits default values from the URL", () => {
    expect(buildListQueryParams({ page: 0, q: "", statut: null })).toEqual({
      page: null,
      q: null,
      statut: null,
    });
  });

  it("serializes active filters", () => {
    expect(
      buildListQueryParams({ page: 1, q: "paris", statut: "CREE" })
    ).toEqual({
      page: "2",
      q: "paris",
      statut: "CREE",
    });
  });
});
