import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { TournamentTabView, type TabRoute } from "@/components/ui/TournamentTabView";
import { useThemeColors } from "@/hooks/useThemeColors";

import MatchesScreen from "./MatchesScreen";
import TournamentsScreen from "./TournamentsScreen";
import TeamsScreen from "./TeamsScreen";

const MY_TENNIS_ROUTES: TabRoute[] = [
  { key: "matches", title: "Matches" },
  { key: "tournaments", title: "Tournaments" },
  { key: "teams", title: "Teams" },
];

const VALID_SECTION_KEYS = new Set(MY_TENNIS_ROUTES.map((r) => r.key));

function sectionKeyFromParam(section: string | string[] | undefined): string {
  const value = Array.isArray(section) ? section[0] : section;
  if (value && VALID_SECTION_KEYS.has(value)) return value;
  return "matches";
}

export default function MyTennisScreen() {
  const theme = useThemeColors();
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string | string[] }>();

  const [tabIndex, setTabIndex] = useState(() => {
    const key = sectionKeyFromParam(section);
    return MY_TENNIS_ROUTES.findIndex((r) => r.key === key);
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        },
      }),
    [theme],
  );

  useEffect(() => {
    const key = sectionKeyFromParam(section);
    const nextIndex = MY_TENNIS_ROUTES.findIndex((r) => r.key === key);
    if (nextIndex === -1) return;
    setTabIndex((current) => (current === nextIndex ? current : nextIndex));
  }, [section]);

  const handleTabIndexChange = useCallback(
    (index: number) => {
      if (index < 0 || index >= MY_TENNIS_ROUTES.length || index === tabIndex) {
        return;
      }
      const nextSection = MY_TENNIS_ROUTES[index].key;
      setTabIndex(index);
      router.setParams({ tab: "my-tennis", section: nextSection });
    },
    [router, tabIndex],
  );

  const renderScene = useCallback(({ route }: { route: TabRoute }) => {
    switch (route.key) {
      case "matches":
        return <MatchesScreen />;
      case "tournaments":
        return <TournamentsScreen />;
      case "teams":
        return <TeamsScreen />;
      default:
        return null;
    }
  }, []);

  return (
    <View style={styles.root}>
      <TournamentTabView
        routes={MY_TENNIS_ROUTES}
        index={tabIndex}
        onIndexChange={handleTabIndexChange}
        renderScene={renderScene}
        swipeEnabled
        animationEnabled
        lazy
        distributeTabs
      />
    </View>
  );
}
