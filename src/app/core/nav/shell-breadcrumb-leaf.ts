import { type DestroyRef, effect, inject, type Signal } from "@angular/core";
import { ShellBreadcrumbStore } from "./shell-breadcrumb-store";

/** Binds a fiche primary label to the shell breadcrumb leaf while the page is active. */
export function bindShellBreadcrumbLeaf(
  destroyRef: DestroyRef,
  label: Signal<string | null | undefined>
): void {
  const store = inject(ShellBreadcrumbStore);

  effect(() => {
    const value = label();
    store.setLeaf(value && value.length > 0 ? value : null);
  });

  destroyRef.onDestroy(() => {
    store.clearLeaf();
  });
}
