import { httpResource } from "@angular/common/http";
import { Component, computed, inject, input, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucidePencil, lucideTriangleAlert } from "@ng-icons/lucide";
import { ZardTableImports } from "@/shared/components/table/table.imports";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { DocumentsSection } from "../shared/ui/documents-section";
import { FICHE_PAGE_IMPORTS } from "../shared/ui/fiche-page";
import { enumToSelectOptions } from "../shared/ui/field-select";
import { statutOptionsFrom } from "../shared/ui/list-filter";
import { statutIconForValue } from "../shared/ui/list-statut-filter";
import {
  chauffeurDisponibiliteIcon,
  chauffeurStatutIcon,
} from "../shared/ui/list-statut-icons";
import { StatutChip } from "../shared/ui/statut-chip";
import { ToastService } from "../shared/ui/toast";
import type { Site } from "../sites/site";
import { voyageStatutTone } from "../tableau/apercu";
import {
  affectationRoleLabel,
  formatInstant,
  statutVoyageLabel,
  type Voyage,
} from "../voyages/voyage";
import {
  alertesChauffeur,
  CHAUFFEUR_DISPONIBILITES,
  CHAUFFEUR_STATUTS,
  type Chauffeur,
  type ChauffeurDisponibilite,
  type ChauffeurStatut,
  chauffeurDisponibiliteLabel,
  chauffeurDisponibiliteTone,
  chauffeurStatutLabel,
  chauffeurStatutTone,
  etatValidite,
  etatValiditeLabel,
  etatValiditeTone,
  formatChauffeurDate,
  formatSoldeConduite,
  habilitationLabel,
  typeContratLabel,
} from "./chauffeur";
import { ChauffeurApi } from "./chauffeur-api";

@Component({
  imports: [
    NgIcon,
    RouterLink,
    StatutChip,
    DocumentsSection,
    ...FICHE_PAGE_IMPORTS,
    ...ZardTableImports,
  ],
  selector: "app-chauffeur-detail-page",
  templateUrl: "./chauffeur-detail-page.html",
  viewProviders: [provideIcons({ lucidePencil, lucideTriangleAlert })],
})
export class ChauffeurDetailPage {
  private readonly api = inject(ChauffeurApi);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  protected readonly chauffeurStatutLabel = chauffeurStatutLabel;
  protected readonly chauffeurStatutTone = chauffeurStatutTone;
  protected readonly chauffeurDisponibiliteLabel = chauffeurDisponibiliteLabel;
  protected readonly chauffeurDisponibiliteTone = chauffeurDisponibiliteTone;
  protected readonly formatChauffeurDate = formatChauffeurDate;
  protected readonly formatSoldeConduite = formatSoldeConduite;
  protected readonly habilitationLabel = habilitationLabel;
  protected readonly typeContratLabel = typeContratLabel;
  protected readonly etatValiditeLabel = etatValiditeLabel;
  protected readonly etatValiditeTone = etatValiditeTone;
  protected readonly formatInstant = formatInstant;
  protected readonly statutVoyageLabel = statutVoyageLabel;
  protected readonly voyageStatutTone = voyageStatutTone;
  protected readonly affectationRoleLabel = affectationRoleLabel;

  protected readonly statutOptions = enumToSelectOptions(
    CHAUFFEUR_STATUTS,
    chauffeurStatutLabel
  );
  protected readonly disponibiliteOptions = enumToSelectOptions(
    CHAUFFEUR_DISPONIBILITES,
    chauffeurDisponibiliteLabel
  );
  private readonly disponibiliteChipOptions = statutOptionsFrom(
    CHAUFFEUR_DISPONIBILITES,
    chauffeurDisponibiliteLabel,
    chauffeurDisponibiliteIcon
  );
  private readonly statutChipOptions = statutOptionsFrom(
    CHAUFFEUR_STATUTS,
    chauffeurStatutLabel,
    chauffeurStatutIcon
  );

  protected readonly aujourdhui = new Date();
  protected readonly actionError = signal<string | null>(null);

  protected readonly chauffeur = httpResource<Chauffeur>(() => ({
    url: `${environment.apiBaseUrl}/chauffeurs/${this.id()}`,
  }));

  protected readonly site = httpResource<Site>(() => {
    const siteId = this.chauffeur.value()?.siteRattachementId;
    return siteId
      ? { url: `${environment.apiBaseUrl}/sites/${siteId}` }
      : undefined;
  });

  protected readonly voyages = httpResource<PageResponse<Voyage>>(() => ({
    params: { chauffeurId: this.id() },
    url: `${environment.apiBaseUrl}/voyages`,
  }));

  protected readonly loadError = computed(() =>
    httpErrorMessage(this.chauffeur.error())
  );

  protected readonly alertes = computed(() => {
    const chauffeur = this.chauffeur.value();
    return chauffeur ? alertesChauffeur(chauffeur, this.aujourdhui) : [];
  });

  protected etat(dateExpiration: string | null) {
    return etatValidite(dateExpiration, this.aujourdhui);
  }

  protected disponibiliteChipIcon(disponibilite: string): string | null {
    return statutIconForValue(this.disponibiliteChipOptions, disponibilite);
  }

  protected statutChipIcon(statut: string): string | null {
    return statutIconForValue(this.statutChipOptions, statut);
  }

  protected roleDans(voyage: Voyage): string {
    const affectation = voyage.affectations.find(
      (a) => a.chauffeurId === this.id()
    );
    return affectation ? affectationRoleLabel(affectation.role) : "—";
  }

  protected async changerStatut(valeur: string): Promise<void> {
    if (!(CHAUFFEUR_STATUTS as readonly string[]).includes(valeur)) {
      return;
    }
    await this.appliquer(
      () => this.api.changerStatut(this.id(), valeur as ChauffeurStatut),
      "Statut mis à jour."
    );
  }

  protected async changerDisponibilite(valeur: string): Promise<void> {
    if (!(CHAUFFEUR_DISPONIBILITES as readonly string[]).includes(valeur)) {
      return;
    }
    await this.appliquer(
      () =>
        this.api.changerDisponibilite(
          this.id(),
          valeur as ChauffeurDisponibilite
        ),
      "Disponibilité mise à jour."
    );
  }

  private async appliquer(
    action: () => Promise<Chauffeur>,
    message: string
  ): Promise<void> {
    this.actionError.set(null);
    try {
      const chauffeur = await action();
      this.chauffeur.set(chauffeur);
      this.toast.success(message);
    } catch (error) {
      this.actionError.set(httpErrorMessage(error));
    }
  }
}
