import { describe, expect, it } from "vitest";
import type { StatutSlice } from "./apercu";
import {
  pickSidePanelChartTile,
  statutSlicesToPieData,
  zardConfigFromSlices,
} from "./apercu-charts";

const slices: StatutSlice[] = [
  { count: 2, key: "DISPONIBLE", label: "Disponible", tone: "pine" },
  { count: 1, key: "EN_VOYAGE", label: "En voyage", tone: "ink" },
];

describe("apercu-charts", () => {
  it("maps slices to pie rows and config keys", () => {
    const data = statutSlicesToPieData(slices);
    expect(data).toEqual([
      { count: 2, statut: "DISPONIBLE" },
      { count: 1, statut: "EN_VOYAGE" },
    ]);
    const config = zardConfigFromSlices(slices);
    expect(config["DISPONIBLE"].label).toBe("Disponible");
    expect(config["DISPONIBLE"].color).toBe("var(--chart-1)");
  });

  it("picks side panel tile by module priority", () => {
    const tiles = [
      {
        destinationId: "commandes" as const,
        label: "Commandes",
        loading: false,
        slices,
      },
      {
        destinationId: "vehicules" as const,
        label: "Véhicules",
        loading: false,
        slices,
      },
    ];
    expect(pickSidePanelChartTile(tiles)?.destinationId).toBe("vehicules");
  });
});
