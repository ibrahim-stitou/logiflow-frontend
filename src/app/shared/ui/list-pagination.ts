import { Component, computed, input, model, output } from "@angular/core";
import { ZardPaginationImports } from "@/shared/components/pagination/pagination.imports";
import { ZardSelectComponent } from "@/shared/components/select/select.component";
import { ZardSelectItemComponent } from "@/shared/components/select/select-item.component";
import { buildPaginationRange } from "./pagination-range";

let nextPageSizeSelectId = 0;

@Component({
  imports: [
    ZardPaginationImports,
    ZardSelectComponent,
    ZardSelectItemComponent,
  ],
  selector: "app-list-pagination",
  styles: `
    .list-pagination {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.625rem 1rem;
      background: var(--color-surface);
      border: 1px solid color-mix(in oklch, var(--color-line) 80%, transparent);
      border-top: none;
      border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    }

    @media (min-width: 640px) {
      .list-pagination {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
    }

    .list-pagination__meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    @media (min-width: 640px) {
      .list-pagination__meta {
        flex-direction: row;
        align-items: center;
        gap: 0.75rem;
      }
    }

    .list-pagination__summary {
      margin: 0;
      font-size: 0.8125rem;
      line-height: 1.4;
      font-variant-numeric: tabular-nums;
      color: var(--color-muted);
      text-align: center;
    }

    @media (min-width: 640px) {
      .list-pagination__summary {
        text-align: left;
      }
    }

    .list-pagination__size {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      flex-shrink: 0;
    }

    .list-pagination__size-label {
      font-size: 0.75rem;
      line-height: 1;
      color: var(--color-muted);
      white-space: nowrap;
    }

    .list-pagination__controls {
      display: flex;
      justify-content: center;
      width: 100%;
      min-width: 0;
    }

    @media (min-width: 640px) {
      .list-pagination__controls {
        width: auto;
        justify-content: flex-end;
      }
    }
  `,
  template: `
    @if (showFooter()) {
    <nav
      aria-label="Pagination"
      class="list-pagination"
    >
      <div class="list-pagination__meta">
        <p class="list-pagination__summary">
          {{ summaryText() }}
        </p>

        @if (showPageSizeSelector()) {
        <div class="list-pagination__size">
          <label class="list-pagination__size-label" [for]="pageSizeSelectId">
            Par page
          </label>
          <z-select
            [attr.id]="pageSizeSelectId"
            [zValue]="pageSizeValue()"
            (zValueChange)="onPageSizeSelect($event)"
            aria-label="Nombre d'éléments par page"
            class="list-pagination__size-select min-w-16"
            zSize="sm"
          >
            @for (size of pageSizeOptions(); track size) {
            <z-select-item [zValue]="sizeOptionValue(size)">
              {{ size }}
            </z-select-item>
            }
          </z-select>
        </div>
        }
      </div>

      @if (totalPages() > 1) {
      <z-pagination
        [zContent]="paginationContent"
        zAriaLabel="Pagination de la liste"
        class="list-pagination__controls"
      />
      }
    </nav>
    }

    <ng-template #paginationContent>
      <ul z-pagination-content>
        <li z-pagination-item>
          <z-pagination-previous
            (click)="goPrevious()"
            [zDisabled]="page() <= 0"
            zSize="sm"
          />
        </li>

        @for (item of pageItems(); track trackPageItem($index, item)) {
        @if (item === "ellipsis") {
        <li z-pagination-item>
          <z-pagination-ellipsis />
        </li>
        } @else {
        <li z-pagination-item>
          <button
            (click)="goToPage(item)"
            [attr.aria-current]="page() === item ? 'page' : null"
            [attr.aria-label]="'Page ' + (item + 1)"
            type="button"
            z-pagination-button
            zSize="icon-sm"
            [zActive]="page() === item"
          >
            <span class="sr-only">Aller à la page</span>
            {{ item + 1 }}
          </button>
        </li>
        }
        }

        <li z-pagination-item>
          <z-pagination-next
            (click)="goNext()"
            [zDisabled]="page() >= totalPages() - 1"
            zSize="sm"
          />
        </li>
      </ul>
    </ng-template>
  `,
})
export class ListPagination {
  readonly page = model.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalElements = input<number | null>(null);
  readonly pageSize = input.required<number>();
  readonly pageSizeChange = output<number>();
  readonly pageSizeOptions = input<readonly number[] | null>(null);
  readonly visibleCount = input<number | null>(null);
  readonly itemLabel = input("élément");

  protected readonly pageSizeSelectId =
    `list-pagination-size-${nextPageSizeSelectId++}`;

  protected readonly showPageSizeSelector = computed(() => {
    const options = this.pageSizeOptions();
    return options !== null && options.length > 0;
  });

  protected readonly pageItems = computed(() =>
    buildPaginationRange(this.page(), this.totalPages())
  );

  protected readonly pageSizeValue = computed(() => String(this.pageSize()));

  protected readonly showFooter = computed(() => {
    const total = this.totalElements();
    if (total !== null) {
      return total > 0 || this.totalPages() > 1;
    }
    return this.totalPages() > 1;
  });

  protected readonly summaryText = computed(() => {
    const total = this.totalElements();
    const current = this.page();
    const size = this.pageSize();
    const label = this.itemLabel();
    const plural = label.endsWith("s") ? label : `${label}s`;
    const visible = this.visibleCount();

    if (total === null) {
      return `Page ${current + 1} sur ${this.totalPages()}`;
    }

    if (total === 0) {
      return `Aucun ${label}`;
    }

    const start = current * size + 1;
    const end = Math.min((current + 1) * size, total);

    if (visible !== null && visible < end - start + 1) {
      return `${visible} affiché(s) sur ${total} ${total > 1 ? plural : label} · page ${current + 1}/${this.totalPages()}`;
    }

    if (start === end) {
      return `${start} sur ${total} ${total > 1 ? plural : label}`;
    }

    return `${start}–${end} sur ${total} ${total > 1 ? plural : label}`;
  });

  protected trackPageItem(index: number, item: number | "ellipsis"): string {
    return item === "ellipsis" ? `ellipsis-${index}` : `page-${item}`;
  }

  protected sizeOptionValue(size: number): string {
    return String(size);
  }

  protected goPrevious(): void {
    if (this.page() <= 0) {
      return;
    }
    this.page.update((current) => current - 1);
  }

  protected goNext(): void {
    if (this.page() >= this.totalPages() - 1) {
      return;
    }
    this.page.update((current) => current + 1);
  }

  protected goToPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.totalPages()) {
      return;
    }
    this.page.set(pageIndex);
  }

  protected onPageSizeSelect(value: string | string[]): void {
    const raw = Array.isArray(value) ? value[0] : value;
    const next = Number.parseInt(raw ?? "", 10);
    const options = this.pageSizeOptions();
    if (
      !Number.isFinite(next) ||
      options === null ||
      !options.includes(next) ||
      next === this.pageSize()
    ) {
      return;
    }
    this.pageSizeChange.emit(next);
    this.page.set(0);
  }
}
