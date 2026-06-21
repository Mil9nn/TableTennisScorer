import React from "react";
import { View, Text as RNText, StyleSheet } from "react-native";
import { Group, Line } from "@shopify/react-native-skia";
import { Colors } from "@/constants/theme";
import { formatChartValue } from "./ChartUtils";

interface ChartAxisProps {
  chartX: number;
  chartY: number;
  chartWidth: number;
  chartHeight: number;
  min: number;
  max: number;
  numTicks?: number;
  labelFormatter?: (value: number) => string;
  showXAxis?: boolean;
  showYAxis?: boolean;
  xLabels?: string[];
}

interface ChartAxisLabelsProps extends ChartAxisProps {
  containerWidth: number;
  containerHeight: number;
}

export const ChartAxis: React.FC<ChartAxisProps> = ({
  chartX,
  chartY,
  chartWidth,
  chartHeight,
  min,
  max,
  numTicks = 4,
  labelFormatter = formatChartValue,
  showXAxis = true,
  showYAxis = true,
  xLabels,
}) => {
  const range = max - min;

  return (
    <Group>
      {/* Y-axis line */}
      {showYAxis && (
        <Line
          p1={{ x: chartX, y: chartY }}
          p2={{ x: chartX, y: chartY + chartHeight }}
          color={Colors.light.border}
          strokeWidth={1}
        />
      )}

      {/* Y-axis ticks */}
      {showYAxis &&
        Array.from({ length: numTicks + 1 }).map((_, i) => {
          const y = chartY + (chartHeight * i) / numTicks;
          return (
            <Line
              key={`y-tick-${i}`}
              p1={{ x: chartX - 5, y }}
              p2={{ x: chartX, y }}
              color={Colors.light.border}
              strokeWidth={1}
            />
          );
        })}

      {/* X-axis line */}
      {showXAxis && (
        <Line
          p1={{ x: chartX, y: chartY + chartHeight }}
          p2={{ x: chartX + chartWidth, y: chartY + chartHeight }}
          color={Colors.light.border}
          strokeWidth={1}
        />
      )}
    </Group>
  );
};

// Separate component for labels using React Native Text
export const ChartAxisLabels: React.FC<ChartAxisLabelsProps> = ({
  chartX,
  chartY,
  chartWidth,
  chartHeight,
  min,
  max,
  numTicks = 4,
  labelFormatter = formatChartValue,
  showXAxis = true,
  showYAxis = true,
  xLabels,
  containerWidth,
  containerHeight,
}) => {
  const range = max - min;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Y-axis labels */}
      {showYAxis &&
        Array.from({ length: numTicks + 1 }).map((_, i) => {
          const value = max - (range * i) / numTicks;
          const y = chartY + (chartHeight * i) / numTicks;
          const label = labelFormatter(value);

          return (
            <RNText
              key={`y-label-${i}`}
              style={[
                styles.yLabel,
                {
                  left: chartX - 45,
                  top: y - 6,
                },
              ]}
            >
              {label}
            </RNText>
          );
        })}

      {/* X-axis labels */}
      {showXAxis && xLabels && xLabels.length > 0 && (
        <>
          {xLabels.map((label, i) => {
            const spacing = chartWidth / xLabels.length;
            const x = chartX + spacing * i + spacing / 2;

            return (
              <RNText
                key={`x-label-${i}`}
                style={[
                  styles.xLabel,
                  {
                    left: x - 20,
                    top: chartY + chartHeight + 5,
                  },
                ]}
              >
                {label.substring(0, 8)}
              </RNText>
            );
          })}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  yLabel: {
    position: "absolute",
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: "right",
    width: 40,
  },
  xLabel: {
    position: "absolute",
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: "center",
    width: 40,
  },
});

