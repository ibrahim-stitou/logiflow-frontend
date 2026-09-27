export type AuthMode = "demo" | "keycloak";

export interface DemoAuthConfig {
  mode: "demo";
}

export interface KeycloakAuthConfig {
  authority: string;
  clientId: string;
  mode: "keycloak";
  postLogoutRedirectUri: string;
  redirectUrl: string;
  scope: string;
}

export type AuthConfig = DemoAuthConfig | KeycloakAuthConfig;

export interface Environment {
  apiBaseUrl: string;
  auth: AuthConfig;
}
