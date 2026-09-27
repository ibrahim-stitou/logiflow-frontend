import { Component, inject, signal } from "@angular/core";
import { FormField, form, required, submit } from "@angular/forms/signals";
import { Router, RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck } from "@ng-icons/lucide";
import { httpErrorMessage } from "../core/api/http-error";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import { FORM_PAGE_IMPORTS } from "../shared/ui/form-page";
import { ToastService } from "../shared/ui/toast";
import { draftToWrite, emptyClientDraft } from "./client";
import { ClientApi } from "./client-api";

@Component({
  imports: [FormField, NgIcon, RouterLink, ...FORM_PAGE_IMPORTS],
  selector: "app-client-create-page",
  templateUrl: "./client-create-page.html",
  viewProviders: [provideIcons({ lucideCheck })],
})
export class ClientCreatePage {
  private readonly api = inject(ClientApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly formError = signal<string | null>(null);

  protected readonly draft = signal(emptyClientDraft());

  protected readonly createForm = form(this.draft, (path) => {
    required(path.code, { message: "Le code est obligatoire." });
    required(path.raisonSociale, {
      message: "La raison sociale est obligatoire.",
    });
  });

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    await submit(this.createForm, async () => {
      try {
        const created = await this.api.create(draftToWrite(this.draft()));
        this.toast.success("Client créé.");
        await this.router.navigate(["/clients", created.id]);
      } catch (error) {
        this.formError.set(httpErrorMessage(error));
      }
    });
  }
}
