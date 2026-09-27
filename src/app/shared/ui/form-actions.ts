import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/** Sticky save / cancel bar; use inline inside nested section forms. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.form-actions--inline]": "inline()",
    class: "form-actions",
  },
  selector: "app-form-actions",
  template: "<ng-content />",
})
export class FormActions {
  readonly inline = input(false);
}
