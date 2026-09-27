import type { EChartsOption } from "echarts";
import type {
  ZardChartChromeColors,
  ZardChartConfig,
  ZardChartDatum,
  ZardChartGrid,
  ZardChartLegendEntry,
  ZardChartRadarShape,
  ZardChartRadialVariant,
  ZardChartSeries,
  ZardChartSeriesInput,
  ZardChartStackOffset,
  ZardChartType,
} from "./chart.types";
import { buildArcLabels, resolveRadius } from "./chart-arc-label.util";
import { paletteColor, withAlpha } from "./chart-colors.util";
import {
  buildTooltipHtml,
  type ZardChartTooltipContext,
  type ZardChartTooltipParam,
} from "./chart-tooltip.formatter";

/** Bars keep shadcn's default corner radius unless a series overrides it. */
const DEFAULT_BAR_RADIUS = 4;
const DEFAULT_SYMBOL_SIZE = 8;
/**
 * Horizontal breathing room for the plot area, in pixels. Lines and areas sit flush against the
 * axis ends (`boundaryGap: false`), so without it the first and last point are drawn half outside
 * the canvas — the same reason every shadcn area/line chart passes `margin={{ left: 12, right: 12 }}`.
 */
const CURVE_GRID_INSET = 12;
/** Keeps the donut's centre reading above anything a chart paints behind its ring. */
const CENTER_TEXT_Z = 100;
const DEFAULT_AREA_OPACITY = 0.4;
const DEFAULT_RADAR_OPACITY = 0.6;
const DEFAULT_RADAR_STROKE = 1;
const DEFAULT_RADAR_RADIUS = "72%";
const IMPLICIT_STACK_ID = "zard-stack";

/**
 * Entry motion. A chart is watched once, when it appears, so it can afford to be explanatory —
 * but Recharts' 1.5s `ease` reads as sluggish across a grid of them. This is the same gesture,
 * shortened, on a strong ease-out: fast off the mark, settling at the end, where the eye is.
 */
const ENTRY_DURATION = 700;
const ENTRY_EASING = "quinticOut";
/** Re-drawing after a toggle is movement on screen, not an entrance: quicker, and eased both ends. */
const UPDATE_DURATION = 250;

/** Everything the builder needs. Pure data plus one color resolver, so it stays testable. */
export interface ZardChartBuildContext {
  accessibility: boolean;
  animation: boolean;
  brush: boolean;
  centerLabel?: string;
  centerValue?: string;
  chrome: ZardChartChromeColors;
  /** True on touch, where a tooltip has to survive the finger lifting. */
  coarsePointer: boolean;
  /** Series colors already resolved from `zConfig` for the active theme, keyed by data key. */
  colors: Record<string, string>;
  config: ZardChartConfig;
  data: readonly ZardChartDatum[];
  dataZoom: boolean;
  endAngle?: number;
  fontFamily: string;
  gradient: boolean;
  grid: ZardChartGrid;
  hasLegend: boolean;
  horizontal: boolean;
  innerRadius?: string | number;
  label: boolean;
  nameKey?: string;
  outerRadius?: string | number;
  padAngle: number;
  /** Radar only: the spokes running from the centre to each indicator. */
  radarRadialLines: boolean;
  radarShape: ZardChartRadarShape;
  /** Radial only: writes each category's name along its own ring. */
  radialLabel: boolean;
  radialVariant: ZardChartRadialVariant;
  /** Turns `var(--token)` into a literal ECharts can paint with. */
  resolveColor: (value: string) => string;
  series: ZardChartSeriesInput;
  /** The canvas, in pixels. Zero until the chart has been laid out. */
  size: { width: number; height: number };
  stacked: boolean;
  stackOffset: ZardChartStackOffset;
  startAngle?: number;
  toolbox: boolean;
  tooltip:
    | (Omit<ZardChartTooltipContext, "colors" | "config"> & { cursor: boolean })
    | null;
  /** Radial only: the muted ring drawn behind each bar. */
  track: boolean;
  type: ZardChartType;
  xAxis: boolean;
  xAxisFormatter?: (value: string) => string;
  xAxisKey?: string;
  yAxis: boolean;
  yAxisFormatter?: (value: number) => string;
}

type OptionRecord = Record<string, unknown>;

