import { Component, inject, type OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { OidcSecurityService } from "angular-auth-oidc-client";
import { firstValueFrom } from "rxjs";
import { lireRetourConnexion } from "../core/auth/auth-storage";

@Component({
  selector: "app-sign-in-callback-page",
  template: `<p class="p-6 text-sm text-muted">Connexion en cours…</p>`,
})
export class SignInCallbackPage implements OnInit {
  private readonly oidc = inject(OidcSecurityService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    const resultat = await firstValueFrom(this.oidc.checkAuth());
    const retour = lireRetourConnexion("/");
    if (resultat.isAuthenticated) {
      await this.router.navigateByUrl(retour);
      return;
    }
    await this.router.navigateByUrl("/connexion");
  }
}
