import { formatAmountDh } from "../core/api/money";
import { isFieldSelectNone } from "../shared/ui/field-select";
import type { ApercuTone } from "../tableau/apercu";

// ─── Énumérations ────────────────────────────────────────────────────────────

export const TYPES_ENGIN = ["VEHICULE", "REMORQUE"] as const;
export type TypeEngin = (typeof TYPES_ENGIN)[number];

export const TYPES_INTERVENTION = [
  "ENTRETIEN_PREVENTIF",
  "REPARATION",
  "CONTROLE_TECHNIQUE",
  "PNEUMATIQUES",
  "CARROSSERIE",
  "DIAGNOSTIC",
  "FREINAGE",
  "GROUPE_FROID",
  "RAPPEL_CONSTRUCTEUR",
  "AUTRE",
] as const;
export type TypeIntervention = (typeof TYPES_INTERVENTION)[number];

export const NATURES = ["PREVENTIF", "CORRECTIF", "REGLEMENTAIRE"] as const;
export type Nature = (typeof NATURES)[number];

export const PRIORITES = ["BASSE", "NORMALE", "HAUTE", "URGENTE"] as const;
export type Priorite = (typeof PRIORITES)[number];

export const ORIGINES = [
  "MANUELLE",
  "PLAN_ENTRETIEN",
  "SINISTRE",
  "AGENT_IA",
  "PANNE_SIGNALEE",
] as const;
export type Origine = (typeof ORIGINES)[number];

export const STATUTS_OT = [
  "PLANIFIE",
  "EN_COURS",
  "EN_ATTENTE_PIECES",
  "TERMINE",
  "ANNULE",
] as const;
export type StatutOT = (typeof STATUTS_OT)[number];

export const TYPES_LIGNE = [
  "MAIN_OEUVRE",
  "PIECE",
  "SOUS_TRAITANCE",
  "FOURNITURE",
  "DIVERS",
] as const;
export type TypeLigne = (typeof TYPES_LIGNE)[number];

export const TYPES_PRESTATAIRE = [
  "GARAGE",
  "CONCESSION",
  "PNEUMATIQUES",
  "CARROSSERIE",
  "CONTROLE_TECHNIQUE",
  "DEPANNAGE",
  "EXPERT",
  "ASSUREUR",
] as const;
export type TypePrestataire = (typeof TYPES_PRESTATAIRE)[number];

export const GARANTIES = [
  "RC",
  "DOMMAGES",
  "VOL",
  "INCENDIE",
  "BRIS_GLACE",
  "MARCHANDISES",
  "ASSISTANCE",
] as const;
export type Garantie = (typeof GARANTIES)[number];

export const TYPES_SINISTRE = [
  "ACCIDENT_CIRCULATION",
  "ACCROCHAGE",
  "VOL",
  "VANDALISME",
  "INCENDIE",
  "BRIS_DE_GLACE",
  "DOMMAGE_MARCHANDISE",
  "EVENEMENT_CLIMATIQUE",
  "AUTRE",
] as const;
export type TypeSinistre = (typeof TYPES_SINISTRE)[number];

export const GRAVITES = [
  "MATERIEL_LEGER",
  "MATERIEL_LOURD",
  "CORPOREL",
] as const;
export type Gravite = (typeof GRAVITES)[number];

export const RESPONSABILITES = [
  "A_DETERMINER",
  "NON_RESPONSABLE",
  "PARTAGEE",
  "RESPONSABLE",
] as const;
export type Responsabilite = (typeof RESPONSABILITES)[number];

export const STATUTS_SINISTRE = [
  "DECLARE",
  "DECLARE_ASSUREUR",
  "EN_EXPERTISE",
  "EN_REPARATION",
  "CLOS",
  "CLASSE_SANS_SUITE",
] as const;
export type StatutSinistre = (typeof STATUTS_SINISTRE)[number];

export type EtatEcheance = "OK" | "ALERTE" | "ECHU";

// ─── Modèles API ─────────────────────────────────────────────────────────────

export interface EnginRef {
  id: string;
  type: TypeEngin;
}

export interface LigneCout {
  designation: string;
  prixUnitaireHt: number;
  quantite: number;
  referencePiece: string | null;
  tauxTva: number | null;
  totalHt?: number;
  totalTtc?: number;
  type: TypeLigne;
}

