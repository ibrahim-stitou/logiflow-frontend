import { ChangeDetectionStrategy, Component } from "@angular/core";

/** Responsive grid for read-only fiche fields. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "fiche-field-grid",
    role: "list",
  },
  selector: "app-fiche-field-grid",
  template: "<ng-content />",
})
export class FicheFieldGrid {}
