import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type TemplateRef,
  ViewEncapsulation,
} from "@angular/core";

import type { ClassValue } from "clsx";

import { ZardStringTemplateOutletDirective } from "@/shared/core";
import { mergeClasses } from "@/shared/utils/merge-classes";

import {
  cardActionVariants,
  cardContentVariants,
  cardDescriptionVariants,
  cardFooterVariants,
  cardHeaderVariants,
  cardTitleVariants,
  cardVariants,
  type ZardCardSizeType,
} from "./card.variants";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zCardTitle",
  host: {
    "[class]": "classes()",
    "data-slot": "card-title",
  },
  imports: [ZardStringTemplateOutletDirective],
  selector: "z-card-title, [z-card-title]",
  template: `
    @let title = zTitle();
    <ng-container *zStringTemplateOutlet="title">{{ title }}</ng-container>
  `,
})
export class ZardCardTitleComponent {
  readonly class = input<ClassValue>("");
  readonly zTitle = input<string | TemplateRef<void>>();

  protected readonly classes = computed(() =>
    mergeClasses(cardTitleVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zCardDescription",
  host: {
    "[class]": "classes()",
    "data-slot": "card-description",
  },
  imports: [ZardStringTemplateOutletDirective],
  selector: "z-card-description, [z-card-description]",
  template: `
    @let description = zDescription();
    <ng-container *zStringTemplateOutlet="description">{{ description }}</ng-container>
  `,
})
export class ZardCardDescriptionComponent {
  readonly class = input<ClassValue>("");
  readonly zDescription = input<string | TemplateRef<void>>();

  protected readonly classes = computed(() =>
    mergeClasses(cardDescriptionVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zCardAction",
  host: {
    "[class]": "classes()",
    "data-slot": "card-action",
  },
  selector: "z-card-action, [z-card-action]",
  template: `
    <ng-content />
  `,
})
export class ZardCardActionComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(cardActionVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zCardHeader",
  host: {
    "[class]": "classes()",
    "data-slot": "card-header",
  },
  selector: "z-card-header, [z-card-header]",
  template: `
    <ng-content />
  `,
})
export class ZardCardHeaderComponent {
  readonly class = input<ClassValue>("");
  readonly zHeaderBorder = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    mergeClasses(
      cardHeaderVariants(),
      this.zHeaderBorder() ? "border-b" : "",
      this.class()
    )
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zCardContent",
  host: {
    "[class]": "classes()",
    "data-slot": "card-content",
  },
  selector: "z-card-content, [z-card-content]",
  template: `
    <ng-content />
  `,
})
export class ZardCardContentComponent {
  readonly class = input<ClassValue>("");

  protected readonly classes = computed(() =>
    mergeClasses(cardContentVariants(), this.class())
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zCardFooter",
  host: {
    "[class]": "classes()",
    "data-slot": "card-footer",
  },
  selector: "z-card-footer, [z-card-footer]",
  template: `
    <ng-content />
  `,
})
export class ZardCardFooterComponent {
  readonly class = input<ClassValue>("");
  readonly zFooterBorder = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    mergeClasses(
      cardFooterVariants(),
      this.zFooterBorder() ? "border-t" : "",
      this.class()
    )
  );
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: "zCard",
  host: {
    "[attr.data-size]": "zSize()",
    "[class]": "classes()",
    "data-slot": "card",
  },
  selector: "z-card, [z-card]",
  template: `
    <ng-content />
  `,
})
export class ZardCardComponent {
  readonly class = input<ClassValue>("");
  readonly zSize = input<ZardCardSizeType>("default");

  protected readonly classes = computed(() =>
    mergeClasses(cardVariants(), this.class())
  );
}
