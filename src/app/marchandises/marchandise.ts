export interface Marchandise {
  actif: boolean;
  classeAdr: string | null;
  code: string;
  famille: string | null;
  gerbable: boolean;
  id: string;
  libelle: string;
  numeroOnu: string | null;
}

export interface MarchandiseWrite {
  classeAdr?: string;
  code: string;
  famille?: string;
  gerbable: boolean;
  libelle: string;
  numeroOnu?: string;
}

export interface MarchandiseDraft {
  classeAdr: string;
  code: string;
  famille: string;
  gerbable: boolean;
  libelle: string;
  numeroOnu: string;
}

export function emptyMarchandiseDraft(): MarchandiseDraft {
  return {
    classeAdr: "",
    code: "",
    famille: "",
    gerbable: true,
    libelle: "",
    numeroOnu: "",
  };
}

export function draftToWrite(draft: MarchandiseDraft): MarchandiseWrite {
  const body: MarchandiseWrite = {
    code: draft.code.trim().toUpperCase(),
    gerbable: draft.gerbable,
    libelle: draft.libelle.trim(),
  };
  const famille = draft.famille.trim();
  if (famille.length > 0) {
    body.famille = famille;
  }
  const classeAdr = draft.classeAdr.trim();
  if (classeAdr.length > 0) {
    body.classeAdr = classeAdr;
  }
  const numeroOnu = draft.numeroOnu.trim();
  if (numeroOnu.length > 0) {
    body.numeroOnu = numeroOnu;
  }
  return body;
}

export function gerbableLabel(gerbable: boolean): string {
  return gerbable ? "Gerbable" : "Non gerbable";
}

export function formatMarchandiseLabel(
  marchandise: Pick<Marchandise, "code" | "libelle">
): string {
  return `${marchandise.code} — ${marchandise.libelle}`;
}

export function marchandiseLabelFromLookup(
  marchandiseId: string,
  marchandisesById: ReadonlyMap<string, Pick<Marchandise, "code" | "libelle">>
): string {
  const marchandise = marchandisesById.get(marchandiseId);
  return marchandise ? formatMarchandiseLabel(marchandise) : marchandiseId;
}
