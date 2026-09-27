import { HttpErrorResponse } from "@angular/common/http";

const CORRELATION_HEADER = "X-Correlation-Id";

const GENERIC_INTERNAL_PATTERNS = [
  /unexpected error occurred/i,
  /erreur inattendue est survenue/i,
  /contact support with the correlation identifier/i,
  /contacter le support en fournissant l'identifiant de corrélation/i,
] as const;

interface ProblemDetailBody {
  correlationId?: unknown;
  detail?: unknown;
  title?: unknown;
  type?: unknown;
  violations?: unknown;
}

export function httpErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return messageFromHttpError(error);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Chargement impossible.";
}

function messageFromHttpError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return "Backend injoignable. Démarre logiflow-backend (`make run`) puis recharge.";
  }

  const body = parseProblemDetail(error.error);
  const correlationId = readCorrelationId(error, body);

  if (error.status === 503) {
    return serviceUnavailableMessage(body, correlationId);
  }

  const violations = readViolations(body);
  if (violations.length > 0) {
    return validationMessage(violations);
  }

  const detail = readDetail(body);
  if (detail && !isGenericInternalMessage(detail)) {
    return detail;
  }

  if (error.status >= 500) {
    return serverErrorMessage(error.status, correlationId);
  }

  return fallbackForStatus(error.status, correlationId);
}

function parseProblemDetail(raw: unknown): ProblemDetailBody | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  return raw as ProblemDetailBody;
}

function readCorrelationId(
  error: HttpErrorResponse,
  body: ProblemDetailBody | null
): string | null {
  const fromHeader = error.headers.get(CORRELATION_HEADER);
  if (fromHeader && fromHeader.trim().length > 0) {
    return fromHeader.trim();
  }
  if (
    typeof body?.correlationId === "string" &&
    body.correlationId.length > 0
  ) {
    return body.correlationId;
  }
  return null;
}

function readDetail(body: ProblemDetailBody | null): string | null {
  if (typeof body?.detail !== "string") {
    return null;
  }
  const trimmed = body.detail.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readViolations(body: ProblemDetailBody | null): string[] {
  if (!Array.isArray(body?.violations)) {
    return [];
  }
  return body.violations.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
}

function isGenericInternalMessage(message: string): boolean {
  return GENERIC_INTERNAL_PATTERNS.some((pattern) => pattern.test(message));
}

function validationMessage(violations: readonly string[]): string {
  if (violations.length === 1) {
    return `Saisie invalide : ${violations[0]}.`;
  }
  return `Saisie invalide : ${violations.join(" · ")}.`;
}

function serverErrorMessage(
  status: number,
  correlationId: string | null
): string {
  const retry =
    "Le serveur a rencontré un problème. Attends quelques secondes, puis réessaie.";
  if (correlationId) {
    return `${retry} Si ça persiste, contacte le support (réf. ${correlationId}).`;
  }
  if (status === 502 || status === 504) {
    return `${retry} Le service met peut-être trop de temps à répondre.`;
  }
  return retry;
}

function serviceUnavailableMessage(
  body: ProblemDetailBody | null,
  correlationId: string | null
): string {
  const detail = readDetail(body);
  if (detail && !isGenericInternalMessage(detail)) {
    return `${detail} Réessaie dans quelques instants.`;
  }
  const base =
    "Service temporairement indisponible. Réessaie dans quelques instants.";
  return correlationId ? `${base} (réf. ${correlationId})` : base;
}

function fallbackForStatus(
  status: number,
  correlationId: string | null
): string {
  switch (status) {
    case 400:
      return "Requête invalide. Vérifie les champs saisis puis réessaie.";
    case 401:
      return "Authentification requise. Reconnecte-toi puis réessaie.";
    case 403:
      return "Tu n'as pas les droits pour cette action.";
    case 404:
      return "Ressource introuvable. Elle a peut-être été supprimée.";
    case 409:
      return "Conflit : l'état a changé entre-temps. Recharge la page puis réessaie.";
    case 422:
      return "Action refusée par une règle métier. Vérifie les données saisies.";
    default:
      return correlationId
        ? `Erreur ${status}. Réessaie plus tard (réf. ${correlationId}).`
        : `Erreur ${status}. Réessaie plus tard.`;
  }
}
