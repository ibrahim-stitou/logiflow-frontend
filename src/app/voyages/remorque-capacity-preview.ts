import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import {
  ZardCardComponent,
  ZardCardContentComponent,
  ZardCardDescriptionComponent,
  ZardCardHeaderComponent,
  ZardCardTitleComponent,
} from "@/shared/components/card/card.component";
import type { Dossier } from "../dossiers/dossier";
import type { RemorqueListItem } from "../remorques/remorque";
import { isFieldSelectNone } from "../shared/ui/field-select";
import type { Site } from "../sites/site";
import { RemorqueCapacityDisplay } from "./remorque-capacity-display";
import { buildCapacitePreview } from "./voyage-capacite-preview";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RemorqueCapacityDisplay,
    ZardCardComponent,
    ZardCardContentComponent,
    ZardCardDescriptionComponent,
    ZardCardHeaderComponent,
    ZardCardTitleComponent,
  ],
  selector: "app-remorque-capacity-preview",
  templateUrl: "./remorque-capacity-preview.html",
})
export class RemorqueCapacityPreview {
  readonly remorqueId = input<string | null>("");
  readonly remorqueOptions = input<readonly RemorqueListItem[]>([]);
  readonly dossierIds = input<readonly string[]>([]);
  readonly dossiersById = input<
    ReadonlyMap<string, Pick<Dossier, "poidsBrutKg" | "volumeM3" | "segments">>
  >(new Map());
  readonly sitesById = input<ReadonlyMap<string, Pick<Site, "libelle">>>(
    new Map()
  );

  protected readonly remorqueSelectionnee = computed(() => {
    const remorqueId = this.remorqueId();
    if (!remorqueId || isFieldSelectNone(remorqueId)) {
      return null;
    }
    return (
      this.remorqueOptions().find((remorque) => remorque.id === remorqueId) ??
      null
    );
  });

  protected readonly capacitePreview = computed(() => {
    const remorque = this.remorqueSelectionnee();
    if (!remorque) {
      return null;
    }
    return buildCapacitePreview(
      remorque.chargeUtileKg,
      remorque.volumeUtileM3,
      this.dossierIds(),
      this.dossiersById(),
      this.sitesById()
    );
  });

  protected readonly hint = computed(() => {
    if (!this.remorqueSelectionnee()) {
      return "Choisissez une remorque pour estimer la capacité.";
    }
    if (this.dossierIds().length === 0) {
      return "Sélectionnez au moins un dossier pour estimer la capacité.";
    }
    if (!this.capacitePreview()) {
      return "Au moins deux sites distincts (segments des dossiers) sont requis.";
    }
    return null;
  });
}
