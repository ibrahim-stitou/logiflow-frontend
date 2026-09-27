import { Component, computed, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterLink } from "@angular/router";
import { filter } from "rxjs";
import type { ShellBreadcrumbRouteData } from "../core/nav/shell-breadcrumb-data";
import { ShellBreadcrumbStore } from "../core/nav/shell-breadcrumb-store";

export interface ShellBreadcrumbCrumb {
  current: boolean;
  label: string;
  path?: string;
}

@Component({
  imports: [RouterLink],
  selector: "app-shell-breadcrumb",
  styles: `
    :host {
      display: block;
      min-width: 0;
      flex: 1 1 auto;
    }

    .shell-breadcrumb {
      min-width: 0;
    }

    .shell-breadcrumb__list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.25rem 0.375rem;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: 0.875rem;
      line-height: 1.35;
    }

    .shell-breadcrumb__item {
      display: inline-flex;
      align-items: center;
      min-width: 0;
      max-width: 100%;
    }

    .shell-breadcrumb__item:not(:last-child)::after {
      content: "/";
      margin-left: 0.375rem;
      color: var(--color-muted);
      font-weight: 400;
    }

    .shell-breadcrumb__link {
      color: var(--color-muted);
      text-decoration: none;
      transition: color 120ms ease-out;
    }

    @media (hover: hover) and (pointer: fine) {
      .shell-breadcrumb__link:hover {
        color: var(--color-ink);
      }
    }

    .shell-breadcrumb__current {
      font-weight: 500;
      color: var(--color-ink);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
  template: `
    @if (crumbs().length > 0) {
    <nav aria-label="Fil d'Ariane" class="shell-breadcrumb">
      <ol class="shell-breadcrumb__list">
        @for (crumb of crumbs(); track crumb.label + (crumb.path ?? '')) {
        <li class="shell-breadcrumb__item">
          @if (!crumb.current && crumb.path) {
          <a class="shell-breadcrumb__link" [routerLink]="crumb.path">{{
            crumb.label
          }}</a>
          } @else {
          <span
            [attr.aria-current]="crumb.current ? 'page' : null"
            class="shell-breadcrumb__current"
            >{{ crumb.label }}</span
          >
          }
        </li>
        }
      </ol>
    </nav>
    }
  `,
})
export class ShellBreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly store = inject(ShellBreadcrumbStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly routeData = signal<ShellBreadcrumbRouteData | null>(null);

  constructor() {
    this.syncFromRouter();
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.store.clearLeaf();
        this.syncFromRouter();
      });
  }

  protected readonly crumbs = computed((): ShellBreadcrumbCrumb[] => {
    const data = this.routeData();
    if (!data) {
      return [];
    }

    const items: ShellBreadcrumbCrumb[] = data.trail.map((item, index) => {
      const isLastTrail = index === data.trail.length - 1;
      const hasLeaf = Boolean(data.leaf) || this.store.leafLabel() !== null;
      const current = isLastTrail && !hasLeaf;
      return {
        current,
        label: item.label,
        path: current ? undefined : item.path,
      };
    });

    const leaf = data.leaf ?? this.store.leafLabel();
    if (leaf) {
      if (items.length > 0) {
        const last = items.at(-1);
        if (last?.current) {
          items[items.length - 1] = {
            ...last,
            current: false,
            path: last.path ?? data.trail.at(-1)?.path,
          };
        }
      }
      items.push({ current: true, label: leaf });
    }

    return items;
  });

  private syncFromRouter(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const raw = route.data["shellBreadcrumb"] as
      | ShellBreadcrumbRouteData
      | undefined;
    this.routeData.set(raw ?? null);
  }
}
