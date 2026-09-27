import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  ViewEncapsulation,
} from "@angular/core";

import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck } from "@ng-icons/lucide";
import type { ClassValue } from "clsx";

import {
  selectItemIconVariants,
  selectItemStateVariants,
  selectItemVariants,
  type ZardSelectItemModeVariants,
} from "@/shared/components/select/select.variants";
import { mergeClasses } from "@/shared/utils/merge-classes";
import { noopFn } from "@/shared/utils/noop";

// Interface to avoid circular dependency
interface SelectHost {
  navigateTo(): void;
  selectedValue(): string[];
  selectItem(value: string, label: string): void;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zSelectItem",
  host: {
    "(click)": "onClick()",
    "(keydown.{tab}.prevent)": "noopFn",
    "(mouseenter)": "onMouseEnter()",
    "[attr.aria-disabled]": "zDisabled()",
    "[attr.aria-selected]": "isSelected()",
    "[attr.data-disabled]": 'zDisabled() ? "" : null',
    "[attr.data-selected]": 'isSelected() ? "" : null',
    "[attr.value]": "zValue()",
    "[class]": "classes()",
    "data-slot": "select-item",
    role: "option",
    tabindex: "-1",
  },
  imports: [NgIcon],
  selector: "z-select-item, [z-select-item]",
  template: `
    <span data-slot="select-item-indicator" [class]="iconClasses()">
      @if (isSelected()) {
        <ng-icon
          name="lucideCheck"
          class="size-4! text-current"
          [strokeWidth]="strokeWidth()"
          aria-hidden="true"
          data-testid="check-icon"
        />
      }
    </span>
    <span data-slot="select-item-text" class="truncate">
      <ng-content />
    </span>
  `,
  viewProviders: [provideIcons({ lucideCheck })],
})
export class ZardSelectItemComponent {
  readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly zValue = input.required<string>();
  readonly zDisabled = input(false, { transform: booleanAttribute });
  readonly class = input<ClassValue>("");

  private readonly select = signal<SelectHost | null>(null);
  noopFn = noopFn;

  readonly label = linkedSignal<string>(() => {
    const element = this.elementRef.nativeElement;
    return (element.textContent ?? element.innerText)?.trim() ?? "";
  });

  readonly zMode = signal<ZardSelectItemModeVariants>("normal");

  protected readonly classes = computed(() =>
    mergeClasses(
      selectItemVariants({ zMode: this.zMode() }),
      selectItemStateVariants(),
      this.class()
    )
  );

  protected readonly iconClasses = computed(() =>
    mergeClasses(selectItemIconVariants({ zMode: this.zMode() }))
  );

  protected readonly strokeWidth = computed(() =>
    this.zMode() === "compact" ? 3 : 2
  );

  protected readonly isSelected = computed(
    () => this.select()?.selectedValue().includes(this.zValue()) ?? false
  );

  setSelectHost(selectHost: SelectHost) {
    this.select.set(selectHost);
  }

  onMouseEnter() {
    if (this.zDisabled()) {
      return;
    }
    this.select()?.navigateTo();
  }

  onClick() {
    if (this.zDisabled()) {
      return;
    }
    this.select()?.selectItem(this.zValue(), this.label());
  }
}
