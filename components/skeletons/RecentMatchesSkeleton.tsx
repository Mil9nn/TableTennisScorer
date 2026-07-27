import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { useThemeColors } from "@/hooks/useThemeColors";

const ROW_COUNT = 2;

export default function RecentMatchesSkeleton() {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: theme.spacing[4],
        },
        card: {
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          padding: theme.spacing[5],
          gap: theme.spacing[4],
        },
        playersRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: theme.spacing[4],
        },
        player: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
        },
        footer: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: theme.spacing[4],
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.light,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.playersRow}>
            <View style={styles.player}>
              <Skeleton width={40} height={40} borderRadius={20} />
              <Skeleton width={80} height={16} borderRadius={theme.borderRadius.sm} />
            </View>
            <View style={styles.player}>
              <Skeleton width={80} height={16} borderRadius={theme.borderRadius.sm} />
              <Skeleton width={40} height={40} borderRadius={20} />
            </View>
          </View>
          <View style={styles.footer}>
            <Skeleton width={64} height={20} borderRadius={theme.borderRadius.sm} />
            <Skeleton width={96} height={12} borderRadius={theme.borderRadius.sm} />
          </View>
        </View>
      ))}
    </View>
  );
}
