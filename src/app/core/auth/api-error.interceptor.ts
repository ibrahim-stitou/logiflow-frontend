import type {
  HttpErrorResponse,
  HttpInterceptorFn,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, from, switchMap, throwError } from "rxjs";
import { environment } from "../../../environments/environment";
import { KeycloakSessionService } from "./keycloak-session";
import { SessionUtilisateur } from "./session";

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.auth.mode !== "keycloak") {
    return next(req);
  }

  const session = inject(SessionUtilisateur);
  const router = inject(Router);
  if (!(session instanceof KeycloakSessionService)) {
    return next(req);
  }
  const keycloak = session;

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        return throwError(() => error);
      }
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (estErreurMfa(error)) {
        keycloak.reauthentifierMfa();
        return throwError(() => error);
      }

      const dejaRejoue = req.headers.has("X-Logiflow-Auth-Retry");
      if (dejaRejoue) {
        return from(session.deconnecter()).pipe(
          switchMap(() =>
            from(router.navigateByUrl("/connexion?expiree=1")).pipe(
              switchMap(() => throwError(() => error))
            )
          )
        );
      }

      return from(keycloak.forcerRenouvellement()).pipe(
        switchMap((jeton) => {
          if (!jeton) {
            return from(session.deconnecter()).pipe(
              switchMap(() =>
                from(router.navigateByUrl("/connexion?expiree=1")).pipe(
                  switchMap(() => throwError(() => error))
                )
              )
            );
          }
          const retente = req.clone({
            headers: req.headers.set("X-Logiflow-Auth-Retry", "1"),
          });
          return next(retente);
        })
      );
    })
  );
};

function estErreurMfa(error: HttpErrorResponse): boolean {
  const www = error.headers.get("WWW-Authenticate") ?? "";
  return www.includes("mfa_required");
}
