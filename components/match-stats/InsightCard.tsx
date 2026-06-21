import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export type InsightType = "success" | "info" | "warning" | "highlight";

export interface InsightMetric {
  label: string;
  value: string | number;
}

interface InsightCardProps {
  type: InsightType;
  headline: string;
  description: string;
  metric?: InsightMetric;
  delay?: number;
}

const typeColors: Record<InsightType, { accent: string }> = {
  success: { accent: "#0f766e" },
  info: { accent: "#2563eb" },
  warning: { accent: "#d97706" },
  highlight: { accent: "#7c3aed" },
};

export function InsightCard({
  type,
  headline,
  description,
  metric,
  delay = 0,
}: InsightCardProps) {
  const colors = typeColors[type];

  return (
    <Animated.View
      entering={FadeInDown.delay(delay * 1000).duration(350)}
      style={styles.container}
    >
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.description}>{description}</Text>

      {metric && (
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <Text style={[styles.metricValue, { color: colors.accent }]}>
            {metric.value}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e9edf3",
  },
  headline: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 18,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  metricRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  metricLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#94a3b8",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
