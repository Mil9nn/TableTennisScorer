import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { DesignTokens } from "@/constants/designTokens";

interface GameProgressionChartProps {
  data: Array<{ game: string; [key: string]: string | number }>;
  side1Name: string;
  side2Name: string;
  title?: string;
  subtitle?: string;
  maxValue?: number;
}

const tokens = DesignTokens;

const Y_STEP = 5;

const COLORS = {
  side1: DesignTokens.colors.lightBlue,
  side2: "#f43f5e",
};

function getYAxisScale(values: number[], overrideMax?: number) {
  const peak = Math.max(...values, 0);
  const chartMax =
    typeof overrideMax === "number" && overrideMax > 0
      ? Math.ceil(overrideMax / Y_STEP) * Y_STEP
      : Math.max(Y_STEP * 4, Math.ceil(peak / Y_STEP) * Y_STEP);

  return {
    maxValue: chartMax,
    noOfSections: chartMax / Y_STEP,
    stepValue: Y_STEP,
  };
}

export function GameProgressionChart({
  data,
  side1Name,
  side2Name,
  title = "Game-by-Game Score Trends",
  subtitle = "Track score evolution throughout the match",
  maxValue,
}: GameProgressionChartProps) {
  if (data.length === 0) return null;

  const lineOne = data.map((item) => ({
    value: Number(item[side1Name] ?? 0),
    label: item.game,
    dataPointText: `${item[side1Name]}`,
  }));
  const lineTwo = data.map((item) => ({
    value: Number(item[side2Name] ?? 0),
    label: item.game,
    dataPointText: `${item[side2Name]}`,
  }));

  const yAxis = getYAxisScale(
    [...lineOne, ...lineTwo].map((point) => point.value),
    maxValue
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.side1 }]} />
            <Text style={styles.legendText} numberOfLines={1}>{side1Name}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.side2 }]} />
            <Text style={styles.legendText} numberOfLines={1}>{side2Name}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={lineOne}
            data2={lineTwo}
            width={Math.max(280, data.length * 80)}
            height={200}
            spacing={60}
            color1={COLORS.side1}
            color2={COLORS.side2}
            initialSpacing={12}
            thickness1={2}
            thickness2={2}
            dataPointsColor1={COLORS.side1}
            dataPointsColor2={COLORS.side2}
            dataPointsRadius1={3}
            dataPointsRadius2={3}
            hideDataPoints1={false}
            hideDataPoints2={false}
            yAxisColor="#e5e7eb"
            xAxisColor="#e5e7eb"
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            curved
            isAnimated
            hideRules={false}
            rulesColor="#f1f5f9"
            maxValue={yAxis.maxValue}
            noOfSections={yAxis.noOfSections}
            stepValue={yAxis.stepValue}
          />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  header: {
    gap: tokens.spacing[2],
  },
  title: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  subtitle: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
  },
  content: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    backgroundColor: tokens.colors.background.primary,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[4],
    marginBottom: tokens.spacing[4],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
    maxWidth: 150,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  axisText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
});

