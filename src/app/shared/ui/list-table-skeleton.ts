import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { ZardTableImports } from "@/shared/components/table/table.imports";

export function skeletonCellWidthClass(
  column: number,
  columns: number
): string {
  if (column === 0) {
    return "max-w-28";
  }
  if (column === columns - 1) {
    return "max-w-14";
  }
  return "max-w-20";
}

@Component({
  imports: [...ZardTableImports],
  selector: "app-list-table-skeleton",
  template: `
    <div
      [attr.aria-label]="label()"
      class="list-table-panel"
      role="status"
    >
      <span class="sr-only">{{ label() }}</span>
      <table z-table>
        <thead z-table-header>
          <tr z-table-row>
            @for (column of columnIndices(); track column) {
            <th scope="col" z-table-head>
              <div
                class="h-3 w-16 animate-pulse rounded-sm bg-secondary"
              ></div>
            </th>
            }
          </tr>
        </thead>
        <tbody z-table-body>
          @for (row of rowIndices(); track row) {
          <tr z-table-row>
            @for (column of columnIndices(); track column) {
            <td z-table-cell>
              <div
                [class]="
                  'h-4 w-full animate-pulse rounded-sm bg-secondary/80 ' +
                  cellWidth(column)
                "
              ></div>
            </td>
            }
          </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ListTableSkeleton {
  readonly columns = input(6);
  readonly rows = input(8);
  readonly label = input.required<string>();

  protected readonly columnIndices = computed(() =>
    Array.from({ length: this.columns() }, (_, index) => index)
  );

  protected readonly rowIndices = computed(() =>
    Array.from({ length: this.rows() }, (_, index) => index)
  );

  protected cellWidth(column: number): string {
    return skeletonCellWidthClass(column, this.columns());
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "aria-hidden": "true",
    class: "block",
  },
  selector: "app-map-aside-skeleton",
  template: `
    <aside class="surface-panel flex min-h-80 flex-col">
      <div class="border-b border-line px-4 py-3">
        <div class="h-4 w-36 animate-pulse rounded-sm bg-secondary"></div>
        <div
          class="mt-2 h-3 w-52 animate-pulse rounded-sm bg-secondary/80"
        ></div>
      </div>
      <div class="m-2 min-h-72 flex-1 animate-pulse bg-secondary/50"></div>
    </aside>
  `,
})
export class MapAsideSkeleton {}
