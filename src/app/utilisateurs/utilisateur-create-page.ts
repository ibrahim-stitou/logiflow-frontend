import { Component, inject, signal } from "@angular/core";
import { FormField, form, required, submit } from "@angular/forms/signals";
import { Router, RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck } from "@ng-icons/lucide";
import { httpErrorMessage } from "../core/api/http-error";
import { type Role, roleLabel } from "../core/auth/role";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import { FORM_PAGE_IMPORTS } from "../shared/ui/form-page";
import { ToastService } from "../shared/ui/toast";
import {
  draftToWrite,
  emptyUtilisateurDraft,
  UTILISATEUR_ROLES,
  withToggledRole,
} from "./utilisateur";
import { UtilisateurApi } from "./utilisateur-api";

@Component({
  imports: [FormField, NgIcon, RouterLink, ...FORM_PAGE_IMPORTS],
  selector: "app-utilisateur-create-page",
  templateUrl: "./utilisateur-create-page.html",
  viewProviders: [provideIcons({ lucideCheck })],
})
export class UtilisateurCreatePage {
  private readonly api = inject(UtilisateurApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly roles = UTILISATEUR_ROLES;
  protected readonly roleLabel = roleLabel;
  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly formError = signal<string | null>(null);
  protected readonly rolesTouched = signal(false);

  protected readonly draft = signal(emptyUtilisateurDraft());

  protected readonly createForm = form(this.draft, (path) => {
    required(path.login, { message: "Le login est obligatoire." });
    required(path.email, { message: "L'email est obligatoire." });
  });

  protected toggleRole(role: Role, event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.draft.update((current) =>
        withToggledRole(current, role, target.checked)
      );
    }
  }

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    this.rolesTouched.set(true);
    await submit(this.createForm, async () => {
      if (this.draft().roles.length === 0) {
        return;
      }
      try {
        const created = await this.api.create(draftToWrite(this.draft()));
        this.toast.success("Utilisateur créé.");
        await this.router.navigate(["/utilisateurs", created.id]);
      } catch (error) {
        this.formError.set(httpErrorMessage(error));
      }
    });
  }
}
