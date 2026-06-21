import { UpdateProfileDialog } from "@/components/profile/UpdateProfileDialog";
import { TournamentTabView, type TabRoute } from "@/components/ui/TournamentTabView";
import { DesignTokens } from "@/constants/designTokens";
import { useProfile, type ProfileDisplayUser } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  fetchInsights,
  fetchProfileMatchHistory,
  fetchShotsAnalysis,
  fetchTeams,
} from "@/lib/profile/api";
import { profilePath } from "@/lib/profile/navigation";
import { hasInsightsData, hasShotsData } from "@/lib/profile/sectionAvailability";
import { FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Card, List, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PROFILE_TAB_ROUTES: TabRoute[] = [
  { key: "information", title: "Information" },
  { key: "explore", title: "Explore" },
];

const calculateAge = (dob: string) => {
  if (!dob) return null;
  const d = new Date(dob);
  return new Date().getFullYear() - d.getFullYear();
};

const formatGender = (value: string) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "Not specified";

const formatHandedness = (value: string) =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "Not specified";

const formatDateLong = (dateString: string) => {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  topSection: {
    gap: DesignTokens.spacing[2],
  },
  tabViewWrapper: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.tertiary,
  },
  scene: {
    flex: 1,
  },
  sceneScroll: {
    flex: 1,
  },
  sceneContent: {
    gap: DesignTokens.spacing[2],
    paddingBottom: DesignTokens.spacing[6],
  },
  loadingText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.error,
  },
  menuCard: {
    backgroundColor: DesignTokens.components.card.backgroundColor,
    borderRadius: DesignTokens.borderRadius.none,
    elevation: 0,
    shadowOpacity: 0,
  },
  listItem: {
    paddingVertical: DesignTokens.spacing[3],
  },
  listItemTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
  },
  listItemDescription: {
    fontSize: DesignTokens.typography.fontSize.sm,
  },
  accountCard: {
    borderRadius: DesignTokens.borderRadius.none,
    backgroundColor: DesignTokens.colors.background.primary,
  },
  accountButton: {
    paddingVertical: DesignTokens.spacing[5],
    paddingHorizontal: DesignTokens.spacing[4],
    borderRadius: DesignTokens.borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomActions: {
    paddingHorizontal: DesignTokens.spacing[6],
  },
  updateButton: {
    backgroundColor: DesignTokens.colors.primary[600],
  },
  logoutButton: {
    backgroundColor: "#fee2e2",
    height: 45,
  },
  accountButtonText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
  updateButtonText: {
    color: DesignTokens.colors.text.inverse,
  },
  logoutButtonText: {
    color: DesignTokens.colors.error,
  },
  userInfoCard: {
    backgroundColor: DesignTokens.components.card.backgroundColor,
    borderRadius: DesignTokens.borderRadius.none,
    elevation: 0,
    shadowOpacity: 0,
  },
  userInfoTitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
    marginBottom: DesignTokens.spacing[3],
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  userInfoGrid: {
    gap: DesignTokens.spacing[2],
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  userInfoLabel: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.tertiary,
    marginBottom: DesignTokens.spacing[1],
    textTransform: "uppercase",
    letterSpacing: 0.1,
  },
  userInfoValueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DesignTokens.spacing[2],
  },
  userInfoValue: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.secondary,
  },
});

interface ProfileHomeScreenProps {
  userId: string;
}

