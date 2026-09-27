import type { EChartsOption } from "echarts";

/** Human-readable metadata for a data key: label, color and optional icon. */
export interface ZardChartConfigItem {
  /** A CSS color: 'var(--chart-1)', '#2563eb', 'hsl(220 98% 61%)' or 'oklch(0.5 0.2 240)'. */
  color?: string;
  /** Icon name resolved through @ng-icons/lucide. */
  icon?: string;
  /** Human-readable label shown in tooltip and legend. */
  label?: string;
  /** Per-theme colors, taking precedence over `color`. */
  theme?: { light: string; dark: string };
}

/** Maps every data key to its label, color and icon. Decoupled from the data itself. */
export type ZardChartConfig = Record<string, ZardChartConfigItem>;

export type ZardChartType =
  | "area"
  | "bar"
  | "line"
  | "pie"
  | "radar"
  | "radial";

export type ZardChartTooltipIndicator = "dot" | "line" | "dashed";

export type ZardChartTooltipTrigger = "axis" | "item";

export type ZardChartGrid = boolean | "horizontal" | "vertical";

export type ZardChartStackOffset = "none" | "expand";

export type ZardChartRadialVariant = "bar" | "gauge";

export type ZardChartRadarShape = "polygon" | "circle";

export type ZardChartRenderer = "canvas" | "svg";

/** A single data row. Keys are data keys, values are numbers, strings or a `fill` color. */
export type ZardChartDatum = Record<string, unknown>;

/** Per-series overrides. Use when `zSeries: string[]` is not expressive enough. */
export interface ZardChartSeries {
  color?: string;
  dataKey: string;
  /**
   * ZardUI extension. Opacity of the filled band, for `area` and `radar` series.
   * Ignored when the chart renders a gradient fill.
   */
  fillOpacity?: number;
  label?: boolean;
  radius?: number | number[];
  showSymbol?: boolean;
  smooth?: boolean | number;
  stack?: string;
  step?: "start" | "middle" | "end";
  /** Stroke width of the line, or of a radar web's outline. */
  strokeWidth?: number;
  symbolSize?: number;
  type?: ZardChartType;
  yAxisIndex?: number;
}

/** Either the shorthand list of data keys or the fully described series. */
export type ZardChartSeriesInput =
  | readonly string[]
  | readonly ZardChartSeries[];

/** Escape hatch: deep-merged into the generated option, always winning. */
export type ZardChartOptionOverride = EChartsOption;

/** Colors of everything that is not a series: grid, axes, labels and surfaces. */
export interface ZardChartChromeColors {
  background: string;
  border: string;
  foreground: string;
  mutedForeground: string;
}

/** What the legend needs to render one entry, resolved by the parent chart. */
export interface ZardChartLegendEntry {
  color: string;
  /** The data key this entry came from. */
  dataKey: string;
  icon?: string;
  label: string;
  /** The name ECharts knows the series (or pie slice) by. */
  name: string;
}
