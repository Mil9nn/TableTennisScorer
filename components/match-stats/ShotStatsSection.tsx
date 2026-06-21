import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Shot } from "@/types/shot.type";
import { getShotColor } from "@/lib/match-stats-utils";
import { formatStrokeName } from "@/lib/utils";
import { Spacing, BorderRadius, Colors, Typography } from "@/constants/theme";

interface ShotStatsSectionProps {
  shots: Shot[];
}

interface ShotStats {
  shotTypes: Record<string, number>;
  totalShots: number;
  avgShotDistance: number;
}

export default function ShotStatsSection({ shots }: ShotStatsSectionProps) {
  const [selectedStroke, setSelectedStroke] = useState<string | null>(null);

  const shotsWithStroke = useMemo(
    () => shots.filter((s) => s.stroke),
    [shots]
  );

  const coordinateShots = useMemo(() => {
    return shots.filter(
      (s) =>
        s.originX != null &&
        s.originY != null &&
        s.landingX != null &&
        s.landingY != null
    );
  }, [shots]);

  // Compute shot statistics (stroke counts from any tagged shot; distance from coordinate shots only)
  const stats = useMemo((): ShotStats => {
    const shotTypes: Record<string, number> = {};
    let totalDistance = 0;

    shotsWithStroke.forEach((shot) => {
      if (shot.stroke) {
        shotTypes[shot.stroke] = (shotTypes[shot.stroke] || 0) + 1;
      }
    });

    coordinateShots.forEach((shot) => {
      if (
        shot.originX != null &&
        shot.originY != null &&
        shot.landingX != null &&
        shot.landingY != null
      ) {
        const dx = shot.landingX - shot.originX;
        const dy = shot.landingY - shot.originY;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
      }
    });

    return {
      shotTypes,
      totalShots: shotsWithStroke.length,
      avgShotDistance:
        coordinateShots.length > 0
          ? totalDistance / coordinateShots.length
          : 0,
    };
  }, [shotsWithStroke, coordinateShots]);

  const strokeTypes = Object.entries(stats.shotTypes).sort(
    ([, a], [, b]) => b - a
  );

  if (shotsWithStroke.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Shot Statistics</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No shot data available</Text>
          <Text style={styles.emptyStateSubtext}>
            Complete a match and track shots to view statistics
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Summary Stats */}
      <View style={styles.summaryCard}>
        <Text style={styles.title}>Shot Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Shots</Text>
            <Text style={styles.summaryValue}>{stats.totalShots}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg Distance</Text>
            <Text style={styles.summaryValue}>
              {stats.avgShotDistance.toFixed(1)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Shot Types</Text>
            <Text style={styles.summaryValue}>{strokeTypes.length}</Text>
          </View>
        </View>
      </View>

      {/* Stroke Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.title}>Stroke Breakdown</Text>

        <View style={styles.strokeFilters}>
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

          {strokeTypes.map(([stroke, count]) => {
            const color = getShotColor(stroke);
            const isSelected = selectedStroke === stroke;

            return (
              <TouchableOpacity
                key={stroke}
                onPress={() => setSelectedStroke(stroke)}
                style={[
                  styles.filterButton,
                  isSelected && {
                    backgroundColor: color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    isSelected && styles.filterButtonTextActive,
                  ]}
                >
                  {formatStrokeName(stroke)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stroke Statistics Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>
              Stroke Type
            </Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>
              Count
            </Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>
              Percentage
            </Text>
          </View>

          {strokeTypes.map(([stroke, count]) => {
            const percentage = ((count / stats.totalShots) * 100).toFixed(1);
            const color = getShotColor(stroke);

            return (
              <View key={stroke} style={styles.tableRow}>
                <View style={styles.strokeNameCell}>
                  <View
                    style={[styles.colorDot, { backgroundColor: color }]}
                  />
                  <Text style={styles.strokeName}>
                    {formatStrokeName(stroke)}
                  </Text>
                </View>
                <Text style={styles.tableCell}>{count}</Text>
                <Text style={styles.tableCell}>{percentage}%</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Detailed Shot Analysis */}
      <View style={styles.analysisCard}>
        <Text style={styles.title}>Shot Analysis</Text>

        {selectedStroke ? (
          <>
            <Text style={styles.analysisSubtitle}>
              {formatStrokeName(selectedStroke)} - Detailed Stats
            </Text>

            <View style={styles.analysisList}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Total Strokes:</Text>
                <Text style={styles.analysisValue}>
                  {stats.shotTypes[selectedStroke]}
                </Text>
              </View>

              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Percentage of Total:</Text>
                <Text style={styles.analysisValue}>
                  {(
                    (stats.shotTypes[selectedStroke] / stats.totalShots) *
                    100
                  ).toFixed(1)}
                  %
                </Text>
              </View>

              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>
                  Avg Distance for Stroke:
                </Text>
                <Text style={styles.analysisValue}>
                  {(
                    coordinateShots
                      .filter((s) => s.stroke === selectedStroke)
                      .reduce((sum: number, shot: Shot) => {
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
                      }, 0) / stats.shotTypes[selectedStroke]
                  ).toFixed(1)}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.analysisSubtitle}>Overall Shot Analysis</Text>

            <View style={styles.analysisList}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Most Used Stroke:</Text>
                <Text style={styles.analysisValue}>
                  {formatStrokeName(strokeTypes[0][0])} (
                  {strokeTypes[0][1]} shots)
                </Text>
              </View>

              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Shot Variety:</Text>
                <Text style={styles.analysisValue}>{strokeTypes.length}</Text>
              </View>

              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Total Shot Distance:</Text>
                <Text style={styles.analysisValue}>
                  {(stats.avgShotDistance * stats.totalShots).toFixed(0)}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  summaryCard: {
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.md,
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
  summaryGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
  },
  summaryLabel: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    ...Typography['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.light.text,
  },
  breakdownCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  strokeFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterButtonActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  filterButtonText: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  table: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderBottomColor: Colors.light.border,
  },
  tableCell: {
    flex: 1,
    ...Typography.xs,
    color: Colors.light.textSecondary,
    textAlign: "right",
  },
  tableHeaderText: {
    fontWeight: "600",
    color: Colors.light.text,
    textAlign: "center",
  },
  strokeNameCell: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  strokeName: {
    ...Typography.xs,
    color: Colors.light.text,
    fontWeight: "500",
  },
  analysisCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  analysisSubtitle: {
    ...Typography.base,
    color: Colors.light.textSecondary,
    fontWeight: "500",
    marginBottom: Spacing.md,
  },
  analysisList: {
    gap: Spacing.md,
  },
  analysisItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  analysisLabel: {
    ...Typography.base,
    color: Colors.light.textSecondary,
  },
  analysisValue: {
    ...Typography.base,
    color: Colors.light.text,
    fontWeight: "600",
  },
});
