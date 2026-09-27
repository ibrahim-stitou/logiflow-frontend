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
  clampDatetimeLocal,
  combineDatetimeLocal,
  DEFAULT_DATETIME_TIME,
  dateIsoFromDate,
  dateIsoToDisplay,
  localDateFromDateIso,
  resolveDateIsoFromDisplay,
  splitDatetimeLocal,
} from "./iso-datetime";

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
      useExisting: forwardRef(() => IsoDatetimeInputComponent),
    },
  ],
  selector: "app-iso-datetime-input",
  template: `
    <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
      <z-input-group class="min-h-11 h-auto w-full flex-1">
        <input
          z-input
          type="text"
          inputmode="numeric"
          autocomplete="off"
          [attr.id]="inputId()"
          [attr.placeholder]="datePlaceholder()"
          [attr.aria-invalid]="ariaInvalid() ?? null"
          [disabled]="isDisabled()"
          [class]="inputClasses()"
          [value]="displayDate()"
          (input)="onDateInput($event)"
          (blur)="onDateBlur()"
          (keydown)="onDateKeydown($event)"
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

      <input
        z-input
        type="time"
        step="60"
        class="min-h-11 w-full shrink-0 sm:w-34"
        [attr.id]="timeInputId()"
        [attr.aria-label]="timeAriaLabel()"
        [attr.aria-invalid]="ariaInvalid() ?? null"
        [disabled]="isDisabled()"
        [attr.min]="timeMin()"
        [value]="timeValue()"
        (input)="onTimeInput($event)"
        (blur)="onTimeBlur()"
      />
    </div>

    <ng-template #calendarTemplate>
      <z-popover aria-label="Choisir une date" class="w-auto overflow-hidden p-0">
        <z-calendar
          zCaptionLayout="dropdown"
        [minDate]="effectiveMinDate()"
        [maxDate]="maxDate()"
          [value]="selectedDate()"
          (valueChange)="onCalendarSelect($event)"
        />
      </z-popover>
    </ng-template>
  `,
  viewProviders: [provideIcons({ lucideCalendar })],
})
export class IsoDatetimeInputComponent implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly datePlaceholder = input("jj/mm/aaaa");
  readonly timeAriaLabel = input("Heure");
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  /** Minimum allowed value as `yyyy-MM-ddTHH:mm` (local). */
  readonly minIsoDatetime = input<string | null>(null);
  readonly ariaInvalid = input<boolean | null>(null);
  readonly inputClass = input<ClassValue>("");
  /** Standalone binding when `[formField]` is not used. */
  readonly isoDatetime = input<string | undefined>(undefined);
  readonly isoDatetimeChange = output<string>();

  protected readonly displayDate = signal("");
  protected readonly timeValue = signal("");
  protected readonly selectedDate = signal<Date | null>(null);
  protected readonly isOpen = signal(false);
  protected readonly isDisabled = signal(false);

  protected readonly timeInputId = computed(() => `${this.inputId()}-time`);

  protected readonly effectiveMinDate = computed(() => {
    const explicitMin = this.minDate();
    if (explicitMin) {
      return explicitMin;
    }
    const minIso = this.minIsoDatetime();
    if (!minIso) {
      return null;
    }
    const { date } = splitDatetimeLocal(minIso);
    return localDateFromDateIso(date);
  });

  protected readonly timeMin = computed(() => {
    const minIso = this.minIsoDatetime();
    const selected = this.selectedDate();
    if (!(minIso && selected)) {
      return null;
    }
    const { date: minDateIso, time: minTime } = splitDatetimeLocal(minIso);
    const minDate = localDateFromDateIso(minDateIso);
    if (!minDate || minTime.length === 0) {
      return null;
    }
    return selected.getTime() === minDate.getTime() ? minTime : null;
  });

  protected readonly inputClasses = computed(() =>
    mergeClasses(this.inputClass())
  );

  private datetimeLocal = "";
  private dateIso = "";
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const external = this.isoDatetime();
      if (external !== undefined && external !== this.datetimeLocal) {
        this.writeValue(external);
      }
    });
  }

  writeValue(value: string | null): void {
    this.datetimeLocal = value ?? "";
    const { date, time } = splitDatetimeLocal(this.datetimeLocal);
    this.dateIso = date;
    this.displayDate.set(dateIsoToDisplay(date));
    this.timeValue.set(time);
    this.selectedDate.set(localDateFromDateIso(date));
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

  protected onDateInput(event: Event): void {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.displayDate.set(target.value);
    const resolved = resolveDateIsoFromDisplay(target.value, this.dateIso);
    if (resolved === "") {
      this.commitFromParts("", this.timeValue());
      return;
    }
    if (resolved) {
      this.commitFromParts(
        resolved,
        this.timeValue().length > 0 ? this.timeValue() : DEFAULT_DATETIME_TIME
      );
    }
  }

  protected onDateBlur(): void {
    const resolved = resolveDateIsoFromDisplay(
      this.displayDate(),
      this.dateIso
    );
    if (resolved && resolved.length > 0) {
      this.displayDate.set(dateIsoToDisplay(resolved));
      this.commitFromParts(
        resolved,
        this.timeValue().length > 0 ? this.timeValue() : DEFAULT_DATETIME_TIME
      );
    } else if (this.dateIso.length > 0) {
      this.displayDate.set(dateIsoToDisplay(this.dateIso));
    }
    this.onTouched();
  }

  protected onDateKeydown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.isOpen.set(true);
    }
    if (event.key === "Escape") {
      this.isOpen.set(false);
    }
  }

  protected onTimeInput(event: Event): void {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.timeValue.set(target.value);
    if (this.dateIso.length === 0) {
      return;
    }
    this.commitFromParts(this.dateIso, target.value);
  }

  protected onTimeBlur(): void {
    this.onTouched();
  }

  protected onCalendarSelect(value: CalendarValue): void {
    const date = Array.isArray(value) ? (value[0] ?? null) : value;
    if (!date) {
      this.commitFromParts("", "");
      this.isOpen.set(false);
      return;
    }

    const iso = dateIsoFromDate(date);
    const time =
      this.timeValue().length > 0 ? this.timeValue() : DEFAULT_DATETIME_TIME;
    this.commitFromParts(iso, time);
    this.displayDate.set(dateIsoToDisplay(iso));
    this.isOpen.set(false);
    this.onTouched();
  }

  private commitFromParts(date: string, time: string): void {
    let combined = combineDatetimeLocal(date, time);
    const minIso = this.minIsoDatetime();
    if (minIso && combined.length > 0) {
      combined = clampDatetimeLocal(combined, minIso);
    }
    const { date: nextDate, time: nextTime } = splitDatetimeLocal(combined);
    if (combined === this.datetimeLocal) {
      this.dateIso = nextDate;
      this.selectedDate.set(localDateFromDateIso(nextDate));
      return;
    }

    this.datetimeLocal = combined;
    this.dateIso = nextDate;
    this.timeValue.set(nextTime);
    this.displayDate.set(dateIsoToDisplay(nextDate));
    this.selectedDate.set(localDateFromDateIso(nextDate));
    this.onChange(combined);
    this.isoDatetimeChange.emit(combined);
  }
}