export interface OrdreTravail {
  budgetEstime: number | null;
  dateFacture: string | null;
  debutPlanifie: string;
  debutReel: string | null;
  description: string | null;
  diagnostic: string | null;
  engin: EnginRef;
  finPlanifiee: string | null;
  finReelle: string | null;
  heures: number | null;
  id: string;
  immobilisation: boolean;
  immobilisationHeures: number | null;
  intervenant: string | null;
  kilometrage: number | null;
  lignes: LigneCout[];
  nature: Nature;
  numeroFacture: string | null;
  origine: Origine;
  planId: string | null;
  prestataireId: string | null;
  priorite: Priorite;
  reference: string;
  sinistreId: string | null;
  statut: StatutOT;
  titre: string;
  totalHt: number;
  totalTtc: number;
  totalTva: number;
  travauxRealises: string | null;
  type: TypeIntervention;
}

export interface DetailsOT {
  budgetEstime: number | null;
  debutPlanifie: string;
  description: string | null;
  finPlanifiee: string | null;
  immobilisation: boolean;
  nature: Nature;
  prestataireId: string | null;
  priorite: Priorite;
  titre: string;
  type: TypeIntervention;
}

export interface Echeance {
  dateEcheance: string | null;
  etat: EtatEcheance;
  heuresRestantes: number | null;
  immatriculation: string | null;
  kilometrageActuel: number | null;
  kmParJour: number;
  kmRestant: number | null;
}

export interface PlanEntretien {
  actif: boolean;
  coutEstime: number | null;
  derniereDate: string | null;
  derniereHeures: number | null;
  derniereKm: number | null;
  dureeEstimeeMin: number;
  echeance: Echeance | null;
  engin: EnginRef;
  id: string;
  libelle: string;
  periodiciteHeures: number | null;
  periodiciteKm: number | null;
  periodiciteMois: number | null;
  prestataireId: string | null;
  seuilAlerteJours: number;
  seuilAlerteKm: number;
  type: TypeIntervention;
}

export interface Tiers {
  assureur: string | null;
  immatriculation: string | null;
  nom: string;
  numeroPolice: string | null;
}

export interface CoutsSinistre {
  coutNet: number;
  franchise: number;
  indemnite: number;
  ordresOuverts: number;
  ordresTravail: number;
  reparationsHt: number;
  reparationsTtc: number;
}

export interface Sinistre {
  blesses: boolean;
  chauffeurId: string | null;
  constatAmiable: boolean;
  contratId: string | null;
  couts: CoutsSinistre | null;
  dateCloture: string | null;
  dateDeclarationAssureur: string | null;
  dateExpertise: string | null;
  dateSurvenance: string;
  declarationEnRetard: boolean;
  description: string;
  enginImmobilise: boolean;
  estimationDommages: number | null;
  expertId: string | null;
  franchise: number | null;
  gravite: Gravite;
  id: string;
  indemnite: number | null;
  latitude: number | null;
  lieu: string | null;
  longitude: number | null;
  numeroDossierAssureur: string | null;
  rapportPolice: boolean;
  reference: string;
  remorqueId: string | null;
  responsabilite: Responsabilite;
  statut: StatutSinistre;
  tiers: Tiers | null;
  type: TypeSinistre;
  vehiculeId: string | null;
  voyageId: string | null;
}

export interface Prestataire {
  actif: boolean;
  adresse: string | null;
  code: string;
  contactNom: string | null;
  email: string | null;
  id: string;
  notes: string | null;
  raisonSociale: string;
  siret: string | null;
  telephone: string | null;
  type: TypePrestataire;
}

export interface ContratAssurance {
  actif: boolean;
  assureurId: string;
  dateEcheance: string;
  dateEffet: string;
  engins: EnginRef[];
  enVigueur: boolean;
  franchise: number | null;
  garanties: Garantie[];
  id: string;
  numeroPolice: string;
  primeAnnuelle: number | null;
  type: "FLOTTE" | "ENGIN";
}

export interface Repartition {
  cle: string;
  libelle: string;
  nombre: number;
  totalHt: number;
}

export interface CoutsMaintenance {
  budgetEstime: number;
  coutNetSinistres: number;
  debut: string;
  fin: string;
  indemnitesPercues: number;
  nombreOrdres: number;
  nombreSinistres: number;
  parEngin: Repartition[];
  parMois: Repartition[];
  parNature: Repartition[];
  parType: Repartition[];
  totalHt: number;
  totalTtc: number;
}

