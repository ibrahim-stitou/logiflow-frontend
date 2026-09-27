import { Component, computed, inject, signal } from "@angular/core";
import {
  FormField,
  form,
  max,
  min,
  pattern,
  required,
  submit,
  validate,
} from "@angular/forms/signals";
import { Router, RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck } from "@ng-icons/lucide";
import { httpErrorMessage } from "../core/api/http-error";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import {
  enumToSelectOptions,
  withNoneSelectOption,
} from "../shared/ui/field-select";
import { FORM_PAGE_IMPORTS } from "../shared/ui/form-page";
import { ToastService } from "../shared/ui/toast";
import { computeVolumeUtileM3 } from "../vehicules/vehicule";
import {
  carrosserieLabel,
  draftToWrite,
  emptyRemorqueDraft,
  REMORQUE_CARROSSERIES,
  REMORQUE_TYPES,
  typeRemorqueLabel,
} from "./remorque";
import { RemorqueApi } from "./remorque-api";

const IMMAT_PATTERN = /^[A-Za-z]{2}-\d{3}-[A-Za-z]{2}$/;
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;
const CURRENT_YEAR = new Date().getFullYear();

@Component({
  imports: [FormField, NgIcon, RouterLink, ...FORM_PAGE_IMPORTS],
  selector: "app-remorque-create-page",
  templateUrl: "./remorque-create-page.html",
  viewProviders: [provideIcons({ lucideCheck })],
})
export class RemorqueCreatePage {
  private readonly api = inject(RemorqueApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly types = REMORQUE_TYPES;
  protected readonly typeOptions = withNoneSelectOption(
    "Non renseigné",
    enumToSelectOptions(REMORQUE_TYPES, typeRemorqueLabel)
  );
  protected readonly carrosserieSelectOptions = enumToSelectOptions(
    REMORQUE_CARROSSERIES,
    carrosserieLabel
  );
  protected readonly carrosseries = REMORQUE_CARROSSERIES;
  protected readonly typeRemorqueLabel = typeRemorqueLabel;
  protected readonly carrosserieLabel = carrosserieLabel;
  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly formError = signal<string | null>(null);

  protected readonly draft = signal(emptyRemorqueDraft());

  /** Volume utile calculé automatiquement : longueur × largeur × hauteur. */
  protected readonly volumeUtileCalcule = computed(() => {
    const draft = this.draft();
    return computeVolumeUtileM3(
      draft.longueurM,
      draft.largeurM,
      draft.hauteurM
    );
  });

  protected readonly createForm = form(this.draft, (path) => {
    required(path.immatriculation, {
      message: "L'immatriculation est obligatoire.",
    });
    pattern(path.immatriculation, IMMAT_PATTERN, {
      message: "Format attendu : AA-123-AA.",
    });
    required(path.carrosserie, { message: "La carrosserie est obligatoire." });

    validate(path.vin, (ctx) => {
      const vin = ctx.value().trim().toUpperCase();
      if (vin.length === 0) {
        return undefined;
      }
      if (!VIN_PATTERN.test(vin)) {
        return {
          kind: "vin",
          message: "VIN invalide : 17 caractères (sans I, O ni Q).",
        };
      }
      return undefined;
    });

    min(path.anneeFabrication, 1900, {
      message: "L'année semble trop ancienne.",
    });
    max(path.anneeFabrication, CURRENT_YEAR + 1, {
      message: "L'année ne peut pas être dans le futur.",
    });

    min(path.chargeUtileKg, 0, {
      message: "La charge utile ne peut pas être négative.",
    });
    min(path.poidsVideKg, 0, {
      message: "Le poids à vide ne peut pas être négatif.",
    });
    min(path.nbPositionsPalettes, 0, {
      message: "Le nombre de positions ne peut pas être négatif.",
    });
    min(path.longueurM, 0, {
      message: "La longueur ne peut pas être négative.",
    });
    min(path.largeurM, 0, {
      message: "La largeur ne peut pas être négative.",
    });
    min(path.hauteurM, 0, {
      message: "La hauteur ne peut pas être négative.",
    });

    validate(path.temperatureMax, (ctx) => {
      const minValue = ctx.valueOf(path.temperatureMin);
      const maxValue = ctx.value();
      if (typeof minValue !== "number" || typeof maxValue !== "number") {
        return undefined;
      }
      if (maxValue < minValue) {
        return {
          kind: "temperatureOrder",
          message: "La température max doit être ≥ à la température min.",
        };
      }
      return undefined;
    });
  });

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    await submit(this.createForm, async () => {
      try {
        const created = await this.api.create(draftToWrite(this.draft()));
        this.toast.success("Remorque créée.");
        await this.router.navigate(["/remorques", created.id]);
      } catch (error) {
        this.formError.set(httpErrorMessage(error));
      }
    });
  }
}
