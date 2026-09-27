import { Component, inject, signal } from "@angular/core";
import { FormField, form, required, submit } from "@angular/forms/signals";
import { ActivatedRoute, Router } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideTruck } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import {
  DEMO_IDENTITIES,
  DEMO_PASSWORD,
  type DemoIdentity,
} from "../core/auth/demo-identity";
import { DemoSessionService } from "../core/auth/demo-session";
import { roleLabel } from "../core/auth/role";
import { SessionUtilisateur } from "../core/auth/session";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";

@Component({
  imports: [FormField, NgIcon],
  providers: [provideIcons({ lucideTruck })],
  selector: "app-sign-in-page",
  styleUrl: "./sign-in-page.css",
  templateUrl: "./sign-in-page.html",
})
export class SignInPage {
  private readonly session = inject(SessionUtilisateur);
  private readonly demoSession = inject(DemoSessionService, { optional: true });
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly keycloakMode = environment.auth.mode === "keycloak";
  protected readonly identities = DEMO_IDENTITIES;
  protected readonly demoPassword = DEMO_PASSWORD;
  protected readonly roleLabel = roleLabel;
  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly authError = signal<string | null>(null);
  protected readonly sessionExpiree = signal(
    this.route.snapshot.queryParamMap.get("expiree") === "1"
  );

  protected readonly credentials = signal({
    login: "",
    password: "",
  });

  protected readonly signInForm = form(this.credentials, (path) => {
    required(path.login, { message: "L'identifiant est obligatoire." });
    required(path.password, { message: "Le mot de passe est obligatoire." });
  });

  protected fillIdentity(identity: DemoIdentity): void {
    this.authError.set(null);
    this.credentials.set({
      login: identity.login,
      password: DEMO_PASSWORD,
    });
  }

  protected async onSso(): Promise<void> {
    this.authError.set(null);
    const retour =
      this.route.snapshot.queryParamMap.get("retour")?.trim() || "/";
    await this.session.connecter(retour.startsWith("/") ? retour : "/");
  }

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.authError.set(null);
    await submit(this.signInForm, async () => {
      const { login, password } = this.credentials();
      if (!this.demoSession) {
        return;
      }
      const accepted = this.demoSession.signIn(login, password);
      if (!accepted) {
        this.authError.set("Identifiant ou mot de passe incorrect.");
        return;
      }
      const retour =
        this.route.snapshot.queryParamMap.get("retour")?.trim() || "/";
      await this.router.navigateByUrl(retour.startsWith("/") ? retour : "/");
    });
  }
}
