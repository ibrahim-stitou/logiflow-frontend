import { computed, Service, signal } from "@angular/core";
import {
  clearAuthSessionStorage,
  DEMO_SESSION_STORAGE_KEY,
} from "./auth-storage";
import { DEMO_PASSWORD, findDemoIdentity } from "./demo-identity";
import { isRole, type Role } from "./role";
import { SessionUtilisateur, type UtilisateurConnecte } from "./session";

export { DEMO_SESSION_STORAGE_KEY } from "./auth-storage";

export interface DemoSession {
  login: string;
  roles: readonly Role[];
}

@Service()
export class DemoSessionService extends SessionUtilisateur {
  private readonly sessionState = signal<DemoSession | null>(
    readStoredSession()
  );

  readonly isSignedIn = computed(() => this.sessionState() !== null);

  readonly utilisateur = computed<UtilisateurConnecte | null>(() => {
    const session = this.sessionState();
    if (!session) {
      return null;
    }
    return {
      login: session.login,
      nom: null,
      roles: session.roles,
    };
  });

  /** État brut démo (tests et persistance). */
  readonly session = this.sessionState;

  signIn(login: string, password: string): boolean {
    const identity = findDemoIdentity(login);
    if (!identity || password !== DEMO_PASSWORD) {
      return false;
    }

    const session: DemoSession = {
      login: identity.login,
      roles: [identity.role],
    };
    persistSession(session);
    this.sessionState.set(session);
    return true;
  }

  connecter(_retour = "/"): Promise<void> {
    // En mode démo, la page /connexion appelle signIn() directement.
    return Promise.resolve();
  }

  deconnecter(): Promise<void> {
    this.signOut();
    return Promise.resolve();
  }

  signOut(): void {
    clearAuthSessionStorage();
    this.sessionState.set(null);
  }

  jetonAcces(): Promise<string | null> {
    return Promise.resolve(null);
  }

  override hasAnyRole(roles: readonly Role[]): boolean {
    const current = this.sessionState();
    if (!current) {
      return false;
    }
    return roles.some((role) => current.roles.includes(role));
  }
}

function readStoredSession(): DemoSession | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("login" in parsed) ||
      !("roles" in parsed)
    ) {
      clearAuthSessionStorage();
      return null;
    }

    const { login, roles } = parsed;
    if (typeof login !== "string" || !Array.isArray(roles)) {
      clearAuthSessionStorage();
      return null;
    }

    const validRoles = roles.filter(isRole);
    if (validRoles.length === 0) {
      clearAuthSessionStorage();
      return null;
    }

    return { login, roles: validRoles };
  } catch {
    clearAuthSessionStorage();
    return null;
  }
}

function persistSession(session: DemoSession): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session));
}
