import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { DesignTokens } from "@/constants/designTokens";

const AVATAR_SIZE = 32;
const SKELETON_COUNT = 10;

const tokens = DesignTokens;

function TeamMatchCardSkeleton() {
  return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Skeleton width={72} height={15} borderRadius={DesignTokens.borderRadius.sm} />
          <Skeleton width={76} height={15} borderRadius={DesignTokens.borderRadius.full} />
        </View>

        <View style={styles.rowTop}>
          <View style={styles.sideBlock}>
            <Skeleton
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              borderRadius={AVATAR_SIZE / 2}
            />
            <Skeleton
              width={100}
              height={12}
              borderRadius={DesignTokens.borderRadius.sm}
              style={styles.teamNameSkeleton}
            />
          </View>

          <View style={[styles.sideBlock, styles.sideRight]}>
            <Skeleton
              width={100}
              height={15}
              borderRadius={DesignTokens.borderRadius.sm}
              style={styles.teamNameSkeleton}
            />
            <Skeleton
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              borderRadius={AVATAR_SIZE / 2}
            />
          </View>
        </View>

        <View style={styles.metaRow}>
          <Skeleton width={64} height={11} borderRadius={DesignTokens.borderRadius.sm} />
          <Skeleton width={56} height={11} borderRadius={DesignTokens.borderRadius.sm} />
          <Skeleton width={88} height={11} borderRadius={DesignTokens.borderRadius.sm} />
        </View>
      </View>
  );
}

export default function TeamMatchesListSkeleton() {
  return (
    <View style={styles.listFrame}>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <TeamMatchCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listFrame: {
    flex: 1,
    width: "100%",
    backgroundColor: tokens.colors.background.secondary,
    gap: tokens.spacing[2],
  },
  card: {
    backgroundColor: DesignTokens.colors.background.primary,
    padding: tokens.spacing[4],
    gap: tokens.spacing[2],
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DesignTokens.spacing[10],
    marginBottom: DesignTokens.spacing[4],
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
  },
  sideBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  teamNameSkeleton: {
    minWidth: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 4,
  },
});
