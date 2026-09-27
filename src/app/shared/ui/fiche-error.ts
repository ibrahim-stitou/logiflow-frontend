import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

/** Inline load error with retry for fiche headers. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-fiche-error",
  template: `
    <div class="alert-panel" role="alert">
      <p>{{ message() ?? "Une erreur est survenue." }}</p>
      <button
        (click)="retry.emit()"
        class="pressable mt-2 font-medium text-ink underline underline-offset-2"
        type="button"
      >
        Réessayer
      </button>
    </div>
  `,
})
export class FicheError {
  readonly message = input<string | null>(null);
  readonly retry = output();
}
