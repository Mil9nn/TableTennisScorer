import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { useThemeColors } from "@/hooks/useThemeColors";

const ROW_COUNT = 8;
const LOGO_SIZE = 52;

function TournamentRowSkeleton() {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
          minHeight: 72,
        },
        body: {
          flex: 1,
          minWidth: 0,
          gap: 6,
        },
        titleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
        },
      }),
    [theme],
  );

  return (
    <View style={styles.row}>
      <Skeleton
        muted
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        borderRadius={theme.borderRadius.md}
      />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Skeleton muted width="62%" height={14} borderRadius={theme.borderRadius.sm} />
          <Skeleton muted width={52} height={18} borderRadius={theme.borderRadius.full} />
        </View>
        <Skeleton muted width="78%" height={11} borderRadius={theme.borderRadius.sm} />
        <Skeleton muted width="55%" height={10} borderRadius={theme.borderRadius.sm} />
      </View>
    </View>
  );
}

export default function TournamentsSkeleton() {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        listFrame: {
          flex: 1,
          width: "100%",
          backgroundColor: theme.colors.background.tertiary,
        },
        cardContainer: {
          backgroundColor: theme.colors.background.primary,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.light,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.listFrame}>
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <View key={index} style={styles.cardContainer}>
          <TournamentRowSkeleton />
        </View>
      ))}
    </View>
  );
}
