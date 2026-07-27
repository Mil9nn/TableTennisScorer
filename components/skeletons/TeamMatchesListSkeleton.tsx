import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { useThemeColors } from "@/hooks/useThemeColors";

const ROW_COUNT = 8;
const AVATAR_SIZE = 44;

function TeamMatchRowSkeleton() {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          gap: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[4],
        },
        rowTop: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
        },
        sideBlock: {
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
        },
        sideRight: {
          justifyContent: "flex-end",
        },
        metaStack: {
          gap: theme.spacing[2],
        },
        metaRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
        },
      }),
    [theme],
  );

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.sideBlock}>
          <Skeleton
            muted
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            borderRadius={AVATAR_SIZE / 2}
          />
          <Skeleton
            muted
            width={96}
            height={13}
            borderRadius={theme.borderRadius.sm}
            style={{ flex: 1, maxWidth: 120 }}
          />
        </View>

        <Skeleton muted width={44} height={18} borderRadius={theme.borderRadius.sm} />

        <View style={[styles.sideBlock, styles.sideRight]}>
          <Skeleton
            muted
            width={96}
            height={13}
            borderRadius={theme.borderRadius.sm}
            style={{ flex: 1, maxWidth: 120 }}
          />
          <Skeleton
            muted
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            borderRadius={AVATAR_SIZE / 2}
          />
        </View>
      </View>

      <View style={styles.metaStack}>
        <Skeleton muted width={120} height={12} borderRadius={theme.borderRadius.sm} />
        <View style={styles.metaRow}>
          <Skeleton muted width={56} height={10} borderRadius={theme.borderRadius.sm} />
          <Skeleton muted width={48} height={10} borderRadius={theme.borderRadius.sm} />
          <Skeleton muted width={80} height={10} borderRadius={theme.borderRadius.sm} />
        </View>
      </View>
    </View>
  );
}

export default function TeamMatchesListSkeleton() {
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
          <TeamMatchRowSkeleton />
        </View>
      ))}
    </View>
  );
}
