import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  inject,
  signal,
} from "@angular/core";

export type ToastTone = "success" | "error";

export interface ToastMessage {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
}

const TOAST_DURATION_MS = 4000;

@Injectable({ providedIn: "root" })
export class ToastService {
  private nextId = 0;
  private readonly timers = new Map<
    number,
    ReturnType<typeof globalThis.setTimeout>
  >();

  readonly messages = signal<readonly ToastMessage[]>([]);

  success(message: string): void {
    this.show(message, "success");
  }

  error(message: string): void {
    this.show(message, "error");
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      globalThis.clearTimeout(timer);
      this.timers.delete(id);
    }
    this.messages.update((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }

  private show(message: string, tone: ToastTone): void {
    const id = ++this.nextId;
    this.messages.update((current) => [...current, { id, message, tone }]);
    const timer = globalThis.setTimeout(() => {
      this.dismiss(id);
    }, TOAST_DURATION_MS);
    this.timers.set(id, timer);
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      "pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2",
  },
  selector: "app-toast-host",
  template: `
    @for (toast of toastService.messages(); track toast.id) {
    <div
      [class]="toastClasses(toast.tone)"
      class="toast-item pointer-events-auto border px-4 py-3 text-sm shadow-sm"
      role="status"
    >
      <div class="flex items-start justify-between gap-3">
        <p class="text-pretty leading-snug">{{ toast.message }}</p>
        <button
          (click)="toastService.dismiss(toast.id)"
          [attr.aria-label]="'Fermer : ' + toast.message"
          class="pressable shrink-0 text-xs text-muted hover:text-ink"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
    }
  `,
})
export class ToastHost {
  protected readonly toastService = inject(ToastService);

  protected toastClasses(tone: ToastTone): string {
    if (tone === "error") {
      return "border-brake/25 bg-brake/5 text-brake";
    }
    return "border-pine/25 bg-pine/5 text-pine";
  }
}
