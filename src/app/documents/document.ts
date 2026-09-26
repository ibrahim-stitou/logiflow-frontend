export const TYPE_ENTITES_DOCUMENTABLES = [
  "VEHICULE",
  "REMORQUE",
  "CHAUFFEUR",
  "PRISE_CARBURANT",
  "ORDRE_TRAVAIL",
  "SINISTRE",
  "CONTRAT_ASSURANCE",
  "PRESTATAIRE",
] as const;
export type TypeEntiteDocumentable =
  (typeof TYPE_ENTITES_DOCUMENTABLES)[number];

export const DOCUMENT_TYPES = [
  "CARTE_GRISE",
  "ASSURANCE",
  "CONTROLE_TECHNIQUE",
  "ADR",
  "PHOTO",
  "JUSTIFICATIF_CARBURANT",
  "PERMIS_CONDUIRE",
  "CARTE_CONDUCTEUR",
  "FIMO_FCO",
  "VISITE_MEDICALE",
  "PIECE_IDENTITE",
  "PASSEPORT",
  "VISA",
  "DEVIS",
  "FACTURE",
  "RAPPORT_INTERVENTION",
  "CONSTAT_AMIABLE",
  "RAPPORT_POLICE",
  "RAPPORT_EXPERTISE",
  "DECLARATION_SINISTRE",
  "ATTESTATION_ASSURANCE",
  "CONDITIONS_CONTRAT",
  "AUTRE",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Types proposés au téléversement selon l'entité (tous restent acceptés par l'API). */
export const DOCUMENT_TYPES_PAR_ENTITE: Record<
  TypeEntiteDocumentable,
  readonly DocumentType[]
> = {
  CHAUFFEUR: [
    "PERMIS_CONDUIRE",
    "CARTE_CONDUCTEUR",
    "FIMO_FCO",
    "VISITE_MEDICALE",
    "ADR",
    "PIECE_IDENTITE",
    "PASSEPORT",
    "VISA",
    "PHOTO",
    "AUTRE",
  ],
  CONTRAT_ASSURANCE: ["CONDITIONS_CONTRAT", "ATTESTATION_ASSURANCE", "AUTRE"],
  ORDRE_TRAVAIL: ["DEVIS", "FACTURE", "RAPPORT_INTERVENTION", "PHOTO", "AUTRE"],
  PRESTATAIRE: ["ATTESTATION_ASSURANCE", "AUTRE"],
  PRISE_CARBURANT: ["JUSTIFICATIF_CARBURANT", "PHOTO", "AUTRE"],
  REMORQUE: [
    "CARTE_GRISE",
    "ASSURANCE",
    "CONTROLE_TECHNIQUE",
    "ADR",
    "PHOTO",
    "AUTRE",
  ],
  SINISTRE: [
    "CONSTAT_AMIABLE",
    "PHOTO",
    "RAPPORT_POLICE",
    "RAPPORT_EXPERTISE",
    "DECLARATION_SINISTRE",
    "DEVIS",
    "FACTURE",
    "AUTRE",
  ],
  VEHICULE: [
    "CARTE_GRISE",
    "ASSURANCE",
    "CONTROLE_TECHNIQUE",
    "ADR",
    "PHOTO",
    "AUTRE",
  ],
};

export interface Document {
  dateExpiration: string | null;
  entiteId: string;
  id: string;
  reference: string;
  typeDocument: DocumentType;
  typeEntite: TypeEntiteDocumentable;
  url: string;
}

export function isDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}

/**
 * Entity kinds whose files are typically compliance credentials with a
 * validity window (permis, carte grise, attestation…).
 * Justifications / work artifacts (carburant, OT, sinistre) never track expiry.
 */
const ENTITES_AVEC_EXPIRATION = new Set<TypeEntiteDocumentable>([
  "VEHICULE",
  "REMORQUE",
  "CHAUFFEUR",
  "CONTRAT_ASSURANCE",
  "PRESTATAIRE",
]);

/**
 * Types that are historical evidence even when attached to a compliance
 * entity (photos, reports, invoices) — no expiry badge or upload field.
 */
const TYPES_SANS_EXPIRATION = new Set<DocumentType>([
  "PHOTO",
  "JUSTIFICATIF_CARBURANT",
  "DEVIS",
  "FACTURE",
  "RAPPORT_INTERVENTION",
  "CONSTAT_AMIABLE",
  "RAPPORT_POLICE",
  "RAPPORT_EXPERTISE",
  "DECLARATION_SINISTRE",
  "CONDITIONS_CONTRAT",
  "AUTRE",
]);

/** Whether this entity/type combination should track document expiration. */
export function documentSuitExpiration(
  typeEntite: TypeEntiteDocumentable,
  typeDocument?: DocumentType
): boolean {
  if (!ENTITES_AVEC_EXPIRATION.has(typeEntite)) {
    return false;
  }
  if (typeDocument !== undefined && TYPES_SANS_EXPIRATION.has(typeDocument)) {
    return false;
  }
  return true;
}

export function documentTypeLabel(type: DocumentType): string {
  switch (type) {
    case "CARTE_GRISE":
      return "Carte grise";
    case "ASSURANCE":
      return "Assurance";
    case "CONTROLE_TECHNIQUE":
      return "Contrôle technique";
    case "ADR":
      return "ADR";
    case "PHOTO":
      return "Photo";
    case "JUSTIFICATIF_CARBURANT":
      return "Justificatif carburant";
    case "PERMIS_CONDUIRE":
      return "Permis de conduire";
    case "CARTE_CONDUCTEUR":
      return "Carte conducteur";
    case "FIMO_FCO":
      return "FIMO / FCO";
    case "VISITE_MEDICALE":
      return "Visite médicale";
    case "PIECE_IDENTITE":
      return "Pièce d'identité";
    case "PASSEPORT":
      return "Passeport";
    case "VISA":
      return "Visa";
    case "DEVIS":
      return "Devis";
    case "FACTURE":
      return "Facture";
    case "RAPPORT_INTERVENTION":
      return "Rapport d'intervention";
    case "CONSTAT_AMIABLE":
      return "Constat amiable";
    case "RAPPORT_POLICE":
      return "Rapport de police";
    case "RAPPORT_EXPERTISE":
      return "Rapport d'expertise";
    case "DECLARATION_SINISTRE":
      return "Déclaration de sinistre";
    case "ATTESTATION_ASSURANCE":
      return "Attestation d'assurance";
    case "CONDITIONS_CONTRAT":
      return "Conditions du contrat";
    case "AUTRE":
      return "Autre";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function formatDocumentExpiration(value: string | null): string {
  if (!value) {
    return "—";
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-FR");
}