/** Engin de la flotte (véhicule ou remorque) pour les listes de choix et les libellés. */
export interface EnginLookup {
  id: string;
  immatriculation: string;
  type: TypeEngin;
}

// ─── Libellés et tons ────────────────────────────────────────────────────────

const LIBELLES: Record<string, string> = {
  A_DETERMINER: "À déterminer",
  A_PLANIFIER: "À planifier",
  ACCIDENT_CIRCULATION: "Accident de circulation",
  ACCROCHAGE: "Accrochage",
  AGENT_IA: "Agent IA",
  ALERTE: "En alerte",
  ANNULE: "Annulé",
  ASSISTANCE: "Assistance",
  ASSUREUR: "Assureur",
  AUTRE: "Autre",
  BASSE: "Basse",
  BON: "Bon état",
  BRIS_DE_GLACE: "Bris de glace",
  BRIS_GLACE: "Bris de glace",
  CARROSSERIE: "Carrosserie",
  CLASSE_SANS_SUITE: "Classé sans suite",
  CLOS: "Clos",
  CONCESSION: "Concession",
  CONTROLE_TECHNIQUE: "Contrôle technique",
  CORPOREL: "Corporel",
  CORRECTIF: "Correctif",
  CRITIQUE: "Critique",
  DECLARE: "Déclaré",
  DECLARE_ASSUREUR: "Déclaré à l'assureur",
  DEPANNAGE: "Dépannage",
  DIAGNOSTIC: "Diagnostic",
  DIVERS: "Divers",
  DOMMAGE_MARCHANDISE: "Dommage marchandise",
  DOMMAGES: "Dommages",
  ECHU: "Échu",
  EN_ATTENTE_PIECES: "Attente pièces",
  EN_COURS: "En cours",
  EN_EXPERTISE: "En expertise",
  EN_REPARATION: "En réparation",
  ENGIN: "Par engin",
  ENTRETIEN_PREVENTIF: "Entretien préventif",
  EVENEMENT_CLIMATIQUE: "Événement climatique",
  EXPERT: "Expert",
  FLOTTE: "Flotte",
  FOURNITURE: "Fourniture",
  FREINAGE: "Freinage",
  GARAGE: "Garage",
  GROUPE_FROID: "Groupe froid",
  HAUTE: "Haute",
  INCENDIE: "Incendie",
  MAIN_OEUVRE: "Main-d'œuvre",
  MANUELLE: "Saisie manuelle",
  MARCHANDISES: "Marchandises",
  MATERIEL_LEGER: "Matériel léger",
  MATERIEL_LOURD: "Matériel lourd",
  NON_RESPONSABLE: "Non responsable",
  NORMALE: "Normale",
  OK: "À jour",
  PANNE_SIGNALEE: "Panne signalée",
  PARTAGEE: "Partagée",
  PIECE: "Pièce",
  PLAN_ENTRETIEN: "Plan d'entretien",
  PLANIFIE: "Planifié",
  PNEUMATIQUES: "Pneumatiques",
  PREVENTIF: "Préventif",
  RAPPEL_CONSTRUCTEUR: "Rappel constructeur",
  RC: "Responsabilité civile",
  REGLEMENTAIRE: "Réglementaire",
  REMORQUE: "Remorque",
  REPARATION: "Réparation",
  RESPONSABLE: "Responsable",
  SINISTRE: "Sinistre",
  SOUS_TRAITANCE: "Sous-traitance",
  SURVEILLER: "À surveiller",
  TERMINE: "Terminé",
  URGENTE: "Urgente",
  VANDALISME: "Vandalisme",
  VEHICULE: "Véhicule",
  VOL: "Vol",
};

/** Libellé français d'une valeur d'énumération du module maintenance. */
export function libelle(valeur: string | null | undefined): string {
  if (!valeur) {
    return "—";
  }
  return LIBELLES[valeur] ?? valeur;
}

export function toneStatutOT(statut: StatutOT): ApercuTone {
  switch (statut) {
    case "EN_COURS":
      return "ink";
    case "EN_ATTENTE_PIECES":
      return "amber";
    case "TERMINE":
      return "pine";
    case "ANNULE":
      return "muted";
    default:
      return "amber";
  }
}

