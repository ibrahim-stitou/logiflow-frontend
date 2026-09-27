import { httpResource } from "@angular/common/http";
import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormField, form, min, required, submit } from "@angular/forms/signals";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import { type Commande, formatCommandeLabel } from "../commandes/commande";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import { validateTimeWindowEndAfterStart } from "../core/forms/time-window-validation";
import {
  formatMarchandiseLabel,
  type Marchandise,
} from "../marchandises/marchandise";
import {
  enumToSelectOptions,
  type FieldSelectOption,
  withNoneSelectOption,
} from "../shared/ui/field-select";
import { FORM_PAGE_IMPORTS } from "../shared/ui/form-page";
import { ToastService } from "../shared/ui/toast";
import {
  CARROSSERIES_REQUISES,
  carrosserieRequiseLabel,
  type DossierLookupSite,
  draftToWrite,
  emptyDossierDraft,
  emptyLigneMarchandiseDraft,
  formatSiteLabel,
  TYPE_TRANSPORTS,
  typeTransportLabel,
  validateLignesMarchandise,
} from "./dossier";
import { DossierApi } from "./dossier-api";

const LOOKUP_PAGE_SIZE = 50;

@Component({
  imports: [FormField, NgIcon, RouterLink, ...FORM_PAGE_IMPORTS],
  selector: "app-dossier-create-page",
  templateUrl: "./dossier-create-page.html",
  viewProviders: [provideIcons({ lucideCheck })],
})
export class DossierCreatePage {
  private readonly api = inject(DossierApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly types = TYPE_TRANSPORTS;
  protected readonly carrosseries = CARROSSERIES_REQUISES;
  protected readonly typeTransportLabel = typeTransportLabel;
  protected readonly carrosserieRequiseLabel = carrosserieRequiseLabel;
  protected readonly formatCommandeLabel = formatCommandeLabel;
  protected readonly formatMarchandiseLabel = formatMarchandiseLabel;
  protected readonly typeTransportOptions = enumToSelectOptions(
    TYPE_TRANSPORTS,
    typeTransportLabel
  );
  protected readonly carrosserieSelectOptions = withNoneSelectOption(
    "Aucune contrainte",
    enumToSelectOptions(CARROSSERIES_REQUISES, carrosserieRequiseLabel)
  );
  protected readonly formatSiteLabel = formatSiteLabel;
  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly formError = signal<string | null>(null);
  protected readonly lignesError = signal<string | null>(null);

  private lastPrefilledCommandeId = "";

  protected readonly draft = signal(
    emptyDossierDraft(this.route.snapshot.queryParamMap.get("commandeId") ?? "")
  );

  constructor() {
    effect(() => {
      const { commandeId } = this.draft();
      if (
        !(
          commandeId &&
          this.commandes.hasValue() &&
          this.marchandises.hasValue()
        )
      ) {
        if (!commandeId) {
          this.lastPrefilledCommandeId = "";
        }
        return;
      }
      if (commandeId === this.lastPrefilledCommandeId) {
        return;
      }
      this.lastPrefilledCommandeId = commandeId;
      this.applyCommandePrefill(commandeId);
    });
  }

  protected readonly createForm = form(this.draft, (path) => {
    required(path.commandeId, {
      message: "La commande confirmée est obligatoire.",
    });
    required(path.familleMarchandise, {
      message: "La famille de marchandise est obligatoire.",
    });
    required(path.chargementSiteId, {
      message: "Le site de chargement est obligatoire.",
    });
    required(path.dechargementSiteId, {
      message: "Le site de déchargement est obligatoire.",
    });
    min(path.nbPalettes, 0, {
      message: "Le nombre de palettes ne peut pas être négatif.",
    });
    required(path.chargementDebut, {
      message: "Le début de fenêtre de chargement est obligatoire.",
    });
    required(path.chargementFin, {
      message: "La fin de fenêtre de chargement est obligatoire.",
    });
    required(path.dechargementDebut, {
      message: "Le début de fenêtre de déchargement est obligatoire.",
    });
    required(path.dechargementFin, {
      message: "La fin de fenêtre de déchargement est obligatoire.",
    });
    validateTimeWindowEndAfterStart(
      path.chargementFin,
      path.chargementDebut,
      "La fin de chargement doit être postérieure au début."
    );
    validateTimeWindowEndAfterStart(
      path.dechargementFin,
      path.dechargementDebut,
      "La fin de déchargement doit être postérieure au début."
    );
  });

  protected readonly commandes = httpResource<PageResponse<Commande>>(() => ({
    params: { page: 0, size: LOOKUP_PAGE_SIZE },
    url: `${environment.apiBaseUrl}/commandes`,
  }));

  protected readonly sites = httpResource<PageResponse<DossierLookupSite>>(
    () => ({
      params: { page: 0, q: "", size: LOOKUP_PAGE_SIZE },
      url: `${environment.apiBaseUrl}/sites`,
    })
  );

  protected readonly marchandises = httpResource<PageResponse<Marchandise>>(
    () => ({
      params: { page: 0, size: LOOKUP_PAGE_SIZE },
      url: `${environment.apiBaseUrl}/marchandises`,
    })
  );

  protected readonly commandeOptions = computed(() =>
    (this.commandes.value()?.content ?? []).filter(
      (commande) => commande.statut === "CONFIRMEE"
    )
  );

  protected readonly siteOptions = computed(() =>
    (this.sites.value()?.content ?? []).filter((site) => site.actif)
  );

  protected readonly marchandiseOptions = computed(() =>
    (this.marchandises.value()?.content ?? []).filter(
      (marchandise) => marchandise.actif
    )
  );

  protected readonly commandeSelectOptions = computed<
    readonly FieldSelectOption[]
  >(() =>
    this.commandeOptions().map((commande) => ({
      label: formatCommandeLabel(commande),
      value: commande.id,
    }))
  );

  protected readonly siteSelectOptions = computed<readonly FieldSelectOption[]>(
    () =>
      this.siteOptions().map((site) => ({
        label: formatSiteLabel(site),
        value: site.id,
      }))
  );

  protected readonly marchandiseSelectOptions = computed<
    readonly FieldSelectOption[]
  >(() =>
    this.marchandiseOptions().map((marchandise) => ({
      label: formatMarchandiseLabel(marchandise),
      value: marchandise.id,
    }))
  );

  protected readonly marchandisesById = computed(() => {
    const map = new Map<string, Marchandise>();
    for (const marchandise of this.marchandises.value()?.content ?? []) {
      map.set(marchandise.id, marchandise);
    }
    return map;
  });

  protected readonly lookupsReady = computed(
    () =>
      this.commandes.hasValue() &&
      this.sites.hasValue() &&
      this.marchandises.hasValue()
  );

  protected readonly lookupsError = computed(() => {
    const commandeError = this.commandes.error();
    if (commandeError) {
      return httpErrorMessage(commandeError);
    }
    const siteError = this.sites.error();
    if (siteError) {
      return httpErrorMessage(siteError);
    }
    const marchandiseError = this.marchandises.error();
    return marchandiseError ? httpErrorMessage(marchandiseError) : null;
  });

  private applyCommandePrefill(commandeId: string): void {
    const commande = this.commandeOptions().find(
      (item) => item.id === commandeId
    );
    if (!commande || commande.lignes.length === 0) {
      return;
    }

    const lignes = commande.lignes.map((ligne) => {
      const marchandise = this.marchandisesById().get(ligne.marchandiseId);
      return {
        classeAdr: marchandise?.classeAdr ?? "",
        gerbable: marchandise?.gerbable ?? true,
        marchandiseId: ligne.marchandiseId,
        nbColis: ligne.nbColis,
        numeroOnu: marchandise?.numeroOnu ?? "",
        poidsKg: ligne.poidsKg,
        volumeM3: ligne.volumeM3,
      };
    });

    const firstMarchandise = this.marchandisesById().get(
      commande.lignes[0].marchandiseId
    );

    this.draft.update((current) => ({
      ...current,
      familleMarchandise:
        firstMarchandise?.famille?.trim() || current.familleMarchandise,
      lignes,
    }));
  }

  protected onGroupable(event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.draft.update((current) => ({
        ...current,
        groupable: target.checked,
      }));
    }
  }