export function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Accepts both the `string[]` shorthand and the fully described `ZardChartSeries[]`. */
export function normalizeSeries(
  input: ZardChartSeriesInput | undefined
): ZardChartSeries[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.map((item) =>
    typeof item === "string" ? { dataKey: item } : { ...item }
  );
}

function labelFor(config: ZardChartConfig, key: string): string {
  return config[key]?.label ?? key;
}

function colorFor(
  ctx: ZardChartBuildContext,
  key: string,
  index: number,
  declared?: string
): string {
  if (declared) {
    return ctx.resolveColor(declared);
  }
  const resolved = ctx.colors[key];
  if (resolved) {
    return resolved;
  }
  return ctx.resolveColor(paletteColor(index));
}

/** Reads a row's category, honouring `zNameKey` before falling back to `zXAxisKey`. */
function categoryOf(ctx: ZardChartBuildContext, row: ZardChartDatum): string {
  const key = ctx.nameKey ?? ctx.xAxisKey;
  return key ? String(row[key] ?? "") : "";
}

/** `stackOffset="expand"` has no ECharts counterpart — normalise the rows to 0-1 first. */
function expandRow(
  row: ZardChartDatum,
  keys: string[]
): Record<string, number | null> {
  const total = keys.reduce(
    (sum, key) => sum + Math.abs(toNumber(row[key]) ?? 0),
    0
  );
  const normalized: Record<string, number | null> = {};

  for (const key of keys) {
    const value = toNumber(row[key]);
    normalized[key] = value === null ? null : total === 0 ? 0 : value / total;
  }

  return normalized;
}

/** A cartesian data point: a bare number, or an object when the row styles itself. */
type CartesianPoint = number | null | OptionRecord;

/**
 * Per-point overrides a row may carry, mirroring what Recharts expresses with `<Cell>`:
 * `fill` for the color, plus `itemStyle` and `label` for anything else about that one point.
 */
function pointStyleOf(
  ctx: ZardChartBuildContext,
  row: ZardChartDatum
): OptionRecord | undefined {
  const fill =
    typeof row["fill"] === "string"
      ? ctx.resolveColor(row["fill"] as string)
      : undefined;
  const declared = isPlainObject(row["itemStyle"])
    ? row["itemStyle"]
    : undefined;
  const label = isPlainObject(row["label"]) ? row["label"] : undefined;

  if (!fill && !declared && !label) {
    return undefined;
  }

  const itemStyle = { ...(fill ? { color: fill } : {}), ...(declared ?? {}) };

  return {
    ...(Object.keys(itemStyle).length > 0 ? { itemStyle } : {}),
    ...(label ? { label } : {}),
  };
}

function seriesValues(
  ctx: ZardChartBuildContext,
  definitions: ZardChartSeries[]
): Map<string, CartesianPoint[]> {
  const keys = definitions.map((definition) => definition.dataKey);
  const values = new Map<string, CartesianPoint[]>(
    keys.map((key) => [key, []])
  );

  for (const row of ctx.data) {
    const source = ctx.stackOffset === "expand" ? expandRow(row, keys) : row;
    const style = pointStyleOf(ctx, row);

    for (const key of keys) {
      const value = toNumber(source[key]);
      values.get(key)?.push(style ? { value, ...style } : value);
    }
  }

  return values;
}

function stackIdOf(
  ctx: ZardChartBuildContext,
  definition: ZardChartSeries
): string | undefined {
  if (definition.stack) {
    return definition.stack;
  }
  return ctx.stacked ? IMPLICIT_STACK_ID : undefined;
}

/** Only the outermost bar of a stack is rounded, exactly like Recharts. */
function barRadius(
  ctx: ZardChartBuildContext,
  definition: ZardChartSeries,
  isStackTop: boolean
): number | number[] | undefined {
  const declared = definition.radius ?? DEFAULT_BAR_RADIUS;
  if (Array.isArray(declared)) {
    return declared;
  }
  if (!isStackTop) {
    return 0;
  }
  return ctx.horizontal
    ? [0, declared, declared, 0]
    : [declared, declared, 0, 0];
}

function areaFill(
  ctx: ZardChartBuildContext,
  color: string,
  definition: ZardChartSeries
): OptionRecord {
  if (ctx.gradient) {
    return {
      color: {
        colorStops: [
          { color: withAlpha(color, 0.8), offset: 0 },
          { color: withAlpha(color, 0.1), offset: 1 },
        ],
        type: "linear",
        x: 0,
        x2: 0,
        y: 0,
        y2: 1,
      },
    };
  }

  return { color, opacity: definition.fillOpacity ?? DEFAULT_AREA_OPACITY };
}

