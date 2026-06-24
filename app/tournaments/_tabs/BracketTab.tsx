import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import KnockoutBracketView from "@/components/tournaments/KnockoutBracketView";

const tokens = DesignTokens;

interface BracketTabProps {
  tournament: any;
  fadeAnim: Animated.Value;
  knockoutMatches: any[];
  onMatchClick?: (matchId: string) => void;
}

export const BracketTab: React.FC<BracketTabProps> = ({
  tournament,
  fadeAnim,
  knockoutMatches,
  onMatchClick,
}) => {
  return (
    <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
      <View style={styles.contentCardHeader}>
        <View style={styles.contentCardHeaderLeft}>
          <Ionicons name="trophy-outline" size={20} color={tokens.colors.primary[600]} />
          <Text style={styles.contentCardTitle}>Knockout Bracket</Text>
        </View>
      </View>
      <KnockoutBracketView
        bracket={tournament.bracket}
        participants={
          tournament.format === "hybrid" &&
            tournament.qualifiedParticipants
            ? tournament.qualifiedParticipants
            : tournament.participants
        }
        matches={knockoutMatches as any}
        onMatchClick={onMatchClick}
        showThirdPlace={tournament.knockoutConfig?.thirdPlaceMatch}
        category={tournament.category as "individual" | "team"}
        matchType={tournament.matchType}
        doublesPairs={tournament.doublesPairs}
      />
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
});
