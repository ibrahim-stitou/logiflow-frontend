import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/** Read-only label + value pair inside a fiche field grid. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.fiche-field-grid__item--span-2]": "span() === 2",
    class: "fiche-field-grid__item",
    role: "listitem",
  },
  selector: "app-fiche-field",
  template: `
    <span class="fiche-field__label">{{ label() }}</span>
    <span
      [class.fiche-field__value--mono]="mono()"
      class="fiche-field__value"
    >
      <ng-content />
    </span>
  `,
})
export class FicheField {
  readonly label = input.required<string>();
  readonly mono = input(false);
  readonly span = input<1 | 2>(1);
}