function seriesLabelOption(
  ctx: ZardChartBuildContext,
  definition: ZardChartSeries
): OptionRecord {
  const show = definition.label ?? ctx.label;
  if (!show) {
    return { show: false };
  }

  return {
    color: ctx.chrome.foreground,
    distance: 6,
    fontSize: 12,
    position: ctx.horizontal ? "right" : "top",
    show: true,
  };
}

function gridVisibility(grid: ZardChartGrid): {
  horizontal: boolean;
  vertical: boolean;
} {
  return {
    horizontal: grid === true || grid === "horizontal",
    vertical: grid === true || grid === "vertical",
  };
}

function buildAxes(
  ctx: ZardChartBuildContext,
  definitions: ZardChartSeries[],
  categories: string[]
): OptionRecord {
  const lines = gridVisibility(ctx.grid);
  const hasBars = definitions.some(
    (definition) => (definition.type ?? ctx.type) === "bar"
  );

  const categoryAxis: OptionRecord = {
    axisLabel: {
      color: ctx.chrome.mutedForeground,
      fontSize: 12,
      hideOverlap: true,
      margin: 8,
      // `zXAxis` and `zXAxisFormatter` both address the category axis, whichever way the chart is
      // turned — the same pairing shadcn gets from `<XAxis dataKey>` plus its `tickFormatter`.
      show: ctx.xAxis,
      ...(ctx.xAxisFormatter
        ? { formatter: (value: string) => ctx.xAxisFormatter?.(value) ?? value }
        : {}),
    },
    axisLine: { show: false },
    axisTick: { show: false },
    boundaryGap: hasBars,
    data: categories,
    // `border/50`, like shadcn's `[&_.recharts-cartesian-grid_line]:stroke-border/50`. `opacity`
    // multiplies the token's own alpha instead of replacing it, which `--border` already carries.
    splitLine: {
      lineStyle: { color: ctx.chrome.border, opacity: 0.5 },
      show: false,
    },
    type: "category",
  };

  const valueAxis: OptionRecord = {
    axisLabel: {
      color: ctx.chrome.mutedForeground,
      fontSize: 12,
      margin: 8,
      // Likewise `zYAxis` and `zYAxisFormatter` always address the value axis.
      show: ctx.yAxis,
      ...(ctx.yAxisFormatter
        ? {
            formatter: (value: number) =>
              ctx.yAxisFormatter?.(value) ?? String(value),
          }
        : {}),
    },
    axisLine: { show: false },
    axisTick: { show: false },
    // `border/50`, like shadcn's `[&_.recharts-cartesian-grid_line]:stroke-border/50`. `opacity`
    // multiplies the token's own alpha instead of replacing it, which `--border` already carries.
    splitLine: {
      lineStyle: { color: ctx.chrome.border, opacity: 0.5 },
      show: false,
    },
    type: "value",
    ...(ctx.stackOffset === "expand" ? { max: 1, min: 0 } : {}),
  };

  const xAxis = ctx.horizontal ? valueAxis : categoryAxis;
  const yAxis = ctx.horizontal ? categoryAxis : valueAxis;

  // `splitLine` of the Y axis always draws horizontal lines, whichever way the chart is turned.
  (yAxis["splitLine"] as OptionRecord)["show"] = lines.horizontal;
  (xAxis["splitLine"] as OptionRecord)["show"] = lines.vertical;

  if (ctx.horizontal) {
    yAxis["inverse"] = true;
  }

  return { xAxis, yAxis };
}

