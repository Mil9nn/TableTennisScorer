import { UpdateProfileDialog } from "@/components/profile/UpdateProfileDialog";
import { ProfileIdentityHero } from "@/components/profile/ProfileIdentityHero";
import {
  ProfileAchievementMetrics,
  ProfileCareerOverview,
  ProfileDetailsSection,
  ProfileInfoGrouped,
  ProfileMoreMenu,
  ProfileMyProfileSection,
  ProfileRecentForm,
} from "@/components/profile/ProfileOverviewSections";
import { ProfileStatsContent } from "@/components/profile/ProfileStatsContent";
import { TournamentTabView, type TabRoute } from "@/components/ui/TournamentTabView";
import { useProfile, type ProfileDisplayUser } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useProfileOverview } from "@/hooks/useProfileOverview";
import { useThemeColors } from "@/hooks/useThemeColors";
import { calculateAge } from "@/lib/profile/calculateAge";
import * as Haptics from "expo-haptics";
import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "react-native-paper";

const PROFILE_TAB_ROUTES: TabRoute[] = [
  { key: "overview", title: "Overview" },
  { key: "stats", title: "Stats" },
  { key: "more", title: "More" },
];

const STATS_TAB_INDEX = 1;

const formatGender = (value: string) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "Not specified";

const formatHandedness = (value: string) =>
  value
    ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
    : "Not specified";

interface ProfileHomeScreenProps {
  userId: string;
}

