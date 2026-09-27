import { Component, computed, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideLayoutDashboard, lucideLogOut } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import { roleLabel } from "../core/auth/role";
import { SessionUtilisateur } from "../core/auth/session";

@Component({
  imports: [NgIcon, RouterLink],
  providers: [provideIcons({ lucideLayoutDashboard, lucideLogOut })],
  selector: "app-acces-refuse-page",
  templateUrl: "./acces-refuse-page.html",
})
export class AccesRefusePage {
  private readonly session = inject(SessionUtilisateur);
  private readonly router = inject(Router);

  protected readonly roleName = computed(() => {
    const current = this.session.utilisateur();
    const role = current?.roles[0];
    return role ? roleLabel(role) : "inconnu";
  });

  protected readonly login = computed(
    () => this.session.utilisateur()?.login ?? ""
  );

  protected readonly hasSession = computed(() => this.session.isSignedIn());

  protected async signOut(): Promise<void> {
    await this.session.deconnecter();
    if (environment.auth.mode === "demo") {
      await this.router.navigateByUrl("/connexion");
    }
  }
}