function buildCartesianSeries(
  ctx: ZardChartBuildContext,
  definitions: ZardChartSeries[]
): OptionRecord[] {
  const values = seriesValues(ctx, definitions);
  const lastOfStack = new Map<string, number>();

  definitions.forEach((definition, index) => {
    const stack = stackIdOf(ctx, definition);
    if (stack) {
      lastOfStack.set(stack, index);
    }
  });

  return definitions.map((definition, index) => {
    const type = definition.type ?? ctx.type;
    const isBar = type === "bar";
    const isArea = type === "area";
    const color = colorFor(ctx, definition.dataKey, index, definition.color);
    const stack = stackIdOf(ctx, definition);
    const isStackTop = !stack || lastOfStack.get(stack) === index;

    const series: OptionRecord = {
      data: values.get(definition.dataKey) ?? [],
      id: definition.dataKey,
      itemStyle: {
        color,
        ...(isBar
          ? { borderRadius: barRadius(ctx, definition, isStackTop) }
          : {}),
      },
      name: labelFor(ctx.config, definition.dataKey),
      type: isBar ? "bar" : "line",
      // Recharts sets a hair of space between the bars of a group; ECharts leaves a third of a bar.
      ...(isBar ? { barGap: "5%", emphasis: { disabled: true } } : {}),
      animation: ctx.animation,
      label: seriesLabelOption(ctx, definition),
      ...(stack ? { stack } : {}),
      ...(definition.yAxisIndex === undefined
        ? {}
        : { yAxisIndex: definition.yAxisIndex }),
    };

    if (!isBar) {
      const area = isArea ? areaFill(ctx, color, definition) : undefined;

      series["lineStyle"] = { color, width: definition.strokeWidth ?? 2 };
      series["smooth"] = definition.smooth ?? false;
      series["showSymbol"] = definition.showSymbol ?? false;
      series["symbol"] = "circle";
      series["symbolSize"] = definition.symbolSize ?? DEFAULT_SYMBOL_SIZE;
      series["emphasis"] = { focus: "none" };
      // An axis tooltip highlights one point, which fades the rest of the line to nothing.
      // Recharts only adds an active dot, so pin the blur state to the normal one.
      series["blur"] = {
        itemStyle: { opacity: 1 },
        lineStyle: { opacity: 1 },
        ...(area
          ? { areaStyle: { opacity: (area["opacity"] as number) ?? 1 } }
          : {}),
      };
      if (definition.step) {
        series["step"] = definition.step;
      }
      if (area) {
        series["areaStyle"] = area;
      }
    }

    return series;
  });
}

/**
 * ECharts lays radar indicators out counter-clockwise from the top; Recharts goes clockwise.
 * Keeping the first row at twelve o'clock and reversing the rest flips the direction without
 * moving the starting point.
 */
function clockwise<T>(items: readonly T[]): T[] {
  const [first, ...rest] = items;
  return first === undefined ? [] : [first, ...rest.reverse()];
}

function buildRadar(
  ctx: ZardChartBuildContext,
  definitions: ZardChartSeries[]
): OptionRecord {
  const lines = gridVisibility(ctx.grid);
  const gridVisible = lines.horizontal || lines.vertical;
  const indicators = clockwise(
    ctx.data.map((row) => ({ name: categoryOf(ctx, row) }))
  );

  const data = definitions.map((definition, index) => {
    const color = colorFor(ctx, definition.dataKey, index, definition.color);
    const opacity = definition.fillOpacity ?? DEFAULT_RADAR_OPACITY;

    return {
      itemStyle: { color },
      lineStyle: {
        color,
        width: definition.strokeWidth ?? DEFAULT_RADAR_STROKE,
      },
      name: labelFor(ctx.config, definition.dataKey),
      symbol: (definition.showSymbol ?? false) ? "circle" : "none",
      symbolSize: definition.symbolSize ?? DEFAULT_SYMBOL_SIZE,
      value: clockwise(
        ctx.data.map((row) => toNumber(row[definition.dataKey]))
      ),
      ...(opacity > 0 ? { areaStyle: { color, opacity } } : {}),
      label: seriesLabelOption(ctx, definition),
    };
  });

  return {
    radar: {
      axisLine: {
        lineStyle: { color: ctx.chrome.border },
        show: gridVisible && ctx.radarRadialLines,
      },
      axisName: { color: ctx.chrome.mutedForeground, fontSize: 12 },
      indicator: indicators,
      // Recharts sizes the web off the container, not off however much room the names leave.
      radius: ctx.outerRadius ?? DEFAULT_RADAR_RADIUS,
      shape: ctx.radarShape,
      splitArea: { show: false },
      splitLine: { lineStyle: { color: ctx.chrome.border }, show: gridVisible },
    },
    series: [{ animation: ctx.animation, data, type: "radar" }],
  };
}

