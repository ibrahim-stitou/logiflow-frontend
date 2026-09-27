import { isFieldSelectNone } from "../shared/ui/field-select";
import { type ApercuTone, vehiculeStatutTone } from "../tableau/apercu";
import {
  computeVolumeUtileM3,
  formatMarqueModele,
  formatVehiculeDate,
  statutLabel,
  VEHICULE_STATUTS,
  type VehiculeStatut,
} from "../vehicules/vehicule";

export const REMORQUE_TYPES = ["SEMI_REMORQUE", "REMORQUE"] as const;
export type RemorqueType = (typeof REMORQUE_TYPES)[number];

export const REMORQUE_CARROSSERIES = [
  "TAUTLINER",
  "FRIGORIFIQUE",
  "CITERNE",
  "PLATEAU",
  "BENNE",
  "PORTE_CONTENEUR",
] as const;
export type RemorqueCarrosserie = (typeof REMORQUE_CARROSSERIES)[number];

/** Remorque telle que renvoyée par l'API (RemorqueResponse). */
export interface Remorque {
  anneeFabrication: number | null;
  carrosserie: string;
  chargeUtileKg: number;
  dateAcquisition: string | null;
  dateMiseEnService: string | null;
  datePremiereMiseCirculation: string | null;
  dateSortie: string | null;
  groupeFroid: boolean;
  hauteurM: number | null;
  heuresGroupeFroid: number;
  heuresGroupeFroidSortie: number | null;
  id: string;
  immatriculation: string;
  kilometrage: number;
  kilometrageSortie: number | null;
  largeurM: number | null;
  longueurM: number | null;
  marque: string | null;
  modele: string | null;
  motifSortie: string | null;
  nbPositionsPalettes: number;
  numeroParc: string | null;
  poidsVideKg: number | null;
  statut: string;
  temperatureMax: number | null;
  temperatureMin: number | null;
  type: string | null;
  vin: string | null;
  volumeUtileM3: number;
}

export type RemorqueListItem = Pick<
  Remorque,
  | "carrosserie"
  | "chargeUtileKg"
  | "id"
  | "immatriculation"
  | "statut"
  | "volumeUtileM3"
>;

/** Corps de création, calqué sur RemorqueRequest côté backend. */
export interface RemorqueWrite {
  anneeFabrication: number | null;
  carrosserie: RemorqueCarrosserie;
  chargeUtileKg: number;
  dateAcquisition: string | null;
  dateMiseEnService: string | null;
  datePremiereMiseCirculation: string | null;
  groupeFroid: boolean;
  hauteurM: number | null;
  immatriculation: string;
  largeurM: number | null;
  longueurM: number | null;
  marque: string | null;
  modele: string | null;
  nbPositionsPalettes: number;
  numeroParc: string | null;
  poidsVideKg: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  type: RemorqueType | null;
  vin: string | null;
  volumeUtileM3: number;
}

/** État du formulaire de création ("" = non renseigné pour textes/dates/sélections). */
export interface RemorqueDraft {
  anneeFabrication: number | null;
  carrosserie: RemorqueCarrosserie;
  chargeUtileKg: number;
  dateAcquisition: string;
  dateMiseEnService: string;
  datePremiereMiseCirculation: string;
  groupeFroid: boolean;
  hauteurM: number | null;
  immatriculation: string;
  largeurM: number | null;
  longueurM: number | null;
  marque: string;
  modele: string;
  nbPositionsPalettes: number;
  numeroParc: string;
  poidsVideKg: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  type: RemorqueType | "";
  vin: string;
}

