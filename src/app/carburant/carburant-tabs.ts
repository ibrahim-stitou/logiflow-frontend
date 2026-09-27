import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";

import {
  ZardTabComponent,
  ZardTabGroupComponent,
} from "@/shared/components/tabs";
import { SITES_ALLOWED_ROLES } from "../core/auth/role";
import { SessionUtilisateur } from "../core/auth/session";

@Component({
  imports: [ZardTabComponent, ZardTabGroupComponent],
  selector: "app-carburant-tabs",
  templateUrl: "./carburant-tabs.html",
})
export class CarburantTabs {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly session = inject(SessionUtilisateur);
  private readonly tabGroup = viewChild(ZardTabGroupComponent);

  protected readonly showStations = computed(() => {
    const roles = this.session.utilisateur()?.roles ?? [];
    return roles.some((role) => SITES_ALLOWED_ROLES.includes(role));
  });

  constructor() {
    const syncActiveTab = () => {
      const group = this.tabGroup();
      if (!group) {
        return;
      }
      group.selectTabByIndex(this.indexFromUrl(this.router.url));
    };

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => syncActiveTab());

    afterNextRender(() => syncActiveTab());
  }

  protected onTabChange(event: { index: number }): void {
    const target = event.index === 1 ? "/carburant/stations" : "/carburant";
    const [path] = this.router.url.split("?");
    if (path === target) {
      return;
    }
    void this.router.navigateByUrl(target);
  }

  private indexFromUrl(url: string): number {
    const [path] = url.split("?");
    if (
      path === "/carburant/stations" ||
      path.startsWith("/carburant/stations/")
    ) {
      return 1;
    }
    return 0;
  }
}