function buildPie(
  ctx: ZardChartBuildContext,
  definitions: ZardChartSeries[]
): OptionRecord {
  const [definition] = definitions;
  const valueKey = definition?.dataKey ?? "";

  const data = ctx.data.map((row, index) => {
    const name = categoryOf(ctx, row);
    const declared =
      typeof row["fill"] === "string" ? (row["fill"] as string) : undefined;

    return {
      itemStyle: {
        color: colorFor(ctx, name, index, declared ?? definition?.color),
      },
      name: labelFor(ctx.config, name),
      value: toNumber(row[valueKey]) ?? 0,
    };
  });

  return {
    series: [
      {
        animation: ctx.animation,
        avoidLabelOverlap: true,
        center: ["50%", "50%"],
        // Recharts walks a pie counter-clockwise from twelve o'clock; ECharts goes the other way.
        clockwise:
          ctx.startAngle !== undefined && ctx.endAngle !== undefined
            ? ctx.endAngle < ctx.startAngle
            : false,
        data,
        itemStyle: {
          borderColor: ctx.chrome.background,
          borderWidth: definitions[0]?.strokeWidth ?? 0,
        },
        label: {
          color: ctx.chrome.foreground,
          fontSize: 12,
          formatter: "{c}",
          show: ctx.label,
        },
        labelLine: { lineStyle: { color: ctx.chrome.border }, show: ctx.label },
        padAngle: ctx.padAngle,
        radius: [ctx.innerRadius ?? 0, ctx.outerRadius ?? "80%"],
        // Recharts starts a pie at three o'clock, not twelve.
        startAngle: ctx.startAngle ?? 0,
        type: "pie",
        ...(ctx.endAngle === undefined ? {} : { endAngle: ctx.endAngle }),
      },
    ],
  };
}

/** Reproduces the polar layout ECharts is about to compute, so the labels can ride the rings. */
function arcLabels(
  ctx: ZardChartBuildContext,
  names: string[]
): OptionRecord[] {
  const { width, height } = ctx.size;
  if (width <= 0 || height <= 0 || names.length === 0) {
    return [];
  }

  const base = Math.min(width, height) / 2;
  const inner = resolveRadius(ctx.innerRadius, base, base * 0.3);
  const outer = resolveRadius(ctx.outerRadius, base, base * 0.9);
  const band = (outer - inner) / names.length;
  const fontSize = 11;

  return buildArcLabels(names, {
    ascending: (ctx.endAngle ?? 360) >= (ctx.startAngle ?? 90),
    cx: width / 2,
    cy: height / 2,
    fill: "#fff",
    font: `${fontSize}px ${ctx.fontFamily}`,
    fontSize,
    radii: names.map((_, index) => inner + band * (index + 0.5)),
    startAngle: ctx.startAngle ?? 90,
  });
}

function buildRadialBar(
  ctx: ZardChartBuildContext,
  definitions: ZardChartSeries[]
): OptionRecord {
  const [definition] = definitions;
  const stacked = definitions.length > 1;
  const names = stacked
    ? definitions.map((item) => labelFor(ctx.config, item.dataKey))
    : ctx.data.map((row) => labelFor(ctx.config, categoryOf(ctx, row)));

  const rowValues = stacked
    ? definitions.map((item) => toNumber(ctx.data[0]?.[item.dataKey]) ?? 0)
    : ctx.data.map((row) => toNumber(row[definition?.dataKey ?? ""]) ?? 0);

  const max = Math.max(...rowValues, 0) || 1;
  const track = withAlpha(ctx.chrome.mutedForeground, 0.15);

  const series: OptionRecord[] = [];

  if (stacked) {
    // Every series shares one ring, so only the outermost segment gets a rounded cap.
    definitions.forEach((item, index) => {
      series.push({
        animation: ctx.animation,
        coordinateSystem: "polar",
        data: [rowValues[index]],
        itemStyle: { color: colorFor(ctx, item.dataKey, index, item.color) },
        name: labelFor(ctx.config, item.dataKey),
        roundCap: index === definitions.length - 1,
        stack: IMPLICIT_STACK_ID,
        type: "bar",
      });
    });
  } else {
    const data = ctx.data.map((row, index) => {
      const name = categoryOf(ctx, row);
      const declared =
        typeof row["fill"] === "string" ? (row["fill"] as string) : undefined;

      return {
        itemStyle: {
          color: colorFor(ctx, name, index, declared ?? definition?.color),
        },
        value: toNumber(row[definition?.dataKey ?? ""]) ?? 0,
      };
    });

    series.push({
      animation: ctx.animation,
      backgroundStyle: { color: track },
      // Recharts leaves barely a hair between the rings; ECharts' default gap is four times that.
      barCategoryGap: "10%",
      coordinateSystem: "polar",
      data,
      name: labelFor(ctx.config, definition?.dataKey ?? ""),
      roundCap: true,
      showBackground: ctx.track,
      type: "bar",
    });
  }

  return {
    ...(ctx.radialLabel && !stacked ? { graphic: arcLabels(ctx, names) } : {}),
    angleAxis: {
      max: stacked
        ? rowValues.reduce((sum, value) => sum + value, 0) || 1
        : max,
      min: 0,
      show: false,
      type: "value",
      // Recharts reads the two angles as a direction: 180 → 0 sweeps clockwise, -90 → 380
      // counter-clockwise. ECharts needs that spelled out.
      ...(ctx.startAngle === undefined || ctx.endAngle === undefined
        ? {}
        : { clockwise: ctx.endAngle < ctx.startAngle }),
      ...(ctx.startAngle === undefined ? {} : { startAngle: ctx.startAngle }),
      ...(ctx.endAngle === undefined ? {} : { endAngle: ctx.endAngle }),
    },
    polar: {
      center: ["50%", "50%"],
      radius: [ctx.innerRadius ?? "30%", ctx.outerRadius ?? "90%"],
    },
    radiusAxis: {
      data: stacked ? [names.join(" / ")] : names,
      show: false,
      type: "category",
      z: 10,
    },
    series,
  };
}

