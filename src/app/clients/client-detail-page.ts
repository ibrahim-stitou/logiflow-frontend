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
import type { Client } from "./client";
import { ClientApi } from "./client-api";

@Component({
  imports: [NgIcon, StatutChip, ...FICHE_PAGE_IMPORTS],
  selector: "app-client-detail-page",
  templateUrl: "./client-detail-page.html",
  viewProviders: [provideIcons({ lucideCircleOff })],
})
export class ClientDetailPage {
  private readonly api = inject(ClientApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() => (this.client.hasValue() ? this.client.value().code : null))
    );
  }

  protected readonly actifIcon = actifIcon;
  protected readonly actifLabel = actifLabel;
  protected readonly actifTone = actifTone;
  protected readonly deactivateError = signal<string | null>(null);

  protected readonly client = httpResource<Client>(() => ({
    url: `${environment.apiBaseUrl}/clients/${this.id()}`,
  }));

  protected readonly loadError = computed(() =>
    httpErrorMessage(this.client.error())
  );

  protected async desactiver(): Promise<void> {
    this.deactivateError.set(null);
    try {
      await this.api.desactiver(this.id());
      this.client.reload();
      this.toast.success("Client désactivé.");
    } catch (error) {
      this.deactivateError.set(httpErrorMessage(error));
    }
  }
}
