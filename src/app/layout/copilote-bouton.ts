import { Component, computed, inject } from "@angular/core";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideSparkles } from "@ng-icons/lucide";
import { afficherEtat } from "../ia/copilote";
import { CopiloteStore } from "../ia/copilote-store";
import { CopiloteSheetService } from "./copilote-sheet.service";

/**
 * Bouton « Copilote » du header. Ouvre le panneau via {@link CopiloteSheetService}
 * (Zard sheet) : le header a un backdrop-filter qui piégerait un élément `fixed`.
 */
@Component({
  imports: [NgIcon],
  providers: [provideIcons({ lucideSparkles })],
  selector: "app-copilote-bouton",
  styles: `
    .copilote-point {
      position: absolute;
      top: -0.1875rem;
      right: -0.1875rem;
      width: 0.5625rem;
      height: 0.5625rem;
      border: 2px solid var(--color-surface);
      border-radius: 999px;
    }
    .copilote-point--ok {
      background: var(--color-pine);
    }
    .copilote-point--degrade {
      background: var(--color-amber);
    }
    .copilote-point--hors_ligne {
      background: var(--color-brake);
    }
  `,
  template: `
    <button
      (click)="sheet.basculer()"
      [attr.aria-expanded]="store.ouvert()"
      aria-controls="app-copilote-panel"
      aria-haspopup="dialog"
      class="shell-pill shell-pill--copilote pressable relative shrink-0"
      id="app-copilote-bouton"
      type="button"
    >
      <ng-icon class="shell-pill-icon text-sm" name="lucideSparkles" />
      <span class="hidden sm:inline">Copilote</span>
      @if (niveau() !== "verification") {
        <span
          [attr.title]="etat().libelle"
          [class]="'copilote-point copilote-point--' + niveau()"
          aria-hidden="true"
        ></span>
      }
    </button>
  `,
})
export class CopiloteBouton {
  protected readonly store = inject(CopiloteStore);
  protected readonly sheet = inject(CopiloteSheetService);
  protected readonly etat = computed(() => afficherEtat(this.store.etat()));
  protected readonly niveau = computed(() => this.etat().niveau);
}
