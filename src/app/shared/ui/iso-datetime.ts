import {
  formatIsoForDisplay,
  isoToLocalDate,
  parseTypedDateToIso,
  toIsoDateInput,
} from "./iso-date";

const DATE_HEURE_ISO = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?/;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;
const HEURE = /^\d{2}:\d{2}$/;

/** `datetime-local` value `yyyy-MM-ddTHH:mm` (local, no seconds). */

export const DEFAULT_DATETIME_TIME = "08:00";

export interface DatetimeLocalParts {
  date: string;
  time: string;
}

export function toDatetimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function splitDatetimeLocal(value: string): DatetimeLocalParts {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { date: "", time: "" };
  }

  const match = DATE_HEURE_ISO.exec(trimmed);
  if (match) {
    return { date: match[1], time: match[2] };
  }

  return { date: "", time: "" };
}

export function combineDatetimeLocal(date: string, time: string): string {
  const normalizedDate = date.trim();
  const normalizedTime = time.trim();
  if (normalizedDate.length === 0 && normalizedTime.length === 0) {
    return "";
  }
  if (normalizedDate.length === 0 || normalizedTime.length === 0) {
    return "";
  }
  if (!(DATE_ISO.test(normalizedDate) && HEURE.test(normalizedTime))) {
    return "";
  }
  return `${normalizedDate}T${normalizedTime}`;
}

export function datetimeLocalToIso(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Date invalide.");
  }
  return parsed.toISOString();
}

export function datetimeLocalToDate(value: string): Date | null {
  const { date, time } = splitDatetimeLocal(value);
  if (date.length === 0 || time.length === 0) {
    return null;
  }
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isoInstantToDatetimeLocal(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return toDatetimeLocal(parsed);
}

export function compareDatetimeLocal(a: string, b: string): number {
  const left = datetimeLocalToDate(a);
  const right = datetimeLocalToDate(b);
  if (!(left || right)) {
    return 0;
  }
  if (!left) {
    return -1;
  }
  if (!right) {
    return 1;
  }
  return left.getTime() - right.getTime();
}

export function maxDatetimeLocal(...values: readonly string[]): string {
  const candidates = values.filter((value) => value.trim().length > 0);
  if (candidates.length === 0) {
    return "";
  }
  return candidates.reduce((latest, current) =>
    compareDatetimeLocal(current, latest) > 0 ? current : latest
  );
}

export function clampDatetimeLocal(value: string, min: string): string {
  if (min.trim().length === 0 || value.trim().length === 0) {
    return value;
  }
  return compareDatetimeLocal(value, min) < 0 ? min : value;
}

export function formatDatetimeLocalForDisplay(value: string): string {
  const { date, time } = splitDatetimeLocal(value);
  if (date.length === 0) {
    return "";
  }
  const formattedDate = formatIsoForDisplay(date);
  return time.length > 0 ? `${formattedDate} ${time}` : formattedDate;
}

export function resolveDateIsoFromDisplay(
  displayDate: string,
  fallbackIso = ""
): string | null {
  const parsed = parseTypedDateToIso(displayDate);
  if (parsed === "") {
    return "";
  }
  if (parsed) {
    return parsed;
  }
  return fallbackIso.length > 0 ? fallbackIso : null;
}

export function dateIsoToDisplay(dateIso: string): string {
  return dateIso.length > 0 ? formatIsoForDisplay(dateIso) : "";
}

export function dateIsoFromDate(date: Date): string {
  return toIsoDateInput(date);
}

export function localDateFromDateIso(dateIso: string): Date | null {
  return isoToLocalDate(dateIso);
}
