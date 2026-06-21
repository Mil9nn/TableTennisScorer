import { ChartDataPoint } from "./types";

/**
 * Safely calculate max value from data array
 */
export const getSafeMaxValue = (
  values: number[],
  fallback: number = 100
): number => {
  if (!values || values.length === 0) return fallback;
  const max = Math.max(...values);
  return isNaN(max) || !isFinite(max) ? fallback : max;
};

/**
 * Safely calculate min value from data array
 */
export const getSafeMinValue = (
  values: number[],
  fallback: number = 0
): number => {
  if (!values || values.length === 0) return fallback;
  const min = Math.min(...values);
  return isNaN(min) || !isFinite(min) ? fallback : min;
};

/**
 * Format large numbers for display (1K, 1M, etc.)
 */
export const formatChartValue = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Check if chart data is valid
 */
export const hasValidChartData = (data: ChartDataPoint[]): boolean => {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.every((item) => typeof item.value === 'number' && !isNaN(item.value))
  );
};

/**
 * Normalize data values to 0-1 range
 */
export const normalizeData = (
  data: ChartDataPoint[],
  min: number,
  max: number
): ChartDataPoint[] => {
  const range = max - min;
  if (range === 0) return data.map((d) => ({ ...d, value: 0.5 }));

  return data.map((d) => ({
    ...d,
    value: (d.value - min) / range,
  }));
};

/**
 * Calculate chart dimensions accounting for margins
 */
export const getChartDimensions = (
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number }
) => {
  return {
    chartWidth: width - margin.left - margin.right,
    chartHeight: height - margin.top - margin.bottom,
    chartX: margin.left,
    chartY: margin.top,
  };
};

/**
 * Generate color with opacity
 */
export const colorWithOpacity = (color: string, opacity: number): string => {
  // Handle hex colors
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // Handle rgba colors
  if (color.startsWith("rgba")) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
  }
  // Handle rgb colors
  if (color.startsWith("rgb")) {
    return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
  }
  return color;
};

/**
 * Calculate bar positions and sizes
 */
export const calculateBarLayout = (
  dataLength: number,
  chartWidth: number,
  barWidth?: number,
  spacing?: number
) => {
  const defaultSpacing = spacing || 8;
  const defaultBarWidth = barWidth || 30;

  if (dataLength === 0) {
    return {
      barWidth: defaultBarWidth,
      spacing: defaultSpacing,
      totalWidth: 0,
    };
  }

  const totalSpacing = defaultSpacing * (dataLength - 1);
  const availableWidth = chartWidth - totalSpacing;
  const calculatedBarWidth = Math.min(
    defaultBarWidth,
    availableWidth / dataLength
  );

  return {
    barWidth: calculatedBarWidth,
    spacing: defaultSpacing,
    totalWidth: calculatedBarWidth * dataLength + totalSpacing,
  };
};

/**
 * Interpolate value with easing
 */
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Calculate Y position from value
 */
export const valueToY = (
  value: number,
  min: number,
  max: number,
  chartHeight: number
): number => {
  if (max === min) return chartHeight / 2;
  const normalized = (value - min) / (max - min);
  return chartHeight - normalized * chartHeight;
};

/**
 * Calculate X position for data point
 */
export const indexToX = (
  index: number,
  dataLength: number,
  chartWidth: number,
  barWidth: number,
  spacing: number
): number => {
  if (dataLength === 0) return 0;
  const totalBarWidth = barWidth * dataLength;
  const totalSpacing = spacing * (dataLength - 1);
  const startX = (chartWidth - totalBarWidth - totalSpacing) / 2;
  return startX + index * (barWidth + spacing) + barWidth / 2;
};

/**
 * Find nearest data point to X coordinate
 */
export const findNearestDataPoint = (
  x: number,
  dataLength: number,
  chartWidth: number,
  barWidth: number,
  spacing: number
): number => {
  let nearestIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < dataLength; i++) {
    const dataX = indexToX(i, dataLength, chartWidth, barWidth, spacing);
    const distance = Math.abs(x - dataX);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  return nearestIndex;
};
