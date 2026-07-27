import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  useHomeDashboard,
  type HomeNearMatchEntry,
} from "@/hooks/useHomeDashboard";
import { useHomeFeed } from "@/hooks/useHomeFeed";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Button } from "@/components/ui/Button";
import { SidebarMenuButton } from "@/components/ui/Sidebar";
import { IndividualMatchCard } from "@/components/matches/IndividualMatchCard";
import { TeamMatchCard } from "@/components/matches/TeamMatchCard";
import { HomeChallengeCard } from "@/components/home/HomeChallengeCard";
import { FeedPostCard } from "@/components/home/FeedPostCard";
import { HOME_CHALLENGES } from "@/components/home/challenges";
import { getMatchOpenHref } from "@/lib/matchNavigation";
import type { TeamMatch } from "@/types/match.type";
import HomeScreenSkeleton from "@/components/skeletons/HomeScreenSkeleton";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";

export default function HomeScreen() {
  const theme = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const matchesDash = useHomeDashboard(Boolean(user), user?.location);
  const feed = useHomeFeed(Boolean(user));

  const nearYouMatches = matchesDash.nearYouMatches;
  const loading = matchesDash.loading || feed.loading;
  const refreshing = matchesDash.refreshing || feed.refreshing;
  const hardError =
    matchesDash.error &&
    feed.error &&
    nearYouMatches.length === 0 &&
    feed.posts.length === 0
      ? matchesDash.error
      : null;

  const matchCardWidth = Math.min(windowWidth * 0.82, windowWidth - theme.spacing[8]);
  const matchCardGap = theme.spacing[3];
  const matchCardStride = matchCardWidth + matchCardGap;
  const challengeCardWidth = Math.min(160, windowWidth * 0.42);
  const challengeCardGap = theme.spacing[3];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background.tertiary,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[2],
          paddingBottom: theme.spacing[3],
          gap: theme.spacing[3],
          backgroundColor: theme.colors.background.primary,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.light,
        },
        menuButton: {
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        },
        brandBlock: {
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
        },
        logo: { width: 28, height: 28 },
        brandTitle: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary[700],
        },
        scrollView: {
          flex: 1,
          backgroundColor: theme.colors.background.tertiary,
        },
        scrollContent: {
          paddingBottom: theme.spacing[16],
          gap: theme.spacing[7],
          paddingTop: theme.spacing[4],
        },
        section: { gap: theme.spacing[3] },
        sectionHeader: {
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing[4],
          gap: theme.spacing[3],
        },
        sectionTitle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        sectionSubtitle: {
          fontSize: theme.typography.fontSize.sm,
          lineHeight: 18,
          color: theme.colors.text.tertiary,
        },
        sectionLink: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.primary[600],
          paddingVertical: theme.spacing[1],
        },
        sectionLinkHit: {
          minHeight: 44,
          justifyContent: "center",
          paddingLeft: theme.spacing[2],
        },
        horizontalScroll: {
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
          gap: matchCardGap,
          alignItems: "stretch",
        },
        challengeScroll: {
          paddingHorizontal: theme.spacing[4],
          gap: challengeCardGap,
          alignItems: "stretch",
        },
        matchShell: {
          width: matchCardWidth,
          borderRadius: theme.borderRadius.base,
          overflow: "hidden",
          backgroundColor: theme.colors.background.primary,
          ...theme.shadows.sm,
        },
        feedStack: {
          paddingHorizontal: theme.spacing[4],
          gap: theme.spacing[3],
        },
        emptyInline: {
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[2],
        },
        emptyInlineText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          lineHeight: 20,
        },
        stateCard: {
          marginHorizontal: theme.spacing[4],
          padding: theme.spacing[5],
          borderRadius: theme.borderRadius.base,
          backgroundColor: theme.colors.background.primary,
          alignItems: "center",
          gap: theme.spacing[3],
          borderWidth: 1,
          borderColor: theme.colors.border.light,
        },
        stateText: {
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.tertiary,
          textAlign: "center",
        },
      }),
    [theme, matchCardWidth, matchCardGap, challengeCardGap],
  );

  const openRoute = useCallback((route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as never);
  }, []);

  const onRefresh = useCallback(() => {
    matchesDash.refresh();
    feed.refresh();
  }, [matchesDash, feed]);

  const onReload = useCallback(() => {
    matchesDash.reload();
    feed.reload();
  }, [matchesDash, feed]);

  const renderNearMatch = (item: HomeNearMatchEntry) => {
    const key = `${item.category}-${item.match._id}`;
    const matchId = item.match._id;
    const onPress = () => {
      if (!matchId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(
        getMatchOpenHref(matchId, item.match.status ?? "in_progress", item.category),
      );
    };

    return (
      <View key={key} style={styles.matchShell}>
        {item.category === "individual" ? (
          <IndividualMatchCard
            match={item.match}
            onPress={onPress}
            variant="carousel"
            containerStyle={{ width: matchCardWidth }}
          />
        ) : (
          <TeamMatchCard
            match={item.match as TeamMatch}
            onPress={onPress}
            variant="carousel"
            containerStyle={{ width: matchCardWidth }}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.header}>
        <SidebarMenuButton
          style={styles.menuButton}
          iconColor={theme.colors.text.primary}
        />

        <View style={styles.brandBlock}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.brandTitle}>TTPro</Text>
        </View>
      </View>

      <ProfileCompletionBanner />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[600]}
            colors={[theme.colors.primary[600]]}
          />
        }
      >
        {loading ? (
          <HomeScreenSkeleton />
        ) : hardError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{hardError}</Text>
            <Button variant="outline" size="sm" onPress={onReload}>
              Try again
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View >
                  <Text style={styles.sectionTitle}>Matches near you</Text>
                </View>
                <Pressable
                  style={styles.sectionLinkHit}
                  onPress={() =>
                    openRoute("/(tabs)?tab=my-tennis&section=matches")
                  }
                  hitSlop={8}
                >
                  <Text style={styles.sectionLink}>See all</Text>
                </Pressable>
              </View>

              {nearYouMatches.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                  decelerationRate="fast"
                  snapToInterval={matchCardStride}
                  snapToAlignment="start"
                  disableIntervalMomentum
                >
                  {nearYouMatches.map(renderNearMatch)}
                </ScrollView>
              ) : (
                <View style={styles.emptyInline}>
                  <Text style={styles.emptyInlineText}>
                    No matches nearby yet. Start one or check back soon.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.sectionTitle}>Challenges</Text>
                  <Text style={styles.sectionSubtitle}>
                    Get ready to challenge yourself and earn exclusive badges and rewards.
                  </Text>
                </View>
                <Pressable
                  style={styles.sectionLinkHit}
                  onPress={() => openRoute("/challenges")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Explore challenges"
                >
                  <Text style={styles.sectionLink}>Explore</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.challengeScroll}
                decelerationRate="fast"
              >
                {HOME_CHALLENGES.map((challenge) => (
                  <HomeChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    width={challengeCardWidth}
                    onPress={() => openRoute("/challenges")}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Feed</Text>
                  <Text style={styles.sectionSubtitle}>
                    Updates from TTPro — appreciate, comment, and share.
                  </Text>
                </View>
              </View>

              <View style={styles.feedStack}>
                {feed.error && feed.posts.length === 0 ? (
                  <Text style={styles.emptyInlineText}>{feed.error}</Text>
                ) : null}

                {feed.posts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    onAppreciate={feed.toggleAppreciate}
                    onComment={feed.addComment}
                    onShare={feed.recordShare}
                  />
                ))}

                {!feed.error && feed.posts.length === 0 ? (
                  <Text style={styles.emptyInlineText}>
                    Official updates will show up here soon.
                  </Text>
                ) : null}
              </View>
            </View>
          </>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}
