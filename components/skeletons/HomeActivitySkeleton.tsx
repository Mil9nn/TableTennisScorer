import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { useThemeColors } from "@/hooks/useThemeColors";

const ROW_COUNT = 4;

type HomeActivitySkeletonProps = {
  rowCount?: number;
};

export default function HomeActivitySkeleton({ rowCount = ROW_COUNT }: HomeActivitySkeletonProps) {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        listFrame: {
          paddingHorizontal: theme.spacing[4],
          gap: theme.spacing[4],
        },
        card: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: theme.colors.background.primary,
          paddingVertical: theme.spacing[4],
          paddingHorizontal: theme.spacing[4],
          borderRadius: theme.borderRadius.base,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          paddingRight: theme.spacing[1],
          gap: theme.spacing[2],
        },
        content: {
          flex: 1,
          minWidth: 0,
          gap: theme.spacing[1],
        },
        trailing: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[1],
        },
      }),
    [theme],
  );

  return (
    <View style={styles.listFrame}>
      {Array.from({ length: rowCount }).map((_, index) => {
        const delayMs = index * 70;

        return (
          <View key={index} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.content}>
                <Skeleton
                  muted
                  width="72%"
                  height={12}
                  borderRadius={theme.borderRadius.sm}
                  delayMs={delayMs}
                />
                <Skeleton
                  muted
                  width="48%"
                  height={10}
                  borderRadius={theme.borderRadius.sm}
                  delayMs={delayMs + 40}
                />
              </View>
            </View>
            <View style={styles.trailing}>
              <Skeleton muted width={36} height={10} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 60} />
              <Skeleton muted width={14} height={14} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 80} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