export function ProfileHomeScreen({ userId }: ProfileHomeScreenProps) {
  const theme = useThemeColors();
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const { user, isMe, refreshUser, error: profileError } = useProfile();
  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = useProfileOverview(userId);

  const [refreshing, setRefreshing] = useState(false);
  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [statsTabVisited, setStatsTabVisited] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        },
        scene: { flex: 1 },
        sceneScroll: { flex: 1 },
        sceneContent: {
          gap: 0,
          paddingBottom: theme.spacing[10],
          paddingTop: 0,
        },
        statusBanner: {
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[2],
        },
        errorText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.error,
          textAlign: "center",
        },
        loadingWrap: {
          paddingVertical: theme.spacing[8],
          alignItems: "center",
        },
      }),
    [theme],
  );

  const resolvedUserId = String(userId ?? "");
  const displayUser = user as ProfileDisplayUser | null;
  const statusMessage = profileError || overviewError;

  const myProfileUser = useMemo(() => {
    if (!displayUser) return null;
    return {
      ...displayUser,
      isProfileComplete: authUser?.isProfileComplete,
    };
  }, [displayUser, authUser?.isProfileComplete]);

  const openEditProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUpdateDialogVisible(true);
  }, []);

  const openCompleteProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/complete-profile" as Href);
  }, [router]);

  const infoGroups = useMemo(() => {
    if (!displayUser) {
      return [
        { title: "Personal", fields: [] as Array<{ label: string; value: string }> },
      ];
    }

    const personal: Array<{ label: string; value: string }> = [];
    const contact: Array<{ label: string; value: string }> = [];

    if (displayUser.fullName) {
      personal.push({ label: "Name", value: displayUser.fullName });
    }
    if (displayUser.username) {
      personal.push({ label: "Username", value: `@${displayUser.username}` });
    }
    if (displayUser.gender) {
      personal.push({
        label: "Gender",
        value: formatGender(displayUser.gender),
      });
    }
    if (displayUser.dateOfBirth) {
      const age = calculateAge(displayUser.dateOfBirth);
      personal.push({
        label: "Age",
        value: age != null ? `${age}` : displayUser.dateOfBirth.slice(0, 10),
      });
    }
    if (displayUser.handedness) {
      personal.push({
        label: "Handedness",
        value: formatHandedness(displayUser.handedness),
      });
    }
    if (displayUser.location?.trim()) {
      personal.push({ label: "Location", value: displayUser.location.trim() });
    }

    if (isMe && displayUser.email) {
      contact.push({ label: "Email", value: displayUser.email });
    }
    if (isMe && displayUser.phoneNumber) {
      contact.push({ label: "Phone", value: displayUser.phoneNumber });
    }

    return [
      { title: "Personal", fields: personal },
      { title: "Contact", fields: contact },
    ];
  }, [displayUser, isMe]);

  const hasDetails = infoGroups.some((group) => group.fields.length > 0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refreshUser(), refreshOverview()]).finally(() =>
      setRefreshing(false),
    );
  }, [refreshUser, refreshOverview]);

  const handleTabIndexChange = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (index === STATS_TAB_INDEX) {
      setStatsTabVisited(true);
    }
    setTabIndex(index);
  }, []);

  const openStatsTab = useCallback(() => {
    setStatsTabVisited(true);
    setTabIndex(STATS_TAB_INDEX);
  }, []);

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  );

  const renderStatusBanner = () => {
    if (!statusMessage) return null;
    return (
      <View style={styles.statusBanner}>
        <Text style={styles.errorText}>{statusMessage}</Text>
      </View>
    );
  };

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.sceneScroll}
      contentContainerStyle={styles.sceneContent}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      {renderStatusBanner()}

      {overviewLoading && overview.totalMatches === 0 && !displayUser ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary[600]} />
        </View>
      ) : (
        <>
          <ProfileCareerOverview
            overview={overview}
            userId={resolvedUserId}
            onOpenStats={openStatsTab}
          />
          <ProfileAchievementMetrics
            overview={overview}
            userId={resolvedUserId}
          />
          <ProfileRecentForm form={overview.recentForm} />
          {isMe ? (
            <ProfileMyProfileSection
              user={myProfileUser}
              groups={infoGroups}
              onEdit={openEditProfile}
              onComplete={openCompleteProfile}
            />
          ) : hasDetails ? (
            <>
              <ProfileDetailsSection title="Details" />
              <ProfileInfoGrouped groups={infoGroups} />
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );

  const renderStatsTab = () => (
    <View style={styles.scene}>
      <ProfileStatsContent
        userId={resolvedUserId}
        enabled={statsTabVisited || tabIndex === STATS_TAB_INDEX}
      />
    </View>
  );

  const renderMoreTab = () => (
    <ScrollView
      style={styles.sceneScroll}
      contentContainerStyle={styles.sceneContent}
      refreshControl={refreshControl}
    >
      {renderStatusBanner()}
      <ProfileMoreMenu
        userId={resolvedUserId}
        showShots={overview.showShots}
      />
    </ScrollView>
  );

  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      switch (route.key) {
        case "overview":
          return <View style={styles.scene}>{renderOverviewTab()}</View>;
        case "stats":
          return renderStatsTab();
        case "more":
          return <View style={styles.scene}>{renderMoreTab()}</View>;
        default:
          return null;
      }
    },
    [
      overview,
      overviewLoading,
      displayUser,
      isMe,
      myProfileUser,
      refreshing,
      resolvedUserId,
      statusMessage,
      styles,
      theme,
      infoGroups,
      hasDetails,
      statsTabVisited,
      tabIndex,
      openStatsTab,
      openEditProfile,
      openCompleteProfile,
    ],
  );

  return (
    <View style={styles.root}>
      <UpdateProfileDialog
        visible={updateDialogVisible}
        onClose={() => setUpdateDialogVisible(false)}
        user={displayUser}
        onSaved={refreshUser}
      />

      <ProfileIdentityHero
        user={displayUser}
        userId={resolvedUserId}
        overview={overview}
        loading={overviewLoading}
        isMe={isMe}
        showBackButton={!isMe}
        onEdit={() => setUpdateDialogVisible(true)}
      />

      <TournamentTabView
        routes={PROFILE_TAB_ROUTES}
        index={tabIndex}
        onIndexChange={handleTabIndexChange}
        renderScene={renderScene}
        swipeEnabled
        lazy
        distributeTabs
      />
    </View>
  );
}
