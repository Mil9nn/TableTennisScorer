import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { Surface } from "react-native-paper";
import { DesignTokens } from "@/constants/designTokens";

const COLORS = {
  serve: "#F4A261",
  receive: "#4C6EF5",
};

interface ServeReceiveChartProps {
  data: Array<{
    player: string;
    Serve: number;
    Receive: number;
    ServeTotal?: number;
    ReceiveTotal?: number;
  }>;
}

const tokens = DesignTokens;

export function ServeReceiveChart({ data }: ServeReceiveChartProps) {
  const [activeTooltip, setActiveTooltip] = useState<{
    title: string;
    value: number;
    total?: number;
  } | null>(null);

  if (data.length === 0) return null;

  const chartData = data.flatMap((item) => {
    const playerShort = item.player.slice(0, 10);
    return [
      {
        value: item.Serve,
        frontColor: COLORS.serve,
        spacing: 10,
        label: playerShort,
        onPress: () =>
          setActiveTooltip({
            title: `${item.player} • Serve`,
            value: item.Serve,
            total: item.ServeTotal,
          }),
      },
      {
        value: item.Receive,
        frontColor: COLORS.receive,
        spacing: 26,
        label: "",
        onPress: () =>
          setActiveTooltip({
            title: `${item.player} • Receive`,
            value: item.Receive,
            total: item.ReceiveTotal,
          }),
      },
    ];
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Serve vs Receive</Text>
        <Text style={styles.subtitle}>
          Points won on serve vs receive by player
        </Text>
      </View>

      <View style={styles.chartArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.content}>
            <BarChart
              data={chartData}
              barWidth={28}
              spacing={18}
              initialSpacing={20}
              endSpacing={20}
              barBorderTopLeftRadius={4}
              barBorderTopRightRadius={4}
              barBorderBottomLeftRadius={0}
              barBorderBottomRightRadius={0}
              noOfSections={4}
              xAxisColor="#e5e7eb"
              yAxisColor="#e5e7eb"
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.xLabel}
              hideRules={false}
              rulesColor="#f3f4f6"
              disableScroll
              isAnimated
              showFractionalValues={false}
              maxValue={Math.max(1, ...chartData.map((d) => d.value))}
            />
          </View>
        </ScrollView>

        {activeTooltip && (
          <Surface style={styles.tooltip} elevation={2}>
            <Text style={styles.tooltipTitle}>{activeTooltip.title}</Text>
            <View style={styles.tooltipStats}>
              <View style={styles.tooltipRow}>
                <Text style={styles.tooltipLabel}>Won</Text>
                <Text style={styles.tooltipValue}>{activeTooltip.value} pts</Text>
              </View>
              <View style={styles.tooltipRow}>
                <Text style={styles.tooltipLabel}>Total</Text>
                <Text style={styles.tooltipValue}>
                  {typeof activeTooltip.total === "number" ? activeTooltip.total : "-"} pts
                </Text>
              </View>
              <View style={styles.tooltipRow}>
                <Text style={styles.tooltipLabel}>Lost</Text>
                <Text style={styles.tooltipValue}>
                  {typeof activeTooltip.total === "number"
                    ? Math.max(0, activeTooltip.total - activeTooltip.value)
                    : "-"}{" "}
                  pts
                </Text>
              </View>
              <View style={styles.tooltipRow}>
                <Text style={styles.tooltipLabel}>Win Rate</Text>
                <Text style={styles.tooltipValue}>
                  {typeof activeTooltip.total === "number" && activeTooltip.total > 0
                    ? `${Math.round((activeTooltip.value / activeTooltip.total) * 100)}%`
                    : "-"}
                </Text>
              </View>
            </View>
          </Surface>
        )}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.serve }]} />
          <Text style={styles.legendText}>Serve</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.receive }]} />
          <Text style={styles.legendText}>Receive</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing[4],
    borderRadius: tokens.borderRadius.none,
  },
  header: {
    
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
    
  },
  chartArea: {
    position: "relative",
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    backgroundColor: tokens.colors.background.primary,
  },
  axisText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
  },
  label: {
    color: tokens.colors.text.secondary,
  },
  xLabel: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
  },
  legendRow: {
    flexDirection: "row",
    gap: tokens.spacing[4],
    marginTop: tokens.spacing[4],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#64748b",
  },
  tooltip: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 110,
    position: "absolute",
    top: 6,
    right: 16,
    zIndex: 20,
  },
  tooltipTitle: {
    color: "#64748b",
    fontSize: 11,
    marginBottom: 3,
  },
  tooltipStats: {
    gap: 2,
  },
  tooltipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  tooltipLabel: {
    color: "#64748b",
    fontSize: 11,
  },
  tooltipValue: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "700",
  },
});

