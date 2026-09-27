import { httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { DOSSIERS_PLAN_ROLES } from "../core/auth/role";
import { SessionUtilisateur } from "../core/auth/session";
import { bindShellBreadcrumbLeaf } from "../core/nav/shell-breadcrumb-leaf";
import { type Dossier, statutDossierLabel } from "../dossiers/dossier";
import {
  type Marchandise,
  marchandiseLabelFromLookup,
} from "../marchandises/marchandise";
import { FICHE_PAGE_IMPORTS } from "../shared/ui/fiche-page";
import { statutOptionsFrom } from "../shared/ui/list-filter";
import { statutIconForValue } from "../shared/ui/list-statut-filter";
import { commandeStatutIcon } from "../shared/ui/list-statut-icons";
import { StatutChip } from "../shared/ui/statut-chip";
import { ToastService } from "../shared/ui/toast";
import { commandeStatutTone } from "../tableau/apercu";
import {
  type Client,
  type Commande,
  formatClientLabel,
  formatDate,
  formatMoney,
  STATUT_COMMANDES,
  statutCommandeLabel,
} from "./commande";
import { CommandeApi } from "./commande-api";

@Component({
  imports: [RouterLink, StatutChip, ...FICHE_PAGE_IMPORTS],
  selector: "app-commande-detail-page",
  templateUrl: "./commande-detail-page.html",
})
export class CommandeDetailPage {
  private readonly api = inject(CommandeApi);
  private readonly session = inject(SessionUtilisateur);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() =>
        this.commande.hasValue() ? this.commande.value().reference : null
      )
    );
  }

  protected readonly formatClientLabel = formatClientLabel;
  protected readonly formatDate = formatDate;
  protected readonly formatMoney = formatMoney;
  protected readonly statutOptions = statutOptionsFrom(
    STATUT_COMMANDES,
    statutCommandeLabel,
    commandeStatutIcon
  );
  protected readonly statutCommandeLabel = statutCommandeLabel;
  protected readonly commandeStatutTone = commandeStatutTone;
  protected readonly statutDossierLabel = statutDossierLabel;

  protected statutChipIcon(statut: string): string | null {
    return statutIconForValue(this.statutOptions, statut);
  }

  protected readonly actionError = signal<string | null>(null);

  protected readonly canOpenDossier = computed(() =>
    this.session.hasAnyRole(DOSSIERS_PLAN_ROLES)
  );

  protected readonly commande = httpResource<Commande>(() => ({
    url: `${environment.apiBaseUrl}/commandes/${this.id()}`,
  }));

  protected readonly clients = httpResource<PageResponse<Client>>(() => ({
    params: { page: 0, size: 50 },
    url: `${environment.apiBaseUrl}/clients`,
  }));

  protected readonly client = computed(() => {
    const clientId = this.commande.value()?.clientId;
    if (!clientId) {
      return;
    }
    return this.clients.value()?.content.find((entry) => entry.id === clientId);
  });

  protected readonly marchandises = httpResource<PageResponse<Marchandise>>(
    () => ({
      params: { page: 0, size: 50 },
      url: `${environment.apiBaseUrl}/marchandises`,
    })
  );

  protected readonly marchandisesById = computed(() => {
    const map = new Map<string, Pick<Marchandise, "code" | "libelle">>();
    for (const marchandise of this.marchandises.value()?.content ?? []) {
      map.set(marchandise.id, marchandise);
    }
    return map;
  });

  protected readonly marchandiseLabel = (marchandiseId: string): string =>
    marchandiseLabelFromLookup(marchandiseId, this.marchandisesById());

  protected readonly dossiersLiees = httpResource<PageResponse<Dossier>>(
    () => ({
      params: { commandeId: this.id() },
      url: `${environment.apiBaseUrl}/dossiers`,
    })
  );

  protected readonly dossiersList = computed(
    () => this.dossiersLiees.value()?.content ?? []
  );

  protected readonly loadError = computed(() =>
    httpErrorMessage(this.commande.error())
  );

  protected async confirmer(): Promise<void> {
    this.actionError.set(null);
    try {
      await this.api.confirmer(this.id());
      this.commande.reload();
      this.toast.success("Commande confirmée.");
    } catch (error) {
      // Second save 500s until CommandeRepositoryAdapter updates in place.
      this.actionError.set(httpErrorMessage(error));
    }
  }

  protected async annuler(): Promise<void> {
    this.actionError.set(null);
    try {
      await this.api.annuler(this.id());
      this.commande.reload();
      this.toast.success("Commande annulée.");
    } catch (error) {
      // Annuler also save()s — same optimistic-lock 500 after an earlier
      // confirmer. Backend: in-place update in CommandeRepositoryAdapter.
      this.actionError.set(httpErrorMessage(error));
    }
  }
}
