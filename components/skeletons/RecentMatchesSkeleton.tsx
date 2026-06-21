import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function RecentMatchesSkeleton() {
  const placeholders = Array.from({ length: 2 });

  return (
    <View style={styles.container}>
      {placeholders.map((_, i) => (
        <View key={i} style={styles.card}>
          {/* Players Row */}
          <View style={styles.playersRow}>
            {/* Player 1 */}
            <View style={styles.player}>
              <Skeleton width={40} height={40} borderRadius={20} />
              <Skeleton width={80} height={16} borderRadius={4} />
            </View>

            {/* Player 2 */}
            <View style={styles.player}>
              <Skeleton width={80} height={16} borderRadius={4} />
              <Skeleton width={40} height={40} borderRadius={20} />
            </View>
          </View>

          {/* Divider + Score + Time */}
          <View style={styles.footer}>
            <Skeleton width={64} height={20} borderRadius={4} />
            <Skeleton width={96} height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  playersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.base,
  },
  player: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
});

