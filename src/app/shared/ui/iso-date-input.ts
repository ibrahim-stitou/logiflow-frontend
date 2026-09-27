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
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCalendar } from "@ng-icons/lucide";
import type { ClassValue } from "clsx";
import { ZardCalendarComponent } from "@/shared/components/calendar";
import type { CalendarValue } from "@/shared/components/calendar/calendar.types";
import { ZardInputComponent } from "@/shared/components/input";
import { ZardInputGroupImports } from "@/shared/components/input-group";
import {
  ZardPopoverComponent,
  ZardPopoverDirective,
} from "@/shared/components/popover";
import { mergeClasses } from "@/shared/utils/merge-classes";
import {
  formatIsoForDisplay,
  isoToLocalDate,
  parseTypedDateToIso,
  toIsoDateInput,
} from "./iso-date";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgIcon,
    ZardCalendarComponent,
    ZardInputComponent,
    ZardInputGroupImports,
    ZardPopoverComponent,
    ZardPopoverDirective,
  ],
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IsoDateInputComponent),
    },
  ],
  selector: "app-iso-date-input",
  template: `
    <z-input-group class="min-h-11 h-auto w-full">
      <input
        z-input
        type="text"
        inputmode="numeric"
        autocomplete="off"
        [attr.id]="inputId()"
        [attr.placeholder]="placeholder()"
        [attr.aria-invalid]="ariaInvalid() ?? null"
        [disabled]="isDisabled()"
        [class]="inputClasses()"
        [value]="displayValue()"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (keydown)="onKeydown($event)"
      />
      <z-input-group-addon zAlign="inline-end">
        <button
          type="button"
          z-input-group-button
          aria-label="Ouvrir le calendrier"
          zPopover
          zAlign="end"
          [zContent]="calendarTemplate"
          [zVisible]="isOpen()"
          [zAlignOffset]="-8"
          [zSideOffset]="10"
          (zVisibleChange)="isOpen.set($event)"
        >
          <ng-icon name="lucideCalendar" />
        </button>
      </z-input-group-addon>
    </z-input-group>

    <ng-template #calendarTemplate>
      <z-popover aria-label="Choisir une date" class="w-auto overflow-hidden p-0">
        <z-calendar
          zCaptionLayout="dropdown"
          [minDate]="minDate()"
          [maxDate]="maxDate()"
          [value]="selectedDate()"
          (valueChange)="onCalendarSelect($event)"
        />
      </z-popover>
    </ng-template>
  `,
  viewProviders: [provideIcons({ lucideCalendar })],
})
export class IsoDateInputComponent implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly placeholder = input("jj/mm/aaaa");
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly ariaInvalid = input<boolean | null>(null);
  readonly inputClass = input<ClassValue>("");
  /** Standalone binding when `[formField]` is not used. */
  readonly isoDate = input<string | undefined>(undefined);
  readonly isoDateChange = output<string>();

  protected readonly displayValue = signal("");
  protected readonly selectedDate = signal<Date | null>(null);
  protected readonly isOpen = signal(false);
  protected readonly isDisabled = signal(false);

  protected readonly inputClasses = computed(() =>
    mergeClasses(this.inputClass())
  );

  private isoValue = "";
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const external = this.isoDate();
      if (external !== undefined && external !== this.isoValue) {
        this.writeValue(external);
      }
    });
  }

  writeValue(value: string | null): void {
    this.isoValue = value ?? "";
    this.selectedDate.set(isoToLocalDate(this.isoValue));
    this.displayValue.set(
      this.isoValue.length > 0 ? formatIsoForDisplay(this.isoValue) : ""
    );
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

  protected onInput(event: Event): void {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const typed = target.value;
    this.displayValue.set(typed);

    const parsed = parseTypedDateToIso(typed);
    if (parsed === "") {
      this.commitIso("");
      return;
    }
    if (parsed) {
      this.commitIso(parsed);
    }
  }

  protected onBlur(): void {
    const parsed = parseTypedDateToIso(this.displayValue());
    if (parsed && parsed.length > 0) {
      this.displayValue.set(formatIsoForDisplay(parsed));
    } else if (this.isoValue.length > 0) {
      this.displayValue.set(formatIsoForDisplay(this.isoValue));
    }
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.isOpen.set(true);
    }
    if (event.key === "Escape") {
      this.isOpen.set(false);
    }
  }

  protected onCalendarSelect(value: CalendarValue): void {
    const date = Array.isArray(value) ? (value[0] ?? null) : value;
    if (!date) {
      this.commitIso("");
      this.isOpen.set(false);
      return;
    }

    this.commitIso(toIsoDateInput(date));
    this.displayValue.set(formatIsoForDisplay(this.isoValue));
    this.isOpen.set(false);
    this.onTouched();
  }

  private commitIso(iso: string): void {
    if (iso === this.isoValue) {
      this.selectedDate.set(iso ? isoToLocalDate(iso) : null);
      return;
    }
    this.isoValue = iso;
    this.selectedDate.set(iso ? isoToLocalDate(iso) : null);
    this.onChange(iso);
    this.isoDateChange.emit(iso);
  }
}
