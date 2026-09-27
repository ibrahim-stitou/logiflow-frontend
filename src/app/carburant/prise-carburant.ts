import { formatAmountDh } from "../core/api/money";

export const TYPE_CARBURANTS = ["DIESEL", "GNR", "ADBLUE", "ESSENCE"] as const;
export type TypeCarburant = (typeof TYPE_CARBURANTS)[number];

export const STATUT_PRISES = ["BROUILLON", "VALIDEE"] as const;
export type StatutPrise = (typeof STATUT_PRISES)[number];

export interface PriseCarburant {
  datePrise: string;
  id: string;
  litrage: number;
  montantTtc: number;
  prixUnitaire: number | null;
  remorqueId: string | null;
  stationCode: string;
  stationId: string;
  stationLibelle: string;
  statut: StatutPrise;
  typeCarburant: TypeCarburant;
  vehiculeId: string | null;
  voyageId: string;
  voyageReference: string;
}

export interface PriseCarburantWrite {
  datePrise: string;
  litrage: number;
  montantTtc: number;
  remorqueId: string | null;
  stationId: string;
  typeCarburant: TypeCarburant;
  vehiculeId: string | null;
  voyageId: string;
}

export interface PriseCarburantMaj {
  litrage: number;
  montantTtc: number;
  stationId: string;
  typeCarburant: TypeCarburant;
}

export interface PriseCarburantStats {
  litresTotal: number;
  montantTotal: number;
  nombre: number;
  parType: {
    litres: number;
    montant: number;
    nombre: number;
    type: TypeCarburant;
  }[];
}

export interface PriseCarburantDraft {
  datePrise: string;
  engin: "vehicule" | "remorque";
  litrage: string;
  montantTtc: string;
  stationId: string;
  typeCarburant: TypeCarburant;
  voyageId: string;
}

export function emptyPriseCarburantDraft(voyageId = ""): PriseCarburantDraft {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return {
    datePrise: local,
    engin: "vehicule",
    litrage: "",
    montantTtc: "",
    stationId: "",
    typeCarburant: "DIESEL",
    voyageId,
  };
}

export function typeCarburantLabel(type: TypeCarburant): string {
  switch (type) {
    case "DIESEL":
      return "Diesel";
    case "GNR":
      return "GNR";
    case "ADBLUE":
      return "AdBlue";
    case "ESSENCE":
      return "Essence";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function statutPriseLabel(statut: StatutPrise): string {
  switch (statut) {
    case "BROUILLON":
      return "Brouillon";
    case "VALIDEE":
      return "Validée";
    default: {
      const _exhaustive: never = statut;
      return _exhaustive;
    }
  }
}

export function statutPriseTone(
  statut: StatutPrise
): "muted" | "pine" | "amber" | "ink" | "brake" {
  switch (statut) {
    case "BROUILLON":
      return "amber";
    case "VALIDEE":
      return "pine";
    default: {
      const _exhaustive: never = statut;
      return _exhaustive;
    }
  }
}

export function formatPriseShortId(id: string): string {
  return `#${id.slice(0, 8)}`;
}

export function formatLitres(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} L`;
}

export function formatMontantTtc(value: number): string {
  return formatAmountDh(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

export function formatPrixUnitaire(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${value.toLocaleString("fr-FR", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 3,
  })} DH/L`;
}

export function draftToWrite(
  draft: PriseCarburantDraft,
  voyage: { remorqueId: string | null; vehiculeId: string }
): PriseCarburantWrite {
  const vehiculeId = draft.engin === "vehicule" ? voyage.vehiculeId : null;
  const remorqueId = draft.engin === "remorque" ? voyage.remorqueId : null;
  return {
    datePrise: new Date(draft.datePrise).toISOString(),
    litrage: Number.parseFloat(draft.litrage),
    montantTtc: Number.parseFloat(draft.montantTtc),
    remorqueId,
    stationId: draft.stationId,
    typeCarburant: draft.typeCarburant,
    vehiculeId,
    voyageId: draft.voyageId,
  };
}
