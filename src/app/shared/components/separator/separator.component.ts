import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from "@angular/core";

import type { ClassValue } from "clsx";

import { mergeClasses } from "@/shared/utils/merge-classes";

import {
  separatorVariants,
  type ZardSeparatorVariants,
} from "./separator.variants";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zSeparator",
  host: {
    "[attr.aria-orientation]":
      '!zDecorative() && zOrientation() === "vertical" ? "vertical" : null',
    "[attr.data-orientation]": "zOrientation()",
    "[attr.role]": 'zDecorative() ? "none" : "separator"',
    "[class]": "classes()",
    "data-slot": "separator",
  },
  selector: "z-separator",
  template: "",
})
export class ZardSeparatorComponent {
  readonly zOrientation =
    input<ZardSeparatorVariants["zOrientation"]>("horizontal");
  readonly zDecorative = input(true, { transform: booleanAttribute });
  readonly class = input<ClassValue>("");

  // shadcn/ui uses div through SeparatorPrimitive. We don't use div, so we need to add 'block' class
  // to make it match shadcn/ui styling
  protected readonly classes = computed(() =>
    mergeClasses(separatorVariants(), "block", this.class())
  );
}
