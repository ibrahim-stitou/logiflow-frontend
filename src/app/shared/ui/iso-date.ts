const ISO_DATE_STRICTE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_FR_BARRES = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const DATE_FR_TIRETS = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
const DATE_ISO_SOUPLE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
/** ISO calendar date `yyyy-MM-dd` (no time zone). */

export function toIsoDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isoToLocalDate(iso: string): Date | null {
  const match = ISO_DATE_STRICTE.exec(iso.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatIsoForDisplay(iso: string): string {
  const date = isoToLocalDate(iso);
  if (!date) {
    return iso;
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

/**
 * Parses `jj/mm/aaaa`, `jj-mm-aaaa`, or `aaaa-mm-jj` into an ISO date string.
 * Returns null when the value is incomplete or invalid.
 */
export function parseTypedDateToIso(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const slash = DATE_FR_BARRES.exec(trimmed);
  if (slash) {
    return partsToIso(Number(slash[3]), Number(slash[2]), Number(slash[1]));
  }

  const dashFr = DATE_FR_TIRETS.exec(trimmed);
  if (dashFr) {
    return partsToIso(Number(dashFr[3]), Number(dashFr[2]), Number(dashFr[1]));
  }

  const iso = DATE_ISO_SOUPLE.exec(trimmed);
  if (iso) {
    return partsToIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  return null;
}

function partsToIso(year: number, month: number, day: number): string | null {
  if (
    !(
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      Number.isInteger(day)
    )
  ) {
    return null;
  }
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return toIsoDateInput(date);
}
