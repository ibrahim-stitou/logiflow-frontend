import type { Signal } from "@angular/core";
import type { Role } from "./role";

export interface UtilisateurConnecte {
  /** Identifiant affiché (preferred_username en Keycloak, login en démo). */
  login: string;
  /** Nom complet si disponible. */
  nom: string | null;
  roles: readonly Role[];
}

/** Session utilisateur (démo ou Keycloak). Jeton d'injection Angular. */
export abstract class SessionUtilisateur {
  abstract readonly utilisateur: Signal<UtilisateurConnecte | null>;
  abstract readonly isSignedIn: Signal<boolean>;

  /** Ouvre la connexion : formulaire démo ou redirection Keycloak. */
  abstract connecter(retour?: string): Promise<void>;
  abstract deconnecter(): Promise<void>;

  /** Jeton à joindre aux appels API (null en démo). */
  abstract jetonAcces(): Promise<string | null>;

  hasAnyRole(roles: readonly Role[]): boolean {
    const courant = this.utilisateur();
    return (
      courant !== null && roles.some((role) => courant.roles.includes(role))
    );
  }
}
