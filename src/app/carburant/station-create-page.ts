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
import { draftToWrite, emptyStationDraft } from "./station";
import { StationApi } from "./station-api";

@Component({
  imports: [FormField, NgIcon, RouterLink, ...FORM_PAGE_IMPORTS],
  selector: "app-station-create-page",
  templateUrl: "./station-create-page.html",
  viewProviders: [provideIcons({ lucideCheck })],
})
export class StationCreatePage {
  private readonly api = inject(StationApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly formError = signal<string | null>(null);
  protected readonly draft = signal(emptyStationDraft());

  protected readonly createForm = form(this.draft, (path) => {
    required(path.code, { message: "Le code est obligatoire." });
    required(path.libelle, { message: "Le libellé est obligatoire." });
  });

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    await submit(this.createForm, async () => {
      try {
        const created = await this.api.create(draftToWrite(this.draft()));
        this.toast.success("Station créée.");
        await this.router.navigate(["/carburant/stations", created.id]);
      } catch (error) {
        this.formError.set(httpErrorMessage(error));
      }
    });
  }
}
