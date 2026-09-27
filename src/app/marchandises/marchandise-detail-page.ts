import { httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCircleOff } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import { bindShellBreadcrumbLeaf } from "../core/nav/shell-breadcrumb-leaf";
import { FICHE_PAGE_IMPORTS } from "../shared/ui/fiche-page";
import {
  actifIcon,
  actifLabel,
  actifTone,
  StatutChip,
} from "../shared/ui/statut-chip";
import { ToastService } from "../shared/ui/toast";
import { gerbableLabel, type Marchandise } from "./marchandise";
import { MarchandiseApi } from "./marchandise-api";

@Component({
  imports: [NgIcon, StatutChip, ...FICHE_PAGE_IMPORTS],
  selector: "app-marchandise-detail-page",
  templateUrl: "./marchandise-detail-page.html",
  viewProviders: [provideIcons({ lucideCircleOff })],
})
export class MarchandiseDetailPage {
  private readonly api = inject(MarchandiseApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() =>
        this.marchandise.hasValue() ? this.marchandise.value().code : null
      )
    );
  }

  protected readonly actifIcon = actifIcon;
  protected readonly actifLabel = actifLabel;
  protected readonly actifTone = actifTone;
  protected readonly gerbableLabel = gerbableLabel;
  protected readonly deactivateError = signal<string | null>(null);

  protected readonly marchandise = httpResource<Marchandise>(() => ({
    url: `${environment.apiBaseUrl}/marchandises/${this.id()}`,
  }));

  protected readonly loadError = computed(() =>
    httpErrorMessage(this.marchandise.error())
  );

  protected async desactiver(): Promise<void> {
    this.deactivateError.set(null);
    try {
      await this.api.desactiver(this.id());
      this.marchandise.reload();
      this.toast.success("Marchandise désactivée.");
    } catch (error) {
      this.deactivateError.set(httpErrorMessage(error));
    }
  }
}