function buildRadialGauge(
  ctx: ZardChartBuildContext,
  definitions: ZardChartSeries[]
): OptionRecord {
  const [definition] = definitions;
  const row = ctx.data[0] ?? {};
  const value = toNumber(row[definition?.dataKey ?? ""]) ?? 0;
  const declared =
    typeof row["fill"] === "string" ? (row["fill"] as string) : undefined;
  const color = colorFor(
    ctx,
    categoryOf(ctx, row),
    0,
    declared ?? definition?.color
  );
  const track = withAlpha(ctx.chrome.mutedForeground, 0.15);
  const width = 26;

  return {
    series: [
      {
        animation: ctx.animation,
        axisLabel: { show: false },
        axisLine: { lineStyle: { color: [[1, track]], width }, roundCap: true },
        axisTick: { show: false },
        center: ["50%", "50%"],
        data: [
          { name: labelFor(ctx.config, definition?.dataKey ?? ""), value },
        ],
        detail: { show: false },
        endAngle: ctx.endAngle ?? -270,
        max: Math.max(value, 1) * 1.25,
        min: 0,
        pointer: { show: false },
        progress: { itemStyle: { color }, roundCap: true, show: true, width },
        radius: ctx.outerRadius ?? "85%",
        splitLine: { show: false },
        startAngle: ctx.startAngle ?? 90,
        title: { show: false },
        type: "gauge",
      },
    ],
  };
}

/**
 * shadcn nests a `<Label content={…} />` in the donut; ECharts needs `graphic` text nodes.
 *
 * The nodes are positioned with plain `x`/`y` inside the group — `left`/`top` would override
 * them and stack the value and the caption on the very same pixel.
 */
function buildCenterText(ctx: ZardChartBuildContext): OptionRecord[] {
  if (!ctx.centerValue && !ctx.centerLabel) {
    return [];
  }

  const children: OptionRecord[] = [];
  const hasBoth = !!ctx.centerValue && !!ctx.centerLabel;

  if (ctx.centerValue) {
    children.push({
      style: {
        align: "center",
        fill: ctx.chrome.foreground,
        fontSize: 36,
        fontWeight: 700,
        text: ctx.centerValue,
        textAlign: "center",
        textVerticalAlign: "middle",
        verticalAlign: "middle",
      },
      type: "text",
      x: 0,
      y: 0,
      z: CENTER_TEXT_Z,
    });
  }

  if (ctx.centerLabel) {
    children.push({
      style: {
        align: "center",
        fill: ctx.chrome.mutedForeground,
        fontSize: 12,
        text: ctx.centerLabel,
        textAlign: "center",
        textVerticalAlign: "middle",
        verticalAlign: "middle",
      },
      type: "text",
      x: 0,
      y: hasBoth ? 24 : 0,
      z: CENTER_TEXT_Z,
    });
  }

  return children;
}

