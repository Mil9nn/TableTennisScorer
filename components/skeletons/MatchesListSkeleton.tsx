import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { useThemeColors } from "@/hooks/useThemeColors";

const ROW_COUNT = 8;
const AVATAR_SIZE = 40;

function SinglesMatchRowSkeleton() {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          gap: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[4],
        },
        matchContent: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
        },
        playerSection: {
          flex: 1,
          minWidth: 0,
        },
        playerSectionRight: {
          alignItems: "flex-end",
        },
        playerInfo: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
        },
        playerInfoRight: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
        },
        scoreContainer: {
          alignItems: "center",
          justifyContent: "center",
          minWidth: 72,
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
      <View style={styles.matchContent}>
        <View style={styles.playerSection}>
          <View style={styles.playerInfo}>
            <Skeleton
              muted
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              borderRadius={AVATAR_SIZE / 2}
            />
            <Skeleton muted width={88} height={13} borderRadius={theme.borderRadius.sm} />
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Skeleton muted width={44} height={18} borderRadius={theme.borderRadius.sm} />
        </View>

        <View style={[styles.playerSection, styles.playerSectionRight]}>
          <View style={styles.playerInfoRight}>
            <Skeleton muted width={88} height={13} borderRadius={theme.borderRadius.sm} />
            <Skeleton
              muted
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              borderRadius={AVATAR_SIZE / 2}
            />
          </View>
        </View>
      </View>

      <View style={styles.metaStack}>
        <Skeleton muted width={120} height={12} borderRadius={theme.borderRadius.sm} />
        <View style={styles.metaRow}>
          <Skeleton muted width={58} height={10} borderRadius={theme.borderRadius.sm} />
          <Skeleton muted width={48} height={10} borderRadius={theme.borderRadius.sm} />
          <Skeleton muted width={72} height={10} borderRadius={theme.borderRadius.sm} />
        </View>
      </View>
    </View>
  );
}

export default function MatchesListSkeleton() {
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
          <SinglesMatchRowSkeleton />
        </View>
      ))}
    </View>
  );
}
