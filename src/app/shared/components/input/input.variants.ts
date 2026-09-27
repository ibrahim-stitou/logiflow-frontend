import { cva } from "class-variance-authority";

/** LogiFlow field look: rounded, mono type, min-h-11 — matches `.field`. */
export const inputVariants = cva(
  [
    "h-auto min-h-11 w-full min-w-0 rounded-md border border-input bg-canvas",
    "px-3 py-[0.65rem] font-mono text-base text-ink outline-none",
    "transition-[border-color,box-shadow,background-color]",
    "placeholder:text-muted file:inline-flex file:h-6 file:border-0 file:bg-transparent",
    "file:font-mono file:text-sm file:font-medium file:text-foreground",
    "focus-visible:border-ring focus-visible:bg-surface focus-visible:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-pine)_14%,transparent)] focus-visible:ring-0",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
    "aria-invalid:border-destructive/55 aria-invalid:bg-destructive/4 aria-invalid:ring-0",
    "aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-brake)_12%,transparent)]",
    "sm:text-sm",
  ].join(" ")
);

export const inputGroupInputVariants = cva(
  "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent"
);
