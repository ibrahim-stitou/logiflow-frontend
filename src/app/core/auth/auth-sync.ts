import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { AUTH_BROADCAST_CHANNEL } from "./auth-storage";

/** Déconnexion synchronisée entre onglets (mode Keycloak). */
@Injectable({ providedIn: "root" })
export class AuthSyncService {
  private readonly router = inject(Router);

  init(): void {
    if (environment.auth.mode !== "keycloak") {
      return;
    }
    if (typeof BroadcastChannel === "undefined") {
      return;
    }
    const canal = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    canal.onmessage = (event: MessageEvent) => {
      if (event.data !== "logout") {
        return;
      }
      void this.router.navigateByUrl("/connexion");
    };
  }
}
