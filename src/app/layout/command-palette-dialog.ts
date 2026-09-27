import {
  type AfterViewInit,
  Component,
  computed,
  type ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideArrowRight,
  lucideCornerDownLeft,
  lucideSearch,
} from "@ng-icons/lucide";
import { ZardDialogRef } from "@/shared/components/dialog/dialog-ref";
import { SessionUtilisateur } from "../core/auth/session";
import { PaletteEntitySearchStore } from "../core/nav/palette-entity-search-store";
import {
  filterPaletteItems,
  type PaletteItem,
  type PaletteSection,
  paletteItemsForRoles,
} from "../core/nav/palette-items";

interface PaletteListGroup {
  entries: readonly { item: PaletteItem; index: number }[];
  section: PaletteSection;
}

@Component({
  imports: [NgIcon],
  selector: "app-command-palette-dialog",
  styles: `
    :host {
      display: block;
    }

    .command-palette {
      display: flex;
      flex-direction: column;
      max-height: min(28rem, calc(100dvh - 6rem));
      background: var(--color-surface);
    }

    .command-palette__search-wrap {
      flex-shrink: 0;
      padding: 0.75rem 0.75rem 0.625rem;
      border-bottom: 1px solid
        color-mix(in oklch, var(--color-line) 70%, transparent);
    }

    .command-palette__search {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      height: 2.5rem;
      padding-inline: 0.75rem;
      background: var(--color-canvas);
      border: 1px solid color-mix(in oklch, var(--color-line) 85%, transparent);
      border-radius: var(--radius-lg);
      box-shadow: inset 0 1px 2px oklch(0 0 0 / 0.03);
      transition: border-color 150ms cubic-bezier(0.2, 0, 0, 1),
        box-shadow 150ms cubic-bezier(0.2, 0, 0, 1);
    }

    .command-palette__search:focus-within {
      border-color: color-mix(in oklch, var(--color-pine) 45%, var(--color-line));
      box-shadow:
        inset 0 1px 2px oklch(0 0 0 / 0.03),
        0 0 0 3px color-mix(in oklch, var(--color-pine) 12%, transparent);
    }

    .command-palette__search-icon {
      flex-shrink: 0;
      width: 1rem;
      height: 1rem;
      color: var(--color-muted);
    }

    .command-palette__input {
      min-width: 0;
      flex: 1;
      border: 0;
      background: transparent;
      font-size: 0.875rem;
      line-height: 1.35;
      color: var(--color-ink);
      outline: none;
    }

    .command-palette__input::placeholder {
      color: var(--color-muted);
    }

    .command-palette__scroller {
      flex: 1;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 0.5rem 0.75rem 0.375rem;
      -webkit-overflow-scrolling: touch;
    }

    .command-palette__divider {
      height: 1px;
      margin: 0.375rem 0 0.5rem;
      background: color-mix(in oklch, var(--color-line) 70%, transparent);
    }

    .command-palette__section-label {
      margin: 0 0 0.25rem;
      padding: 0 0.375rem;
      font-size: 0.6875rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-muted);
    }

    .command-palette__group {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .command-palette__item {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 0.125rem;
      padding: 0.5rem 0.625rem;
      font-size: 0.875rem;
      line-height: 1.35;
      text-align: left;
      color: var(--color-ink);
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      transition: background-color 120ms cubic-bezier(0.2, 0, 0, 1),
        border-color 120ms cubic-bezier(0.2, 0, 0, 1),
        color 120ms cubic-bezier(0.2, 0, 0, 1);
    }

    @media (hover: hover) and (pointer: fine) {
      .command-palette__item:hover {
        background: color-mix(in oklch, var(--color-pine) 5%, var(--color-canvas));
      }
    }

    .command-palette__item.is-active {
      color: var(--color-ink);
      background: var(--color-canvas);
      border-color: color-mix(in oklch, var(--color-line) 90%, transparent);
      box-shadow: 0 1px 2px oklch(0 0 0 / 0.04);
    }

    .command-palette__item-arrow {
      flex-shrink: 0;
      width: 0.875rem;
      height: 0.875rem;
      color: var(--color-muted);
      opacity: 0.85;
    }

    .command-palette__item.is-active .command-palette__item-arrow {
      color: var(--color-pine);
      opacity: 1;
    }

    .command-palette__item-label {
      min-width: 0;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .command-palette__item-badge {
      flex-shrink: 0;
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: 0.65rem;
      color: var(--color-muted);
    }

    .command-palette__empty,
    .command-palette__loading {
      margin: 0;
      padding: 1rem 0.375rem;
      font-size: 0.875rem;
      color: var(--color-muted);
    }

    .command-palette__footer {
      display: flex;
      flex-shrink: 0;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem 1rem;
      padding: 0.5rem 0.75rem 0.625rem;
      border-top: 1px solid color-mix(in oklch, var(--color-line) 70%, transparent);
      background: color-mix(in oklch, var(--color-canvas) 40%, var(--color-surface));
    }

    .command-palette__hint {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--color-ink);
    }

    .command-palette__hint--muted {
      color: var(--color-muted);
    }

    .command-palette__kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.375rem;
      height: 1.25rem;
      padding-inline: 0.25rem;
      font-family: inherit;
      font-size: 0.65rem;
      font-weight: 500;
      line-height: 1;
      color: var(--color-muted);
      background: var(--color-surface);
      border: 1px solid color-mix(in oklch, var(--color-line) 85%, transparent);
      border-radius: calc(var(--radius-md) - 4px);
      box-shadow: 0 1px 0 oklch(0 0 0 / 0.04);
    }

    .command-palette__kbd ng-icon {
      width: 0.75rem;
      height: 0.75rem;
    }
  `,
  template: `
    <div class="command-palette">
      <div class="command-palette__search-wrap">
        <label class="sr-only" for="command-palette-input"
          >Aller à un module, une action ou une référence</label
        >
        <div class="command-palette__search">
          <ng-icon
            aria-hidden="true"
            class="command-palette__search-icon"
            name="lucideSearch"
          />
          <input
            #queryInput
            (input)="onInput($event)"
            (keydown)="onKeydown($event)"
            [value]="query()"
            autocomplete="off"
            class="command-palette__input"
            id="command-palette-input"
            placeholder="Rechercher…"
            type="search"
          />
        </div>
      </div>

      <div
        #listScroller
        class="command-palette__scroller"
        id="command-palette-list"
        role="listbox"
      >
        @if (filteredTargets().length === 0) {
        <p class="command-palette__empty" role="status">
          @if (entityLoading()) {
          Recherche…
          } @else {
          Aucun résultat.
          }
        </p>
        } @else {
        @for (group of listGroups(); track group.section; let gi = $index) {
        @if (gi > 0) {
        <div aria-hidden="true" class="command-palette__divider"></div>
        }
        <p class="command-palette__section-label">{{ group.section }}</p>
        <ul class="command-palette__group">
          @for (entry of group.entries; track entry.item.kind + ':' + entry.item.path) {
          <li role="presentation">
            <button
              (click)="goTo(entry.item.path)"
              [attr.aria-selected]="activeIndex() === entry.index"
              [attr.data-palette-index]="entry.index"
              [class.is-active]="activeIndex() === entry.index"
              class="command-palette__item pressable"
              type="button"
              role="option"
            >
              <ng-icon
                aria-hidden="true"
                class="command-palette__item-arrow"
                name="lucideArrowRight"
              />
              <span class="command-palette__item-label">{{
                entry.item.label
              }}</span>
              @if (entry.item.badge; as badge) {
              <span class="command-palette__item-badge">{{ badge }}</span>
              }
            </button>
          </li>
          }
        </ul>
        }
        @if (entityLoading()) {
        <p class="command-palette__loading" role="status">
          Recherche de références…
        </p>
        }
        }
      </div>

      <footer class="command-palette__footer">
        <span class="command-palette__hint">
          <kbd class="command-palette__kbd">
            <ng-icon aria-hidden="true" name="lucideCornerDownLeft" />
          </kbd>
          <span>Aller à la page</span>
        </span>
        <span class="command-palette__hint command-palette__hint--muted">
          <kbd class="command-palette__kbd">Esc</kbd>
          <span>Fermer</span>
        </span>
      </footer>
    </div>
  `,
  viewProviders: [
    provideIcons({ lucideArrowRight, lucideCornerDownLeft, lucideSearch }),
  ],
})
export class CommandPaletteDialogComponent implements AfterViewInit {
  private readonly session = inject(SessionUtilisateur);
  private readonly paletteEntitySearch = inject(PaletteEntitySearchStore);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(
    ZardDialogRef<CommandPaletteDialogComponent>
  );

