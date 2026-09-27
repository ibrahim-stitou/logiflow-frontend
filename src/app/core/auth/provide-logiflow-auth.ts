import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from "@angular/core";
import {
  authInterceptor,
  LogLevel,
  OidcSecurityService,
  provideAuth,
} from "angular-auth-oidc-client";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { apiErrorInterceptor } from "./api-error.interceptor";
import { AuthSyncService } from "./auth-sync";
import { DemoSessionService } from "./demo-session";
import { KeycloakSessionService } from "./keycloak-session";
import { SessionUtilisateur } from "./session";

export function provideLogiflowAuth(): EnvironmentProviders {
  const { mode } = environment.auth;

  const sessionProvider =
    mode === "keycloak"
      ? [
          KeycloakSessionService,
          { provide: SessionUtilisateur, useExisting: KeycloakSessionService },
        ]
      : [
          DemoSessionService,
          { provide: SessionUtilisateur, useExisting: DemoSessionService },
        ];

  const httpProviders =
    mode === "keycloak"
      ? [
          provideHttpClient(
            withInterceptors([authInterceptor(), apiErrorInterceptor])
          ),
        ]
      : [provideHttpClient()];

  const oidcProviders =
    mode === "keycloak" && environment.auth.mode === "keycloak"
      ? [
          provideAuth({
            config: {
              authority: environment.auth.authority,
              clientId: environment.auth.clientId,
              logLevel: LogLevel.Warn,
              postLogoutRedirectUri: environment.auth.postLogoutRedirectUri,
              redirectUrl: environment.auth.redirectUrl,
              renewTimeBeforeTokenExpiresInSeconds: 30,
              responseType: "code",
              scope: environment.auth.scope,
              secureRoutes: ["/api/"],
              silentRenew: true,
              useRefreshToken: true,
            },
          }),
          provideAppInitializer(() => {
            const oidc = inject(OidcSecurityService);
            return firstValueFrom(oidc.checkAuth());
          }),
        ]
      : [];

  return makeEnvironmentProviders([
    ...sessionProvider,
    ...httpProviders,
    ...oidcProviders,
    provideAppInitializer(() => {
      inject(AuthSyncService).init();
    }),
  ]);
}
