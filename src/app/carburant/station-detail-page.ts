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
import { FormField, form, required, submit } from "@angular/forms/signals";
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
import { draftToMaj, type Station, stationToDraft } from "./station";
import { StationApi } from "./station-api";

@Component({
  imports: [FormField, NgIcon, StatutChip, ...FICHE_PAGE_IMPORTS],
  selector: "app-station-detail-page",
  templateUrl: "./station-detail-page.html",
  viewProviders: [provideIcons({ lucideCheck, lucideCircleOff })],
})
export class StationDetailPage {
  private readonly api = inject(StationApi);
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

  protected readonly station = httpResource<Station>(() => ({
    url: `${environment.apiBaseUrl}/stations/${this.id()}`,
  }));

  protected readonly draft = signal(
    stationToDraft({
      actif: true,
      adresse: null,
      code: "",
      id: "",
      libelle: "",
    })
  );

  protected readonly loadError = computed(() =>
    httpErrorMessage(this.station.error())
  );

  protected readonly editForm = form(this.draft, (path) => {
    required(path.libelle, { message: "Le libellé est obligatoire." });
  });

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() =>
        this.station.hasValue() ? this.station.value().code : null
      )
    );

    effect(() => {
      const current = this.station.value();
      if (current) {
        this.draft.set(stationToDraft(current));
      }
    });
  }

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    await submit(this.editForm, async () => {
      try {
        await this.api.update(this.id(), draftToMaj(this.draft()));
        this.toast.success("Station mise à jour.");
        this.station.reload();
      } catch (error) {
        this.formError.set(httpErrorMessage(error));
      }
    });
  }

  protected async desactiver(): Promise<void> {
    this.deactivateError.set(null);
    try {
      await this.api.deactivate(this.id());
      this.toast.success("Station désactivée.");
      this.station.reload();
    } catch (error) {
      this.deactivateError.set(httpErrorMessage(error));
    }
  }
}
