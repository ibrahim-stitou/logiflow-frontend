import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { isRole, type Role } from "./role";
import { SessionUtilisateur } from "./session";

export const signedInGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionUtilisateur);
  const router = inject(Router);
  if (session.isSignedIn()) {
    return true;
  }
  return router.createUrlTree(["/connexion"], {
    queryParams: { retour: state.url },
  });
};

export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionUtilisateur);
  const router = inject(Router);
  if (!session.isSignedIn()) {
    return true;
  }
  return router.parseUrl("/");
};

export const roleGuard: CanActivateFn = (route) => {
  const session = inject(SessionUtilisateur);
  const router = inject(Router);
  const { roles } = route.data;
  const allowed = readAllowedRoles(roles);
  if (allowed.length === 0 || session.hasAnyRole(allowed)) {
    return true;
  }
  return router.parseUrl("/403");
};

function readAllowedRoles(value: unknown): Role[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isRole);
}
