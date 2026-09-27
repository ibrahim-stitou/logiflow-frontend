import { httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import {
  FormField,
  form,
  max,
  min,
  required,
  submit,
} from "@angular/forms/signals";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck, lucideCircleOff } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import { bindShellBreadcrumbLeaf } from "../core/nav/shell-breadcrumb-leaf";
import { FICHE_PAGE_IMPORTS } from "../shared/ui/fiche-page";
import {
  actifIcon,
  actifLabel,
  actifTone,
  StatutChip,
} from "../shared/ui/statut-chip";
import { ToastService } from "../shared/ui/toast";
import { draftToWrite, emptySiteDraft, type Site, siteToDraft } from "./site";
import { SiteApi } from "./site-api";
import {
  type SiteLocalisationCoordinates,
  SiteLocalisationMap,
} from "./site-localisation-map";

@Component({
  imports: [
    FormField,
    NgIcon,
    SiteLocalisationMap,
    StatutChip,
    ...FICHE_PAGE_IMPORTS,
  ],
  selector: "app-site-detail-page",
  templateUrl: "./site-detail-page.html",
  viewProviders: [provideIcons({ lucideCheck, lucideCircleOff })],
})
export class SiteDetailPage {
  private readonly api = inject(SiteApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  protected readonly actifIcon = actifIcon;
  protected readonly actifLabel = actifLabel;
  protected readonly actifTone = actifTone;
  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly formError = signal<string | null>(null);
  protected readonly deactivateError = signal<string | null>(null);

  protected readonly site = httpResource<Site>(() => ({
    url: `${environment.apiBaseUrl}/sites/${this.id()}`,
  }));

  protected readonly loadError = computed(() =>
    httpErrorMessage(this.site.error())
  );

  protected readonly draft = signal(emptySiteDraft());

  protected readonly editForm = form(this.draft, (path) => {
    required(path.libelle, { message: "Le libellé est obligatoire." });
    min(path.latitude, -90, { message: "Latitude minimale : -90." });
    max(path.latitude, 90, { message: "Latitude maximale : 90." });
    min(path.longitude, -180, { message: "Longitude minimale : -180." });
    max(path.longitude, 180, { message: "Longitude maximale : 180." });
  });

  private seededForId = "";

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() => (this.site.hasValue() ? this.site.value().code : null))
    );

    effect(() => {
      const id = this.id();
      const current = this.site.value();
      if (!current || current.id !== id || this.seededForId === id) {
        return;
      }
      this.seededForId = id;
      this.draft.set(siteToDraft(current));
    });
  }

  protected onPoidsLourdChange(checked: boolean): void {
    this.draft.update((current) => ({
      ...current,
      interditPoidsLourd: checked,
    }));
  }

  protected onLocalisationChange(coords: SiteLocalisationCoordinates): void {
    this.draft.update((current) => ({
      ...current,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }));
  }

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    await submit(this.editForm, async () => {
      try {
        const updated = await this.api.update(
          this.id(),
          draftToWrite(this.draft())
        );
        this.draft.set(siteToDraft(updated));
        this.site.reload();
        this.toast.success("Site enregistré.");
      } catch (error) {
        // Second save 500s until SiteRepositoryAdapter updates in place
        // (same pattern as VehiculeRepositoryAdapter).
        this.formError.set(httpErrorMessage(error));
      }
    });
  }

  protected async desactiver(): Promise<void> {
    this.deactivateError.set(null);
    try {
      await this.api.desactiver(this.id());
      this.seededForId = "";
      this.site.reload();
      this.toast.success("Site désactivé.");
    } catch (error) {
      // DELETE also save()s the aggregate — same optimistic-lock 500 after
      // an earlier PUT. Backend: in-place update in SiteRepositoryAdapter.
      this.deactivateError.set(httpErrorMessage(error));
    }
  }
}
