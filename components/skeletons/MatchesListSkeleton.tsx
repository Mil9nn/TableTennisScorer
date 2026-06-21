import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { DesignTokens } from "@/constants/designTokens";

export default function MatchesListSkeleton() {
  return (
    <View style={styles.container}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Header: Format & Status */}
            <View style={styles.cardHeader}>
              <Skeleton width={80} height={16} borderRadius={DesignTokens.borderRadius.sm} />
              <Skeleton width={60} height={16} borderRadius={DesignTokens.borderRadius.sm} />
            </View>

            {/* Match Content: Players & Score */}
            <View style={styles.matchContent}>
              {/* Side 1: Avatar + Name */}
              <View style={styles.playerSection}>
                <View style={styles.playerInfo}>
                  <View style={styles.avatarContainer}>
                    <Skeleton width={32} height={32} borderRadius={16} />
                  </View>
                  <Skeleton width={100} height={16} borderRadius={DesignTokens.borderRadius.sm} />
                </View>
              </View>

              {/* Score */}
              <View style={styles.scoreContainer}>
                <Skeleton width={50} height={20} borderRadius={DesignTokens.borderRadius.sm} />
              </View>

              {/* Side 2: Name + Avatar */}
              <View style={[styles.playerSection, styles.playerSectionRight]}>
                <View style={[styles.playerInfo, styles.playerInfoRight]}>
                  <Skeleton width={100} height={16} borderRadius={DesignTokens.borderRadius.sm} />
                  <View style={styles.avatarContainer}>
                    <Skeleton width={32} height={32} borderRadius={16} />
                  </View>
                </View>
              </View>
            </View>


            <View style={styles.metaRow}>
              <Skeleton width={70} height={12} borderRadius={DesignTokens.borderRadius.sm} />
              <Skeleton width={50} height={12} borderRadius={DesignTokens.borderRadius.sm} />
              <Skeleton width={60} height={12} borderRadius={DesignTokens.borderRadius.sm} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: DesignTokens.colors.background.tertiary,
  },
  cardContainer: {
    marginBottom: DesignTokens.spacing[1],
  },
  card: {
    backgroundColor: DesignTokens.colors.background.primary,
    padding: DesignTokens.spacing[5],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing[4],
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[4],
  },
  playerSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  playerSectionRight: {
    alignItems: 'flex-end',
  },
  playerInfo: {
    alignItems: 'flex-start',
    gap: DesignTokens.spacing[2],
  },
  playerInfoRight: {
    alignItems: 'flex-end',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlap: {
    marginLeft: -DesignTokens.spacing[2],
  },
  avatarOverlapRight: {
    marginRight: -DesignTokens.spacing[2],
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[2],
  },
});