  private readonly queryInput =
    viewChild<ElementRef<HTMLInputElement>>("queryInput");
  private readonly listScroller =
    viewChild<ElementRef<HTMLElement>>("listScroller");

  protected readonly query = signal("");
  protected readonly activeIndex = signal(0);

  protected readonly paletteTargets = computed((): PaletteItem[] =>
    paletteItemsForRoles(this.session.utilisateur()?.roles ?? [])
  );

  protected readonly filteredTargets = computed(() => [
    ...filterPaletteItems(this.paletteTargets(), this.query()),
    ...this.paletteEntitySearch.items(),
  ]);

  protected readonly listGroups = computed((): PaletteListGroup[] => {
    const items = this.filteredTargets();
    const groups: PaletteListGroup[] = [];
    let current: PaletteListGroup | null = null;

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!current || current.section !== item.section) {
        current = { entries: [], section: item.section };
        groups.push(current);
      }
      current.entries = [...current.entries, { index, item }];
    }

    return groups;
  });

  protected readonly entityLoading = computed(() =>
    this.paletteEntitySearch.loading()
  );

  constructor() {
    effect(() => {
      const index = this.activeIndex();
      const scroller = this.listScroller()?.nativeElement;
      if (!scroller) {
        return;
      }
      const active = scroller.querySelector<HTMLElement>(
        `[data-palette-index="${index}"]`
      );
      active?.scrollIntoView({ block: "nearest" });
    });
  }

  ngAfterViewInit(): void {
    this.queryInput()?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.query.set(target.value);
    this.paletteEntitySearch.setQuery(target.value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const targets = this.filteredTargets();
    switch (event.key) {
      case "ArrowDown": {
        if (targets.length === 0) {
          return;
        }
        event.preventDefault();
        this.activeIndex.update((index) => (index + 1) % targets.length);
        break;
      }
      case "ArrowUp": {
        if (targets.length === 0) {
          return;
        }
        event.preventDefault();
        this.activeIndex.update(
          (index) => (index - 1 + targets.length) % targets.length
        );
        break;
      }
      case "Enter": {
        event.preventDefault();
        const target = targets[this.activeIndex()];
        if (target) {
          void this.goTo(target.path);
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        this.dialogRef.close();
        break;
      }
      default:
        break;
    }
  }

  protected async goTo(path: string): Promise<void> {
    this.paletteEntitySearch.clear();
    this.dialogRef.close();
    await this.router.navigateByUrl(path);
  }
}
