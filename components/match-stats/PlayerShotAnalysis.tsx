import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { getShotColor } from "@/lib/match-stats-utils";

interface PlayerPieData {
  playerId: string;
  playerName: string;
  data: Array<{ name: string; value: number }>;
}

interface PlayerShotAnalysisProps {
  playerPieData: PlayerPieData[];
}

export function PlayerShotAnalysis({ playerPieData }: PlayerShotAnalysisProps) {
  if (!playerPieData.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Player Shot Analysis</Text>

      {playerPieData.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.cardsRow}>
            {playerPieData.map((player) => {
              const totalShots = player.data.reduce(
                (sum, item) => sum + item.value,
                0
              );

              const sortedData = [...player.data].sort((a, b) => b.value - a.value);
              const pieData = sortedData.slice(0, 6).map((item) => ({
                value: item.value,
                color: getShotColor(item.name),
                text: `${Math.round((item.value / Math.max(totalShots, 1)) * 100)}%`,
              }));

              return (
                <View key={player.playerId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.playerName}>{player.playerName}</Text>
                    <Text style={styles.totalShots}>
                      Total points: <Text style={styles.totalValue}>{totalShots}</Text>
                    </Text>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.chartWrap}>
                      <PieChart
                        data={pieData}
                        donut
                        radius={52}
                        innerRadius={34}
                        showText
                        textColor="#64748b"
                        textSize={10}
                        focusOnPress
                        strokeWidth={2}
                        strokeColor="#fff"
                      />
                    </View>
                    {sortedData.slice(0, 6).map((item, index) => {
                      const percentage = totalShots > 0 ? (item.value / totalShots) * 100 : 0;
                      return (
                        <View key={index} style={styles.shotRow}>
                          <View style={styles.shotInfo}>
                            <View
                              style={[
                                styles.colorDot,
                                { backgroundColor: getShotColor(item.name) },
                              ]}
                            />
                            <Text style={styles.shotName} numberOfLines={1}>
                              {item.name}
                            </Text>
                          </View>
                          <View style={styles.barContainer}>
                            <View
                              style={[
                                styles.bar,
                                {
                                  width: `${percentage}%`,
                                  backgroundColor: getShotColor(item.name),
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.shotValue}>{item.value}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    paddingHorizontal: 2,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eef0f3",
    minWidth: 280,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  totalShots: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  totalValue: {
    fontWeight: "600",
    color: "#1f2937",
  },
  cardContent: {
    padding: 16,
    gap: 10,
  },
  chartWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  shotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shotInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 90,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shotName: {
    fontSize: 12,
    color: "#334155",
    flex: 1,
  },
  barContainer: {
    flex: 1,
    height: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
  shotValue: {
    width: 28,
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "right",
  },
});

