import { Skeleton } from "@/components/ui/Skeleton";
import { useThemeColors } from "@/hooks/useThemeColors";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

const ROW_COUNT = 8;
const LOGO_SIZE = 44;
const CAPTAIN_SIZE = 32;

function TeamRowSkeleton() {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          gap: theme.spacing[4],
        },
        topRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: theme.spacing[3],
        },
        info: {
          flex: 1,
          minWidth: 0,
          gap: 4,
          paddingTop: 2,
        },
        badges: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing[2],
        },
        captainBlock: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
        },
        captainTextCol: {
          flex: 1,
          minWidth: 0,
          gap: 2,
        },
        footerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing[2],
        },
      }),
    [theme],
  );

  return (
    <View style={styles.row}>
      <View style={styles.topRow}>
        <Skeleton
          muted
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          borderRadius={LOGO_SIZE / 2}
        />
        <View style={styles.info}>
          <Skeleton muted width="70%" height={16} borderRadius={theme.borderRadius.sm} />
          <Skeleton muted width="48%" height={12} borderRadius={theme.borderRadius.sm} />
        </View>
      </View>

      <View style={styles.badges}>
        <Skeleton muted width={48} height={22} borderRadius={theme.borderRadius.full} />
        <Skeleton muted width={64} height={22} borderRadius={theme.borderRadius.full} />
      </View>

      <View style={styles.captainBlock}>
        <Skeleton
          muted
          width={CAPTAIN_SIZE}
          height={CAPTAIN_SIZE}
          borderRadius={CAPTAIN_SIZE / 2}
        />
        <View style={styles.captainTextCol}>
          <Skeleton muted width={52} height={10} borderRadius={theme.borderRadius.sm} />
          <Skeleton muted width="55%" height={13} borderRadius={theme.borderRadius.sm} />
        </View>
      </View>

      <View style={styles.footerRow}>
        <Skeleton muted width={96} height={11} borderRadius={theme.borderRadius.sm} />
        <Skeleton muted width={80} height={13} borderRadius={theme.borderRadius.sm} />
      </View>
    </View>
  );
}

export default function TeamListSkeleton() {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        listFrame: {
          flex: 1,
          width: "100%",
          backgroundColor: theme.colors.background.tertiary,
          paddingTop: theme.spacing[3],
          paddingHorizontal: theme.spacing[3],
          gap: theme.spacing[4],
        },
        cardContainer: {
          backgroundColor: theme.colors.background.primary,
          overflow: "hidden",
        },
        cardInner: {
          paddingHorizontal: theme.spacing[5],
          paddingVertical: theme.spacing[5],
          backgroundColor: theme.colors.background.primary,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.listFrame}>
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <View key={index} style={styles.cardContainer}>
          <View style={styles.cardInner}>
            <TeamRowSkeleton />
          </View>
        </View>
      ))}
    </View>
  );
}
