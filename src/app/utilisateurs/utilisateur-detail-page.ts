import { httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { FormField, form, required, submit } from "@angular/forms/signals";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideCheck, lucideCircleOff } from "@ng-icons/lucide";
import { environment } from "../../environments/environment";
import { httpErrorMessage } from "../core/api/http-error";
import { type Role, roleLabel } from "../core/auth/role";
import { firstFieldError } from "../core/forms/first-field-error";
import { fieldClasses, showFieldError } from "../core/forms/show-field-error";
import { bindShellBreadcrumbLeaf } from "../core/nav/shell-breadcrumb-leaf";
import { FICHE_PAGE_IMPORTS } from "../shared/ui/fiche-page";
import {
  actifIcon,
  actifLabel,
  actifTone,
  StatutChip,
} from "../shared/ui/statut-chip";
import { ToastService } from "../shared/ui/toast";
import {
  draftToWrite,
  emptyUtilisateurDraft,
  UTILISATEUR_ROLES,
  type Utilisateur,
  utilisateurToDraft,
  withToggledRole,
} from "./utilisateur";
import { UtilisateurApi } from "./utilisateur-api";

@Component({
  imports: [FormField, NgIcon, StatutChip, ...FICHE_PAGE_IMPORTS],
  selector: "app-utilisateur-detail-page",
  templateUrl: "./utilisateur-detail-page.html",
  viewProviders: [provideIcons({ lucideCheck, lucideCircleOff })],
})
export class UtilisateurDetailPage {
  private readonly api = inject(UtilisateurApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  protected readonly actifIcon = actifIcon;
  protected readonly actifLabel = actifLabel;
  protected readonly actifTone = actifTone;
  protected readonly roles = UTILISATEUR_ROLES;
  protected readonly roleLabel = roleLabel;
  protected readonly firstFieldError = firstFieldError;
  protected readonly showFieldError = showFieldError;
  protected readonly fieldClasses = fieldClasses;
  protected readonly formError = signal<string | null>(null);
  protected readonly rolesTouched = signal(false);
  protected readonly deactivateError = signal<string | null>(null);

  protected readonly utilisateur = httpResource<Utilisateur>(() => ({
    url: `${environment.apiBaseUrl}/utilisateurs/${this.id()}`,
  }));

  protected readonly loadError = computed(() =>
    httpErrorMessage(this.utilisateur.error())
  );

  protected readonly draft = signal(emptyUtilisateurDraft());

  protected readonly editForm = form(this.draft, (path) => {
    required(path.email, { message: "L'email est obligatoire." });
  });

  private seededForId = "";

  constructor() {
    bindShellBreadcrumbLeaf(
      this.destroyRef,
      computed(() =>
        this.utilisateur.hasValue() ? this.utilisateur.value().login : null
      )
    );

    effect(() => {
      const id = this.id();
      const current = this.utilisateur.value();
      if (!current || current.id !== id || this.seededForId === id) {
        return;
      }
      this.seededForId = id;
      this.draft.set(utilisateurToDraft(current));
    });
  }

  protected toggleRole(role: Role, event: Event): void {
    const { target } = event;
    if (target instanceof HTMLInputElement) {
      this.draft.update((current) =>
        withToggledRole(current, role, target.checked)
      );
    }
  }

  protected async onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    this.rolesTouched.set(true);
    await submit(this.editForm, async () => {
      if (this.draft().roles.length === 0) {
        return;
      }
      try {
        const updated = await this.api.update(
          this.id(),
          draftToWrite(this.draft())
        );
        this.draft.set(utilisateurToDraft(updated));
        this.utilisateur.reload();
        this.toast.success("Utilisateur enregistré.");
      } catch (error) {
        // Second save 500s until UtilisateurRepositoryAdapter updates in
        // place (same pattern as VehiculeRepositoryAdapter).
        this.formError.set(httpErrorMessage(error));
      }
    });
  }

  protected async desactiver(): Promise<void> {
    this.deactivateError.set(null);
    try {
      await this.api.desactiver(this.id());
      this.seededForId = "";
      this.utilisateur.reload();
      this.toast.success("Utilisateur désactivé.");
    } catch (error) {
      // DELETE also save()s the aggregate — same optimistic-lock 500 after
      // an earlier PUT. Backend: in-place update in UtilisateurRepositoryAdapter.
      this.deactivateError.set(httpErrorMessage(error));
    }
  }
}