export function toneEcheance(
  etat: EtatEcheance | null | undefined
): ApercuTone {
  switch (etat) {
    case "ECHU":
      return "brake";
    case "ALERTE":
      return "amber";
    case "OK":
      return "pine";
    default:
      return "muted";
  }
}

export function tonePriorite(priorite: Priorite): ApercuTone {
  switch (priorite) {
    case "URGENTE":
      return "brake";
    case "HAUTE":
      return "amber";
    default:
      return "muted";
  }
}

export function toneStatutSinistre(statut: StatutSinistre): ApercuTone {
  switch (statut) {
    case "DECLARE":
      return "amber";
    case "CLOS":
      return "pine";
    case "CLASSE_SANS_SUITE":
      return "muted";
    default:
      return "ink";
  }
}

// ─── Transitions ─────────────────────────────────────────────────────────────

const TRANSITIONS_OT: Record<StatutOT, readonly StatutOT[]> = {
  ANNULE: [],
  EN_ATTENTE_PIECES: ["EN_COURS", "ANNULE"],
  EN_COURS: ["EN_ATTENTE_PIECES", "ANNULE"],
  PLANIFIE: ["EN_COURS", "ANNULE"],
  TERMINE: [],
};

/** Transitions simples ; la fin passe par la clôture (EN_COURS / EN_ATTENTE_PIECES). */
export function transitionsOT(statut: StatutOT): readonly StatutOT[] {
  return TRANSITIONS_OT[statut];
}

export function peutCloturer(statut: StatutOT): boolean {
  return statut === "EN_COURS" || statut === "EN_ATTENTE_PIECES";
}

export function otModifiable(statut: StatutOT): boolean {
  return statut !== "TERMINE" && statut !== "ANNULE";
}

const TRANSITIONS_SINISTRE: Record<StatutSinistre, readonly StatutSinistre[]> =
  {
    CLASSE_SANS_SUITE: [],
    CLOS: [],
    DECLARE: ["DECLARE_ASSUREUR", "EN_REPARATION", "CLOS", "CLASSE_SANS_SUITE"],
    DECLARE_ASSUREUR: [
      "EN_EXPERTISE",
      "EN_REPARATION",
      "CLOS",
      "CLASSE_SANS_SUITE",
    ],
    EN_EXPERTISE: ["EN_REPARATION", "CLOS"],
    EN_REPARATION: ["CLOS"],
  };

export function transitionsSinistre(
  statut: StatutSinistre
): readonly StatutSinistre[] {
  return TRANSITIONS_SINISTRE[statut];
}

export function libelleTransitionOT(cible: StatutOT, depuis: StatutOT): string {
  if (cible === "EN_COURS") {
    return depuis === "EN_ATTENTE_PIECES" ? "Reprendre" : "Démarrer";
  }
  if (cible === "EN_ATTENTE_PIECES") {
    return "En attente de pièces";
  }
  return "Annuler";
}

// ─── Calculs et mise en forme ────────────────────────────────────────────────