function buildTooltip(
  ctx: ZardChartBuildContext,
  legendEntries: ZardChartLegendEntry[]
): OptionRecord | undefined {
  if (!ctx.tooltip) {
    return undefined;
  }

  const colors: Record<string, string> = {};
  for (const entry of legendEntries) {
    colors[entry.name] = entry.color;
  }

  // A radar arrives as one param holding every indicator, so the tooltip needs their names.
  const indicators =
    ctx.type === "radar"
      ? clockwise(
          ctx.data.map((row) => labelFor(ctx.config, categoryOf(ctx, row)))
        )
      : undefined;

  const context: ZardChartTooltipContext = {
    ...ctx.tooltip,
    colors,
    config: ctx.config,
    indicators,
  };

  const hasBars = normalizeSeries(ctx.series).some(
    (definition) => (definition.type ?? ctx.type) === "bar"
  );
  const cursor = ctx.tooltip.cursor
    ? hasBars
      ? {
          shadowStyle: { color: withAlpha(ctx.chrome.mutedForeground, 0.15) },
          type: "shadow",
        }
      : { lineStyle: { color: ctx.chrome.border, width: 1 }, type: "line" }
    : { type: "none" };

  return {
    appendToBody: false,
    axisPointer: cursor,
    backgroundColor: "transparent",
    borderWidth: 0,
    // Recharts keeps its tooltip inside the responsive container; ECharts would let it
    // spill over whatever sits next to the chart.
    confine: true,
    extraCssText: "box-shadow:none;",
    formatter: (params: ZardChartTooltipParam | ZardChartTooltipParam[]) =>
      buildTooltipHtml(params, context),
    padding: 0,
    trigger: ctx.tooltip.trigger,
    // A tap is a hover that ends immediately, so on touch the tooltip would flash and vanish.
    // Binding it to the click alone keeps it up until the next tap, the way Recharts behaves.
    triggerOn: ctx.coarsePointer ? "click" : "mousemove|click",
  };
}

/** One legend entry per series — or per slice, for the single-series chart types. */
export function buildLegendEntries(
  ctx: ZardChartBuildContext
): ZardChartLegendEntry[] {
  const definitions = normalizeSeries(ctx.series);
  const perSlice =
    ctx.type === "pie" || (ctx.type === "radial" && definitions.length <= 1);

  if (perSlice) {
    return ctx.data.map((row, index) => {
      const name = categoryOf(ctx, row);
      const declared =
        typeof row["fill"] === "string" ? (row["fill"] as string) : undefined;

      return {
        color: colorFor(ctx, name, index, declared),
        dataKey: name,
        icon: ctx.config[name]?.icon,
        label: labelFor(ctx.config, name),
        name: labelFor(ctx.config, name),
      };
    });
  }

  return definitions.map((definition, index) => ({
    color: colorFor(ctx, definition.dataKey, index, definition.color),
    dataKey: definition.dataKey,
    icon: ctx.config[definition.dataKey]?.icon,
    label: labelFor(ctx.config, definition.dataKey),
    name: labelFor(ctx.config, definition.dataKey),
  }));
}

function isPlainObject(value: unknown): value is OptionRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep-merges the `[zOption]` escape hatch over the generated option. Arrays merge
 * index by index so `{ series: [{ symbolSize: 12 }] }` patches the first series
 * instead of replacing the whole list.
 */
export function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(base) && Array.isArray(override)) {
    const length = Math.max(base.length, override.length);
    const merged = [];
    for (let index = 0; index < length; index++) {
      merged.push(
        index >= override.length
          ? base[index]
          : deepMerge(base[index], override[index])
      );
    }
    return merged as T;
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const merged: OptionRecord = { ...base };
    for (const [key, value] of Object.entries(override)) {
      merged[key] = key in base ? deepMerge(base[key], value) : value;
    }
    return merged as T;
  }

  return override as T;
}

/**
 * Resolves every `var(--token)` left anywhere in the option. The builder already resolves the
 * colors it produces, but `[zOption]` is authored by hand — and ECharts silently falls back to
 * black when it meets a `var()` it cannot parse, so the escape hatch has to be swept too.
 */
export function resolveOptionColors<T>(
  option: T,
  resolveColor: (value: string) => string
): T {
  if (typeof option === "string") {
    return (option.startsWith("var(--") ? resolveColor(option) : option) as T;
  }

  if (Array.isArray(option)) {
    return option.map((item) => resolveOptionColors(item, resolveColor)) as T;
  }

  if (isPlainObject(option)) {
    const resolved: OptionRecord = {};
    for (const [key, value] of Object.entries(option)) {
      resolved[key] = resolveOptionColors(value, resolveColor);
    }
    return resolved as T;
  }

  return option;
}

