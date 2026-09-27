import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from "@angular/core";

import type { ClassValue } from "clsx";

import {
  selectGroupVariants,
  selectLabelVariants,
  selectSeparatorVariants,
} from "@/shared/components/select/select.variants";
import { mergeClasses } from "@/shared/utils/merge-classes";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zSelectGroup",
  host: {
    "[class]": "classes()",
    "data-slot": "select-group",
    role: "group",
  },
  selector: "z-select-group, [z-select-group]",
  template: "<ng-content />",
})
export class ZardSelectGroupComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(selectGroupVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zSelectLabel",
  host: {
    "[class]": "classes()",
    "data-slot": "select-label",
  },
  selector: "z-select-label, [z-select-label]",
  template: "<ng-content />",
})
export class ZardSelectLabelComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(selectLabelVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zSelectSeparator",
  host: {
    "[class]": "classes()",
    "data-slot": "select-separator",
    role: "separator",
  },
  selector: "z-select-separator, [z-select-separator]",
  template: "",
})
export class ZardSelectSeparatorComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(selectSeparatorVariants(), this.class())
  );
}
