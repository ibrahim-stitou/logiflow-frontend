import { Injectable, inject } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter, take } from "rxjs";
import { ZardDialogService } from "@/shared/components/dialog/dialog.service";
import type { ZardDialogRef } from "@/shared/components/dialog/dialog-ref";
import { CommandPaletteDialogComponent } from "./command-palette-dialog";

@Injectable({ providedIn: "root" })
export class CommandPaletteService {
  private readonly dialog = inject(ZardDialogService);
  private openRef: ZardDialogRef<CommandPaletteDialogComponent> | null = null;

  open(): void {
    if (this.openRef !== null && !this.openRef.isClosing()) {
      return;
    }

    const ref = this.dialog.create({
      zClosable: false,
      zContent: CommandPaletteDialogComponent,
      zCustomClasses:
        "gap-0 overflow-hidden p-0 [&_main]:gap-0 [&_main]:space-y-0",
      zHideFooter: true,
      zHideHeader: true,
      zMaskClosable: true,
      zWidth: "min(26rem, calc(100vw - 2rem))",
    });

    this.openRef = ref;
    toObservable(ref.isClosing)
      .pipe(
        filter((closing) => closing),
        take(1)
      )
      .subscribe(() => {
        if (this.openRef === ref) {
          this.openRef = null;
        }
      });
  }
}
