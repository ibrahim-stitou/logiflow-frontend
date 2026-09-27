import type { Environment } from "./environment.types";

export const environment: Environment = {
  apiBaseUrl: "/api/v1",
  auth: {
    authority: "http://localhost:8081/realms/logiflow",
    clientId: "logiflow-frontend",
    mode: "keycloak",
    postLogoutRedirectUri: "http://localhost:4200/connexion",
    redirectUrl: "http://localhost:4200/connexion/retour",
    scope: "openid profile email",
  },
};
