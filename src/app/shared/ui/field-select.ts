import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  output,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { NgIcon } from "@ng-icons/core";
import type { ClassValue } from "clsx";
import { ZardSelectComponent } from "@/shared/components/select/select.component";
import type {
  ZardSelectPositionVariants,
  ZardSelectPreferOverlaySideVariants,
} from "@/shared/components/select/select.variants";
import { ZardSelectItemComponent } from "@/shared/components/select/select-item.component";
import { mergeClasses } from "@/shared/utils/merge-classes";

/** Sentinel for optional selects (Zard rejects empty string item values). */
export const FIELD_SELECT_NONE = "__none__";

export interface FieldSelectOption {
  disabled?: boolean;
  icon?: string;
  label: string;
  value: string;
}

export function isFieldSelectNone(value: string): boolean {
  return value.length === 0 || value === FIELD_SELECT_NONE;
}

export function enumToSelectOptions<T extends string>(
  values: readonly T[],
  label: (value: T) => string
): readonly FieldSelectOption[] {
  return values.map((value) => ({ label: label(value), value }));
}

export function withNoneSelectOption(
  noneLabel: string,
  options: readonly FieldSelectOption[]
): readonly FieldSelectOption[] {
  return [{ label: noneLabel, value: FIELD_SELECT_NONE }, ...options];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgIcon, ZardSelectComponent, ZardSelectItemComponent],
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FieldSelectComponent),
    },
  ],
  selector: "app-field-select",
  template: `
    <div class="relative w-full">
      @if (selectedOption()?.icon; as iconName) {
        <ng-icon
          [name]="iconName"
          aria-hidden="true"
          class="pointer-events-none absolute top-1/2 left-3 z-10 size-4 shrink-0 -translate-y-1/2 opacity-80"
        />
      }
      <z-select
        [attr.id]="inputId()"
        [class]="selectClasses()"
        [zDisabled]="isDisabled()"
        [zInvalid]="invalid() ?? false"
        [zPlaceholder]="placeholder()"
        [zPosition]="position()"
        [zPreferOverlaySide]="preferOverlaySide()"
        [zValue]="internalValue()"
        (zValueChange)="onSelectChange($event)"
      >
        @for (option of options(); track option.value) {
          <z-select-item [zDisabled]="option.disabled ?? false" [zValue]="option.value">
            <span class="inline-flex items-center gap-2">
              @if (option.icon) {
                <ng-icon [name]="option.icon" aria-hidden="true" class="size-4 shrink-0 opacity-80" />
              }
              <span>{{ option.label }}</span>
            </span>
          </z-select-item>
        }
      </z-select>
    </div>
  `,
})
export class FieldSelectComponent implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly placeholder = input("Choisir…");
  readonly invalid = input<boolean | null>(null);
  readonly position = input<ZardSelectPositionVariants>("popper");
  readonly preferOverlaySide =
    input<ZardSelectPreferOverlaySideVariants>("auto");
  readonly inputClass = input<ClassValue>("");
  readonly options = input<readonly FieldSelectOption[]>([]);
  /** Standalone binding when `[formField]` is not used. */
  readonly selectValue = input<string | undefined>(undefined);
  readonly selectValueChange = output<string>();

  protected readonly internalValue = signal("");
  protected readonly isDisabled = signal(false);

  protected readonly selectClasses = computed(() =>
    mergeClasses(
      "w-full [&_[data-slot=select-trigger]]:min-h-11 [&_[data-slot=select-trigger]]:h-auto",
      this.selectedOption()?.icon ? "[&_[data-slot=select-trigger]]:pl-10" : "",
      this.inputClass()
    )
  );

  protected readonly selectedOption = computed(() => {
    const value = this.internalValue();
    return this.options().find((option) => option.value === value);
  });

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const external = this.selectValue();
      if (external !== undefined && external !== this.internalValue()) {
        this.internalValue.set(external);
      }
    });
  }

  writeValue(value: string | null): void {
    this.internalValue.set(value ?? "");
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected onSelectChange(value: string | string[]): void {
    const next = Array.isArray(value) ? (value[0] ?? "") : value;
    if (next === this.internalValue()) {
      return;
    }
    this.internalValue.set(next);
    this.onChange(next);
    this.selectValueChange.emit(next);
    this.onTouched();
  }
}
