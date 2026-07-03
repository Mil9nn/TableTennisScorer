import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useHomeActivity, type HomeActivityItem } from '@/hooks/useHomeActivity';
import { Button } from '@/components/ui/Button';
import Sidebar from '@/components/ui/Sidebar';
import HomeActivitySkeleton from '@/components/skeletons/HomeActivitySkeleton';
import { DesignTokens } from '@/constants/designTokens';

function getFirstName(user: { fullName?: string; username?: string } | null) {
  const fromFullName = user?.fullName?.trim().split(/\s+/)[0];
  return fromFullName || user?.username || 'there';
}

function ActivityKindIcon({ kind }: { kind: HomeActivityItem['kind'] }) {
  if (kind === 'tournament') {
    return <Feather name="award" size={14} color={DesignTokens.colors.primary[600]} />;
  }
  if (kind === 'team_match') {
    return <FontAwesome5 name="users" size={12} color={DesignTokens.colors.info} />;
  }
  return <FontAwesome5 name="table-tennis" size={12} color={DesignTokens.colors.info} />;
}

function ActivityRow({
  item,
  onPress,
}: {
  item: HomeActivityItem;
  onPress: (item: HomeActivityItem) => void;
}) {
  return (
    <View style={styles.rowShell}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.card, styles.activityCard]}
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.subtitle}. ${item.timeLabel || ''}`}
      >
        <View style={styles.activityRow}>
          <View style={styles.kindIconWrap}>
            <ActivityKindIcon kind={item.kind} />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.activitySubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.activityTrailing}>
          {item.timeLabel ? (
            <Text style={styles.activityTime}>{item.timeLabel}</Text>
          ) : null}
          <Feather name="chevron-right" size={16} color={DesignTokens.colors.text.tertiary} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    items: activityItems,
    loading: activityLoading,
    refreshing,
    error: activityError,
    reload: reloadActivity,
    refresh: refreshActivity,
  } = useHomeActivity(Boolean(user), user?._id);

  const liveItems = useMemo(
    () =>
      activityItems.filter(
        (item) => item.isLive && (item.kind === 'match' || item.kind === 'team_match'),
      ),
    [activityItems],
  );

  const recentItems = useMemo(
    () =>
      activityItems.filter(
        (item) => !(item.isLive && (item.kind === 'match' || item.kind === 'team_match')),
      ),
    [activityItems],
  );

  const openActivity = useCallback((item: HomeActivityItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.href);
  }, []);

  const openLiveMatch = useCallback((item: HomeActivityItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(item.href);
  }, []);

  const openQuickAction = useCallback((route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as never);
  }, []);

  const greeting = getFirstName(user);

  const renderEmptyState = () => (
    <View style={styles.listFrame}>
      <View style={styles.rowShell}>
        <View style={[styles.card, styles.emptyCard]}>
          <Ionicons
            name="tennisball-outline"
            size={40}
            color={DesignTokens.colors.text.tertiary}
          />
          <Text style={styles.emptyTitle}>No recent activity yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a match or join a tournament to see updates here.
          </Text>
          <View style={styles.emptyActions}>
            <Button variant="primary" size="sm" onPress={() => openQuickAction('/match/create')}>
              Quick match
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => openQuickAction('/tournaments/create')}
            >
              Create tournament
            </Button>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={DesignTokens.colors.background.primary} />

      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.pageTitle}>Hi, {greeting}</Text>
            <Text style={styles.pageSubtitle}>Your latest matches and tournaments</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            activeOpacity={0.7}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Feather name="menu" size={20} color={DesignTokens.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable
            style={styles.quickAction}
            onPress={() => openQuickAction('/match/create')}
            accessibilityRole="button"
            accessibilityLabel="Start a quick match"
          >
            <View style={[styles.quickActionIcon, styles.quickActionIconMatch]}>
              <Feather name="play" size={14} color={DesignTokens.colors.success} />
            </View>
            <Text style={styles.quickActionLabel}>Quick match</Text>
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => openQuickAction('/tournaments/create')}
            accessibilityRole="button"
            accessibilityLabel="Create a tournament"
          >
            <View style={[styles.quickActionIcon, styles.quickActionIconTournament]}>
              <Feather name="award" size={14} color={DesignTokens.colors.primary[600]} />
            </View>
            <Text style={styles.quickActionLabel}>Tournament</Text>
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => openQuickAction('/(tabs)/matches')}
            accessibilityRole="button"
            accessibilityLabel="Browse all matches"
          >
            <View style={[styles.quickActionIcon, styles.quickActionIconBrowse]}>
              <FontAwesome5 name="table-tennis" size={12} color={DesignTokens.colors.info} />
            </View>
            <Text style={styles.quickActionLabel}>Browse</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshActivity}
            tintColor={DesignTokens.colors.primary[600]}
            colors={[DesignTokens.colors.primary[600]]}
          />
        }
      >
        {activityLoading ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Live now</Text>
              <HomeActivitySkeleton />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <HomeActivitySkeleton />
            </View>
          </>
        ) : (
          <>
            {liveItems.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Live now</Text>
                <View style={styles.listFrame}>
                  {liveItems.map((item) => (
                    <View key={item.id} style={styles.rowShell}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.liveCard}
                        onPress={() => openLiveMatch(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Live match: ${item.title}. Tap to score`}
                      >
                        <View style={styles.liveDot} />
                        <View style={styles.liveContent}>
                          <Text style={styles.liveTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.liveHint} numberOfLines={1}>
                            {item.subtitle} · Tap to score
                          </Text>
                        </View>
                        <View style={styles.livePlayButton}>
                          <Feather name="play" size={16} color={DesignTokens.colors.error} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent activity</Text>

              {activityError ? (
                <View style={styles.listFrame}>
                  <View style={styles.rowShell}>
                    <View style={[styles.card, styles.stateCard, styles.stateCardError]}>
                      <Text style={styles.stateText}>{activityError}</Text>
                      <Button variant="outline" size="sm" onPress={reloadActivity}>
                        Try again
                      </Button>
                    </View>
                  </View>
                </View>
              ) : recentItems.length === 0 && liveItems.length === 0 ? (
                renderEmptyState()
              ) : recentItems.length === 0 ? (
                <View style={styles.listFrame}>
                  <View style={styles.rowShell}>
                    <View style={[styles.card, styles.emptyCardCompact]}>
                      <Text style={styles.emptySubtitle}>
                        You&apos;re all caught up — no other recent updates.
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.listFrame}>
                  {recentItems.map((item) => (
                    <ActivityRow key={item.id} item={item} onPress={openActivity} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.primary,
  },
  headerContainer: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingTop: DesignTokens.spacing[4],
    paddingBottom: DesignTokens.spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing[4],
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: DesignTokens.spacing[3],
  },
  pageTitle: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
  },
  pageSubtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.borderRadius.full,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    backgroundColor: DesignTokens.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing[2],
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[3],
    paddingHorizontal: DesignTokens.spacing[3],
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  quickActionIcon: {
    width: 28,
    height: 28,
    borderRadius: DesignTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconMatch: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  quickActionIconTournament: {
    backgroundColor: DesignTokens.colors.primary[50],
  },
  quickActionIconBrowse: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  quickActionLabel: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DesignTokens.spacing[10],
  },
  section: {
    paddingTop: DesignTokens.spacing[2],
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: DesignTokens.typography.letterSpacing.wider,
    marginBottom: DesignTokens.spacing[3],
    paddingHorizontal: DesignTokens.spacing[4],
  },
  listFrame: {
    backgroundColor: DesignTokens.colors.background.tertiary,
    paddingHorizontal: DesignTokens.spacing[2],
    paddingBottom: DesignTokens.spacing[2],
  },
  rowShell: {
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
  },
  card: {
    backgroundColor: DesignTokens.colors.background.secondary,
    padding: DesignTokens.spacing[4],
    overflow: 'hidden',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateCardError: {
    gap: DesignTokens.spacing[3],
  },
  stateText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    gap: DesignTokens.spacing[2],
  },
  emptyCardCompact: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.secondary,
    marginTop: DesignTokens.spacing[2],
  },
  emptySubtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: DesignTokens.spacing[2],
    marginTop: DesignTokens.spacing[3],
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: DesignTokens.spacing[2],
  },
  kindIconWrap: {
    width: 28,
    height: 28,
    borderRadius: DesignTokens.borderRadius.base,
    backgroundColor: DesignTokens.colors.background.primary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing[2],
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
  },
  activitySubtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    marginTop: 2,
  },
  activityTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing[2],
    marginLeft: DesignTokens.spacing[2],
  },
  activityTime: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text.tertiary,
  },
  liveCard: {
    backgroundColor: DesignTokens.colors.background.secondary,
    padding: DesignTokens.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DesignTokens.colors.error,
    marginRight: DesignTokens.spacing[3],
  },
  liveContent: {
    flex: 1,
    paddingRight: DesignTokens.spacing[3],
    minWidth: 0,
  },
  liveTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
  },
  liveHint: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    marginTop: 2,
  },
  livePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
