import React from "react";
import { View } from "react-native";
import { KnockoutStatistics as KnockoutStatisticsType } from "@/types/knockoutStatistics.type";
import { ParticipantStatisticsSection } from "./ParticipantStatisticsSection";

interface KnockoutStatisticsProps {
  statistics: KnockoutStatisticsType;
  category: "individual" | "team";
}

export function KnockoutStatistics({ statistics, category }: KnockoutStatisticsProps) {
  return (
    <View>
      <ParticipantStatisticsSection
        progression={statistics.participantProgression}
        stats={statistics.participantStats}
        metrics={statistics.performanceMetrics}
      />
    </View>
  );
}

