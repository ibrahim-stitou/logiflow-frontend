import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from "@angular/core";

import type { ClassValue } from "clsx";

import { mergeClasses } from "@/shared/utils/merge-classes";

import {
  inputGroupAddonVariants,
  inputGroupButtonVariants,
  inputGroupTextVariants,
  inputGroupVariants,
  type ZardInputGroupAddonAlignVariants,
  type ZardInputGroupButtonSizeVariants,
  type ZardInputGroupButtonVariantVariants,
} from "./input-group.variants";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zInputGroup",
  host: {
    "[class]": "classes()",
    "data-slot": "input-group",
    role: "group",
  },
  selector: "z-input-group, [z-input-group]",
  template: "<ng-content />",
})
export class ZardInputGroupComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(inputGroupVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zInputGroupAddon",
  host: {
    "(click)": "onClick($event)",
    "[attr.data-align]": "zAlign()",
    "[class]": "classes()",
    "data-slot": "input-group-addon",
    role: "group",
  },
  selector: "z-input-group-addon, [z-input-group-addon]",
  template: "<ng-content />",
})
export class ZardInputGroupAddonComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly class = input<ClassValue>("");
  readonly zAlign = input<ZardInputGroupAddonAlignVariants>("inline-start");

  protected readonly classes = computed(() =>
    mergeClasses(
      inputGroupAddonVariants({ zAlign: this.zAlign() }),
      this.class()
    )
  );

  protected onClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }

    const control = this.elementRef.nativeElement.parentElement?.querySelector(
      "input, textarea"
    ) as HTMLElement | null;
    control?.focus();
  }
}

@Directive({
  exportAs: "zInputGroupButton",
  host: {
    "[attr.data-size]": "zSize()",
    "[class]": "classes()",
    "data-slot": "input-group-button",
    type: "button",
  },
  selector: "button[z-input-group-button]",
})
export class ZardInputGroupButtonDirective {
  readonly class = input<ClassValue>("");
  readonly zVariant = input<ZardInputGroupButtonVariantVariants>("ghost");
  readonly zSize = input<ZardInputGroupButtonSizeVariants>("xs");

  protected readonly classes = computed(() =>
    mergeClasses(
      inputGroupButtonVariants({
        zSize: this.zSize(),
        zVariant: this.zVariant(),
      }),
      this.class()
    )
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zInputGroupText",
  host: {
    "[class]": "classes()",
    "data-slot": "input-group-text",
  },
  selector: "z-input-group-text, span[z-input-group-text]",
  template: "<ng-content />",
})
export class ZardInputGroupTextComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(inputGroupTextVariants(), this.class())
  );
}
