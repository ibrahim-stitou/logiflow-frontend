import { cva, type VariantProps } from "class-variance-authority";

import { mergeClasses } from "@/shared/utils/merge-classes";

/**
 * Every measurement of the calendar derives from two CSS variables declared on the root:
 *
 * - `--cell-size`: the width/height of a single day cell (default `--spacing(7)`)
 * - `--cell-radius`: the corner radius of a day cell (default `var(--radius-md)`)
 *
 * Overriding them through the `class` input rescales the whole calendar, e.g.
 * `class="[--cell-size:--spacing(12)]"`.
 */
export const calendarVariants = cva(
  mergeClasses(
    // `block` because these classes land on the `<z-calendar>` host, which is inline by default.
    "group/calendar block w-fit bg-background p-2",
    "[--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)]",
    "in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent"
  )
);

/** Wraps every rendered month. Stacks on small screens and sits side by side from `md` up. */
export const calendarMonthsVariants = cva(
  "relative flex flex-col gap-4 md:flex-row"
);

export const calendarMonthVariants = cva("relative flex w-full flex-col gap-4");

export const calendarNavVariants = cva(
  "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1"
);

/**
 * Extra classes layered on top of `buttonVariants` — the navigation arrows are rendered with
 * `<button z-button [zType]="zButtonVariant()">`, so the button component supplies the base styling.
 */
export const calendarNavButtonVariants = cva(
  "size-(--cell-size) p-0 select-none aria-disabled:opacity-50"
);

/** Placeholder that holds an arrow's slot on the months that do not own it. */
export const calendarNavSpacerVariants = cva("size-(--cell-size)");

export const calendarCaptionVariants = cva(
  "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)"
);

export const calendarDropdownsVariants = cva(
  "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium"
);

export const calendarCaptionLabelVariants = cva("font-medium select-none", {
  defaultVariants: {
    layout: "label",
  },
  variants: {
    layout: {
      // In dropdown layout this label is what the user sees of the select underneath it,
      // so it carries the control's height and padding.
      dropdown:
        "flex h-(--cell-size) items-center gap-1 rounded-(--cell-radius) px-2 text-sm",
      label: "text-sm",
    },
  },
});

/**
 * Wraps a caption dropdown. A native `<select>` is laid invisible on top of the visible label,
 * so the browser owns the popup while the label owns the looks — the same trick shadcn uses.
 * The focus ring therefore has to come from the select, through `has-[:focus-visible]`.
 */
export const calendarDropdownRootVariants = cva(
  mergeClasses(
    "relative isolate rounded-(--cell-radius) border border-input bg-background shadow-xs",
    "has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
    "has-disabled:pointer-events-none has-disabled:opacity-50"
  )
);

/** The native select itself: invisible, but on top and still clickable. */
export const calendarDropdownVariants = cva(
  "absolute inset-0 z-10 cursor-pointer bg-popover opacity-0"
);

export const calendarWeekdaysVariants = cva("grid w-full grid-cols-7");

export const calendarWeekdayVariants = cva(
  mergeClasses(
    "flex h-(--cell-size) w-full min-w-(--cell-size) items-center justify-center",
    "rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none"
  )
);

/** The day rows. `gap-y-2` reproduces the `week: mt-2` of shadcn; `gap-x-0` keeps the range rail continuous. */
export const calendarWeekVariants = cva(
  "mt-2 grid w-full grid-cols-7 gap-x-0 gap-y-2"
);

export const calendarDayVariants = cva(
  mergeClasses(
    "group/day relative aspect-square size-full rounded-(--cell-radius) p-0 text-center select-none",
    // Round the range rail at both ends of every week.
    "nth-[7n+1]:rounded-s-(--cell-radius) nth-[7n]:rounded-e-(--cell-radius)"
  ),
  {
    compoundVariants: [
      {
        className: "rounded-(--cell-radius) bg-transparent after:hidden",
        rangeEnd: true,
        // A one-day range is a plain selected day: full radius, no rail.
        rangeStart: true,
      },
      {
        className: "bg-transparent",
        rangeEnd: false,
        rangeMiddle: false,
        rangeStart: false,
        selected: true,
        // Today + selected outside of a range: the day button owns the highlight.
        today: true,
      },
    ],
    defaultVariants: {
      rangeEnd: false,
      rangeMiddle: false,
      rangeStart: false,
      selected: false,
      today: false,
    },
    variants: {
      rangeEnd: {
        false: "",
        true: mergeClasses(
          "relative isolate z-0 rounded-e-(--cell-radius) bg-muted",
          "after:absolute after:inset-y-0 after:start-0 after:w-4 after:bg-muted",
          "[&:nth-child(7n+1)]:after:hidden"
        ),
      },
      rangeMiddle: {
        false: "",
        true: "rounded-none bg-muted",
      },
      rangeStart: {
        false: "",
        true: mergeClasses(
          "relative isolate z-0 rounded-s-(--cell-radius) bg-muted",
          "after:absolute after:inset-y-0 after:end-0 after:w-4 after:bg-muted",
          // No neighbour to bridge to at the end of a week — do not bleed outside the grid.
          "[&:nth-child(7n)]:after:hidden"
        ),
      },
      selected: {
        false: "",
        true: "",
      },
      today: {
        false: "",
        true: "rounded-(--cell-radius) bg-muted text-foreground",
      },
    },
  }
);

export const calendarDayButtonVariants = cva(
  mergeClasses(
    "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col items-center justify-center gap-1",
    "rounded-(--cell-radius) border border-transparent p-0 text-sm leading-none font-normal",
    "transition-colors outline-none",
    "hover:bg-muted hover:text-foreground dark:hover:text-foreground",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&>span]:text-xs [&>span]:opacity-70"
  ),
  {
    compoundVariants: [
      {
        className: "rounded-(--cell-radius) bg-primary text-primary-foreground",
        rangeEnd: true,
        // A one-day range renders as a regular selected day.
        rangeStart: true,
      },
    ],
    defaultVariants: {
      disabled: false,
      outside: false,
      rangeEnd: false,
      rangeMiddle: false,
      rangeStart: false,
      selected: false,
    },
    variants: {
      disabled: {
        false: "",
        true: "text-muted-foreground opacity-50 cursor-not-allowed",
      },
      outside: {
        false: "",
        true: "text-muted-foreground aria-selected:text-muted-foreground",
      },
      rangeEnd: {
        false: "",
        true: "rounded-(--cell-radius) rounded-e-(--cell-radius) bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      },
      rangeMiddle: {
        false: "",
        true: "rounded-none bg-muted text-foreground hover:bg-muted hover:text-foreground",
      },
      rangeStart: {
        false: "",
        true: "rounded-(--cell-radius) rounded-s-(--cell-radius) bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      },
      selected: {
        false: "",
        true: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      },
    },
  }
);

export type ZardCalendarCaptionLabelVariants = NonNullable<
  VariantProps<typeof calendarCaptionLabelVariants>["layout"]
>;
