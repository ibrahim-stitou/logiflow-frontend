import type { ListStatutOption } from "./list-statut-filter";

const ESPACES = /\s+/;

/** Keeps rows whose statut matches, or all rows when selected is null. */
export function filterByStatut<T>(
  rows: readonly T[],
  selected: string | null,
  statutOf: (row: T) => string
): T[] {
  if (selected === null) {
    return [...rows];
  }
  return rows.filter((row) => statutOf(row) === selected);
}

export function statutOptionsFrom<T extends string>(
  values: readonly T[],
  labelOf: (value: T) => string,
  iconOf?: (value: T) => string
): ListStatutOption[] {
  return values.map((value) => ({
    label: labelOf(value),
    value,
    ...(iconOf ? { icon: iconOf(value) } : {}),
  }));
}

/** Client-side multi-token match when the list API has no `q` parameter. */
export function filterByQuery<T>(
  rows: readonly T[],
  query: string,
  searchableText: (row: T) => string
): T[] {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(ESPACES)
    .filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return [...rows];
  }
  return rows.filter((row) => {
    const text = searchableText(row).toLowerCase();
    return tokens.every((token) => text.includes(token));
  });
}
