import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from "@angular/core";

import type { ClassValue } from "clsx";

import {
  tableBodyVariants,
  tableCaptionVariants,
  tableCellVariants,
  tableFooterVariants,
  tableHeaderVariants,
  tableHeadVariants,
  tableRowVariants,
  tableVariants,
  type ZardTableSizeVariants,
  type ZardTableTypeVariants,
} from "@/shared/components/table/table.variants";
import { mergeClasses } from "@/shared/utils/merge-classes";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zTable",
  host: {
    "[class]": "classes()",
    "data-slot": "table",
  },
  selector: "table[z-table]",
  template: `
    <ng-content />
  `,
})
export class ZardTableComponent {
  readonly zType = input<ZardTableTypeVariants>("default");
  readonly zSize = input<ZardTableSizeVariants>("default");
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(
      tableVariants({
        zSize: this.zSize(),
        zType: this.zType(),
      }),
      this.class()
    )
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zTableHeader",
  host: {
    "[class]": "classes()",
    "data-slot": "table-header",
  },
  selector: "thead[z-table-header]",
  template: `
    <ng-content />
  `,
})
export class ZardTableHeaderComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(tableHeaderVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zTableBody",
  host: {
    "[class]": "classes()",
    "data-slot": "table-body",
  },
  selector: "tbody[z-table-body]",
  template: `
    <ng-content />
  `,
})
export class ZardTableBodyComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(tableBodyVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zTableRow",
  host: {
    "[class]": "classes()",
    "data-slot": "table-row",
  },
  selector: "tr[z-table-row]",
  template: `
    <ng-content />
  `,
})
export class ZardTableRowComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(tableRowVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zTableHead",
  host: {
    "[class]": "classes()",
    "data-slot": "table-head",
  },
  selector: "th[z-table-head]",
  template: `
    <ng-content />
  `,
})
export class ZardTableHeadComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(tableHeadVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zTableCell",
  host: {
    "[class]": "classes()",
    "data-slot": "table-cell",
  },
  selector: "td[z-table-cell]",
  template: `
    <ng-content />
  `,
})
export class ZardTableCellComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(tableCellVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zTableCaption",
  host: {
    "[class]": "classes()",
    "data-slot": "table-caption",
  },
  selector: "caption[z-table-caption]",
  template: `
    <ng-content />
  `,
})
export class ZardTableCaptionComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(tableCaptionVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zTableFooter",
  host: {
    "[class]": "classes()",
    "data-slot": "table-footer",
  },
  selector: "tfoot[z-table-footer]",
  template: `
    <ng-content />
  `,
})
export class ZardTableFooterComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(tableFooterVariants(), this.class())
  );
}
