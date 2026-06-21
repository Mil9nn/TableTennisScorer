import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  maxValue?: number;
}

export function SimpleBarChart({ data, color = "#3c6e71", maxValue }: SimpleBarChartProps) {
  if (!data || data.length === 0) return null;

  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      {data.map((item, index) => {
        const percentage = (item.value / max) * 100;
        return (
          <View key={index} style={styles.barRow}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  { width: `${percentage}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    width: 80,
    fontSize: 12,
    color: "#6b7280",
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
  value: {
    width: 30,
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textAlign: "right",
  },
});
