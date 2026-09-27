import {
  Directive,
  inject,
  input,
  model,
  type WritableSignal,
} from "@angular/core";
import { Router } from "@angular/router";

export interface ListKeyboardRow {
  id: string;
  path: string;
}

export function listKeyboardRows<T extends { id: string }>(
  items: readonly T[],
  pathOf: (item: T) => string
): ListKeyboardRow[] {
  return items.map((item) => ({ id: item.id, path: pathOf(item) }));
}

/** Keep keyboard focus on a visible row when the list changes. */
export function syncListKeyboardActiveId(
  rows: readonly ListKeyboardRow[],
  activeId: WritableSignal<string | null>
): void {
  if (rows.length === 0) {
    activeId.set(null);
    return;
  }
  const selected = activeId();
  if (selected === null || !rows.some((row) => row.id === selected)) {
    activeId.set(rows[0]?.id ?? null);
  }
}

/**
 * Arrow keys move the active list row; Enter opens its fiche.
 * Attach to a focusable wrapper around the table (`tabindex` on host).
 */
@Directive({
  host: {
    "(keydown)": "onKeydown($event)",
    class:
      "block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pine/40",
    role: "presentation",
    tabindex: "0",
  },
  selector: "[appListRowKeyboard]",
})
export class ListRowKeyboard {
  private readonly router = inject(Router);

  readonly rows = input.required<readonly ListKeyboardRow[]>();
  readonly activeId = model<string | null>(null);

  protected onKeydown(event: KeyboardEvent): void {
    const rows = this.rows();
    if (rows.length === 0) {
      return;
    }

    let index = rows.findIndex((row) => row.id === this.activeId());
    if (index < 0) {
      index = 0;
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        const next = Math.min(index + 1, rows.length - 1);
        this.activeId.set(rows[next]?.id ?? null);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const previous = Math.max(index - 1, 0);
        this.activeId.set(rows[previous]?.id ?? null);
        break;
      }
      case "Enter": {
        event.preventDefault();
        const row = rows[index];
        if (row) {
          void this.router.navigateByUrl(row.path);
        }
        break;
      }
      case "Home": {
        event.preventDefault();
        this.activeId.set(rows[0]?.id ?? null);
        break;
      }
      case "End": {
        event.preventDefault();
        this.activeId.set(rows.at(-1)?.id ?? null);
        break;
      }
      default:
        break;
    }
  }
}
