import React from "react";
import { Group, RoundedRect, Text, useFont } from "@shopify/react-native-skia";
import { TooltipData } from "./types";
import { Colors } from "@/constants/theme";

interface ChartTooltipProps {
  tooltip: TooltipData | null;
  chartX: number;
  chartY: number;
  chartHeight: number;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  tooltip,
  chartX,
  chartY,
  chartHeight,
}) => {
  // Font is optional - only render text when font is available
  const font = null; // TODO: Add font file to assets/fonts/ if needed

  if (!tooltip) return null;

  const tooltipWidth = 80;
  const tooltipHeight = 50;
  const padding = 8;
  const x = tooltip.x - tooltipWidth / 2;
  const y = Math.max(0, Math.min(tooltip.y - tooltipHeight - 10, chartHeight - tooltipHeight));

  const valueText = tooltip.value.toString();
  const labelText = tooltip.label || "";

  return (
    <Group>
      <RoundedRect
        x={x}
        y={y}
        width={tooltipWidth}
        height={tooltipHeight}
        r={4}
        color={Colors.light.card}
      />
      {font && (
        <>
          <Text
            x={x + padding}
            y={y + padding + 12}
            text={valueText}
            font={font}
            color={Colors.light.text}
          />
          {labelText && (
            <Text
              x={x + padding}
              y={y + padding + 28}
              text={labelText}
              font={font}
              color={Colors.light.textSecondary}
            />
          )}
        </>
      )}
    </Group>
  );
};

