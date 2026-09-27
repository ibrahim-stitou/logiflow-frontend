import { NgTemplateOutlet } from "@angular/common";
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  type TemplateRef,
  ViewEncapsulation,
} from "@angular/core";

import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideEllipsis,
} from "@ng-icons/lucide";
import type { ClassValue } from "clsx";

import {
  ZardButtonComponent,
  type ZardButtonSizeVariants,
  type ZardButtonTypeVariants,
} from "@/shared/components/button";
import {
  paginationContentVariants,
  paginationEllipsisVariants,
  paginationNextVariants,
  paginationPreviousVariants,
  paginationVariants,
} from "@/shared/components/pagination/pagination.variants";
import { mergeClasses } from "@/shared/utils/merge-classes";

type PaginationItemSizeType = Exclude<
  ZardButtonSizeVariants,
  "default" | "xs" | "sm" | "lg"
>;
type PaginationNavSizeType = Exclude<
  ZardButtonSizeVariants,
  "icon" | "icon-xs" | "icon-sm" | "icon-lg"
>;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zPaginationContent",
  host: {
    "[class]": "classes()",
    "data-slot": "pagination-content",
  },
  selector: "ul[z-pagination-content]",
  template: `
    <ng-content />
  `,
})
export class ZardPaginationContentComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(paginationContentVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zPaginationItem",
  host: {
    "data-slot": "pagination-item",
  },
  selector: "li[z-pagination-item]",
  template: `
    <ng-content />
  `,
})
export class ZardPaginationItemComponent {}
// Structural wrapper component for pagination items (<li>). No inputs required.

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zPaginationButton",
  host: {
    "data-slot": "pagination-button",
  },
  imports: [ZardButtonComponent],
  selector: "button[z-pagination-button], a[z-pagination-button]",
  template: `
    <z-button
      [attr.data-active]="zActive() || null"
      [class]="class()"
      [zDisabled]="zDisabled()"
      [zSize]="zSize()"
      [zType]="zType()"
    >
      <ng-content />
    </z-button>
  `,
})
export class ZardPaginationButtonComponent {
  readonly class = input<ClassValue>("");
  readonly zActive = input(false, { transform: booleanAttribute });
  readonly zDisabled = input(false, { transform: booleanAttribute });
  readonly zSize = input<ZardButtonSizeVariants>("icon");

  protected readonly zType = computed<ZardButtonTypeVariants>(() =>
    this.zActive() ? "secondary" : "ghost"
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zPaginationPrevious",
  imports: [ZardPaginationButtonComponent, NgIcon],
  selector: "z-pagination-previous",
  template: `
    <button
      type="button"
      z-pagination-button
      [attr.disabled]="zDisabled() ? '' : null"
      [class]="classes()"
      [zSize]="zSize()"
      [zDisabled]="zDisabled()"
    >
      <span class="sr-only">Page précédente</span>
      <ng-icon name="lucideChevronLeft" aria-hidden="true" />
      <span class="hidden sm:block" aria-hidden="true">Précédent</span>
    </button>
  `,
  viewProviders: [provideIcons({ lucideChevronLeft })],
})
export class ZardPaginationPreviousComponent {
  readonly class = input<ClassValue>("");
  readonly zDisabled = input(false, { transform: booleanAttribute });
  readonly zSize = input<PaginationNavSizeType>("default");

  protected readonly classes = computed(() =>
    mergeClasses(paginationPreviousVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zPaginationNext",
  imports: [ZardPaginationButtonComponent, NgIcon],
  selector: "z-pagination-next",
  template: `
    <button
      type="button"
      z-pagination-button
      [attr.disabled]="zDisabled() ? '' : null"
      [class]="classes()"
      [zDisabled]="zDisabled()"
      [zSize]="zSize()"
    >
      <span class="sr-only">Page suivante</span>
      <span class="hidden sm:block" aria-hidden="true">Suivant</span>
      <ng-icon name="lucideChevronRight" aria-hidden="true" />
    </button>
  `,
  viewProviders: [provideIcons({ lucideChevronRight })],
})
export class ZardPaginationNextComponent {
  readonly class = input<ClassValue>("");
  readonly zDisabled = input(false, { transform: booleanAttribute });
  readonly zSize = input<PaginationNavSizeType>("default");

