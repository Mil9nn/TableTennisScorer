import React, { useMemo, useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { Group, LinearGradient, vec, Path, Skia } from "@shopify/react-native-skia";
import { BarChartProps } from "./types";
import { ChartContainer } from "./ChartContainer";
import { ChartAxis, ChartAxisLabels } from "./ChartAxis";
import { ChartGrid } from "./ChartGrid";
import { ChartTooltip } from "./ChartTooltip";
import { useChartGestures } from "./hooks/useChartGestures";
import { useChartData } from "./hooks/useChartData";
import {
  calculateBarLayout,
  indexToX,
  formatChartValue,
} from "./ChartUtils";
import { Colors } from "@/constants/theme";
// GestureHandlerRootView and GestureDetector are used via useChartGestures hook

// Simple bar component without animation for now
const Bar = ({
  bar,
  chartY,
  chartHeight,
  barWidth,
  color,
  gradientColor,
  primaryGradient,
  rounded,
  animationProgress,
}: {
  bar: { x: number; fullHeight: number; index: number };
  chartY: number;
  chartHeight: number;
  barWidth: number;
  color: string;
  gradientColor?: string;
  primaryGradient: string;
  rounded: boolean;
  animationProgress: number; // Now just a number, not animated value
}) => {
  const animatedHeight = bar.fullHeight * animationProgress;
  const animatedY = chartY + chartHeight - animatedHeight;
  const radius = rounded ? 4 : 0;

  // Create path with rounded top corners only
  const createBarPath = () => {
    const path = Skia.Path.Make();
    const left = bar.x;
    const right = bar.x + barWidth;
    const top = animatedY;
    const bottom = animatedY + animatedHeight;

    if (rounded && radius > 0 && animatedHeight > radius) {
      // Start from bottom-left (sharp corner)
      path.moveTo(left, bottom);
      // Line to bottom-right (sharp corner)
      path.lineTo(right, bottom);
      // Line to top-right (before rounded corner)
      path.lineTo(right, top + radius);
      // Quadratic curve for top-right corner
      path.quadTo(right, top, right - radius, top);
      // Line to top-left (before rounded corner)
      path.lineTo(left + radius, top);
      // Quadratic curve for top-left corner
      path.quadTo(left, top, left, top + radius);
      // Close path back to bottom-left
      path.close();
    } else {
      // Simple rectangle for non-rounded bars or bars too short for rounding
      path.moveTo(left, bottom);
      path.lineTo(right, bottom);
      path.lineTo(right, top);
      path.lineTo(left, top);
      path.close();
    }
    return path;
  };

  const barPath = createBarPath();

  return (
    <Group>
      {gradientColor ? (
        <Path path={barPath}>
          <LinearGradient
            start={vec(bar.x, chartY)}
            end={vec(bar.x, chartY + chartHeight)}
            colors={[color, primaryGradient]}
          />
        </Path>
      ) : (
        <Path path={barPath} color={color} />
      )}
    </Group>
  );
};

export const BarChart: React.FC<BarChartProps> = ({
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
  animationDuration = 800,
  showTooltip = false,
  showGrid = true,
  showValues = false,
  barWidth = 30,
  spacing = 8,
  rounded = true,
  maxValue,
  minValue = 0,
  yAxisLabelFormatter = formatChartValue,
  xAxisLabelFormatter,
  onBarPress,
}) => {
  const { max, min, isValid } = useChartData(data, data2, maxValue, minValue);
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1);
  const { tooltipData, panGesture, GestureDetector: TooltipGestureDetector, GestureHandlerRootView: TooltipGestureHandlerRootView } =
    useChartGestures(undefined, showTooltip);

  const chartMargin = { top: 20, bottom: 30, left: 40, right: 10, ...margin };
  const chartWidth = width - (chartMargin.left || 40) - (chartMargin.right || 10);
  const chartHeight = height - (chartMargin.top || 20) - (chartMargin.bottom || 30);
  const chartX = chartMargin.left || 40;
  const chartY = chartMargin.top || 20;

  const layout = useMemo(
    () => calculateBarLayout(data.length || 0, chartWidth, barWidth, spacing),
    [data.length, chartWidth, barWidth, spacing]
  );

  const xLabels = useMemo(
    () => (data || []).map((d) => (xAxisLabelFormatter ? xAxisLabelFormatter(d.label || "") : d.label || "")),
    [data, xAxisLabelFormatter]
  );

  const barPositions = useMemo(() => {
    if (!onBarPress || !data || data.length === 0) return [];
    return data.map((item, index) => {
      const x = indexToX(index, data.length, chartWidth, layout.barWidth, layout.spacing) - layout.barWidth / 2;
      return {
        x: chartX + x,
        y: chartY,
        width: layout.barWidth,
        height: chartHeight,
        dataPoint: item,
        index,
      };
    });
  }, [data, chartX, chartY, chartWidth, chartHeight, layout, onBarPress]);

  useEffect(() => {
    if (animated) {
      // Simple animation using state
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        setAnimationProgress(progress);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    } else {
      setAnimationProgress(1);
    }
  }, [animated, animationDuration]);

  const primaryGradient = gradientColor || color;
  const secondaryGradient = gradientColor2 || color2 || color;

  // Early return for invalid data - show placeholder instead of null
  if (!isValid || !data || data.length === 0) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
        <Text style={{ color: Colors.light.textSecondary, fontSize: 12 }}>No data available</Text>
      </View>
    );
  }

  const renderBars = (dimensions: {
    chartWidth: number;
    chartHeight: number;
    chartX: number;
    chartY: number;
  }) => {
    const { chartWidth, chartHeight, chartX, chartY } = dimensions;

    // Pre-calculate all bar positions and heights
    const bars = data.map((item, index) => {
      const x = indexToX(index, data.length, chartWidth, layout.barWidth, layout.spacing) - layout.barWidth / 2;
      const normalizedValue = (item.value - min) / (max - min);
      const fullHeight = normalizedValue * chartHeight;
      return { x, fullHeight, item, index };
    });

    const bars2 = data2
      ? data2.map((item, index) => {
          const x = indexToX(index, data2.length, chartWidth, layout.barWidth, layout.spacing) - layout.barWidth / 2 + layout.barWidth;
          const normalizedValue = (item.value - min) / (max - min);
          const fullHeight = normalizedValue * chartHeight;
          return { x, fullHeight, item, index };
        })
      : [];

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

        {bars.map((bar) => (
          <Bar
            key={`bar-${bar.index}`}
            bar={bar}
            chartY={chartY}
            chartHeight={chartHeight}
            barWidth={layout.barWidth}
            color={color}
            gradientColor={gradientColor}
            primaryGradient={primaryGradient}
            rounded={rounded}
            animationProgress={animationProgress}
          />
        ))}

        {bars2.map((bar) => (
          <Bar
            key={`bar2-${bar.index}`}
            bar={bar}
            chartY={chartY}
            chartHeight={chartHeight}
            barWidth={layout.barWidth}
            color={color2 || color}
            gradientColor={gradientColor2}
            primaryGradient={secondaryGradient}
            rounded={rounded}
            animationProgress={animationProgress}
          />
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


  const content = (
    <View style={{ width, height, position: 'relative' }}>
      <ChartContainer
        width={width}
        height={height}
        margin={margin}
        gesture={showTooltip ? panGesture : undefined}
      >
        {renderBars}
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
      {/* Overlay touchable areas for bars */}
      {onBarPress && barPositions.map((barPos, index) => (
        <Pressable
          key={`bar-touch-${index}`}
          style={{
            position: 'absolute',
            left: barPos.x,
            top: barPos.y,
            width: barPos.width,
            height: barPos.height,
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBarPress(barPos.dataPoint, barPos.index);
          }}
        />
      ))}
    </View>
  );

  if (showTooltip) {
    return (
      <TooltipGestureHandlerRootView style={{ width, height }}>
        <TooltipGestureDetector gesture={panGesture}>{content}</TooltipGestureDetector>
      </TooltipGestureHandlerRootView>
    );
  }

  return content;
};
