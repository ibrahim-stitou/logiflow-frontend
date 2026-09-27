import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { type Params, RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucidePlus } from "@ng-icons/lucide";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, RouterLink],
  selector: "app-list-toolbar-cta",
  styles: `
    :host {
      display: block;
      margin-left: auto;
      flex-shrink: 0;
    }
  `,
  template: `
    <a
      [queryParams]="queryParams()"
      [routerLink]="link()"
      class="btn-toolbar pressable list-toolbar__cta"
    >
      <ng-icon aria-hidden="true" class="btn-toolbar__icon" name="lucidePlus" />
      <span>{{ label() }}</span>
    </a>
  `,
  viewProviders: [provideIcons({ lucidePlus })],
})
export class ListToolbarCta {
  readonly link = input.required<string | readonly string[]>();
  readonly label = input.required<string>();
  readonly queryParams = input<Params | null>(null);
}
