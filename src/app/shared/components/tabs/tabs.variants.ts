import { cva, type VariantProps } from "class-variance-authority";

export const tabContainerVariants = cva("group/tabs flex gap-2", {
  defaultVariants: {
    zOrientation: "horizontal",
  },
  variants: {
    zOrientation: {
      horizontal: "flex-col",
      vertical: "flex-row",
    },
  },
});

export const tabNavVariants = cva(
  [
    "group/tabs-list inline-flex w-fit max-w-full items-center justify-center overflow-hidden rounded-lg p-1 text-muted-foreground",
    "group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
    "data-[variant=line]:rounded-none data-[variant=line]:overflow-visible",
  ],
  {
    defaultVariants: {
      zVariant: "default",
    },
    variants: {
      zVariant: {
        default: "bg-secondary group-data-[orientation=horizontal]/tabs:h-9",
        line: "gap-1 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-9",
        // LogiFlow module section switcher: secondary tray, pine active chip.
        section: "h-9 flex-wrap justify-start gap-0.5 bg-secondary",
      },
    },
  }
);

export const tabButtonVariants = cva([
  // Use h-full (not calc(100%-1px)) — the 1px gap showed as a line through the tray.
  "relative inline-flex h-full flex-1 items-center justify-center gap-1.5",
  "rounded-md border border-transparent px-2.5 py-1 text-sm font-medium whitespace-nowrap",
  "text-foreground/60 transition-all cursor-pointer",
  "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start",
  "hover:text-foreground",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring",
  "disabled:pointer-events-none disabled:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "dark:text-muted-foreground dark:hover:text-foreground",
  "group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none",
  "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent",
  "dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
  "data-active:bg-background data-active:text-foreground",
  "dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
  "after:pointer-events-none after:absolute after:bg-foreground after:opacity-0 after:transition-opacity",
  "group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5",
  "group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5",
  "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
  "group-data-[variant=section]/tabs-list:flex-none group-data-[variant=section]/tabs-list:px-3",
  "group-data-[variant=section]/tabs-list:text-ink/70 group-data-[variant=section]/tabs-list:shadow-none",
  "group-data-[variant=section]/tabs-list:hover:bg-surface/60 group-data-[variant=section]/tabs-list:hover:text-ink",
  "group-data-[variant=section]/tabs-list:data-active:bg-primary group-data-[variant=section]/tabs-list:data-active:text-primary-foreground group-data-[variant=section]/tabs-list:data-active:shadow-[0_1px_2px_oklch(0_0_0/0.06),0_4px_12px_color-mix(in_oklch,var(--color-pine)_22%,transparent)]",
  "dark:group-data-[variant=section]/tabs-list:data-active:bg-primary dark:group-data-[variant=section]/tabs-list:data-active:text-primary-foreground",
  "group-data-[variant=section]/tabs-list:after:hidden",
]);

export type ZardTabVariants = VariantProps<typeof tabContainerVariants> &
  VariantProps<typeof tabNavVariants>;
