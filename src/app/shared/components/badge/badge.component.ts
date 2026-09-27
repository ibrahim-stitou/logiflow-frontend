import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from "@angular/core";

import type { ClassValue } from "clsx";

import { mergeClasses } from "@/shared/utils/merge-classes";

import { badgeVariants, type ZardBadgeTypeVariants } from "./badge.variants";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zBadge",
  host: {
    "[attr.data-variant]": "zType()",
    "[class]": "classes()",
    "data-slot": "badge",
  },
  selector: "z-badge, a[z-badge]",
  template: `
    <ng-content />
  `,
})
export class ZardBadgeComponent {
  readonly zType = input<ZardBadgeTypeVariants>("default");

  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(badgeVariants({ zType: this.zType() }), this.class())
  );
}
