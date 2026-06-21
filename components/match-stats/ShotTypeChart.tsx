import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { getShotColor } from "@/lib/match-stats-utils";

interface ShotTypeChartProps {
  data: Array<{ name: string; value: number }>;
}

export function ShotTypeChart({ data }: ShotTypeChartProps) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const chartData = sorted.map((item) => ({
    value: item.value,
    label: item.name.slice(0, 10),
    frontColor: getShotColor(item.name),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shot Type Distribution</Text>
        <Text style={styles.subtitle}>
          Frequency of each shot type across all games
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.content}>
          <BarChart
            data={chartData}
            barWidth={22}
            spacing={14}
            roundedTop
            noOfSections={4}
            xAxisColor="#e5e7eb"
            yAxisColor="#e5e7eb"
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.label}
            hideRules={false}
            rulesColor="#f3f4f6"
            disableScroll
            isAnimated
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eef0f3",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 8,
    minWidth: 340,
    paddingBottom: 12,
  },
  axisText: {
    color: "#94a3b8",
    fontSize: 11,
  },
  label: {
    color: "#475569",
    fontSize: 11,
    marginTop: 8,
  },
});

