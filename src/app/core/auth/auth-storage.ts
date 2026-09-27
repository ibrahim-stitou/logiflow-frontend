/** Clé de la session du mode démo (sessionStorage). */
export const DEMO_SESSION_STORAGE_KEY = "logiflow.demo-session";

export const AUTH_RETURN_URL_KEY = "logiflow.retour";
export const AUTH_BROADCAST_CHANNEL = "logiflow-auth";

export function clearAuthSessionStorage(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
}

export function lireRetourConnexion(defaut = "/"): string {
  if (typeof sessionStorage === "undefined") {
    return defaut;
  }
  const retour = sessionStorage.getItem(AUTH_RETURN_URL_KEY);
  sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
  if (!retour?.startsWith("/")) {
    return defaut;
  }
  return retour;
}

export function enregistrerRetourConnexion(retour: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  const normalise = retour.startsWith("/") ? retour : "/";
  sessionStorage.setItem(AUTH_RETURN_URL_KEY, normalise);
}
