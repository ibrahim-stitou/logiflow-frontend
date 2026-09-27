import { computed, inject, Service } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { OidcSecurityService } from "angular-auth-oidc-client";
import { firstValueFrom, of, switchMap } from "rxjs";
import {
  AUTH_BROADCAST_CHANNEL,
  clearAuthSessionStorage,
  enregistrerRetourConnexion,
} from "./auth-storage";
import { decoderPayloadJwt, lireRealmRoles } from "./jwt-payload";
import { isRole } from "./role";
import { SessionUtilisateur, type UtilisateurConnecte } from "./session";

@Service()
export class KeycloakSessionService extends SessionUtilisateur {
  private readonly oidc = inject(OidcSecurityService);

  private readonly etatAuth = toSignal(this.oidc.isAuthenticated$, {
    initialValue: {
      allConfigsAuthenticated: [],
      isAuthenticated: false,
    },
  });

  /** Re-fetch the access token whenever auth state changes (not a one-shot subscribe). */
  private readonly jetonAccesSignal = toSignal(
    this.oidc.isAuthenticated$.pipe(
      switchMap((etat) =>
        etat.isAuthenticated ? this.oidc.getAccessToken() : of("")
      )
    ),
    { initialValue: "" }
  );

  readonly isSignedIn = computed(() => this.etatAuth().isAuthenticated);

  readonly utilisateur = computed<UtilisateurConnecte | null>(() => {
    if (!this.isSignedIn()) {
      return null;
    }
    const claims = decoderPayloadJwt(this.jetonAccesSignal() || null);
    if (!claims) {
      return null;
    }
    const roles = lireRealmRoles(claims).filter(isRole);
    const login =
      typeof claims["preferred_username"] === "string"
        ? claims["preferred_username"]
        : "";
    const nom = typeof claims["name"] === "string" ? claims["name"] : null;
    return { login, nom, roles };
  });

  connecter(retour = "/"): Promise<void> {
    enregistrerRetourConnexion(retour);
    this.oidc.authorize();
    return Promise.resolve();
  }

  async deconnecter(): Promise<void> {
    clearAuthSessionStorage();
    if (typeof BroadcastChannel !== "undefined") {
      new BroadcastChannel(AUTH_BROADCAST_CHANNEL).postMessage("logout");
    }
    await firstValueFrom(this.oidc.logoffAndRevokeTokens());
  }

  async jetonAcces(): Promise<string | null> {
    const jeton = await firstValueFrom(this.oidc.getAccessToken());
    return jeton || null;
  }

  async forcerRenouvellement(): Promise<string | null> {
    await firstValueFrom(this.oidc.forceRefreshSession());
    return this.jetonAcces();
  }

  reauthentifierMfa(): void {
    this.oidc.authorize(undefined, {
      customParams: { prompt: "login" },
    });
  }
}
