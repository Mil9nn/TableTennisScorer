import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Rect,
  Line,
  G,
  Text as SvgText,
} from "react-native-svg";
import { ZoneWeaknessData } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { Spacing, BorderRadius, Colors, Typography } from "@/constants/theme";

interface ZoneHeatmapProps {
  zoneData: ZoneWeaknessData;
  viewMode?: string;
}

interface HoveredZone {
  x: number;
  y: number;
}

export function ZoneHeatmap({ zoneData }: ZoneHeatmapProps) {
  const [hoveredZone, setHoveredZone] = useState<HoveredZone | null>(null);
  const { width: screenWidth } = useWindowDimensions();

  // SVG dimensions
  const SVG_WIDTH = 548;
  const SVG_HEIGHT = 305;
  const TABLE_X = 182.67;
  const TABLE_Y = 101.67;
  const TABLE_WIDTH = 182.67;
  const TABLE_HEIGHT = 101.67;

  // Grid cell size
  const CELL_WIDTH = TABLE_WIDTH / 10;
  const CELL_HEIGHT = TABLE_HEIGHT / 10;

  // Calculate responsive SVG dimensions
  const maxSvgWidth = screenWidth - Spacing.lg * 2;
  const svgHeight = (maxSvgWidth / SVG_WIDTH) * SVG_HEIGHT;

  // Get color based on win rate
  const getWinRateColor = (winRate: number, totalShots: number): string => {
    if (totalShots === 0) return "rgba(156, 163, 175, 0.2)"; // Gray for no data

    const allWinRates = zoneData.heatmapGrid
      .flat()
      .filter((cell) => cell.totalShots > 0)
      .map((cell) => cell.winRate);

    const avgWinRate =
      allWinRates.length > 0
        ? allWinRates.reduce((a, b) => a + b, 0) / allWinRates.length
        : 50;

    if (winRate >= avgWinRate + 10) return "rgba(34, 197, 94, 0.7)"; // Strong green
    if (winRate >= avgWinRate) return "rgba(132, 204, 22, 0.6)"; // Light green
    if (winRate >= avgWinRate - 5) return "rgba(250, 204, 21, 0.6)"; // Yellow
    if (winRate >= avgWinRate - 10) return "rgba(249, 115, 22, 0.7)"; // Orange
    return "rgba(239, 68, 68, 0.8)"; // Red
  };

  // Get hovered cell data
  const hoveredCell = useMemo(() => {
    if (!hoveredZone) return null;
    return zoneData.heatmapGrid[hoveredZone.y]?.[hoveredZone.x] || null;
  }, [hoveredZone, zoneData.heatmapGrid]);

  // Calculate average win rate
  const avgWinRate = useMemo(() => {
    const allWinRates = zoneData.heatmapGrid
      .flat()
      .filter((cell) => cell.totalShots > 0)
      .map((cell) => cell.winRate);

    return allWinRates.length > 0
      ? allWinRates.reduce((a, b) => a + b, 0) / allWinRates.length
      : 50;
  }, [zoneData.heatmapGrid]);

  // Calculate cell position in scaled SVG
  const getCellPosition = (cellX: number, cellY: number) => {
    const baseX = TABLE_X + cellX * CELL_WIDTH;
    const baseY = TABLE_Y + cellY * CELL_HEIGHT;
    return { baseX, baseY };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zone Vulnerability Heatmap</Text>

      <Text style={styles.description}>
        Hover over zones to see detailed stats. Colors show performance in that
        zone relative to your average performance across all zones (Red = below
        average, Green = above average)
      </Text>

      {/* SVG Heatmap */}
      <View style={styles.svgContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ minWidth: "100%" }}
        >
          <Svg
            width={maxSvgWidth}
            height={svgHeight}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          >
            {/* Background */}
            <Rect
              x="0"
              y="0"
              width={SVG_WIDTH}
              height={SVG_HEIGHT}
              fill="#000000"
              rx="8"
            />

            {/* Table surface */}
            <Rect
              x={TABLE_X}
              y={TABLE_Y}
              width={TABLE_WIDTH}
              height={TABLE_HEIGHT}
              fill="#1E40AF"
              stroke="#1E3A8A"
              strokeWidth="2"
              opacity="0.3"
            />

            {/* Center line */}
            <Line
              x1={TABLE_X + TABLE_WIDTH / 2}
              y1={TABLE_Y}
              x2={TABLE_X + TABLE_WIDTH / 2}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity="0.4"
            />

            {/* Grid cells */}
            {zoneData.heatmapGrid.map((row, y) =>
              row.map((cell, x) => {
                const { baseX, baseY } = getCellPosition(x, y);
                const isHovered = hoveredZone?.x === x && hoveredZone?.y === y;
                const cellColor = getWinRateColor(cell.winRate, cell.totalShots);

                return (
                  <G key={`${x}-${y}`}>
                    {/* Cell rectangle */}
                    <Rect
                      x={baseX}
                      y={baseY}
                      width={CELL_WIDTH}
                      height={CELL_HEIGHT}
                      fill={cellColor}
                      stroke={isHovered ? "#FFFFFF" : "#1E3A8A"}
                      strokeWidth={isHovered ? "2" : "0.5"}
                      opacity={isHovered ? "1" : "0.85"}
                      onPress={() => setHoveredZone({ x, y })}
                    />

                    {/* Shot count label */}
                    {cell.totalShots > 0 && (
                      <SvgText
                        x={baseX + CELL_WIDTH / 2}
                        y={baseY + CELL_HEIGHT / 2}
                        fill="#FFFFFF"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        opacity="0.7"
                      >
                        {cell.totalShots}
                      </SvgText>
                    )}

                    {/* Insufficient data indicator */}
                    {cell.totalShots > 0 && cell.totalShots < 3 && (
                      <SvgText
                        x={baseX + CELL_WIDTH / 2}
                        y={baseY + CELL_HEIGHT / 2 + 10}
                        fill="#FFFFFF"
                        fontSize="6"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        opacity="0.5"
                      >
                        *
                      </SvgText>
                    )}
                  </G>
                );
              })
            )}

            {/* Table borders */}
            <Rect
              x={TABLE_X}
              y={TABLE_Y}
              width={TABLE_WIDTH}
              height={TABLE_HEIGHT}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          </Svg>
        </ScrollView>
      </View>

      {/* Tooltip */}
      {hoveredCell && hoveredCell.totalShots > 0 && (
        <View style={styles.tooltipContainer}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>
              Zone ({hoveredZone!.x}, {hoveredZone!.y})
            </Text>

            <View style={styles.tooltipRow}>
              <Text style={styles.tooltipLabel}>Total Shots:</Text>
              <Text style={styles.tooltipValue}>
                {hoveredCell.totalShots}
                {hoveredCell.totalShots < 3 && (
                  <Text style={styles.insufficientData}>
                    {" "}
                    (insufficient data)
                  </Text>
                )}
              </Text>
            </View>

            <View style={styles.tooltipRow}>
              <Text style={styles.tooltipLabel}>Win Rate:</Text>
              <Text
                style={[
                  styles.tooltipValue,
                  {
                    color:
                      hoveredCell.winRate >= 55
                        ? "#16A34A"
                        : hoveredCell.winRate >= 45
                        ? "#CA8A04"
                        : "#DC2626",
                  },
                ]}
              >
                {hoveredCell.winRate.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.tooltipRow}>
              <Text style={styles.tooltipLabel}>Wins/Losses:</Text>
              <Text style={styles.tooltipValue}>
                {hoveredCell.wins}/{hoveredCell.losses}
              </Text>
            </View>

            {hoveredCell.dominantStroke && (
              <View style={styles.tooltipRow}>
                <Text style={styles.tooltipLabel}>Dominant Shot:</Text>
                <Text style={styles.tooltipValue}>
                  {formatStrokeName(hoveredCell.dominantStroke)}
                </Text>
              </View>
            )}

            <View style={styles.tooltipRow}>
              <Text style={styles.tooltipLabel}>Vulnerability:</Text>
              <Text
                style={[
                  styles.tooltipValue,
                  {
                    color:
                      hoveredCell.vulnerability === "high"
                        ? "#DC2626"
                        : hoveredCell.vulnerability === "medium"
                        ? "#CA8A04"
                        : "#16A34A",
                  },
                ]}
              >
                {hoveredCell.vulnerability.toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setHoveredZone(null)}
              style={styles.tooltipClose}
            >
              <Text style={styles.tooltipCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendHeader}>
          <Text style={styles.legendTitle}>Color Legend:</Text>
          <Text style={styles.legendSubtitle}>Win Rate</Text>
        </View>

        <Text style={styles.legendAvgRate}>
          Your average win rate across zones:{" "}
          <Text style={styles.legendAvgRateValue}>
            {avgWinRate.toFixed(1)}%
          </Text>
        </Text>

        {/* Gradient bar */}
        <View style={styles.gradientContainer}>
          <View
            style={[
              styles.gradientBar,
              {
                backgroundColor:
                  "linear-gradient(to right, #EF4444, #F97316, #FACC15, #84CC16, #22C55E)",
              },
            ]}
          />
        </View>

        {/* Legend items */}
        <View style={styles.legendItems}>
          <View style={styles.legendItemRow}>
            <View
              style={[styles.legendItemBox, { backgroundColor: "#EF4444" }]}
            />
            <Text style={styles.legendItemText}>Very Weak (&lt; avg - 10%)</Text>
          </View>

          <View style={styles.legendItemRow}>
            <View
              style={[styles.legendItemBox, { backgroundColor: "#F97316" }]}
            />
            <Text style={styles.legendItemText}>Weak (avg - 10% to -5%)</Text>
          </View>

          <View style={styles.legendItemRow}>
            <View
              style={[styles.legendItemBox, { backgroundColor: "#FACC15" }]}
            />
            <Text style={styles.legendItemText}>
              Below Average (avg - 5% to avg)
            </Text>
          </View>

          <View style={styles.legendItemRow}>
            <View
              style={[styles.legendItemBox, { backgroundColor: "#84CC16" }]}
            />
            <Text style={styles.legendItemText}>
              Above Average (avg to avg + 10%)
            </Text>
          </View>

          <View style={styles.legendItemRow}>
            <View
              style={[styles.legendItemBox, { backgroundColor: "#22C55E" }]}
            />
            <Text style={styles.legendItemText}>
              Very Strong (&gt;= avg + 10%)
            </Text>
          </View>
        </View>

        <Text style={styles.legendNote}>
          * Zones with fewer than 3 shots are marked as neutral (insufficient
          data)
        </Text>
      </View>

      {/* Vulnerable Zones Summary */}
      {zoneData.vulnerableZones.length > 0 && (
        <View style={styles.vulnerableZonesContainer}>
          <Text style={styles.vulnerableZonesTitle}>Top Vulnerable Zones:</Text>
          {zoneData.vulnerableZones.map((zone, idx) => (
            <Text key={idx} style={styles.vulnerableZoneItem}>
              • {zone.zone} - {zone.lossRate.toFixed(0)}% loss rate
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  title: {
    ...Typography['2xl'],
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.xs,
    color: Colors.light.textTertiary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  svgContainer: {
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.light.backgroundSecondary,
  },
  tooltipContainer: {
    marginVertical: Spacing.md,
  },
  tooltip: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltipTitle: {
    ...Typography.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  tooltipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tooltipLabel: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
  },
  tooltipValue: {
    ...Typography.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
  },
  insufficientData: {
    color: Colors.light.textTertiary,
    fontWeight: Typography.weights.normal,
  },
  tooltipClose: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltipCloseText: {
    color: Colors.light.textSecondary,
    fontSize: 16,
    fontWeight: Typography.weights.bold,
  },
  legendContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  legendHeader: {
    marginBottom: Spacing.sm,
  },
  legendTitle: {
    ...Typography.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
  },
  legendSubtitle: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
  },
  legendAvgRate: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  legendAvgRateValue: {
    fontWeight: Typography.weights.semibold,
    color: "#2563EB",
  },
  gradientContainer: {
    marginBottom: Spacing.md,
  },
  gradientBar: {
    height: 16,
    borderRadius: BorderRadius.sm,
    width: "100%",
  },
  legendItems: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  legendItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendItemBox: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.sm,
  },
  legendItemText: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  legendNote: {
    ...Typography.xs,
    color: Colors.light.textTertiary,
    fontStyle: "italic",
    marginTop: Spacing.sm,
  },
  vulnerableZonesContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  vulnerableZonesTitle: {
    ...Typography.base,
    fontWeight: Typography.weights.semibold,
    color: "#7F1D1D",
    marginBottom: Spacing.sm,
  },
  vulnerableZoneItem: {
    ...Typography.xs,
    color: "#7F1D1D",
    marginBottom: 4,
  },
});
