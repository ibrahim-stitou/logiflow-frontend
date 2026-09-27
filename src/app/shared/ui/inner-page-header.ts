import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideLayoutDashboard } from "@ng-icons/lucide";
import { LIST_TABLE_ROW_ICON_PROVIDERS } from "./list-table-row-icons";

/** Compact page title row for create / detail pages (navigation via shell breadcrumbs). */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "inner-page-header",
  },
  imports: [NgIcon],
  selector: "app-inner-page-header",
  template: `
    <div class="inner-page-header__row">
      @if (icon()) {
      <ng-icon
        [name]="icon()!"
        aria-hidden="true"
        class="inner-page-header__icon"
      />
      }
      <div class="inner-page-header__copy">
        <div class="inner-page-header__title-row">
          <h1 class="inner-page-header__title">{{ title() }}</h1>
          <div class="inner-page-header__actions">
            <ng-content select="[innerPageHeaderActions]" />
          </div>
        </div>
        @if (description()) {
        <p class="inner-page-header__description">{{ description() }}</p>
        }
        <ng-content />
      </div>
    </div>
  `,
  viewProviders: [
    provideIcons({ lucideLayoutDashboard }),
    LIST_TABLE_ROW_ICON_PROVIDERS,
  ],
})
export class InnerPageHeader {
  readonly description = input<string>();
  readonly icon = input<string | null>(null);
  readonly title = input.required<string>();
}
