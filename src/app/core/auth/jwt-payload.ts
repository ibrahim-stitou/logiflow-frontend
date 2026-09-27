/** Décode le payload d'un JWT (affichage UI uniquement, sans vérification de signature). */
export function decoderPayloadJwt(
  jeton: string | null | undefined
): Record<string, unknown> | null {
  if (!jeton) {
    return null;
  }
  const segments = jeton.split(".");
  if (segments.length !== 3) {
    return null;
  }
  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = globalThis.atob(base64);
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function lireRealmRoles(
  payload: Record<string, unknown> | null
): string[] {
  if (!payload) {
    return [];
  }
  const realmAccess = payload["realm_access"];
  if (
    typeof realmAccess !== "object" ||
    realmAccess === null ||
    !("roles" in realmAccess)
  ) {
    return [];
  }
  const { roles } = realmAccess as { roles: unknown };
  if (!Array.isArray(roles)) {
    return [];
  }
  return roles.filter((role): role is string => typeof role === "string");
}
