import React, { useState } from "react";
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
  Circle,
  G,
  Text as SvgText,
} from "react-native-svg";
import { Shot } from "@/types/shot.type";
import { getShotColor } from "@/lib/match-stats-utils";
import { formatStrokeName } from "@/lib/utils";
import { Spacing, BorderRadius, Colors, Typography } from "@/constants/theme";
import Card from "@/components/ui/Card";

interface ShotMapProps {
  shots: Shot[];
  title?: string;
  filterByStroke?: string | null;
}

interface TooltipData {
  shot: Shot;
  x: number;
  y: number;
}

export default function ShotMap({
  shots,
  title = "Shot Map",
  filterByStroke = null,
}: ShotMapProps) {
  const [hoveredShotIndex, setHoveredShotIndex] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const { width: screenWidth } = useWindowDimensions();

  // Filter valid shots (those with coordinates)
  const validShots = shots.filter(
    (s) =>
      s.originX != null &&
      s.originY != null &&
      s.landingX != null &&
      s.landingY != null
  );

  // Apply stroke filter if specified
  const displayShots = filterByStroke
    ? validShots.filter((s) => s.stroke === filterByStroke)
    : validShots;

  if (displayShots.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No shot data available</Text>
          <Text style={styles.emptyStateSubtext}>
            Start tracking to see shot patterns
          </Text>
        </View>
      </View>
    );
  }

  // SVG dimensions
  const SVG_WIDTH = 548;
  const SVG_HEIGHT = 305;
  const TABLE_X = 182.67;
  const TABLE_Y = 101.67;
  const TABLE_WIDTH = 182.67;
  const TABLE_HEIGHT = 101.67;

  // Calculate responsive SVG dimensions
  const maxSvgWidth = screenWidth - Spacing.large * 2;
  const svgHeight = (maxSvgWidth / SVG_WIDTH) * SVG_HEIGHT;

  const handleShotPress = (shot: Shot, index: number) => {
    if (shot.landingX && shot.landingY) {
      const scaleX = maxSvgWidth / SVG_WIDTH;
      const scaleY = svgHeight / SVG_HEIGHT;

      setTooltipData({
        shot,
        x: shot.landingX * scaleX,
        y: shot.landingY * scaleY,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendLabel}>Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4F46E5" }]} />
            <Text style={styles.legendText}>Origin</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} />
            <Text style={styles.legendText}>Landing</Text>
          </View>
        </View>
      </View>

      {/* Shot Map SVG */}
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

            {/* End lines */}
            <Line
              x1={TABLE_X}
              y1={TABLE_Y}
              x2={TABLE_X + TABLE_WIDTH}
              y2={TABLE_Y}
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity="0.4"
            />

            <Line
              x1={TABLE_X}
              y1={TABLE_Y + TABLE_HEIGHT}
              x2={TABLE_X + TABLE_WIDTH}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity="0.4"
            />

            {/* Side lines */}
            <Line
              x1={TABLE_X}
              y1={TABLE_Y}
              x2={TABLE_X}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity="0.4"
            />

            <Line
              x1={TABLE_X + TABLE_WIDTH}
              y1={TABLE_Y}
              x2={TABLE_X + TABLE_WIDTH}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity="0.4"
            />

            {/* Shot trajectories and points */}
            {displayShots.map((shot, idx) => {
              const strokeColor = getShotColor(shot.stroke || "unknown");
              const isHovered = hoveredShotIndex === idx;

              return (
                <G key={`shot-${idx}`}>
                  {/* Trajectory line */}
                  <Line
                    x1={shot.originX}
                    y1={shot.originY}
                    x2={shot.landingX}
                    y2={shot.landingY}
                    stroke={strokeColor}
                    strokeWidth={isHovered ? "3" : "1.5"}
                    opacity={isHovered ? "1" : "0.6"}
                  />

                  {/* Origin point */}
                  <Circle
                    cx={shot.originX}
                    cy={shot.originY}
                    r={isHovered ? "6" : "4"}
                    fill="#4F46E5"
                    opacity={isHovered ? "1" : "0.8"}
                  />

                  {/* Landing point - clickable */}
                  <Circle
                    cx={shot.landingX}
                    cy={shot.landingY}
                    r={isHovered ? "7" : "5"}
                    fill={strokeColor}
                    opacity={isHovered ? "1" : "0.75"}
                    onPress={() => handleShotPress(shot, idx)}
                  />

                  {/* Shot number label */}
                  {isHovered && (
                    <SvgText
                      x={shot.landingX}
                      y={shot.landingY - 12}
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {shot.shotNumber || idx + 1}
                    </SvgText>
                  )}
                </G>
              );
            })}

            {/* Table border */}
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
      {tooltipData && (
        <View style={styles.tooltipContainer}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>
              Shot #{tooltipData.shot.shotNumber || "N/A"}
            </Text>
            {tooltipData.shot.stroke && (
              <Text style={styles.tooltipText}>
                Stroke: {formatStrokeName(tooltipData.shot.stroke)}
              </Text>
            )}
            {tooltipData.shot.player?.name && (
              <Text style={styles.tooltipText}>
                Player: {tooltipData.shot.player.name}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => setTooltipData(null)}
              style={styles.tooltipClose}
            >
              <Text style={styles.tooltipCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Shots</Text>
          <Text style={styles.statValue}>{displayShots.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg Distance</Text>
          <Text style={styles.statValue}>
            {(
              displayShots.reduce((sum, shot) => {
                if (
                  shot.originX &&
                  shot.originY &&
                  shot.landingX &&
                  shot.landingY
                ) {
                  const dx = shot.landingX - shot.originX;
                  const dy = shot.landingY - shot.originY;
                  return sum + Math.sqrt(dx * dx + dy * dy);
                }
                return sum;
              }, 0) / displayShots.length
            ).toFixed(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  title: {
    ...Typography['2xl'],
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.md,
    color: Colors.light.text,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
  },
  emptyStateText: {
    ...Typography.base,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    ...Typography.xs,
    color: Colors.light.textTertiary,
  },
  legendContainer: {
    marginBottom: Spacing.md,
  },
  legendLabel: {
    ...Typography.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  legendItems: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
  },
  svgContainer: {
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.light.backgroundSecondary,
  },
  tooltipContainer: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
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
    minWidth: 200,
  },
  tooltipTitle: {
    ...Typography.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  tooltipText: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
    marginBottom: 4,
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
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  statLabel: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    ...Typography.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
  },
});
