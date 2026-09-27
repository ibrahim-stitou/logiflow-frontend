import { httpResource } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import {
  FormField,
  form,
  min,
  required,
  submit,
  validate,
} from "@angular/forms/signals";
import { Router, RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import { type Client, formatClientLabel } from "../clients/client";
import { httpErrorMessage } from "../core/api/http-error";
import type { PageResponse } from "../core/api/page-response";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import {
  formatMarchandiseLabel,
  type Marchandise,
} from "../marchandises/marchandise";
import type { FieldSelectOption } from "../shared/ui/field-select";
import { FORM_PAGE_IMPORTS } from "../shared/ui/form-page";
import { startOfToday } from "../shared/ui/iso-date";
import { ToastService } from "../shared/ui/toast";
import {
  type CommandeDraft,
  draftToWrite,
  emptyCommandeDraft,
  emptyLigneCommandeDraft,
  isDateTodayOrFuture,
  validateLignesCommande,
} from "./commande";
import { CommandeApi } from "./commande-api";

const LOOKUP_PAGE_SIZE = 50;

const CLIENT_SELECT_NEW = "__new_client__";

const clientsLookupRequest = {
  params: { page: 0, size: LOOKUP_PAGE_SIZE },
  url: `${environment.apiBaseUrl}/clients`,
};

const marchandisesLookupRequest = {
  params: { page: 0, size: LOOKUP_PAGE_SIZE },
  url: `${environment.apiBaseUrl}/marchandises`,
};

@Component({
  imports: [FormField, NgIcon, RouterLink, ...FORM_PAGE_IMPORTS],
  selector: "app-commande-create-page",
  templateUrl: "./commande-create-page.html",
  viewProviders: [provideIcons({ lucideCheck })],
})
export class CommandeCreatePage {
  private readonly api = inject(CommandeApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly formatMarchandiseLabel = formatMarchandiseLabel;
  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly formError = signal<string | null>(null);
  protected readonly lignesError = signal<string | null>(null);

  protected readonly clients = httpResource<PageResponse<Client>>(
    () => clientsLookupRequest
  );

  protected readonly marchandises = httpResource<PageResponse<Marchandise>>(
    () => marchandisesLookupRequest
  );

  protected readonly clientOptions = computed(() =>
    (this.clients.value()?.content ?? []).filter((client) => client.actif)
  );

  protected readonly clientSelectOptions = computed<
    readonly FieldSelectOption[]
  >(() => [
    ...this.clientOptions().map((client) => ({
      label: formatClientLabel(client),
      value: client.id,
    })),
    {
      label: "Créer un nouveau client…",
      value: CLIENT_SELECT_NEW,
    },
  ]);

  protected readonly clientSelectValue = computed(() =>
    this.draft().nouveauClient ? CLIENT_SELECT_NEW : this.draft().clientId
  );

  protected readonly clientsError = computed(() => {
    const error = this.clients.error();
    return error ? httpErrorMessage(error) : null;
  });

  protected readonly marchandiseOptions = computed(() =>
    (this.marchandises.value()?.content ?? []).filter(
      (marchandise) => marchandise.actif
    )
  );

  protected readonly marchandiseSelectOptions = computed<
    readonly FieldSelectOption[]
  >(() =>
    this.marchandiseOptions().map((marchandise) => ({
      label: formatMarchandiseLabel(marchandise),
      value: marchandise.id,
    }))
  );

  protected readonly marchandisesError = computed(() => {
    const error = this.marchandises.error();
    return error ? httpErrorMessage(error) : null;
  });

  protected readonly draft = signal(emptyCommandeDraft());
  protected readonly minDateSouhaitee = startOfToday();

  protected readonly createForm = form(this.draft, (path) => {
    required(path.clientId, {
      message: "Sélectionnez un client.",
      when: ({ valueOf: valeur }) => !valeur(path.nouveauClient),
    });
    required(path.clientCode, {
      message: "Le code client est obligatoire.",
      when: ({ valueOf: valeur }) => valeur(path.nouveauClient),
    });
    required(path.clientRaisonSociale, {
      message: "La raison sociale est obligatoire.",
      when: ({ valueOf: valeur }) => valeur(path.nouveauClient),
    });
    required(path.dateSouhaitee, {
      message: "La date souhaitée est obligatoire.",
    });
    validate(path.dateSouhaitee, (ctx) => {
      const value = ctx.value();
      if (value.length === 0 || isDateTodayOrFuture(value)) {
        return;
      }
      return {
        kind: "datePast",
        message: "La date souhaitée ne peut pas être dans le passé.",
      };
    });
    required(path.montant, { message: "Le prix négocié est obligatoire." });
    min(path.montant, 0, { message: "Le montant ne peut pas être négatif." });
  });

  protected onClientSelectChange(value: string): void {
    if (value === CLIENT_SELECT_NEW) {
      this.draft.update((current) => ({
        ...current,
        clientCode: "",
        clientId: "",
        clientRaisonSociale: "",
        nouveauClient: true,
      }));
      return;
    }

    this.draft.update((current) => ({
      ...current,
      clientCode: "",
      clientId: value,
      clientRaisonSociale: "",
      nouveauClient: false,
    }));
  }

  protected updateLigneMarchandise(index: number, marchandiseId: string): void {
    this.draft.update((current) => ({
      ...current,
      lignes: current.lignes.map((ligne, ligneIndex) =>
        ligneIndex === index ? { ...ligne, marchandiseId } : ligne
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

  protected addLigne(): void {
    this.lignesError.set(null);
    this.draft.update((current) => ({
      ...current,
      lignes: [...current.lignes, emptyLigneCommandeDraft()],
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
    this.lignesError.set(null);

    const lignesValidation = validateLignesCommande(this.draft().lignes);
    if (lignesValidation) {
      this.lignesError.set(lignesValidation);
      return;
    }

    await submit(this.createForm, async () => {
      const draft = this.draft();
      try {
        const clientId = await this.resolveClientId(draft);
        const created = await this.api.create(draftToWrite(draft, clientId));
        this.toast.success("Commande créée.");
        await this.router.navigate(["/commandes", created.id]);
      } catch (error) {
        this.formError.set(httpErrorMessage(error));
      }
    });
  }

  private async resolveClientId(draft: CommandeDraft): Promise<string> {
    if (!draft.nouveauClient) {
      return draft.clientId.trim();
    }
    const client = await this.api.createClient({
      code: draft.clientCode.trim().toUpperCase(),
      raisonSociale: draft.clientRaisonSociale.trim(),
    });
    return client.id;
  }
}
