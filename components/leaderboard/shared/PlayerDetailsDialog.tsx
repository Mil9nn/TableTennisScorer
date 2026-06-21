import React from 'react';
import { View, Text, StyleSheet, Image, Modal, TouchableOpacity } from 'react-native';
import { DesignTokens } from '@/constants/designTokens';

export const PlayerDetailsDialog = ({ visible, onClose, data }) => {
  if (!data) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          
          {/* Header: Profile Info */}
          <View style={styles.header}>
            <Image source={{ uri: data.profileImage }} style={styles.avatar} />
            <View style={styles.headerText}>
              <Text style={styles.fullName} numberOfLines={1}>{data.fullName}</Text>
              <Text style={styles.username}>@{data.username}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Highlights: Win Rate & Streak */}
          <View style={styles.highlightRow}>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>Win Rate</Text>
              <Text style={[styles.highlightValue, { color: '#34C759' }]}>{data.winRate}</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>Streak</Text>
              <Text style={styles.highlightValue}>🔥 {data.streak}</Text>
            </View>
          </View>

          <View style={styles.dividerHorizontal} />

          {/* Detailed Stats Grid */}
          <View style={styles.statsContainer}>
            
            {/* Matches */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Matches</Text>
              <Text style={styles.statValue}>
                <Text style={styles.textWin}>{data.wins} wins</Text> - <Text style={styles.textLoss}>{data.losses} losses</Text> ({data.totalMatches} Total)
              </Text>
            </View>

            {/* Sets */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Sets</Text>
              <Text style={styles.statValue}>
                <Text style={styles.textWin}>{data.setsWon} wins</Text> - <Text style={styles.textLoss}>{data.setsLost} losses</Text>
              </Text>
            </View>

            {/* Points */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Points</Text>
              <Text style={styles.statValue}>
                {data.pointsScored} / {data.pointsConceded}
              </Text>
            </View>

            {/* Best Streak */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Best Streak</Text>
              <Text style={styles.statValue}>
                🔥 +{data.bestStreak}
              </Text>
            </View>

          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing[5],
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: DesignTokens.colors.background.primary,
    borderRadius: DesignTokens.borderRadius.sm,
    padding: DesignTokens.spacing[4],
    ...DesignTokens.shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing[4],
  },
  avatar: {
    width: DesignTokens.components.avatar.size.lg,
    height: DesignTokens.components.avatar.size.lg,
    borderRadius: DesignTokens.components.avatar.size.lg / 2,
    backgroundColor: DesignTokens.colors.background.tertiary,
  },
  headerText: {
    flex: 1,
    marginLeft: DesignTokens.spacing[3],
  },
  fullName: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
  },
  username: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    marginTop: DesignTokens.spacing[1],
  },
  closeButton: {
    padding: DesignTokens.spacing[1],
  },
  closeText: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    color: DesignTokens.colors.text.tertiary,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
  highlightRow: {
    flexDirection: 'row',
    backgroundColor: DesignTokens.colors.background.tertiary,
    borderRadius: DesignTokens.borderRadius.sm,
    paddingVertical: DesignTokens.spacing[3],
    marginBottom: DesignTokens.spacing[4],
  },
  highlightBox: {
    flex: 1,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: DesignTokens.colors.border.light,
  },
  highlightLabel: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.text.tertiary,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: DesignTokens.typography.letterSpacing.wide,
    marginBottom: DesignTokens.spacing[1],
  },
  highlightValue: {
    fontSize: DesignTokens.typography.fontSize['lg'],
    fontWeight: DesignTokens.typography.fontWeight.extrabold,
    color: DesignTokens.colors.text.primary,
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: DesignTokens.colors.border.light,
    marginBottom: DesignTokens.spacing[3],
  },
  statsContainer: {
    gap: DesignTokens.spacing[3],
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.secondary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  statValue: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  textWin: {
    color: DesignTokens.colors.success,
  },
  textLoss: {
    color: DesignTokens.colors.error,
  },
});