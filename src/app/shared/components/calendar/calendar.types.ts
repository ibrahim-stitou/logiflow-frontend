export type CalendarMode = "single" | "multiple" | "range";
export type CalendarValue = Date | Date[] | null;

/**
 * How the month/year caption is rendered:
 *
 * - `label` — a single `"{Month} {Year}"` text
 * - `dropdown` — a month select plus a year select
 * - `dropdown-months` — a month select, year as text
 * - `dropdown-years` — month as text, a year select
 */
export type ZardCalendarCaptionLayout =
  | "label"
  | "dropdown"
  | "dropdown-months"
  | "dropdown-years";

export interface CalendarDay {
  date: Date;
  id?: string;
  isCurrentMonth: boolean;
  isDisabled: boolean;
  isInRange?: boolean;
  isRangeEnd?: boolean;
  isRangeStart?: boolean;
  isSelected: boolean;
  isToday: boolean;
}

export interface CalendarDayConfig {
  disabled: boolean;
  /** Individual days that cannot be selected, on top of the min/max range. */
  disabledDates?: Date[];
  maxDate: Date | null;
  minDate: Date | null;
  mode: CalendarMode;
  month: number;
  selectedDates: Date[];
  year: number;
}
