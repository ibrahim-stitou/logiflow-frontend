// biome-ignore lint/suspicious/noDeprecatedImports: prix négocié encore en EUR côté API (migration MAD à part).
import { eurMoney, formatMoney, type Money } from "../core/api/money";

export { formatMoney, type Money };

export const STATUT_COMMANDES = ["RECUE", "CONFIRMEE", "ANNULEE"] as const;
export type StatutCommande = (typeof STATUT_COMMANDES)[number];

/** Ligne telle que définie dans `LigneCommande` (OpenAPI). */
export interface LigneCommande {
  marchandiseId: string;
  nbColis: number;
  poidsKg: number;
  volumeM3: number;
}

/** Commande telle que renvoyée par l'API (`CommandeResponse`). */
export interface Commande {
  clientId: string;
  dateSouhaitee: string;
  id: string;
  lignes: LigneCommande[];
  prixNegocie: Money;
  reference: string;
  statut: StatutCommande;
}

/** Corps de création, calqué sur `CommandeRequest` côté backend. */
export interface CommandeWrite {
  clientId: string;
  dateSouhaitee: string;
  lignes: LigneCommande[];
  prixNegocie: Money;
}

export interface LigneCommandeDraft {
  marchandiseId: string;
  nbColis: number;
  poidsKg: number;
  volumeM3: number;
}

export type { Client, ClientWrite } from "../clients/client";
export { formatClientLabel } from "../clients/client";

export interface CommandeDraft {
  clientCode: string;
  clientId: string;
  clientRaisonSociale: string;
  dateSouhaitee: string;
  lignes: LigneCommandeDraft[];
  montant: number;
  nouveauClient: boolean;
}

export function emptyLigneCommandeDraft(): LigneCommandeDraft {
  return {
    marchandiseId: "",
    nbColis: 12,
    poidsKg: 1200,
    volumeM3: 8,
  };
}

export function emptyCommandeDraft(): CommandeDraft {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return {
    clientCode: "",
    clientId: "",
    clientRaisonSociale: "",
    dateSouhaitee: toDateInput(date),
    lignes: [emptyLigneCommandeDraft()],
    montant: 2000,
    nouveauClient: false,
  };
}

export function validateLignesCommande(
  lignes: LigneCommandeDraft[]
): string | null {
  if (lignes.length === 0) {
    return "Ajoutez au moins une ligne de marchandise.";
  }
  for (const [index, ligne] of lignes.entries()) {
    if (!ligne.marchandiseId.trim()) {
      return `Ligne ${index + 1} : choisissez une marchandise du catalogue.`;
    }
    if (ligne.poidsKg < 0) {
      return `Ligne ${index + 1} : le poids ne peut pas être négatif.`;
    }
    if (ligne.volumeM3 < 0) {
      return `Ligne ${index + 1} : le volume ne peut pas être négatif.`;
    }
    if (ligne.nbColis < 0) {
      return `Ligne ${index + 1} : le nombre de colis ne peut pas être négatif.`;
    }
  }
  return null;
}

export function isDateTodayOrFuture(isoDate: string): boolean {
  const today = toDateInput(new Date());
  return isoDate >= today;
}

export function draftToWrite(
  draft: CommandeDraft,
  clientId: string
): CommandeWrite {
  return {
    clientId,
    dateSouhaitee: draft.dateSouhaitee,
    lignes: draft.lignes.map((ligne) => ({
      marchandiseId: ligne.marchandiseId.trim(),
      nbColis: ligne.nbColis,
      poidsKg: ligne.poidsKg,
      volumeM3: ligne.volumeM3,
    })),
    prixNegocie: eurMoney(draft.montant),
  };
}

export function statutCommandeLabel(statut: StatutCommande): string {
  switch (statut) {
    case "RECUE":
      return "Reçue";
    case "CONFIRMEE":
      return "Confirmée";
    case "ANNULEE":
      return "Annulée";
    default: {
      const _exhaustive: never = statut;
      return _exhaustive;
    }
  }
}

export function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-FR");
}

export function formatCommandeLabel(
  commande: Pick<Commande, "reference" | "dateSouhaitee">
): string {
  return `${commande.reference} — ${formatDate(commande.dateSouhaitee)}`;
}

export function commandeLabelFromLookup(
  commandeId: string,
  commandesById: ReadonlyMap<
    string,
    Pick<Commande, "reference" | "dateSouhaitee">
  >
): string {
  const commande = commandesById.get(commandeId);
  return commande ? formatCommandeLabel(commande) : commandeId;
}

export function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