  protected updateLigneMarchandise(index: number, marchandiseId: string): void {
    const marchandise = this.marchandisesById().get(marchandiseId);
    this.draft.update((current) => ({
      ...current,
      lignes: current.lignes.map((ligne, ligneIndex) =>
        ligneIndex === index
          ? {
              ...ligne,
              classeAdr: marchandise?.classeAdr ?? ligne.classeAdr,
              gerbable: marchandise?.gerbable ?? ligne.gerbable,
              marchandiseId,
              numeroOnu: marchandise?.numeroOnu ?? ligne.numeroOnu,
            }
          : ligne
      ),
    }));
  }

  protected updateLigneNumber(
    index: number,
    field: "poidsKg" | "volumeM3" | "nbColis",
    event: Event
  ): void {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const parsed = Number(target.value);
    if (Number.isNaN(parsed)) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      lignes: current.lignes.map((ligne, ligneIndex) =>
        ligneIndex === index ? { ...ligne, [field]: parsed } : ligne
      ),
    }));
  }

  protected updateLigneText(
    index: number,
    field: "classeAdr" | "numeroOnu",
    event: Event
  ): void {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      lignes: current.lignes.map((ligne, ligneIndex) =>
        ligneIndex === index ? { ...ligne, [field]: target.value } : ligne
      ),
    }));
  }

  protected onLigneGerbable(index: number, event: Event): void {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      lignes: current.lignes.map((ligne, ligneIndex) =>
        ligneIndex === index ? { ...ligne, gerbable: target.checked } : ligne
      ),
    }));
  }

  protected addLigne(): void {
    this.lignesError.set(null);
    this.draft.update((current) => ({
      ...current,
      lignes: [...current.lignes, emptyLigneMarchandiseDraft()],
    }));
  }

  protected removeLigne(index: number): void {
    this.lignesError.set(null);
    this.draft.update((current) => ({
      ...current,
      lignes:
        current.lignes.length <= 1
          ? current.lignes
          : current.lignes.filter((_, ligneIndex) => ligneIndex !== index),
    }));
  }

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    this.lignesError.set(validateLignesMarchandise(this.draft().lignes));

    await submit(this.createForm, async () => {
      if (this.lignesError()) {
        return;
      }
      try {
        const created = await this.api.create(draftToWrite(this.draft()));
        this.toast.success("Dossier créé.");
        await this.router.navigate(["/dossiers", created.id]);
      } catch (error) {
        this.formError.set(httpErrorMessage(error));
      }
    });
  }
}
