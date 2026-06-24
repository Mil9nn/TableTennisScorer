import React, { useMemo } from "react";
import { Group, Path, Circle, Text, useFont } from "@shopify/react-native-skia";
import { PieChartProps } from "./types";
import { useChartAnimation } from "./hooks/useChartAnimation";
import { Colors } from "@/constants/theme";

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width,
  height,
  radius = 80,
  innerRadius = 0,
  animated = true,
  animationDuration = 800,
  showTooltip = false,
  showLabels = true,
  centerLabel,
}) => {
  const { progress } = useChartAnimation(animated, animationDuration);
  // Font is optional - only render text when font is available
  const font = null; // TODO: Add font file to assets/fonts/ if needed

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  if (data.length === 0 || total === 0) {
    return null;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const actualRadius = Math.min(radius, Math.min(width, height) / 2 - 20);

  let currentAngle = -Math.PI / 2; // Start from top

  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Calculate path for segment
    const createArc = (
      start: number,
      end: number,
      r: number,
      innerR: number
    ) => {
      const largeArc = end - start > Math.PI ? 1 : 0;
      const x1 = centerX + r * Math.cos(start);
      const y1 = centerY + r * Math.sin(start);
      const x2 = centerX + r * Math.cos(end);
      const y2 = centerY + r * Math.sin(end);

      if (innerR > 0) {
        // Donut chart
        const innerX1 = centerX + innerR * Math.cos(start);
        const innerY1 = centerY + innerR * Math.sin(start);
        const innerX2 = centerX + innerR * Math.cos(end);
        const innerY2 = centerY + innerR * Math.sin(end);

        return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${innerX2} ${innerY2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerX1} ${innerY1} Z`;
      } else {
        // Pie chart
        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      }
    };

    const path = createArc(startAngle, endAngle, actualRadius, innerRadius);

    // Label position
    const labelAngle = startAngle + angle / 2;
    const labelRadius = actualRadius * 0.7;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);

    currentAngle = endAngle;

    return {
      path,
      color: item.color,
      percentage,
      labelX,
      labelY,
      text: item.text,
      value: item.value,
    };
  });

  return (
    <Group>
      {segments.map((segment, index) => (
        <Group key={`segment-${index}`}>
          <Path path={segment.path} color={segment.color} />
          {showLabels && segment.text && font && (
            <Text
              x={segment.labelX - 20}
              y={segment.labelY}
              text={segment.text.substring(0, 8)}
              font={font}
              color={Colors.light.text}
            />
          )}
        </Group>
      ))}

      {centerLabel && innerRadius > 0 && font && typeof centerLabel === "string" && (
        <Group>
          <Text
            x={centerX - 20}
            y={centerY - 8}
            text={centerLabel.split('\n')[0] || centerLabel}
            font={font}
            color={Colors.light.text}
          />
          {centerLabel.includes('\n') && (
            <Text
              x={centerX - 20}
              y={centerY + 8}
              text={centerLabel.split('\n')[1]}
              font={font}
              color={Colors.light.textSecondary}
            />
          )}
        </Group>
      )}
    </Group>
  );
};
