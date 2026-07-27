import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import {
  TabView,
  type NavigationState,
  type SceneRendererProps,
} from "react-native-tab-view";

import { useThemeColors } from "@/hooks/useThemeColors";
import type { TabRoute } from "@/components/ui/TournamentTabView";

import HomeScreen from "./_screens/HomeScreen";
import MyTennisScreen from "./_screens/MyTennisScreen";
import LeaderboardsScreen from "./_screens/LeaderboardsScreen";

const MAIN_TAB_ROUTES: TabRoute[] = [
  { key: "home", title: "Home", icon: "home" },
  { key: "my-tennis", title: "My tennis", icon: "my-tennis" },
  { key: "leaderboards", title: "Leaderboards", icon: "leaderboards" },
];

const VALID_TAB_KEYS = new Set(MAIN_TAB_ROUTES.map((r) => r.key));
const LEGACY_SECTION_TABS = new Set(["matches", "tournaments", "teams"]);

function tabKeyFromParam(tab: string | string[] | undefined): string {
  const value = Array.isArray(tab) ? tab[0] : tab;
  if (value && VALID_TAB_KEYS.has(value)) return value;
  // Profile moved to the profile stack — keep deep links from landing on a missing tab
  if (value === "profile") return "home";
  if (value && LEGACY_SECTION_TABS.has(value)) return "my-tennis";
  if (value?.startsWith("matches-")) return "my-tennis";
  return "home";
}

function sectionFromLegacyTab(tab: string | string[] | undefined): string | undefined {
  const value = Array.isArray(tab) ? tab[0] : tab;
  if (value && LEGACY_SECTION_TABS.has(value)) return value;
  if (value?.startsWith("matches-")) return "matches";
  return undefined;
}

function MainTabIcon({
  name,
  color,
  size = 20,
}: {
  name: string | undefined;
  color: string;
  size?: number;
}) {
  switch (name) {
    case "home":
      return <Feather name="home" size={size} color={color} />;
    case "my-tennis":
      return <FontAwesome5 name="table-tennis" size={size - 2} color={color} />;
    case "leaderboards":
      return <Feather name="bar-chart-2" size={size} color={color} />;
    default:
      return <Feather name="circle" size={size} color={color} />;
  }
}

function MainBottomBar({
  navigationState,
  onIndexChange,
  jumpTo,
}: {
  navigationState: NavigationState<TabRoute>;
  onIndexChange: (index: number) => void;
  jumpTo: (key: string) => void;
}) {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: "row",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.primary,
          paddingTop: theme.spacing[1],
          minHeight: 56,
        },
        item: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 48,
          paddingVertical: theme.spacing[1],
          gap: 2,
        },
        label: {
          fontSize: 11,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.tertiary,
        },
        labelActive: {
          color: theme.colors.primary[600],
          fontWeight: theme.typography.fontWeight.semibold,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {navigationState.routes.map((route, index) => {
        const focused = navigationState.index === index;
        const color = focused
          ? theme.colors.primary[600]
          : theme.colors.text.tertiary;

        return (
          <Pressable
            key={route.key}
            style={styles.item}
            onPress={() => {
              onIndexChange(index);
              jumpTo(route.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={route.title}
          >
            <MainTabIcon name={route.icon} color={color} />
            <Text
              style={[styles.label, focused && styles.labelActive]}
              numberOfLines={1}
            >
              {route.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MainTabsScreen() {
  const theme = useThemeColors();
  const router = useRouter();
  const { tab, section } = useLocalSearchParams<{
    tab?: string | string[];
    section?: string | string[];
  }>();

  const [tabIndex, setTabIndex] = useState(() => {
    const key = tabKeyFromParam(tab);
    return MAIN_TAB_ROUTES.findIndex((r) => r.key === key);
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        },
        scene: {
          flex: 1,
        },
      }),
    [theme],
  );

  useEffect(() => {
    const key = tabKeyFromParam(tab);
    const nextIndex = MAIN_TAB_ROUTES.findIndex((r) => r.key === key);
    if (nextIndex !== -1) {
      setTabIndex((current) => (current === nextIndex ? current : nextIndex));
    }

    const legacySection = sectionFromLegacyTab(tab);
    if (legacySection && !section) {
      router.setParams({ tab: "my-tennis", section: legacySection });
    }
  }, [tab, section, router]);

  const handleTabIndexChange = useCallback(
    (index: number) => {
      if (index < 0 || index >= MAIN_TAB_ROUTES.length || index === tabIndex) {
        return;
      }
      const nextTab = MAIN_TAB_ROUTES[index].key;
      setTabIndex(index);
      if (nextTab === "my-tennis") {
        const currentSection = Array.isArray(section) ? section[0] : section;
        router.setParams({
          tab: nextTab,
          section: currentSection || "matches",
        });
        return;
      }
      router.setParams({ tab: nextTab });
    },
    [router, tabIndex, section],
  );

  const renderScene = useCallback(
    ({ route }: SceneRendererProps & { route: TabRoute }) => {
      switch (route.key) {
        case "home":
          return <HomeScreen />;
        case "my-tennis":
          return <MyTennisScreen />;
        case "leaderboards":
          return <LeaderboardsScreen />;
        default:
          return null;
      }
    },
    [],
  );

  const renderTabBar = useCallback(
    (
      props: SceneRendererProps & {
        navigationState: NavigationState<TabRoute>;
      },
    ) => (
      <MainBottomBar
        navigationState={props.navigationState}
        onIndexChange={handleTabIndexChange}
        jumpTo={props.jumpTo}
      />
    ),
    [handleTabIndexChange],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <TabView
        navigationState={{ index: tabIndex, routes: MAIN_TAB_ROUTES }}
        onIndexChange={handleTabIndexChange}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        swipeEnabled={false}
        animationEnabled
        lazy
        tabBarPosition="bottom"
        style={styles.scene}
      />
    </SafeAreaView>
  );
}
