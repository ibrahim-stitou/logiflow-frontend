import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideCircleCheck,
  lucideCircleOff,
  lucideTag,
} from "@ng-icons/lucide";
import type { ApercuTone } from "../../tableau/apercu";
import { LIST_STATUT_FILTER_ICON_PROVIDERS } from "./list-statut-icons";

export type StatutTone = ApercuTone;

const TONE_CLASSES: Record<StatutTone, string> = {
  amber: "border-amber/25 bg-amber/10 text-amber",
  brake: "border-brake/20 bg-brake/10 text-brake",
  ink: "border-ink/15 bg-ink/5 text-ink",
  muted: "border-line bg-canvas text-muted",
  pine: "border-pine/20 bg-pine/10 text-pine",
};

export function statutChipClasses(tone: StatutTone): string {
  return `inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-medium tracking-wide ${TONE_CLASSES[tone]}`;
}

export function actifTone(actif: boolean): StatutTone {
  return actif ? "pine" : "muted";
}

export function actifLabel(actif: boolean): string {
  return actif ? "Actif" : "Inactif";
}

export function actifIcon(actif: boolean): string {
  return actif ? "lucideCircleCheck" : "lucideCircleOff";
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class]": "classes()",
  },
  imports: [NgIcon],
  selector: "app-statut-chip",
  styles: `
    :host {
      gap: 0.3125rem;
    }

    .statut-chip__icon {
      width: 0.8125rem;
      height: 0.8125rem;
      flex-shrink: 0;
      opacity: 0.9;
    }
  `,
  template: `
    @if (icon()) {
    <ng-icon [name]="icon()!" aria-hidden="true" class="statut-chip__icon" />
    }
    <span>{{ label() }}</span>
  `,
  viewProviders: [
    provideIcons({ lucideCircleCheck, lucideCircleOff, lucideTag }),
    LIST_STATUT_FILTER_ICON_PROVIDERS,
  ],
})
export class StatutChip {
  readonly label = input.required<string>();
  readonly tone = input<StatutTone>("muted");
  readonly icon = input<string | null>(null);

  protected readonly classes = computed(() => statutChipClasses(this.tone()));
}
