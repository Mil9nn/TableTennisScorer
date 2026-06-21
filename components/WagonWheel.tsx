import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from "react-native";
import Svg, {
  Rect,
  Line,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
} from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import { Shot } from "@/types/shot.type";
import { SHOT_TYPE_COLORS } from "@/constants/constants";
import { formatStrokeName } from "@/lib/utils";
import { getShotColor } from "@/lib/match-stats-utils";
import { generateShortCommentary } from "@/lib/shot-commentary-utils";
import { Spacing, BorderRadius, Colors, Typography } from "@/constants/theme";
import { Card } from "@/components/ui/Card";

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WagonWheelProps {
  shots: Shot[];
  title?: string;
  animateOnce?: boolean;
}

export default function WagonWheel({ shots, title, animateOnce = false }: WagonWheelProps) {
  const [hoveredShot, setHoveredShot] = useState<number | null>(null);
  const [selectedStroke, setSelectedStroke] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    shot: Shot;
    index: number;
  } | null>(null);

  const validShots = shots.filter(
    (s) =>
      s.originX != null &&
      s.originY != null &&
      s.landingX != null &&
      s.landingY != null
  );

  if (validShots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyEmoji}>📊</Text>
        </View>
        <Text style={styles.emptyTitle}>No shot data available</Text>
        <Text style={styles.emptySubtitle}>Start tracking to see shot patterns</Text>
      </View>
    );
  }

  const strokeTypes = Array.from(
    new Set(validShots.map((s) => s.stroke).filter(Boolean))
  );

  const displayShots = selectedStroke
    ? validShots.filter((s) => s.stroke === selectedStroke)
    : validShots;

  const handleShotPress = (shot: Shot, index: number) => {
    setHoveredShot(index);
    setTooltipData({ shot, index });
    setTooltipVisible(true);
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Stroke filter buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          onPress={() => setSelectedStroke(null)}
          style={[
            styles.filterButton,
            selectedStroke === null && styles.filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedStroke === null && styles.filterButtonTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {strokeTypes.map((stroke) => {
          const count = validShots.filter((s) => s.stroke === stroke).length;
          const color = getShotColor(stroke!);
          return (
            <TouchableOpacity
              key={stroke}
              onPress={() => setSelectedStroke(stroke!)}
              style={[
                styles.filterButton,
                selectedStroke === stroke && styles.filterButtonActive,
                selectedStroke === stroke && { backgroundColor: color },
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedStroke === stroke && styles.filterButtonTextActive,
                ]}
              >
                {formatStrokeName(stroke!)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* SVG Canvas */}
      <View style={styles.svgContainer}>
        <Svg viewBox="0 0 548 305" width="100%" height={200} style={styles.svg}>
          <Defs>
            <LinearGradient id="tableGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#2563EB" />
              <Stop offset="50%" stopColor="#1D4ED8" />
              <Stop offset="100%" stopColor="#1E40AF" />
            </LinearGradient>
            <RadialGradient id="floorGradient">
              <Stop offset="0%" stopColor="#E5E7EB" />
              <Stop offset="100%" stopColor="#D1D5DB" />
            </RadialGradient>
          </Defs>

          {/* Floor/Off-table area */}
          <Rect
            x="0"
            y="0"
            width="548"
            height="305"
            fill="#000"
            stroke="#fff"
            strokeWidth="5"
            rx="8"
          />

          {/* Table surface */}
          <Rect
            x="182.67"
            y="101.67"
            width="182.67"
            height="101.67"
            fill="url(#tableGradient)"
            stroke="#1E3A8A"
            strokeWidth="2"
            opacity="0.95"
          />

          {/* Center line on table */}
          <Line
            x1="274"
            y1="101.67"
            x2="274"
            y2="203.34"
            stroke="white"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity="0.5"
          />

          {/* Net */}
          <Line
            x1="274"
            y1="101.67"
            x2="274"
            y2="203.34"
            stroke="#fff"
            strokeWidth="4"
            opacity="0.7"
          />

          {/* Net posts */}
          <Circle cx="274" cy="76.25" r="6" fill="#1F2937" stroke="#374151" strokeWidth="1" />
          <Circle cx="274" cy="228.75" r="6" fill="#1F2937" stroke="#374151" strokeWidth="1" />

          {/* Reference grid */}
          <G opacity="0.1">
            {[0, 137, 274, 411, 548].map((x) => (
              <Line
                key={`v-${x}`}
                x1={x}
                y1="0"
                x2={x}
                y2="305"
                stroke="#6B7280"
                strokeWidth="0.5"
              />
            ))}
            {[0, 76.25, 152.5, 228.75, 305].map((y) => (
              <Line
                key={`h-${y}`}
                x1="0"
                y1={y}
                x2="548"
                y2={y}
                stroke="#6B7280"
                strokeWidth="0.5"
              />
            ))}
          </G>

          {/* Shot trajectories */}
          {displayShots.map((shot, idx) => {
            const x1 = ((shot.originX! + 100) / 300) * 548;
            const y1 = ((shot.originY! + 100) / 300) * 305;
            const x2 = 182.67 + (shot.landingX! / 100) * 182.67;
            const y2 = 101.67 + (shot.landingY! / 100) * 101.67;

            const isHovered = hoveredShot === idx;
            const shotColor = getShotColor(shot.stroke!);

            const originOnTable =
              shot.originX! >= 0 &&
              shot.originX! <= 100 &&
              shot.originY! >= 0 &&
              shot.originY! <= 100;

            return (
              <G key={idx}>
                {/* Shot trajectory line */}
                <Line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={shotColor}
                  strokeWidth={isHovered ? 2 : 1}
                  strokeLinecap="round"
                  opacity={hoveredShot !== null && !isHovered ? 0.3 : 0.85}
                />

                {/* Origin marker */}
                <Circle
                  cx={x1}
                  cy={y1}
                  r={isHovered ? 5 : 2.5}
                  fill={originOnTable ? shotColor : "#9CA3AF"}
                  stroke="white"
                  strokeWidth="0.5"
                  opacity="0.8"
                />

                {/* Landing marker */}
                <TouchableOpacity
                  onPress={() => handleShotPress(shot, idx)}
                  activeOpacity={0.7}
                  style={{
                    position: "absolute",
                    left: (x2 / 548) * 100 + "%",
                    top: (y2 / 305) * 100 + "%",
                    transform: [{ translateX: -(isHovered ? 7 : 4) }, { translateY: -(isHovered ? 7 : 4) }],
                  }}
                >
                  <Circle
                    cx={x2}
                    cy={y2}
                    r={isHovered ? 7 : 4}
                    fill="#FFD700"
                    stroke="white"
                    strokeWidth={isHovered ? 2 : 1}
                  />
                </TouchableOpacity>
              </G>
            );
          })}
        </Svg>

        {/* Tooltip */}
        {tooltipVisible && tooltipData && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>Point #{tooltipData.index + 1}</Text>
            <Text style={styles.tooltipStroke}>
              {formatStrokeName(tooltipData.shot.stroke || "Unknown")}
            </Text>
            <View style={styles.tooltipDivider} />
            <Text style={styles.tooltipCommentary}>
              {generateShortCommentary(tooltipData.shot)}
            </Text>
            <View style={styles.tooltipCoords}>
              <Text style={styles.tooltipCoord}>
                Origin: ({tooltipData.shot.originX?.toFixed(0)},{" "}
                {tooltipData.shot.originY?.toFixed(0)})
              </Text>
              <Text style={styles.tooltipCoord}>
                Landing: ({tooltipData.shot.landingX?.toFixed(0)},{" "}
                {tooltipData.shot.landingY?.toFixed(0)})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setTooltipVisible(false);
                setHoveredShot(null);
              }}
              style={styles.tooltipClose}
            >
              <Text style={styles.tooltipCloseText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotLanding]} />
          <Text style={styles.legendText}>Landing</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendLine} />
          <Text style={styles.legendText}>Shot trajectory</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.base,
  },
  title: {
    ...Typography.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
  },
  filterContainer: {
    marginVertical: Spacing.sm,
  },
  filterContent: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: "#2563eb",
  },
  filterButtonText: {
    ...Typography.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textSecondary,
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  svgContainer: {
    position: "relative",
    backgroundColor: "#f9fafb",
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
    minHeight: 200,
  },
  svg: {
    width: "100%",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    backgroundColor: "#f9fafb",
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.light.border,
    gap: Spacing.base,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    ...Typography.base,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textSecondary,
  },
  emptySubtitle: {
    ...Typography.sm,
    color: Colors.light.textTertiary,
  },
  tooltip: {
    position: "absolute",
    top: Spacing.base,
    right: Spacing.base,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltipTitle: {
    ...Typography.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.light.text,
    marginBottom: 4,
  },
  tooltipStroke: {
    ...Typography.xs,
    fontWeight: Typography.weights.medium,
    color: "#2563eb",
    marginBottom: Spacing.sm,
  },
  tooltipDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginBottom: Spacing.sm,
  },
  tooltipCommentary: {
    ...Typography.xs,
    fontStyle: "italic",
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  tooltipCoords: {
    gap: 4,
  },
  tooltipCoord: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
  },
  tooltipClose: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  tooltipCloseText: {
    fontSize: 20,
    color: Colors.light.textSecondary,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.base,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fff",
  },
  legendDotLanding: {
    backgroundColor: "#FFD700",
  },
  legendLine: {
    width: 32,
    height: 2,
    backgroundColor: "#ef4444",
  },
  legendText: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
  },
});

