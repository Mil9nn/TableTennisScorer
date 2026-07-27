import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { TournamentTabView, TabRoute } from "@/components/ui/TournamentTabView";
import { InfoTab } from "@/components/match-stats/tabs/InfoTab";
import { OverviewTab } from "@/components/match-stats/tabs/OverviewTab";
import { PerformanceTab } from "@/components/match-stats/tabs/PerformanceTab";
import { DetailsTab } from "@/components/match-stats/tabs/DetailsTab";
import type { MatchStatsData } from "@/hooks/useMatchStatsData";
import type { Match } from "@/types/match.type";

const TAB_ROUTES: TabRoute[] = [
  { key: "info", title: "Info" },
  { key: "overview", title: "Overview" },
  { key: "performance", title: "Performance" },
  { key: "details", title: "Details" },
];

interface MatchStatsTabContentProps {
  match: Match;
  data: MatchStatsData;
}

export function MatchStatsTabContent({ match, data }: MatchStatsTabContentProps) {
  const [tabIndex, setTabIndex] = useState(0);

  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      const content = (() => {
        switch (route.key) {
          case "info":
            return <InfoTab match={match} />;
          case "overview":
            return <OverviewTab data={data} />;
          case "performance":
            return <PerformanceTab data={data} />;
          case "details":
            return <DetailsTab data={data} />;
          default:
            return null;
        }
      })();

      return (
        <ScrollView
          style={styles.scene}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sceneContent}
        >
          {content}
        </ScrollView>
      );
    },
    [match, data]
  );

  const routes = useMemo(() => TAB_ROUTES, []);

  return (
    <View style={styles.wrapper}>
      <TournamentTabView
        routes={routes}
        index={tabIndex}
        onIndexChange={setTabIndex}
        renderScene={renderScene}
        lazy
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scene: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  sceneContent: {
    paddingBottom: 32,
  },
});
