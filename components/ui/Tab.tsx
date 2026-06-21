import React from 'react';
import { View, TouchableOpacity, Text, ScrollView, ViewStyle, StyleSheet } from 'react-native';

interface TabItem {
  value: string;
  label: string;
}

interface TabProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  scrollable?: boolean;
  style?: ViewStyle;
  variant?: 'default' | 'tournament';
}

export const Tab: React.FC<TabProps> = ({
  items,
  activeTab,
  onTabChange,
  scrollable = false,
  style,
  variant = 'default',
}) => {
  const isTournamentVariant = variant === 'tournament';

  const renderTabs = () => {
    if (isTournamentVariant) {
      return (
        <View style={[styles.tournamentContainer, style]}>
          {items.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.tournamentTab,
                  isActive && styles.tournamentTabActive
                ]}
                onPress={() => onTabChange(item.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tournamentTabText,
                  isActive && styles.tournamentTabTextActive
                ]}>
                  {item.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {items.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.tab,
                isActive && styles.tabActive
              ]}
              onPress={() => onTabChange(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                isActive && styles.tabTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (scrollable) {
    if (isTournamentVariant) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[{ paddingHorizontal: 0, gap: 4, flexWrap: 'wrap' }, style]}
        >
          {items.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.tournamentTab,
                  isActive && styles.tournamentTabActive
                ]}
                onPress={() => onTabChange(item.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tournamentTabText,
                  isActive && styles.tournamentTabTextActive
                ]}>
                  {item.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[{ paddingHorizontal: 16, gap: 4 }, style]}
      >
        {items.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.scrollableTab,
                isActive && styles.scrollableTabActive
              ]}
              onPress={() => onTabChange(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.scrollableTabText,
                isActive && styles.scrollableTabTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  return <View style={style}>{renderTabs()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  scrollableTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 4,
  },
  scrollableTabActive: {
    backgroundColor: '#eff6ff',
  },
  scrollableTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  scrollableTabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  tournamentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 0,
  },
  tournamentTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 0,
  },
  tournamentTabActive: {
    backgroundColor: '#3c6e71',
  },
  tournamentTabText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2, // 0.2em for 10px = 2px
    color: '#353535',
    textTransform: 'uppercase',
  },
  tournamentTabTextActive: {
    color: '#ffffff',
  },
});