/** Turns a `ZardChartConfig` plus the component inputs into a complete `EChartsOption`. */
export function buildChartOption(ctx: ZardChartBuildContext): EChartsOption {
  const definitions = normalizeSeries(ctx.series);
  const legendEntries = buildLegendEntries(ctx);
  const isCartesian =
    ctx.type === "area" || ctx.type === "bar" || ctx.type === "line";

  const option: OptionRecord = {
    animation: ctx.animation,
    animationDuration: ENTRY_DURATION,
    animationDurationUpdate: UPDATE_DURATION,
    animationEasing: ENTRY_EASING,
    animationEasingUpdate: "cubicInOut",
    aria: { enabled: ctx.accessibility },
    color: legendEntries.map((entry) => entry.color),
    textStyle: { fontFamily: "inherit" },
  };

  if (isCartesian) {
    const categories = ctx.data.map((row) =>
      String(row[ctx.xAxisKey ?? ""] ?? "")
    );
    Object.assign(option, buildAxes(ctx, definitions, categories));
    const inset =
      ctx.horizontal ||
      definitions.some((definition) => (definition.type ?? ctx.type) === "bar")
        ? 0
        : CURVE_GRID_INSET;
    option["grid"] = {
      bottom: 0,
      left: inset,
      outerBoundsContain: "axisLabel",
      outerBoundsMode: "same",
      right: inset,
      top: 12,
    };
    option["series"] = buildCartesianSeries(ctx, definitions);
  } else if (ctx.type === "radar") {
    Object.assign(option, buildRadar(ctx, definitions));
  } else if (ctx.type === "pie") {
    Object.assign(option, buildPie(ctx, definitions));
  } else {
    Object.assign(
      option,
      ctx.radialVariant === "gauge"
        ? buildRadialGauge(ctx, definitions)
        : buildRadialBar(ctx, definitions)
    );
  }

  const tooltip = buildTooltip(ctx, legendEntries);
  if (tooltip) {
    option["tooltip"] = tooltip;
  }

  // The legend stays hidden — `z-chart-legend` renders the shadcn markup — but it must be
  // declared so `dispatchAction({ type: 'legendToggleSelect' })` has something to act on.
  if (ctx.hasLegend) {
    option["legend"] = {
      data: legendEntries.map((entry) => entry.name),
      show: false,
    };
  }

  const centerText = buildCenterText(ctx);
  if (centerText.length > 0) {
    // A radial chart may already have put its ring labels here; the centre joins them.
    const existing = Array.isArray(option["graphic"])
      ? (option["graphic"] as OptionRecord[])
      : [];
    option["graphic"] = [
      ...existing,
      { children: centerText, left: "center", top: "center", type: "group" },
    ];
  }

  if (ctx.dataZoom && isCartesian) {
    option["dataZoom"] = [
      { type: "inside" },
      {
        backgroundColor: "transparent",
        borderColor: ctx.chrome.border,
        bottom: 0,
        fillerColor: withAlpha(ctx.chrome.mutedForeground, 0.12),
        handleStyle: {
          borderColor: ctx.chrome.border,
          color: ctx.chrome.background,
        },
        height: 18,
        textStyle: { color: ctx.chrome.mutedForeground },
        type: "slider",
      },
    ];
    (option["grid"] as OptionRecord)["bottom"] = 28;
  }

  // A brush selects along an axis, and only the cartesian charts have one — the same guard
  // `dataZoom` carries above.
  const brush = ctx.brush && isCartesian;

  if (brush) {
    option["brush"] = { toolbox: ["rect", "polygon", "clear"], xAxisIndex: 0 };
  }

  // The brush is only reachable through the toolbox, so asking for one brings the other along.
  if (ctx.toolbox || brush) {
    option["toolbox"] = {
      feature: {
        ...(ctx.brush ? { brush: {} } : {}),
        ...(ctx.toolbox
          ? { dataZoom: { yAxisIndex: "none" }, restore: {}, saveAsImage: {} }
          : {}),
      },
      iconStyle: { borderColor: ctx.chrome.mutedForeground },
      right: 0,
      top: 0,
    };
  }

  return option as EChartsOption;
}