export function ProfileHomeScreen({ userId }: ProfileHomeScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);
  const { user, isMe, refreshUser, loading: profileLoading, error: profileError } =
    useProfile();

  const resolvedUserId = String(userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [showInsights, setShowInsights] = useState(false);
  const [showShots, setShowShots] = useState(false);

  const load = useCallback(async () => {
    if (!resolvedUserId) return;
    setError(null);

    try {
      const [, , insightsRes, shotsRes] = await Promise.all([
        fetchProfileMatchHistory(resolvedUserId).catch((err) => {
          console.warn("Failed to fetch match history:", err);
          return null;
        }),
        fetchTeams(resolvedUserId).catch((err) => {
          console.warn("Failed to fetch teams:", err);
          return null;
        }),
        fetchInsights(resolvedUserId).catch((err) => {
          console.warn("Failed to fetch insights:", err);
          return null;
        }),
        fetchShotsAnalysis(resolvedUserId).catch((err) => {
          console.warn("Failed to fetch shots analysis:", err);
          return null;
        }),
      ]);

      setShowInsights(
        insightsRes?.success === true && hasInsightsData(insightsRes.data),
      );
      setShowShots(shotsRes?.success === true && hasShotsData(shotsRes.data));
    } catch (e: unknown) {
      console.error("Error loading profile data:", e);
      if (!user && !isMe) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      }
    }
  }, [resolvedUserId, isMe, user]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refreshUser(), load()]).finally(() => setRefreshing(false));
  }, [refreshUser, load]);

  const handleLogout = useCallback(() => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
            router.replace("/auth/login");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }, [logout, router]);

  const displayUser = user as ProfileDisplayUser | null;
  const showLoading = profileLoading || loading;

  const handleTabIndexChange = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTabIndex(index);
  }, []);

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  );

  const renderInformationTab = () => (
    <ScrollView
      style={styles.sceneScroll}
      contentContainerStyle={styles.sceneContent}
      refreshControl={refreshControl}
    >
      <Card mode="contained" style={styles.userInfoCard}>
        <Card.Content style={{ padding: DesignTokens.spacing[6] }}>
          <Text style={styles.userInfoTitle}>Profile Information</Text>
          <View style={styles.userInfoGrid}>
            {isMe && displayUser?.email ? (
              <View style={styles.userInfoRow}>
                <View style={styles.userInfoValueContainer}>
                  <Text style={styles.userInfoLabel}>Email</Text>
                  <Text style={styles.userInfoValue}>{displayUser.email}</Text>
                </View>
              </View>
            ) : null}

            {displayUser?.dateOfBirth ? (
              <View style={styles.userInfoRow}>
                <View style={styles.userInfoValueContainer}>
                  <Text style={styles.userInfoLabel}>Age</Text>
                  <Text style={styles.userInfoValue}>
                    {calculateAge(displayUser.dateOfBirth)} years old
                  </Text>
                </View>
              </View>
            ) : null}

            {displayUser?.gender ? (
              <View style={styles.userInfoRow}>
                <View style={styles.userInfoValueContainer}>
                  <Text style={styles.userInfoLabel}>Gender</Text>
                  <Text style={styles.userInfoValue}>
                    {formatGender(displayUser.gender)}
                  </Text>
                </View>
              </View>
            ) : null}

            {displayUser?.location ? (
              <View style={styles.userInfoRow}>
                <View style={styles.userInfoValueContainer}>
                  <Text style={styles.userInfoLabel}>Location</Text>
                  <Text style={styles.userInfoValue}>{displayUser.location}</Text>
                </View>
              </View>
            ) : null}

            {displayUser?.handedness ? (
              <View style={styles.userInfoRow}>
                <View style={styles.userInfoValueContainer}>
                  <Text style={styles.userInfoLabel}>Handedness</Text>
                  <Text style={styles.userInfoValue}>
                    {formatHandedness(displayUser.handedness)} handed
                  </Text>
                </View>
              </View>
            ) : null}

            {isMe && displayUser?.phoneNumber ? (
              <View style={styles.userInfoRow}>
                <View style={styles.userInfoValueContainer}>
                  <Text style={styles.userInfoLabel}>Phone</Text>
                  <Text style={styles.userInfoValue}>
                    {displayUser.phoneNumber}
                  </Text>
                </View>
              </View>
            ) : null}

            {displayUser?.createdAt ? (
              <View style={styles.userInfoRow}>
                <View style={styles.userInfoValueContainer}>
                  <Text style={styles.userInfoLabel}>Member Since</Text>
                  <Text style={styles.userInfoValue}>
                    {formatDateLong(displayUser.createdAt)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderExploreTab = () => (
    <ScrollView
      style={styles.sceneScroll}
      contentContainerStyle={styles.sceneContent}
      refreshControl={refreshControl}
    >
      <Card mode="contained" style={styles.menuCard}>
        <List.Item
          title="Matches"
          description="Recent matches, results, scores"
          left={(props) => <List.Icon {...props} icon="history" />}
          onPress={() => router.push(profilePath(resolvedUserId, "match-history"))}
          style={styles.listItem}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
        />
        <List.Item
          title="Head to head"
          description="Win/loss vs opponents"
          left={(props) => <List.Icon {...props} icon="account-multiple" />}
          onPress={() => router.push(profilePath(resolvedUserId, "head-to-head"))}
          style={styles.listItem}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
        />
        <List.Item
          title="Stats"
          description="Singles/doubles, scoring, serve"
          left={(props) => <List.Icon {...props} icon="chart-line" />}
          onPress={() => router.push(profilePath(resolvedUserId, "stats"))}
          style={styles.listItem}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
        />
        <List.Item
          title="Teams"
          description="Teams and team stats"
          left={(props) => <List.Icon {...props} icon="account-group" />}
          onPress={() => router.push(profilePath(resolvedUserId, "teams"))}
          style={styles.listItem}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
        />
        <List.Item
          title="Tournaments"
          description="Placements and tournament performance"
          left={(props) => <List.Icon {...props} icon="trophy" color="#f43f5e" />}
          onPress={() =>
            router.push(profilePath(resolvedUserId, "tournaments"))
          }
          style={styles.listItem}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
        />
        {showInsights ? (
          <List.Item
            title="Insights"
            description="Trends and graphs"
            left={(props) => (
              <List.Icon
                {...props}
                icon="lightbulb-on"
                color="#D97706"
                style={props.style}
              />
            )}
            onPress={() => router.push(profilePath(resolvedUserId, "insights"))}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
        ) : null}
        {showShots ? (
          <List.Item
            title="Shots"
            description="Shot distribution and heatmap"
            left={(props) => (
              <List.Icon
                {...props}
                icon={({ size, color }) => (
                  <FontAwesome name="dot-circle-o" size={size} color={color} />
                )}
                color="#0D9488"
                style={props.style}
              />
            )}
            onPress={() => router.push(profilePath(resolvedUserId, "shots"))}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
        ) : null}
      </Card>
    </ScrollView>
  );

  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      switch (route.key) {
        case "information":
          return <View style={styles.scene}>{renderInformationTab()}</View>;
        case "explore":
          return <View style={styles.scene}>{renderExploreTab()}</View>;
        default:
          return null;
      }
    },
    [
      displayUser,
      isMe,
      refreshing,
      onRefresh,
      resolvedUserId,
      router,
      showInsights,
      showShots,
    ],
  );

  return (
    <View style={styles.root}>
      <View style={styles.topSection}>
        {showLoading ? (
          <Text style={styles.loadingText}>Loading…</Text>
        ) : profileError || error ? (
          <Text style={styles.errorText}>{profileError || error}</Text>
        ) : null}

        {isMe ? (
          <Card style={styles.accountCard}>
            <Card.Content>
              <TouchableOpacity
                style={[styles.accountButton, styles.updateButton]}
                onPress={() => setUpdateDialogVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Update profile"
              >
                <Text style={[styles.accountButtonText, styles.updateButtonText]}>
                  Update profile
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        ) : null}
      </View>

      <UpdateProfileDialog
        visible={updateDialogVisible}
        onClose={() => setUpdateDialogVisible(false)}
        user={displayUser}
        onSaved={refreshUser}
      />

      <View style={styles.tabViewWrapper}>
        <TournamentTabView
          routes={PROFILE_TAB_ROUTES}
          index={tabIndex}
          onIndexChange={handleTabIndexChange}
          renderScene={renderScene}
          swipeEnabled
          lazy
        />
      </View>

      {isMe ? (
        <View
          style={[
            styles.bottomActions,
            { paddingBottom: Math.max(insets.bottom, DesignTokens.spacing[4]) },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.accountButton,
              styles.logoutButton,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Text style={[styles.accountButtonText, styles.logoutButtonText]}>
              {loggingOut ? "Logging out…" : "Log out"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
