import React from "react";
import { Animated, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import { KnockoutStatistics } from "@/components/tournaments/statistics/KnockoutStatistics";

const tokens = DesignTokens;

interface StatisticsTabProps {
  tournament: any;
  fadeAnim: Animated.Value;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
  tournament,
  fadeAnim,
}) => {
  return (
    <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
      <View style={styles.contentCardHeader}>
        <View style={styles.contentCardHeaderLeft}>
          <Ionicons name="bar-chart-outline" size={20} color={tokens.colors.primary[600]} />
          <Text style={styles.contentCardTitle}>Tournament Statistics</Text>
        </View>
      </View>
      <View style={styles.contentCardBody}>
        <KnockoutStatistics
          statistics={tournament.knockoutStatistics}
          category={tournament.category as "individual" | "team"}
        />
      </View>
    </Animated.View>
  );
};

const styles = {
  contentCard: {
    backgroundColor: tokens.colors.white,
  },
  contentCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  contentCardHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: tokens.spacing[8],
  },
  contentCardTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: tokens.typography.letterSpacing.wide,
  },
  contentCardBody: {
    padding: tokens.spacing[4],
  },
};
