import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TabView, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { StyleSheet, View, Text, Pressable, ScrollView, type LayoutChangeEvent } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface TabRoute {
  key: string;
  title: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface TournamentTabViewProps {
  routes: TabRoute[];
  index: number;
  onIndexChange: (index: number) => void;
  renderScene: (props: SceneRendererProps & { route: TabRoute }) => React.ReactNode;
  renderTabBar?: (props: any) => React.ReactNode;
  swipeEnabled?: boolean;
  animationEnabled?: boolean;
  lazy?: boolean;
  tabBarPosition?: 'top' | 'bottom';
  distributeTabs?: boolean;
}

const CustomTabBar: React.FC<{
  navigationState: NavigationState<TabRoute>;
  onIndexChange: (index: number) => void;
  jumpTo: (key: string) => void;
  distributeTabs?: boolean;
}> = ({ navigationState, onIndexChange, jumpTo, distributeTabs = false }) => {
  const theme = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});
  const [viewportWidth, setViewportWidth] = useState(0);

  const scrollActiveTabIntoView = useCallback(
    (animated: boolean) => {
      if (distributeTabs) return;

      const layout = tabLayouts.current[navigationState.index];
      if (!layout || viewportWidth <= 0 || !scrollRef.current) return;

      // Center the active tab in the viewport when possible
      const targetX = Math.max(0, layout.x + layout.width / 2 - viewportWidth / 2);
      scrollRef.current.scrollTo({ x: targetX, animated });
    },
    [distributeTabs, navigationState.index, viewportWidth],
  );

  useEffect(() => {
    scrollActiveTabIntoView(true);
  }, [scrollActiveTabIntoView]);

  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
  }, []);

  const handleTabLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      tabLayouts.current[index] = { x, width };
      if (index === navigationState.index) {
        scrollActiveTabIntoView(false);
      }
    },
    [navigationState.index, scrollActiveTabIntoView],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        tabBarScroll: {
          maxHeight: 52,
          borderBottomColor: theme.colors.border.light,
        },
        tabBarRow: {
          flexDirection: 'row',
          maxHeight: 52,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
        },
        tabItem: {
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 100,
          minHeight: 48,
          width: 'auto',
          borderBottomWidth: 2,
          borderBottomColor: theme.colors.border.light,
        },
        tabItemDistributed: { flex: 1, minWidth: 0 },
        tabItemActive: { borderBottomColor: theme.colors.primary[600] },
        tabTouchable: {
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabDisabled: { opacity: 0.4 },
        tabLabel: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: theme.typography.letterSpacing.wide,
        },
        tabLabelActive: {
          color: theme.colors.primary[600],
          fontWeight: theme.typography.fontWeight.semibold,
        },
        tabLabelDisabled: { color: theme.colors.gray[400] },
        badge: {
          position: 'absolute',
          top: -4,
          right: -8,
          backgroundColor: theme.colors.primary[600],
          borderRadius: theme.borderRadius.full,
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[1],
          minWidth: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
        },
        badgeText: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.white,
          textAlign: 'center',
        },
      }),
    [theme],
  );

  const tabItems = navigationState.routes.map((route, index) => {
    const isFocused = navigationState.index === index;

    return (
      <View
        key={route.key}
        onLayout={(event) => handleTabLayout(index, event)}
        style={[
          styles.tabItem,
          distributeTabs && styles.tabItemDistributed,
          isFocused && styles.tabItemActive,
        ]}
      >
        <Pressable
          style={[styles.tabTouchable, route.disabled && styles.tabDisabled]}
          onPress={() => {
            if (!route.disabled) {
              onIndexChange(index);
              jumpTo(route.key);
            }
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: isFocused }}
          accessibilityLabel={route.title}
        >
          <View>
            <Text
              style={[
                styles.tabLabel,
                isFocused && styles.tabLabelActive,
                route.disabled && styles.tabLabelDisabled,
              ]}
              numberOfLines={1}
            >
              {route.title}
            </Text>
            {route.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{route.badge}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>
    );
  });

  if (distributeTabs) {
    return <View style={styles.tabBarRow}>{tabItems}</View>;
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBarScroll}
      onLayout={handleViewportLayout}
    >
      {tabItems}
    </ScrollView>
  );
};

export const TournamentTabView: React.FC<TournamentTabViewProps> = ({
  routes,
  index,
  onIndexChange,
  renderScene,
  swipeEnabled = true,
  animationEnabled = true,
  lazy = true,
  tabBarPosition = 'top',
  renderTabBar,
  distributeTabs = false,
}) => {
  const theme = useThemeColors();
  const colorScheme = useColorScheme();

  const renderThemedScene = useCallback(
    (props: SceneRendererProps & { route: TabRoute }) => (
      <View key={`${props.route.key}-${colorScheme}`} style={{ flex: 1 }}>
        {renderScene(props)}
      </View>
    ),
    [renderScene, colorScheme],
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      onIndexChange={onIndexChange}
      renderScene={renderThemedScene}
      renderTabBar={
        renderTabBar ||
        ((props) => (
          <CustomTabBar
            navigationState={props.navigationState}
            onIndexChange={onIndexChange}
            jumpTo={props.jumpTo}
            distributeTabs={distributeTabs}
          />
        ))
      }
      swipeEnabled={swipeEnabled}
      animationEnabled={animationEnabled}
      lazy={lazy}
      tabBarPosition={tabBarPosition}
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    />
  );
};
