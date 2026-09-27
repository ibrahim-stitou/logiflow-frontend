export interface AjouterDossierVoyageWrite {
  chargement: SelectionArretWrite;
  dechargement: SelectionArretWrite;
  deviationMaxPourcent?: number | null;
  dossierId: string;
}

export interface SelectionArretWrite {
  arretId?: string | null;
  nouvelArret?: NouvelArretWrite | null;
}

export interface NouvelArretWrite {
  latitude: number;
  libelle: string;
  longitude: number;
}

export interface VerifierAjoutDossierDeviation {
  detourKm: number;
  detourPercent: number;
  maxAllowedPercent: number;
  point: "dropoff" | "pickup";
}

export interface VerifierAjoutDossierTronconEchec {
  arretArriveeId: string;
  arretDepartId: string;
  depassementKg: number | null;
  depassementM3: number | null;
  motif: "volume" | "weight";
}

export interface VerifierAjoutDossierResult {
  compatible: boolean;
  deviation: VerifierAjoutDossierDeviation | null;
  failedLegs: VerifierAjoutDossierTronconEchec[];
}

export function deviationAjoutDossierMessage(
  deviation: VerifierAjoutDossierDeviation
): string {
  const libellePoint =
    deviation.point === "pickup" ? "chargement" : "déchargement";
  return `Ce point de ${libellePoint} est à ${deviation.detourKm.toFixed(1)} km / ${deviation.detourPercent.toFixed(1)} % hors itinéraire, au-delà de la limite de ${deviation.maxAllowedPercent.toFixed(1)} %.`;
}

export function capaciteAjoutDossierMessage(
  echecs: VerifierAjoutDossierTronconEchec[]
): string {
  if (echecs.length === 0) {
    return "Capacité insuffisante.";
  }
  const resume = echecs
    .map((echec) => {
      if (echec.motif === "weight" && echec.depassementKg != null) {
        return `poids +${echec.depassementKg.toFixed(0)} kg`;
      }
      if (echec.depassementM3 != null) {
        return `volume +${echec.depassementM3.toFixed(1)} m³`;
      }
      return echec.motif;
    })
    .join(", ");
  return `Capacité dépassée sur ${echecs.length} tronçon(s) : ${resume}.`;
}
