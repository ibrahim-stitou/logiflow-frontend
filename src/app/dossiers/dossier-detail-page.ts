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
import { type Commande, commandeLabelFromLookup } from "../commandes/commande";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { DOSSIERS_PLAN_ROLES, VOYAGES_ALLOWED_ROLES } from "../core/auth/role";
import { SessionUtilisateur } from "../core/auth/session";
import { bindShellBreadcrumbLeaf } from "../core/nav/shell-breadcrumb-leaf";
import {
  type Marchandise,
  marchandiseLabelFromLookup,
} from "../marchandises/marchandise";
import { FICHE_PAGE_IMPORTS } from "../shared/ui/fiche-page";
import { statutOptionsFrom } from "../shared/ui/list-filter";
import { statutIconForValue } from "../shared/ui/list-statut-filter";
import { dossierStatutIcon } from "../shared/ui/list-statut-icons";
import { OpsTimeline } from "../shared/ui/ops-timeline";
import { StatutChip } from "../shared/ui/statut-chip";
import { ToastService } from "../shared/ui/toast";
import { dossierStatutTone } from "../tableau/apercu";
import { statutVoyageLabel } from "../voyages/voyage";
import {
  carrosserieRequiseLabel,
  type Dossier,
  type DossierLookupSite,
  formatInstant,
  formatWindow,
  manualNextStatuts,
  STATUT_DOSSIERS,
  type StatutDossier,
  siteLabelFromLookup,
  statutDocumentTransportLabel,
  statutDossierLabel,
  typeDocumentTransportLabel,
  typeSegmentLabel,
  typeTransportLabel,
} from "./dossier";
import { DossierApi } from "./dossier-api";
import { dossierTimelineEntries } from "./dossier-timeline";

const SITE_LOOKUP_PAGE_SIZE = 50;
const COMMANDE_LOOKUP_PAGE_SIZE = 50;
const MARCHANDISE_LOOKUP_PAGE_SIZE = 50;

interface VoyageLink {
  id: string;
  reference: string;
}

@Component({
  imports: [RouterLink, OpsTimeline, StatutChip, ...FICHE_PAGE_IMPORTS],
  selector: "app-dossier-detail-page",
  templateUrl: "./dossier-detail-page.html",
})
export class DossierDetailPage {
  private readonly api = inject(DossierApi);
  private readonly toast = inject(ToastService);
  private readonly session = inject(SessionUtilisateur);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() =>
        this.dossier.hasValue() ? this.dossier.value().reference : null
      )
    );
  }

  protected readonly carrosserieRequiseLabel = carrosserieRequiseLabel;
  protected readonly formatInstant = formatInstant;
  protected readonly formatWindow = formatWindow;
  protected readonly manualNextStatuts = manualNextStatuts;
  protected readonly statutOptions = statutOptionsFrom(
    STATUT_DOSSIERS,
    statutDossierLabel,
    dossierStatutIcon
  );
  protected readonly statutDossierLabel = statutDossierLabel;
  protected readonly statutDocumentTransportLabel =
    statutDocumentTransportLabel;
  protected readonly dossierStatutTone = dossierStatutTone;

  protected statutChipIcon(statut: string): string | null {
    return statutIconForValue(this.statutOptions, statut);
  }
  protected readonly statutVoyageLabel = statutVoyageLabel;
  protected readonly typeDocumentTransportLabel = typeDocumentTransportLabel;
  protected readonly typeSegmentLabel = typeSegmentLabel;
  protected readonly typeTransportLabel = typeTransportLabel;

  protected readonly canPlan = computed(() =>
    this.session.hasAnyRole(DOSSIERS_PLAN_ROLES)
  );

  protected readonly canOpenVoyages = computed(() =>
    this.session.hasAnyRole(VOYAGES_ALLOWED_ROLES)
  );

  protected readonly statutError = signal<string | null>(null);

  protected readonly dossier = httpResource<Dossier>(() => ({
    url: `${environment.apiBaseUrl}/dossiers/${this.id()}`,
  }));

  protected readonly voyagesPorteurs = httpResource<PageResponse<VoyageLink>>(
    () => {
      const dossier = this.dossier.value();
      if (dossier?.statut !== "PLANIFIE") {
        return;
      }
      return {
        params: { dossierId: this.id() },
        url: `${environment.apiBaseUrl}/voyages`,
      };
    }
  );

  protected readonly commandes = httpResource<PageResponse<Commande>>(() => ({
    params: { page: 0, q: "", size: COMMANDE_LOOKUP_PAGE_SIZE },
    url: `${environment.apiBaseUrl}/commandes`,
  }));

  protected readonly sites = httpResource<PageResponse<DossierLookupSite>>(
    () => ({
      params: { page: 0, q: "", size: SITE_LOOKUP_PAGE_SIZE },
      url: `${environment.apiBaseUrl}/sites`,
    })
  );

  protected readonly marchandises = httpResource<PageResponse<Marchandise>>(
    () => ({
      params: { page: 0, size: MARCHANDISE_LOOKUP_PAGE_SIZE },
      url: `${environment.apiBaseUrl}/marchandises`,
    })
  );

  protected readonly sitesById = computed(() => {
    const map = new Map<string, DossierLookupSite>();
    for (const site of this.sites.value()?.content ?? []) {
      map.set(site.id, site);
    }
    return map;
  });

  protected readonly commandesById = computed(() => {
    const map = new Map<string, Commande>();
    for (const commande of this.commandes.value()?.content ?? []) {
      map.set(commande.id, commande);
    }
    return map;
  });

  protected readonly marchandisesById = computed(() => {
    const map = new Map<string, Marchandise>();
    for (const marchandise of this.marchandises.value()?.content ?? []) {
      map.set(marchandise.id, marchandise);
    }
    return map;
  });

  protected readonly voyagesPorteursList = computed(
    () => this.voyagesPorteurs.value()?.content ?? []
  );

  protected readonly timelineEntries = computed(() => {
    const dossier = this.dossier.value();
    if (!dossier) {
      return [];
    }
    return dossierTimelineEntries(dossier);
  });

  protected readonly loadError = computed(() =>
    httpErrorMessage(this.dossier.error())
  );

  protected commandeLabel(commandeId: string): string {
    return commandeLabelFromLookup(commandeId, this.commandesById());
  }

  protected siteLabel(siteId: string): string {
    return siteLabelFromLookup(siteId, this.sitesById());
  }

  protected marchandiseLabel(marchandiseId: string): string {
    return marchandiseLabelFromLookup(marchandiseId, this.marchandisesById());
  }

  protected async changerStatut(valeur: StatutDossier): Promise<void> {
    this.statutError.set(null);
    try {
      await this.api.changerStatut(this.id(), valeur);
      this.dossier.reload();
      this.toast.success("Statut du dossier mis à jour.");
    } catch (error) {
      this.statutError.set(httpErrorMessage(error));
    }
  }
}
