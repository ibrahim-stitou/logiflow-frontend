import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from "@angular/core";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideCheck,
  lucideChevronDown,
  lucideCircleCheck,
  lucideCircleOff,
  lucideListFilter,
  lucideTag,
} from "@ng-icons/lucide";
import {
  ZardPopoverComponent,
  ZardPopoverDirective,
} from "@/shared/components/popover";
import { LIST_STATUT_FILTER_ICON_PROVIDERS } from "./list-statut-icons";

export interface ListStatutOption {
  /** Lucide icon name for ng-icon (e.g. lucideCircleCheck). */
  icon?: string;
  label: string;
  value: string;
}

export function iconForStatutOption(option: ListStatutOption): string {
  if (option.icon) {
    return option.icon;
  }
  if (option.value === "true" || option.label === "Actif") {
    return "lucideCircleCheck";
  }
  if (option.value === "false" || option.label === "Inactif") {
    return "lucideCircleOff";
  }
  return "lucideTag";
}

export function statutIconForValue(
  options: readonly ListStatutOption[],
  value: string
): string | null {
  const match = options.find((option) => option.value === value);
  return match ? iconForStatutOption(match) : null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, ZardPopoverComponent, ZardPopoverDirective],
  selector: "app-list-statut-filter",
  styles: `
    :host {
      display: block;
      flex-shrink: 0;
    }

    .list-filter-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      max-width: 100%;
      height: 2.25rem;
      padding-inline: 0.625rem 0.5rem;
      font-size: 0.8125rem;
      font-weight: 500;
      line-height: 1.2;
      color: var(--color-ink);
      background: var(--color-surface);
      border: 1px solid color-mix(in oklch, var(--color-line) 88%, transparent);
      border-radius: var(--radius-lg);
      box-shadow: 0 1px 2px oklch(0 0 0 / 0.03);
      transition: border-color 120ms cubic-bezier(0.2, 0, 0, 1),
        background-color 120ms cubic-bezier(0.2, 0, 0, 1);
    }

    @media (hover: hover) and (pointer: fine) {
      .list-filter-trigger:hover {
        border-color: color-mix(in oklch, var(--color-pine) 35%, var(--color-line));
        background: color-mix(in oklch, var(--color-pine) 4%, var(--color-surface));
      }
    }

    .list-filter-trigger__icon {
      flex-shrink: 0;
      width: 0.9375rem;
      height: 0.9375rem;
      color: var(--color-muted);
    }

    .list-filter-trigger__label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .list-filter-trigger__chevron {
      flex-shrink: 0;
      width: 0.875rem;
      height: 0.875rem;
      margin-left: 0.125rem;
      color: var(--color-muted);
      opacity: 0.85;
    }

    :host ::ng-deep .list-filter-menu {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 11rem;
      padding: 0.25rem;
    }

    .list-filter-menu__item {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4375rem 0.5rem;
      font-size: 0.8125rem;
      line-height: 1.3;
      text-align: left;
      color: var(--color-ink);
      background: transparent;
      border: 0;
      border-radius: calc(var(--radius-md) - 2px);
      transition: background-color 120ms cubic-bezier(0.2, 0, 0, 1);
    }

    @media (hover: hover) and (pointer: fine) {
      .list-filter-menu__item:hover {
        background: color-mix(in oklch, var(--color-pine) 6%, var(--color-canvas));
      }
    }

    .list-filter-menu__icon {
      flex-shrink: 0;
      width: 0.9375rem;
      height: 0.9375rem;
      color: var(--color-muted);
    }

    .list-filter-menu__text {
      min-width: 0;
      flex: 1;
    }

    .list-filter-menu__check {
      flex-shrink: 0;
      width: 0.875rem;
      height: 0.875rem;
      color: var(--color-pine);
    }
  `,
  template: `
    <button
      [attr.aria-expanded]="menuOpen()"
      [attr.aria-label]="ariaLabel()"
      [zContent]="menuTemplate"
      (zVisibleChange)="menuOpen.set($event)"
      [zAlign]="'start'"
      [zSideOffset]="6"
      [zVisible]="menuOpen()"
      class="list-filter-trigger pressable"
      type="button"
      zPopover
    >
      <ng-icon
        [name]="triggerIcon()"
        aria-hidden="true"
        class="list-filter-trigger__icon"
      />
      <span class="list-filter-trigger__label">{{ triggerLabel() }}</span>
      <ng-icon
        aria-hidden="true"
        class="list-filter-trigger__chevron"
        name="lucideChevronDown"
      />
    </button>

    <ng-template #menuTemplate>
      <z-popover
        [attr.aria-label]="ariaLabel()"
        class="list-filter-menu"
        role="menu"
      >
        <button
          (click)="pick(null)"
          [attr.aria-checked]="selected() === null"
          class="list-filter-menu__item"
          role="menuitemradio"
          type="button"
        >
          <ng-icon
            aria-hidden="true"
            class="list-filter-menu__icon"
            name="lucideListFilter"
          />
          <span class="list-filter-menu__text">{{ allLabel() }}</span>
          @if (selected() === null) {
          <ng-icon
            aria-hidden="true"
            class="list-filter-menu__check"
            name="lucideCheck"
          />
          }
        </button>
        @for (option of options(); track option.value) {
        <button
          (click)="pick(option.value)"
          [attr.aria-checked]="selected() === option.value"
          class="list-filter-menu__item"
          role="menuitemradio"
          type="button"
        >
          <ng-icon
            [name]="iconFor(option)"
            aria-hidden="true"
            class="list-filter-menu__icon"
          />
          <span class="list-filter-menu__text">{{ option.label }}</span>
          @if (selected() === option.value) {
          <ng-icon
            aria-hidden="true"
            class="list-filter-menu__check"
            name="lucideCheck"
          />
          }
        </button>
        }
      </z-popover>
    </ng-template>
  `,
  viewProviders: [
    provideIcons({
      lucideCheck,
      lucideChevronDown,
      lucideCircleCheck,
      lucideCircleOff,
      lucideListFilter,
      lucideTag,
    }),
    LIST_STATUT_FILTER_ICON_PROVIDERS,
  ],
})
export class ListStatutFilter {
  readonly options = input.required<readonly ListStatutOption[]>();
  readonly selected = model<string | null>(null);
  readonly ariaLabel = input("Filtrer par statut");
  readonly allLabel = input("Tous");

  protected readonly menuOpen = signal(false);

  protected readonly triggerLabel = computed(() => {
    const current = this.selected();
    if (current === null) {
      return this.allLabel();
    }
    const match = this.options().find((option) => option.value === current);
    return match?.label ?? this.allLabel();
  });

  protected readonly triggerIcon = computed(() => {
    const current = this.selected();
    if (current === null) {
      return "lucideListFilter";
    }
    const match = this.options().find((option) => option.value === current);
    return match ? this.iconFor(match) : "lucideListFilter";
  });

  protected iconFor(option: ListStatutOption): string {
    return iconForStatutOption(option);
  }

  protected pick(value: string | null): void {
    this.selected.set(value);
    this.menuOpen.set(false);
  }
}
