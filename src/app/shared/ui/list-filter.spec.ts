import {
  filterByQuery,
  filterByStatut,
  statutOptionsFrom,
} from "./list-filter";

describe("filterByStatut", () => {
  const rows = [
    { id: "1", statut: "CREE" },
    { id: "2", statut: "INCIDENT" },
    { id: "3", statut: "CREE" },
  ];

  it("returns all rows when no statut is selected", () => {
    expect(filterByStatut(rows, null, (row) => row.statut)).toEqual(rows);
  });

  it("keeps only matching statut", () => {
    expect(filterByStatut(rows, "CREE", (row) => row.statut)).toEqual([
      { id: "1", statut: "CREE" },
      { id: "3", statut: "CREE" },
    ]);
  });
});

describe("filterByQuery", () => {
  const rows = [
    { id: "1", reference: "DOS-2024-001" },
    { id: "2", reference: "DOS-2024-LYON" },
  ];

  it("returns all rows when query is empty", () => {
    expect(filterByQuery(rows, "", (row) => row.reference)).toEqual(rows);
    expect(filterByQuery(rows, "   ", (row) => row.reference)).toEqual(rows);
  });

  it("matches every whitespace-separated token", () => {
    expect(filterByQuery(rows, "dos lyon", (row) => row.reference)).toEqual([
      { id: "2", reference: "DOS-2024-LYON" },
    ]);
  });
});

describe("statutOptionsFrom", () => {
  it("maps values to labeled options", () => {
    expect(
      statutOptionsFrom(["A", "B"] as const, (value) => `L-${value}`)
    ).toEqual([
      { label: "L-A", value: "A" },
      { label: "L-B", value: "B" },
    ]);
  });

  it("attaches icons when iconOf is provided", () => {
    expect(
      statutOptionsFrom(
        ["A"] as const,
        (value) => value,
        () => "lucideInbox"
      )
    ).toEqual([{ icon: "lucideInbox", label: "A", value: "A" }]);
  });
});