  protected readonly classes = computed(() =>
    mergeClasses(paginationNextVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zPaginationEllipsis",
  host: {
    "[class]": "classes()",
    "aria-hidden": "true",
  },
  imports: [NgIcon],
  selector: "z-pagination-ellipsis",
  template: `
    <ng-icon name="lucideEllipsis" aria-hidden="true" />
  `,
  viewProviders: [provideIcons({ lucideEllipsis })],
})
export class ZardPaginationEllipsisComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(paginationEllipsisVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zPagination",
  host: {
    "[attr.aria-label]": "zAriaLabel()",
    "[class]": "classes()",
    "data-slot": "pagination",
    role: "group",
  },
  imports: [
    ZardPaginationContentComponent,
    ZardPaginationItemComponent,
    ZardPaginationButtonComponent,
    ZardPaginationPreviousComponent,
    ZardPaginationNextComponent,
    NgTemplateOutlet,
  ],
  selector: "z-pagination",
  template: `
    @if (zContent()) {
      <ng-container *ngTemplateOutlet="zContent()" />
    } @else {
      <ul z-pagination-content>
        @if (!zSimple()) {
          <li z-pagination-item>
            @let pagePrevious = Math.max(1, clampedIndex() - 1);
            <z-pagination-previous
              [zSize]="navSize()"
              [zDisabled]="zDisabled() || clampedIndex() === 1"
              (click)="goToPage(pagePrevious)"
            />
          </li>
        }

        @for (page of pages(); track page) {
          <li z-pagination-item>
            <button
              z-pagination-button
              type="button"
              class="focus-visible:rounded-md"
              [attr.aria-current]="page === clampedIndex() ? 'page' : null"
              [attr.aria-disabled]="zDisabled() || null"
              [zActive]="page === clampedIndex()"
              [zDisabled]="zDisabled()"
              [zSize]="zSize()"
              (click)="goToPage(page)"
            >
              <span class="sr-only">{{ pages().length === page ? 'Dernière page, page' : 'Aller à la page' }}</span>
              {{ page }}
            </button>
          </li>
        }

        @if (!zSimple()) {
          <li z-pagination-item>
            @let pageNext = Math.min(clampedIndex() + 1, zTotal());
            <z-pagination-next
              [zSize]="navSize()"
              [zDisabled]="zDisabled() || clampedIndex() === zTotal()"
              (click)="goToPage(pageNext)"
            />
          </li>
        }
      </ul>
    }
  `,
})
export class ZardPaginationComponent {
  readonly zAriaLabel = input("Pagination de la liste");
  readonly zContent = input<TemplateRef<void> | undefined>();
  readonly zDisabled = input(false, { transform: booleanAttribute });
  readonly zPageIndex = model<number>(1);
  readonly zSimple = input(false, { transform: booleanAttribute });
  readonly zSize = input<PaginationItemSizeType>("icon");
  readonly zTotal = input<number>(1);

  readonly class = input<ClassValue>("");

  readonly Math = Math;

  protected readonly classes = computed(() =>
    mergeClasses(paginationVariants(), this.class())
  );
  readonly pages = computed<number[]>(() =>
    Array.from({ length: Math.max(0, this.zTotal()) }, (_, i) => i + 1)
  );
  readonly navSize = computed(() => {
    const size = this.zSize();
    switch (size) {
      case "icon-xs":
        return "xs";
      case "icon-sm":
        return "sm";
      case "icon-lg":
        return "lg";
      default:
        return "default";
    }
  });

  readonly clampedIndex = computed(() => {
    const total = Math.max(1, this.zTotal());
    return Math.min(Math.max(1, this.zPageIndex()), total);
  });

  goToPage(page: number): void {
    const max = Math.max(1, this.zTotal());
    if (
      !this.zDisabled() &&
      page >= 1 &&
      page <= max &&
      page !== this.zPageIndex()
    ) {
      this.zPageIndex.set(page);
    }
  }
}
