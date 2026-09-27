import type {
  ZardChartConfig,
  ZardChartDatum,
} from "@/shared/components/chart/chart.types";
import type { ApercuCountableId, ApercuTone, StatutSlice } from "./apercu";

export const APERCU_PIE_NAME_KEY = "statut";
export const APERCU_PIE_VALUE_KEY = "count";
export const APERCU_BAR_LABEL_KEY = "label";

const SIDE_PANEL_MODULE_ORDER: readonly ApercuCountableId[] = [
  "vehicules",
  "voyages",
  "dossiers",
  "commandes",
  "carburant",
];

export interface ApercuChartTileLike {
  destinationId: ApercuCountableId;
  label: string;
  loading: boolean;
  slices: StatutSlice[] | null;
}

export function apercuToneToChartColor(tone: ApercuTone): string {
  switch (tone) {
    case "pine":
      return "var(--chart-1)";
    case "amber":
      return "var(--chart-2)";
    case "muted":
      return "var(--chart-3)";
    case "brake":
      return "var(--chart-4)";
    case "ink":
      return "var(--chart-5)";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

export function zardConfigFromSlices(
  slices: readonly StatutSlice[]
): ZardChartConfig {
  const config: ZardChartConfig = {
    [APERCU_PIE_VALUE_KEY]: { label: "Nombre" },
  };
  for (const slice of slices) {
    config[slice.key] = {
      color: apercuToneToChartColor(slice.tone),
      label: slice.label,
    };
  }
  return config;
}

export function statutSlicesToPieData(
  slices: readonly StatutSlice[]
): ZardChartDatum[] {
  return slices.map((slice) => ({
    [APERCU_PIE_NAME_KEY]: slice.key,
    [APERCU_PIE_VALUE_KEY]: slice.count,
  }));
}

export function statutSlicesToBarData(
  slices: readonly StatutSlice[]
): ZardChartDatum[] {
  return slices.map((slice) => ({
    [APERCU_BAR_LABEL_KEY]: slice.label,
    [APERCU_PIE_VALUE_KEY]: slice.count,
    fill: apercuToneToChartColor(slice.tone),
  }));
}

export function apercuBarSeriesKeys(): readonly string[] {
  return [APERCU_PIE_VALUE_KEY];
}

export function pickSidePanelChartTile(
  tiles: readonly ApercuChartTileLike[]
): ApercuChartTileLike | null {
  for (const id of SIDE_PANEL_MODULE_ORDER) {
    const tile = tiles.find(
      (candidate) =>
        candidate.destinationId === id &&
        !candidate.loading &&
        candidate.slices !== null &&
        candidate.slices.length > 0
    );
    if (tile) {
      return tile;
    }
  }
  return null;
}
