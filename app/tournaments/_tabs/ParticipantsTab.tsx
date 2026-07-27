import React from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import { Avatar } from "@/components/ui/Avatar";
import { 
  isTeamParticipant,
  getParticipantDisplayName,
  getParticipantImage,
} from "@/types/tournament.type";

const tokens = DesignTokens;

interface ParticipantsTabProps {
  tournament: any;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  isTeamTournament: boolean;
  onParticipantPress: (participant: any) => void;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
  tournament,
  fadeAnim,
  scaleAnim,
  isTeamTournament,
  onParticipantPress,
}) => {
  return (
    <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
      <View style={styles.contentCardHeader}>
        <View style={styles.contentCardHeaderLeft}>
          <Ionicons name="people-outline" size={20} color={tokens.colors.primary[600]} />
          <Text style={styles.contentCardTitle}>
            {isTeamTournament ? "Tournament Teams" : "Tournament Participants"}
          </Text>
        </View>
        <View style={styles.contentCardBadge}>
          <Text style={styles.contentCardBadgeText}>
            {tournament.participants?.length || 0} total
          </Text>
        </View>
      </View>
      <View style={styles.contentCardBody}>
        <View style={styles.participantsGrid}>
          {(tournament.participants || []).map((p: any) => {
            const isTeam = isTeamParticipant(p);
            const displayName = getParticipantDisplayName(p);
            const image = getParticipantImage(p);
            const primaryName = isTeam
              ? displayName
              : (p as any).fullName || (p as any).username || "Unknown";
            const secondaryText = isTeam
              ? (p as any).city ||
                `${(p as any).players?.length || 0} players`
              : (p as any).username
                ? `@${(p as any).username}`
                : undefined;

            return (
              <Animated.View
                key={p._id}
                style={[
                  styles.participantCard,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <Pressable
                  onPress={() => onParticipantPress(p)}
                  style={({ pressed }) => [
                    styles.participantCardInner,
                    pressed && styles.participantCardPressed,
                  ]}
                >
                  <View style={styles.participantLeft}>
                    <Avatar src={image} alt={displayName} size={40} />
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName} numberOfLines={1}>
                        {primaryName}
                      </Text>
                      {secondaryText ? (
                        <Text style={styles.participantSubtext} numberOfLines={1}>
                          {secondaryText}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  contentCard: {
    backgroundColor: tokens.colors.white,
  },
  contentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: tokens.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  contentCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[8],
  },
  contentCardTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: tokens.typography.letterSpacing.wide,
  },
  contentCardBadge: {
    backgroundColor: tokens.colors.primary[50],
    paddingHorizontal: tokens.spacing[8],
    paddingVertical: tokens.spacing[4],
    borderRadius: tokens.borderRadius.base,
  },
  contentCardBadgeText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.primary[600],
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  contentCardBody: {},
  participantsGrid: {
    flexDirection: "column",
    gap: tokens.spacing[2],
  },
  participantCard: {
    width: "100%",
  },
  participantCardInner: {
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.secondary,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    borderRadius: tokens.borderRadius.base,
  },
  participantCardPressed: {
    opacity: 0.7,
  },
  participantLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[4],
    flex: 1,
    minWidth: 0,
  },
  participantInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  participantName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  participantSubtext: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
    marginTop: 2,
  },
  seedBadge: {
    backgroundColor: tokens.colors.primary[100],
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.base,
  },
  seedBadgeText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[600],
  },
});
