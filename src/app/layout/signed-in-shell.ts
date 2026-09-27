import { CdkScrollable } from "@angular/cdk/scrolling";
import {
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideBuilding2,
  lucideClipboardList,
  lucideContainer,
  lucideFolderOpen,
  lucideFuel,
  lucideIdCard,
  lucideInbox,
  lucideLayoutDashboard,
  lucideMapPin,
  lucideMenu,
  lucidePackage,
  lucideRoute,
  lucideSearch,
  lucideTruck,
  lucideUsers,
  lucideWrench,
  lucideX,
} from "@ng-icons/lucide";
import { filter } from "rxjs";
import { environment } from "../../environments/environment";
import { roleLabel } from "../core/auth/role";
import { SessionUtilisateur } from "../core/auth/session";
import { DESTINATION_NAV_ICON, TABLEAU_NAV_ICON } from "../core/nav/nav-icon";
import {
  destinationNavGroupsForRoles,
  type WorkDestinationId,
} from "../core/nav/work-destination";
import { StatutChip, type StatutTone } from "../shared/ui/statut-chip";
import { ToastHost } from "../shared/ui/toast";
import type { ApercuTone } from "../tableau/apercu";
import {
  FILE_DU_JOUR_SECTION_ID,
  fileDuJourBadgeLabel,
} from "../tableau/file-du-jour";
import { FileDuJourStore } from "../tableau/file-du-jour-store";
import { CommandPaletteService } from "./command-palette.service";
import { CopiloteBouton } from "./copilote-bouton";
import { ShellBreadcrumbComponent } from "./shell-breadcrumb";

@Component({
  imports: [
    CdkScrollable,
    NgIcon,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ShellBreadcrumbComponent,
    ToastHost,
    CopiloteBouton,
    StatutChip,
  ],
  providers: [
    provideIcons({
      lucideBuilding2,
      lucideClipboardList,
      lucideContainer,
      lucideFolderOpen,
      lucideFuel,
      lucideIdCard,
      lucideInbox,
      lucideLayoutDashboard,
      lucideMapPin,
      lucideMenu,
      lucidePackage,
      lucideRoute,
      lucideSearch,
      lucideTruck,
      lucideUsers,
      lucideWrench,
      lucideX,
    }),
  ],
  selector: "app-signed-in-shell",
  styleUrl: "./signed-in-shell.css",
  templateUrl: "./signed-in-shell.html",
})
export class SignedInShell {
  private readonly session = inject(SessionUtilisateur);
  private readonly fileDuJourStore = inject(FileDuJourStore);
  private readonly commandPalette = inject(CommandPaletteService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mobileNavOpen = signal(false);
  protected readonly mobileNavInert = computed(
    () => !this.mobileNavOpen() && this.isMobileViewport()
  );
  protected readonly tableauIcon = TABLEAU_NAV_ICON;

  private readonly mobileViewport = signal(this.readMobileViewport());

  protected readonly login = computed(
    () => this.session.utilisateur()?.login ?? ""
  );

  protected readonly roleName = computed(() => {
    const role = this.session.utilisateur()?.roles[0];
    return role ? roleLabel(role) : "";
  });

  protected readonly navGroups = computed(() =>
    destinationNavGroupsForRoles(this.session.utilisateur()?.roles ?? [])
  );

  protected readonly fileDuJourSectionId = FILE_DU_JOUR_SECTION_ID;

  protected readonly showFileDuJourBadge = computed(
    () =>
      !this.fileDuJourStore.loading() &&
      this.fileDuJourStore.summary().totalCount > 0
  );

  protected readonly fileDuJourBadgeCount = computed(
    () => this.fileDuJourStore.summary().totalCount
  );

  protected readonly fileDuJourBadgeTone = computed((): StatutTone => {
    const tone: ApercuTone | null = this.fileDuJourStore.summary().topTone;
    return tone ?? "muted";
  });

  protected readonly fileDuJourBadgeAriaLabel = computed(() =>
    fileDuJourBadgeLabel(this.fileDuJourStore.summary())
  );

  constructor() {
    effect((onCleanup) => {
      const open = this.mobileNavOpen();
      const mobile = this.isMobileViewport();
      if (!mobile) {
        document.body.style.overflow = "";
        return;
      }
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = open ? "hidden" : "";
      onCleanup(() => {
        document.body.style.overflow = previousOverflow;
      });
    });

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.mobileNavOpen.set(false);
      });
  }

  private readMobileViewport(): boolean {
    return globalThis.matchMedia("(max-width: 767px)").matches;
  }

  private isMobileViewport(): boolean {
    return this.mobileViewport();
  }

  protected iconFor(id: WorkDestinationId): string {
    return DESTINATION_NAV_ICON[id];
  }

  protected openMobileNav(): void {
    this.mobileNavOpen.set(true);
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  protected openCommandPalette(): void {
    this.commandPalette.open();
  }

  protected async signOut(): Promise<void> {
    await this.session.deconnecter();
    if (environment.auth.mode === "demo") {
      await this.router.navigateByUrl("/connexion");
    }
  }

  @HostListener("window:resize")
  protected onWindowResize(): void {
    const mobile = this.readMobileViewport();
    this.mobileViewport.set(mobile);
    if (!mobile) {
      this.mobileNavOpen.set(false);
    }
  }

  @HostListener("document:keydown", ["$event"])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.mobileNavOpen()) {
      event.preventDefault();
      this.closeMobileNav();
      return;
    }

    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") {
      return;
    }
    event.preventDefault();
    this.openCommandPalette();
  }
}
