import type { Dossier } from "../dossiers/dossier";
import type { Site } from "../sites/site";
import type { VoyageCapacite, VoyageCapaciteTroncon } from "./voyage-capacite";

interface PreviewStop {
  id: string;
  indiceSequence: number;
  libelle: string;
}

interface DossierSurTroncon {
  indiceChargement: number;
  indiceDechargement: number;
  poidsKg: number;
  volumeM3: number;
}

/** Estime la capacité remorque à partir des dossiers sélectionnés (avant création du voyage). */
export function buildCapacitePreview(
  capacitePoidsKg: number,
  capaciteVolumeM3: number,
  dossierIds: readonly string[],
  dossiersById: ReadonlyMap<
    string,
    Pick<Dossier, "poidsBrutKg" | "volumeM3" | "segments">
  >,
  sitesById: ReadonlyMap<string, Pick<Site, "libelle">>
): VoyageCapacite | null {
  if (dossierIds.length === 0) {
    return null;
  }

  const arrets = buildOrderedStops(dossierIds, dossiersById, sitesById);
  if (arrets.length < 2) {
    return null;
  }

  const dossiers = buildDossiersSurTroncons(dossierIds, dossiersById, arrets);
  const troncons = calculerTroncons(arrets, dossiers).map((troncon) =>
    avecPourcentages(troncon, capacitePoidsKg, capaciteVolumeM3)
  );

  return {
    arrets,
    capacitePoidsKg,
    capaciteVolumeM3,
    troncons,
  };
}

function buildOrderedStops(
  dossierIds: readonly string[],
  dossiersById: ReadonlyMap<string, Pick<Dossier, "segments">>,
  sitesById: ReadonlyMap<string, Pick<Site, "libelle">>
): PreviewStop[] {
  const stops: PreviewStop[] = [];
  const seenSiteIds = new Set<string>();

  for (const dossierId of dossierIds) {
    const dossier = dossiersById.get(dossierId);
    if (!dossier) {
      continue;
    }

    const segments = [...dossier.segments].sort(
      (left, right) => left.ordre - right.ordre
    );

    for (const segment of segments) {
      if (seenSiteIds.has(segment.siteId)) {
        continue;
      }

      const site = sitesById.get(segment.siteId);
      if (!site) {
        continue;
      }

      seenSiteIds.add(segment.siteId);
      stops.push({
        id: segment.siteId,
        indiceSequence: stops.length,
        libelle: site.libelle,
      });
    }
  }

  return stops;
}

function buildDossiersSurTroncons(
  dossierIds: readonly string[],
  dossiersById: ReadonlyMap<
    string,
    Pick<Dossier, "poidsBrutKg" | "volumeM3" | "segments">
  >,
  arrets: readonly PreviewStop[]
): DossierSurTroncon[] {
  const indices = new Map(
    arrets.map((arret) => [arret.id, arret.indiceSequence])
  );
  const dossiers: DossierSurTroncon[] = [];

  for (const dossierId of dossierIds) {
    const dossier = dossiersById.get(dossierId);
    if (!dossier) {
      continue;
    }

    const segments = [...dossier.segments].sort(
      (left, right) => left.ordre - right.ordre
    );
    const chargement = segments.find(
      (segment) => segment.type === "CHARGEMENT"
    );
    const dechargement = segments.find(
      (segment) => segment.type === "DECHARGEMENT"
    );
    if (!(chargement && dechargement)) {
      continue;
    }

    const indiceChargement = indices.get(chargement.siteId);
    const indiceDechargement = indices.get(dechargement.siteId);
    if (
      indiceChargement === undefined ||
      indiceDechargement === undefined ||
      indiceChargement >= indiceDechargement
    ) {
      continue;
    }

    dossiers.push({
      indiceChargement,
      indiceDechargement,
      poidsKg: dossier.poidsBrutKg,
      volumeM3: dossier.volumeM3,
    });
  }

  return dossiers;
}

function calculerTroncons(
  arrets: readonly PreviewStop[],
  dossiers: readonly DossierSurTroncon[]
): Omit<
  VoyageCapaciteTroncon,
  "pourcentageMax" | "pourcentagePoids" | "pourcentageVolume"
>[] {
  const nbArrets = arrets.length;
  const poidsDiff = Array.from({ length: nbArrets }, () => 0);
  const volumeDiff = Array.from({ length: nbArrets }, () => 0);

  for (const dossier of dossiers) {
    poidsDiff[dossier.indiceChargement] += dossier.poidsKg;
    poidsDiff[dossier.indiceDechargement] -= dossier.poidsKg;
    volumeDiff[dossier.indiceChargement] += dossier.volumeM3;
    volumeDiff[dossier.indiceDechargement] -= dossier.volumeM3;
  }

  const troncons: Omit<
    VoyageCapaciteTroncon,
    "pourcentageMax" | "pourcentagePoids" | "pourcentageVolume"
  >[] = [];
  let poidsCumul = 0;
  let volumeCumul = 0;

  for (let indice = 0; indice < nbArrets - 1; indice += 1) {
    poidsCumul += poidsDiff[indice];
    volumeCumul += volumeDiff[indice];
    troncons.push({
      arretArriveeId: arrets[indice + 1].id,
      arretDepartId: arrets[indice].id,
      indiceTroncon: indice,
      poidsUtiliseKg: poidsCumul,
      volumeUtiliseM3: volumeCumul,
    });
  }

  return troncons;
}

function avecPourcentages(
  troncon: Omit<
    VoyageCapaciteTroncon,
    "pourcentageMax" | "pourcentagePoids" | "pourcentageVolume"
  >,
  capacitePoidsKg: number,
  capaciteVolumeM3: number
): VoyageCapaciteTroncon {
  const pourcentagePoids =
    capacitePoidsKg > 0 ? (troncon.poidsUtiliseKg / capacitePoidsKg) * 100 : 0;
  const pourcentageVolume =
    capaciteVolumeM3 > 0
      ? (troncon.volumeUtiliseM3 / capaciteVolumeM3) * 100
      : 0;

  return {
    ...troncon,
    pourcentageMax: Math.max(pourcentagePoids, pourcentageVolume),
    pourcentagePoids,
    pourcentageVolume,
  };
}
