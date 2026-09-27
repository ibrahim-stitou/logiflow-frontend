import { HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { httpErrorMessage } from "./http-error";

describe("httpErrorMessage", () => {
  it("explains when the backend is unreachable", () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: "Unknown Error",
    });
    expect(httpErrorMessage(error)).toContain("Backend injoignable");
  });

  it("replaces generic internal errors with a retry hint", () => {
    const error = new HttpErrorResponse({
      error: {
        correlationId: "abc-123",
        detail:
          "An unexpected error occurred. Please contact support with the correlation identifier.",
      },
      headers: new HttpHeaders({ "X-Correlation-Id": "abc-123" }),
      status: 500,
      statusText: "Internal Server Error",
    });
    expect(httpErrorMessage(error)).toContain("réessaie");
    expect(httpErrorMessage(error)).toContain("abc-123");
    expect(httpErrorMessage(error)).not.toContain("contact support");
  });

  it("shows business rule detail for 422 responses", () => {
    const error = new HttpErrorResponse({
      error: {
        detail:
          "Seule une commande confirmée peut générer un dossier de transport (commande xyz)",
      },
      status: 422,
      statusText: "Unprocessable Entity",
    });
    expect(httpErrorMessage(error)).toContain("commande confirmée");
  });

  it("formats bean validation violations", () => {
    const error = new HttpErrorResponse({
      error: {
        detail: "Invalid request",
        violations: ["commandeId: must not be null"],
      },
      status: 400,
      statusText: "Bad Request",
    });
    expect(httpErrorMessage(error)).toBe(
      "Saisie invalide : commandeId: must not be null."
    );
  });

  it("suggests waiting for service unavailable responses", () => {
    const error = new HttpErrorResponse({
      error: {
        detail: "Le moteur d'itinéraire ne répond pas.",
      },
      status: 503,
      statusText: "Service Unavailable",
    });
    expect(httpErrorMessage(error)).toContain(
      "Réessaie dans quelques instants"
    );
    expect(httpErrorMessage(error)).toContain("itinéraire");
  });

  it("passes through local Error messages", () => {
    expect(
      httpErrorMessage(new Error("L'identifiant client est obligatoire."))
    ).toBe("L'identifiant client est obligatoire.");
  });
});
