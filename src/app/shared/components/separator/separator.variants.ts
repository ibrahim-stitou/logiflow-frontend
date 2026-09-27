import { cva, type VariantProps } from "class-variance-authority";

export const separatorVariants = cva(
  "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
  {
    defaultVariants: {
      zOrientation: "horizontal",
    },
    variants: {
      zOrientation: {
        horizontal: "",
        vertical: "",
      },
    },
  }
);

export type ZardSeparatorVariants = VariantProps<typeof separatorVariants>;
