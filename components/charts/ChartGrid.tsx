import React from "react";
import { Group, Line } from "@shopify/react-native-skia";
import { Colors } from "@/constants/theme";

interface ChartGridProps {
  chartX: number;
  chartY: number;
  chartWidth: number;
  chartHeight: number;
  numHorizontalLines?: number;
  numVerticalLines?: number;
}

export const ChartGrid: React.FC<ChartGridProps> = ({
  chartX,
  chartY,
  chartWidth,
  chartHeight,
  numHorizontalLines = 4,
  numVerticalLines = 0,
}) => {
  return (
    <Group>
      {/* Horizontal grid lines */}
      {Array.from({ length: numHorizontalLines + 1 }).map((_, i) => {
        const y = chartY + (chartHeight * i) / numHorizontalLines;
        return (
          <Line
            key={`h-line-${i}`}
            p1={{ x: chartX, y }}
            p2={{ x: chartX + chartWidth, y }}
            color={Colors.light.borderLight}
            strokeWidth={1}
          />
        );
      })}

      {/* Vertical grid lines */}
      {numVerticalLines > 0 &&
        Array.from({ length: numVerticalLines + 1 }).map((_, i) => {
          const x = chartX + (chartWidth * i) / numVerticalLines;
          return (
            <Line
              key={`v-line-${i}`}
              p1={{ x, y: chartY }}
              p2={{ x, y: chartY + chartHeight }}
              color={Colors.light.borderLight}
              strokeWidth={1}
            />
          );
        })}
    </Group>
  );
};

