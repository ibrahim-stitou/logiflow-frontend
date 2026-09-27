import { cva, type VariantProps } from "class-variance-authority";

/** LogiFlow cards: rounded, soft elevation. */
export const cardVariants = cva(
  "group/card flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card py-4 text-sm text-card-foreground shadow-[0_1px_2px_oklch(0_0_0/0.04),0_8px_24px_oklch(0_0_0/0.04)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0",
  {
    variants: {
      zSize: {
        default: "",
        sm: "",
      },
    },
  }
);

export type ZardCardSizeType = NonNullable<
  VariantProps<typeof cardVariants>["zSize"]
>;

export const cardHeaderVariants = cva(
  "group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [&.border-b]:pb-4 group-data-[size=sm]/card:[&.border-b]:pb-3"
);

export const cardTitleVariants = cva(
  "font-display text-base/snug font-medium tracking-tight text-ink group-data-[size=sm]/card:text-sm"
);

export const cardDescriptionVariants = cva("text-sm text-muted");

export const cardActionVariants = cva(
  "col-start-2 row-span-2 row-start-1 self-start justify-self-end"
);

export const cardContentVariants = cva("px-4 group-data-[size=sm]/card:px-3");

export const cardFooterVariants = cva(
  "flex items-center rounded-b-xl bg-secondary/50 p-4 group-data-[size=sm]/card:p-3"
);
