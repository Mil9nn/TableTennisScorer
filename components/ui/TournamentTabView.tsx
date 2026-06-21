import React from 'react';
import { TabView, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { Animated, StyleSheet, View, Text, Dimensions, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens } from '@/constants/designTokens';

const tokens = DesignTokens;
const { width: screenWidth } = Dimensions.get('window');

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
}

const CustomTabBar: React.FC<{
  navigationState: NavigationState<TabRoute>;
  position: Animated.AnimatedAddition<number>;
  onIndexChange: (index: number) => void;
  jumpTo: (key: string) => void;
}> = ({ navigationState, position, onIndexChange, jumpTo }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBarScroll}
      
    >
      {navigationState.routes.map((route, index) => {
        const isFocused = navigationState.index === index;
        const inputRange = navigationState.routes.map((_, i) => i);
        const opacity = position.interpolate({
          inputRange,
          outputRange: inputRange.map(i => (i === index ? 1 : 0.6)),
        });

        const scale = position.interpolate({
          inputRange,
          outputRange: inputRange.map(i => (i === index ? 1.05 : 1)),
        });

        return (
          <Animated.View
            key={route.key}
            style={[
              styles.tabItem,
              isFocused && styles.tabItemActive,
              {
                opacity,
                transform: [{ scale }],
              },
            ]}
          >
            <Pressable
              style={[
                styles.tabTouchable,
                route.disabled && styles.tabDisabled,
              ]}
              onPress={() => {
                if (!route.disabled) {
                  onIndexChange(index);
                  jumpTo(route.key);
                }
              }}
            >
              <View style={styles.tabContent}>
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
                {route.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{route.badge}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
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
}) => {
  return (
    <TabView
      navigationState={{
        index,
        routes,
      }}
      onIndexChange={onIndexChange}
      renderScene={renderScene}
      renderTabBar={
        renderTabBar ||
        ((props) => (
          <CustomTabBar
            navigationState={props.navigationState}
            position={props.position}
            onIndexChange={onIndexChange}
            jumpTo={props.jumpTo}
          />
        ))
      }
      swipeEnabled={swipeEnabled}
      animationEnabled={animationEnabled}
      lazy={lazy}
      tabBarPosition={tabBarPosition}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.white,
  },
  tabBarScroll: {
    maxHeight: 40,
    borderBottomColor: tokens.colors.border.light,
  },
  
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    width: 'auto',
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.border.light,
  },
  tabItemActive: {
    borderBottomColor: tokens.colors.primary[600],
  },
  tabTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabDisabled: {
    opacity: 0.4,
  },
  tabContent: {
    
  },
  tabLabel: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: tokens.typography.letterSpacing.wide,
  },
  tabLabelActive: {
    color: tokens.colors.primary[600],
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  tabLabelDisabled: {
    color: tokens.colors.gray[400],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: tokens.colors.primary[600],
    borderRadius: tokens.borderRadius.full,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[1],
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.white,
    textAlign: 'center',
  },
});