/** Montant dans la devise de l'application (dirham, « 1 234,50 DH ») ; « — » si absent. */
export function formatMontant(montant: number | null | undefined): string {
  if (montant === null || montant === undefined) {
    return "—";
  }
  return formatAmountDh(montant, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

export function formatKm(km: number | null | undefined): string {
  return km === null || km === undefined
    ? "—"
    : `${km.toLocaleString("fr-FR")} km`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  const [annee, mois, jour] = iso.slice(0, 10).split("-");
  return annee && mois && jour ? `${jour}/${mois}/${annee}` : iso;
}

export function formatDateHeure(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function totalHtLigne(
  l: Pick<LigneCout, "prixUnitaireHt" | "quantite">
): number {
  return Math.round(l.quantite * l.prixUnitaireHt * 100) / 100;
}

export function totalTtcLigne(
  l: Pick<LigneCout, "prixUnitaireHt" | "quantite" | "tauxTva">
): number {
  const ht = totalHtLigne(l);
  return Math.round((ht + (ht * (l.tauxTva ?? 20)) / 100) * 100) / 100;
}

export function totauxLignes(lignes: readonly LigneCout[]): {
  ht: number;
  ttc: number;
  tva: number;
} {
  const ht = lignes.reduce((s, l) => s + totalHtLigne(l), 0);
  const ttc = lignes.reduce((s, l) => s + totalTtcLigne(l), 0);
  return {
    ht: Math.round(ht * 100) / 100,
    ttc: Math.round(ttc * 100) / 100,
    tva: Math.round((ttc - ht) * 100) / 100,
  };
}

export function ligneVide(): LigneCout {
  return {
    designation: "",
    prixUnitaireHt: 0,
    quantite: 1,
    referencePiece: null,
    tauxTva: 20,
    type: "MAIN_OEUVRE",
  };
}

export function lignesValides(lignes: readonly LigneCout[]): boolean {
  return lignes.every(
    (l) =>
      l.designation.trim().length > 0 && l.quantite > 0 && l.prixUnitaireHt >= 0
  );
}

/** Périodicité lisible : « 40 000 km · 12 mois · 1 500 h ». */
export function formatPeriodicite(
  p: Pick<
    PlanEntretien,
    "periodiciteHeures" | "periodiciteKm" | "periodiciteMois"
  >
): string {
  const parties: string[] = [];
  if (p.periodiciteKm) {
    parties.push(`${p.periodiciteKm.toLocaleString("fr-FR")} km`);
  }
  if (p.periodiciteMois) {
    parties.push(`${p.periodiciteMois} mois`);
  }
  if (p.periodiciteHeures) {
    parties.push(`${p.periodiciteHeures.toLocaleString("fr-FR")} h`);
  }
  return parties.join(" · ") || "—";
}

/** Résumé de l'échéance : « dans 1 200 km · le 12/11/2026 ». */
export function formatEcheance(e: Echeance | null | undefined): string {
  if (!e) {
    return "—";
  }
  const parties: string[] = [];
  // API omits null fields → undefined; treat both as absent (`!= null`).
  if (e.kmRestant != null) {
    if (e.kmRestant < 0) {
      parties.push(`dépassée de ${formatKm(-e.kmRestant)}`);
    } else if (e.kmRestant === 0) {
      parties.push("échéance km atteinte");
    } else {
      parties.push(`dans ${formatKm(e.kmRestant)}`);
    }
  }
  if (e.heuresRestantes != null) {
    parties.push(`${e.heuresRestantes.toLocaleString("fr-FR")} h restantes`);
  }
  if (e.dateEcheance) {
    parties.push(`le ${formatDate(e.dateEcheance)}`);
  }
  return parties.join(" · ") || "—";
}

/** Libellé d'un engin à partir des listes de la flotte. */
export function libelleEngin(
  ref: EnginRef | null | undefined,
  engins: ReadonlyMap<string, EnginLookup>
): string {
  if (!ref) {
    return "—";
  }
  return engins.get(ref.id)?.immatriculation ?? ref.id.slice(0, 8);
}

/** Nature par défaut selon le type d'intervention. */
export function natureParDefaut(type: TypeIntervention): Nature {
  if (type === "CONTROLE_TECHNIQUE" || type === "RAPPEL_CONSTRUCTEUR") {
    return "REGLEMENTAIRE";
  }
  if (
    type === "ENTRETIEN_PREVENTIF" ||
    type === "PNEUMATIQUES" ||
    type === "GROUPE_FROID"
  ) {
    return "PREVENTIF";
  }
  return "CORRECTIF";
}

/** Valeur numérique facultative saisie dans un champ (vide = null). */
export function nombreOuNull(valeur: string): number | null {
  const texte = valeur.trim().replace(",", ".");
  if (texte === "") {
    return null;
  }
  const nombre = Number(texte);
  return Number.isFinite(nombre) ? nombre : null;
}

/** Texte facultatif (vide = null). */
export function texteOuNull(valeur: string | null | undefined): string | null {
  const texte = (valeur ?? "").trim();
  return texte === "" ? null : texte;
}

/** Paramètres de requête sans les filtres vides ni l'option « aucun » des listes de choix. */
export function parametresRequete(
  valeurs: Record<string, string | number | null | undefined>
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [cle, valeur] of Object.entries(valeurs)) {
    if (typeof valeur === "number") {
      params[cle] = valeur;
    } else if (valeur && valeur.trim() !== "" && !isFieldSelectNone(valeur)) {
      params[cle] = valeur.trim();
    }
  }
  return params;
}
