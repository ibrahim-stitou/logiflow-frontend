import { inject, Injectable, Injector } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter, take } from "rxjs";
import { CopiloteStore } from "../ia/copilote-store";
import { ZardSheetService } from "@/shared/components/sheet/sheet.service";
import type { ZardSheetRef } from "@/shared/components/sheet/sheet-ref";
import { CopilotePanel } from "./copilote-panel";

/**
 * Ouvre le copilote dans un {@link ZardSheetService} (panneau droit) :
 * Escape, croix et clic sur le masque ferment le sheet et synchronisent le store.
 */
@Injectable({ providedIn: "root" })
export class CopiloteSheetService {
  private readonly sheets = inject(ZardSheetService);
  private readonly store = inject(CopiloteStore);
  private readonly injector = inject(Injector);
  private ref: ZardSheetRef<CopilotePanel> | null = null;

  basculer(): void {
    if (this.store.ouvert()) {
      this.fermer();
      return;
    }
    this.ouvrir();
  }

  ouvrir(): void {
    if (this.ref !== null && !this.ref.isClosing()) {
      return;
    }

    this.store.ouvrirPanneau();

    const ref = this.sheets.create({
      zClosable: true,
      zContent: CopilotePanel,
      zHideFooter: true,
      zMaskClosable: true,
      zOkText: null,
      zCancelText: null,
      zSide: "right",
      zWidth: "min(52rem, 100vw)",
      zCustomClasses:
        "h-dvh max-h-dvh min-h-0 gap-0 overflow-hidden p-0 shadow-lg [&_main]:flex [&_main]:min-h-0 [&_main]:flex-1 [&_main]:flex-col [&_main]:gap-0 [&_main]:space-y-0 [&_main]:overflow-hidden [&_main>app-copilote-panel]:flex [&_main>app-copilote-panel]:min-h-0 [&_main>app-copilote-panel]:flex-1 [&_main>app-copilote-panel]:overflow-hidden",
      zOnCancel: () => {
        this.syncClosed(ref);
      },
    });

    this.ref = ref;
    toObservable(ref.isClosing, { injector: this.injector })
      .pipe(
        filter((closing) => closing),
        take(1)
      )
      .subscribe(() => this.syncClosed(ref));
  }

  fermer(): void {
    const ref = this.ref;
    if (ref !== null && !ref.isClosing()) {
      ref.close();
      return;
    }
    this.store.fermer();
    this.ref = null;
  }

  private syncClosed(ref: ZardSheetRef<CopilotePanel>): void {
    if (this.ref === ref) {
      this.ref = null;
    }
    this.store.fermer();
    document.getElementById("app-copilote-bouton")?.focus();
  }
}
