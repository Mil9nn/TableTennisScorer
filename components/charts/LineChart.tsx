import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { Group, Path, Circle, LinearGradient, vec } from "@shopify/react-native-skia";
import { LineChartProps } from "./types";
import { ChartContainer } from "./ChartContainer";
import { ChartAxis, ChartAxisLabels } from "./ChartAxis";
import { ChartGrid } from "./ChartGrid";
import { ChartTooltip } from "./ChartTooltip";
import { useChartAnimation } from "./hooks/useChartAnimation";
import { useChartGestures } from "./hooks/useChartGestures";
import { useChartData } from "./hooks/useChartData";
import {
  formatChartValue,
  valueToY,
} from "./ChartUtils";
import { Colors } from "@/constants/theme";

export const LineChart: React.FC<LineChartProps> = ({
  data,
  data2,
  width,
  height,
  margin,
  color = Colors.light.primary,
  color2,
  gradientColor,
  gradientColor2,
  animated = true,
  animationDuration = 1000,
  showTooltip = false,
  showGrid = true,
  showArea = false,
  curved = true,
  thickness = 3,
  maxValue,
  minValue = 0,
  yAxisLabelFormatter = formatChartValue,
  xAxisLabelFormatter,
  onPointPress,
}) => {
  const { max, min, isValid } = useChartData(data, data2, maxValue, minValue);
  const { progress } = useChartAnimation(animated, animationDuration);
  const { tooltipData, updateTooltip, panGesture, GestureDetector, GestureHandlerRootView } =
    useChartGestures(undefined, showTooltip);

  const xLabels = useMemo(
    () => data.map((d) => (xAxisLabelFormatter ? xAxisLabelFormatter(d.label || "") : d.label || "")),
    [data, xAxisLabelFormatter]
  );

  if (!isValid) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: Colors.light.textSecondary }}>No data available</Text>
      </View>
    );
  }

  const colorWithOpacity = (col: string, opacity: number) => {
    if (col.startsWith("#")) {
      const hex = col.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return col;
  };

  const renderLines = (dimensions: {
    chartWidth: number;
    chartHeight: number;
    chartX: number;
    chartY: number;
  }) => {
    const { chartWidth, chartHeight, chartX, chartY } = dimensions;

    const spacing = chartWidth / (data.length - 1 || 1);
    const points = data.map((item, index) => {
      const x = chartX + index * spacing;
      const y = valueToY(item.value, min, max, chartHeight) + chartY;
      return { x, y, item, index };
    });

    const points2 = data2
      ? data2.map((item, index) => {
          const x = chartX + index * spacing;
          const y = valueToY(item.value, min, max, chartHeight) + chartY;
          return { x, y };
        })
      : [];

    // Create path
    const createPath = (pts: { x: number; y: number }[], isCurved: boolean) => {
      if (pts.length === 0) return "";
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

      let path = `M ${pts[0].x} ${pts[0].y}`;

      if (isCurved && pts.length > 2) {
        for (let i = 1; i < pts.length; i++) {
          const prev = pts[i - 1];
          const curr = pts[i];
          const next = pts[i + 1] || curr;

          const cp1x = prev.x + (curr.x - prev.x) / 2;
          const cp1y = prev.y;
          const cp2x = curr.x - (next.x - curr.x) / 2;
          const cp2y = curr.y;

          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        }
      } else {
        for (let i = 1; i < pts.length; i++) {
          path += ` L ${pts[i].x} ${pts[i].y}`;
        }
      }

      return path;
    };

    const path1 = createPath(points, curved);
    const path2 = data2 ? createPath(points2, curved) : "";

    // Create area path
    const createAreaPath = (pts: { x: number; y: number }[], baseY: number) => {
      if (pts.length === 0) return "";
      const path = createPath(pts, curved);
      const last = pts[pts.length - 1];
      const first = pts[0];
      return `${path} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
    };

    const areaPath1 = showArea ? createAreaPath(points, chartY + chartHeight) : "";
    const areaPath2 = showArea && data2 ? createAreaPath(points2, chartY + chartHeight) : "";

    return (
      <Group>
        {showGrid && (
          <ChartGrid
            chartX={chartX}
            chartY={chartY}
            chartWidth={chartWidth}
            chartHeight={chartHeight}
            numHorizontalLines={4}
          />
        )}

        <ChartAxis
          chartX={chartX}
          chartY={chartY}
          chartWidth={chartWidth}
          chartHeight={chartHeight}
          min={min}
          max={max}
          labelFormatter={yAxisLabelFormatter}
          xLabels={xLabels}
        />

        {/* Area fills */}
        {showArea && areaPath1 && (
          <Path path={areaPath1} color={colorWithOpacity(color, 0.2)} />
        )}
        {showArea && areaPath2 && data2 && (
          <Path path={areaPath2} color={colorWithOpacity(color2 || color, 0.2)} />
        )}

        {/* Lines */}
        <Path path={path1} color={color} style="stroke" strokeWidth={thickness} />
        {data2 && path2 && (
          <Path path={path2} color={color2 || color} style="stroke" strokeWidth={thickness} />
        )}

        {/* Data points */}
        {points.map((point, index) => (
          <Circle key={`point-${index}`} cx={point.x} cy={point.y} r={4} color={color} />
        ))}
        {data2 &&
          points2.map((point, index) => (
            <Circle key={`point2-${index}`} cx={point.x} cy={point.y} r={4} color={color2 || color} />
          ))}

        {showTooltip && tooltipData && (
          <ChartTooltip
            tooltip={tooltipData}
            chartX={chartX}
            chartY={chartY}
            chartHeight={chartHeight}
          />
        )}
      </Group>
    );
  };

  const chartMargin = { top: 20, bottom: 30, left: 40, right: 10, ...margin };
  const chartWidth = width - (chartMargin.left || 40) - (chartMargin.right || 10);
  const chartHeight = height - (chartMargin.top || 20) - (chartMargin.bottom || 30);
  const chartX = chartMargin.left || 40;
  const chartY = chartMargin.top || 20;

  // Calculate point positions for click handlers
  const pointPositions = useMemo(() => {
    if (!onPointPress) return [];
    const spacing = chartWidth / (data.length - 1 || 1);
    return data.map((item, index) => {
      const x = chartX + index * spacing;
      const y = valueToY(item.value, min, max, chartHeight) + chartY;
      return {
        x,
        y,
        dataPoint: item,
        index,
      };
    });
  }, [data, chartX, chartY, chartWidth, chartHeight, min, max, onPointPress]);

  const content = (
    <View style={{ width, height, position: 'relative' }}>
      <ChartContainer
        width={width}
        height={height}
        margin={margin}
        gesture={showTooltip ? panGesture : undefined}
      >
        {renderLines}
      </ChartContainer>
      <ChartAxisLabels
        chartX={chartX}
        chartY={chartY}
        chartWidth={chartWidth}
        chartHeight={chartHeight}
        min={min}
        max={max}
        labelFormatter={yAxisLabelFormatter}
        xLabels={xLabels}
        showXAxis={true}
        showYAxis={true}
        containerWidth={width}
        containerHeight={height}
      />
      {/* Overlay touchable areas for data points */}
      {onPointPress && pointPositions.map((pointPos, index) => (
        <Pressable
          key={`point-touch-${index}`}
          style={{
            position: 'absolute',
            left: pointPos.x - 20,
            top: pointPos.y - 20,
            width: 40,
            height: 40,
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPointPress(pointPos.dataPoint, pointPos.index);
          }}
        />
      ))}
    </View>
  );

  if (showTooltip) {
    return (
      <GestureHandlerRootView style={{ width, height }}>
        <GestureDetector gesture={panGesture}>{content}</GestureDetector>
      </GestureHandlerRootView>
    );
  }

  return content;
};