export function emptyRemorqueDraft(): RemorqueDraft {
  return {
    anneeFabrication: null,
    carrosserie: "TAUTLINER",
    chargeUtileKg: 24_000,
    dateAcquisition: "",
    dateMiseEnService: "",
    datePremiereMiseCirculation: "",
    groupeFroid: false,
    hauteurM: null,
    immatriculation: "",
    largeurM: null,
    longueurM: null,
    marque: "",
    modele: "",
    nbPositionsPalettes: 33,
    numeroParc: "",
    poidsVideKg: null,
    temperatureMax: null,
    temperatureMin: null,
    type: "SEMI_REMORQUE",
    vin: "",
  };
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function draftToWrite(draft: RemorqueDraft): RemorqueWrite {
  return {
    anneeFabrication: draft.anneeFabrication,
    carrosserie: draft.carrosserie,
    chargeUtileKg: draft.chargeUtileKg,
    dateAcquisition:
      draft.dateAcquisition === "" ? null : draft.dateAcquisition,
    dateMiseEnService:
      draft.dateMiseEnService === "" ? null : draft.dateMiseEnService,
    datePremiereMiseCirculation:
      draft.datePremiereMiseCirculation === ""
        ? null
        : draft.datePremiereMiseCirculation,
    groupeFroid: draft.groupeFroid,
    hauteurM: draft.hauteurM,
    immatriculation: draft.immatriculation.trim().toUpperCase(),
    largeurM: draft.largeurM,
    longueurM: draft.longueurM,
    marque: blankToNull(draft.marque),
    modele: blankToNull(draft.modele),
    nbPositionsPalettes: draft.nbPositionsPalettes,
    numeroParc: blankToNull(draft.numeroParc),
    poidsVideKg: draft.poidsVideKg,
    temperatureMax: draft.groupeFroid ? draft.temperatureMax : null,
    temperatureMin: draft.groupeFroid ? draft.temperatureMin : null,
    type: isFieldSelectNone(draft.type) ? null : (draft.type as RemorqueType),
    vin: blankToNull(draft.vin)?.toUpperCase() ?? null,
    volumeUtileM3:
      computeVolumeUtileM3(draft.longueurM, draft.largeurM, draft.hauteurM) ??
      0,
  };
}

export function typeRemorqueLabel(type: RemorqueType): string {
  switch (type) {
    case "SEMI_REMORQUE":
      return "Semi-remorque";
    case "REMORQUE":
      return "Remorque";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function carrosserieLabel(carrosserie: RemorqueCarrosserie): string {
  switch (carrosserie) {
    case "TAUTLINER":
      return "Tautliner";
    case "FRIGORIFIQUE":
      return "Frigorifique";
    case "CITERNE":
      return "Citerne";
    case "PLATEAU":
      return "Plateau";
    case "BENNE":
      return "Benne";
    case "PORTE_CONTENEUR":
      return "Porte-conteneur";
    default: {
      const _exhaustive: never = carrosserie;
      return _exhaustive;
    }
  }
}

export function typeRemorqueDisplay(type: string | null): string {
  if (!type) {
    return "—";
  }
  if ((REMORQUE_TYPES as readonly string[]).includes(type)) {
    return typeRemorqueLabel(type as RemorqueType);
  }
  return type;
}

export function carrosserieDisplay(carrosserie: string | null): string {
  if (!carrosserie) {
    return "—";
  }
  if ((REMORQUE_CARROSSERIES as readonly string[]).includes(carrosserie)) {
    return carrosserieLabel(carrosserie as RemorqueCarrosserie);
  }
  return carrosserie;
}

export { formatMarqueModele, VEHICULE_STATUTS };

export const formatRemorqueDate = formatVehiculeDate;

export function isVehiculeStatut(value: string): value is VehiculeStatut {
  return (VEHICULE_STATUTS as readonly string[]).includes(value);
}

export function remorqueStatutLabel(statut: string): string {
  return isVehiculeStatut(statut) ? statutLabel(statut) : statut;
}

export function remorqueStatutTone(statut: string): ApercuTone {
  return isVehiculeStatut(statut) ? vehiculeStatutTone(statut) : "muted";
}

/** @deprecated Préférer {@link carrosserieDisplay}. */
export function remorqueCarrosserieLabel(carrosserie: string): string {
  return carrosserieDisplay(carrosserie);
}

export function formatRemorqueLabel(
  remorque: Pick<RemorqueListItem, "carrosserie" | "immatriculation" | "statut">
): string {
  return `${remorque.immatriculation} — ${carrosserieDisplay(remorque.carrosserie)} — ${remorqueStatutLabel(remorque.statut)}`;
}
