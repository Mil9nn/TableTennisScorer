import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { useThemeColors } from "@/hooks/useThemeColors";

const ROW_COUNT = 8;
const AVATAR_SIZE = 40;
const AVATAR_OVERLAP = 8;

function OverlappingAvatarPair({ align }: { align: "left" | "right" }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
        },
        overlap: {
          marginLeft: align === "left" ? -AVATAR_OVERLAP : 0,
          marginRight: align === "right" ? -AVATAR_OVERLAP : 0,
        },
      }),
    [align],
  );

  return (
    <View style={styles.row}>
      <Skeleton
        muted
        width={AVATAR_SIZE}
        height={AVATAR_SIZE}
        borderRadius={AVATAR_SIZE / 2}
      />
      <Skeleton
        muted
        width={AVATAR_SIZE}
        height={AVATAR_SIZE}
        borderRadius={AVATAR_SIZE / 2}
        style={styles.overlap}
      />
    </View>
  );
}

function DoublesMatchRowSkeleton() {
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
          flexDirection: "column",
          alignItems: "flex-start",
          gap: theme.spacing[2],
        },
        playerInfoRight: {
          flexDirection: "column",
          alignItems: "flex-end",
          gap: theme.spacing[2],
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
            <OverlappingAvatarPair align="left" />
            <Skeleton muted width={100} height={13} borderRadius={theme.borderRadius.sm} />
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Skeleton muted width={44} height={18} borderRadius={theme.borderRadius.sm} />
        </View>

        <View style={[styles.playerSection, styles.playerSectionRight]}>
          <View style={styles.playerInfoRight}>
            <Skeleton muted width={100} height={13} borderRadius={theme.borderRadius.sm} />
            <OverlappingAvatarPair align="right" />
          </View>
        </View>
      </View>

      <View style={styles.metaStack}>
        <Skeleton muted width={120} height={12} borderRadius={theme.borderRadius.sm} />
        <View style={styles.metaRow}>
          <Skeleton muted width={64} height={10} borderRadius={theme.borderRadius.sm} />
          <Skeleton muted width={48} height={10} borderRadius={theme.borderRadius.sm} />
          <Skeleton muted width={72} height={10} borderRadius={theme.borderRadius.sm} />
        </View>
      </View>
    </View>
  );
}

export default function DoublesMatchesListSkeleton() {
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
          <DoublesMatchRowSkeleton />
        </View>
      ))}
    </View>
  );
}
