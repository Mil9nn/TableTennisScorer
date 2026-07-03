import { UpdateProfileDialog } from "@/components/profile/UpdateProfileDialog";
import { TournamentTabView, type TabRoute } from "@/components/ui/TournamentTabView";
import { DesignTokens } from "@/constants/designTokens";
import { useProfile, type ProfileDisplayUser } from "@/contexts/ProfileContext";
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
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Card, List, Text } from "react-native-paper";

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
    backgroundColor: DesignTokens.colors.background.primary,
  },
  scene: {
    flex: 1,
  },
  sceneScroll: {
    flex: 1,
  },
  sceneContent: {
    gap: DesignTokens.spacing[2],
    paddingBottom: DesignTokens.spacing[8],
  },
  statusBanner: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[3],
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
  accountButton: {
    paddingVertical: DesignTokens.spacing[4],
    paddingHorizontal: DesignTokens.spacing[4],
    borderRadius: DesignTokens.borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  updateButton: {
    backgroundColor: DesignTokens.colors.primary[600],
    marginHorizontal: DesignTokens.spacing[4],
    marginTop: DesignTokens.spacing[2],
  },
  accountButtonText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
  updateButtonText: {
    color: DesignTokens.colors.text.inverse,
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
    gap: 0,
  },
  userInfoField: {
    paddingVertical: DesignTokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
  },
  userInfoFieldLast: {
    borderBottomWidth: 0,
  },
  userInfoLabel: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.1,
    marginBottom: DesignTokens.spacing[1],
  },
  userInfoValue: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.primary,
  },
  emptyStateText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    lineHeight: DesignTokens.typography.fontSize.base * 1.5,
  },
});

interface ProfileField {
  key: string;
  label: string;
  value: string;
}

interface ProfileHomeScreenProps {
  userId: string;
}

export function ProfileHomeScreen({ userId }: ProfileHomeScreenProps) {
  const router = useRouter();
  const { user, isMe, refreshUser, error: profileError } = useProfile();

  const resolvedUserId = String(userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);
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

  const displayUser = user as ProfileDisplayUser | null;
  const statusMessage = profileError || error;

  const profileFields = useMemo((): ProfileField[] => {
    if (!displayUser) return [];

    const fields: ProfileField[] = [];

    if (isMe && displayUser.email) {
      fields.push({ key: "email", label: "Email", value: displayUser.email });
    }
    if (displayUser.dateOfBirth) {
      const age = calculateAge(displayUser.dateOfBirth);
      if (age !== null) {
        fields.push({ key: "age", label: "Age", value: `${age} years old` });
      }
    }
    if (displayUser.gender) {
      fields.push({
        key: "gender",
        label: "Gender",
        value: formatGender(displayUser.gender),
      });
    }
    if (displayUser.location) {
      fields.push({
        key: "location",
        label: "Location",
        value: displayUser.location,
      });
    }
    if (displayUser.handedness) {
      fields.push({
        key: "handedness",
        label: "Handedness",
        value: `${formatHandedness(displayUser.handedness)} handed`,
      });
    }
    if (isMe && displayUser.phoneNumber) {
      fields.push({
        key: "phone",
        label: "Phone",
        value: displayUser.phoneNumber,
      });
    }
    if (displayUser.createdAt) {
      fields.push({
        key: "memberSince",
        label: "Member Since",
        value: formatDateLong(displayUser.createdAt),
      });
    }

    return fields;
  }, [displayUser, isMe]);

  const handleTabIndexChange = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTabIndex(index);
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

  const renderInformationTab = () => (
    <ScrollView
      style={styles.sceneScroll}
      contentContainerStyle={styles.sceneContent}
      refreshControl={refreshControl}
    >
      {renderStatusBanner()}

      {isMe ? (
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
      ) : null}

      <Card mode="contained" style={styles.userInfoCard}>
        <Card.Content style={{ padding: DesignTokens.spacing[6] }}>
          <Text style={styles.userInfoTitle}>Profile Information</Text>
          {profileFields.length > 0 ? (
            <View style={styles.userInfoGrid}>
              {profileFields.map((field, index) => (
                <View
                  key={field.key}
                  style={[
                    styles.userInfoField,
                    index === profileFields.length - 1 && styles.userInfoFieldLast,
                  ]}
                >
                  <Text style={styles.userInfoLabel}>{field.label}</Text>
                  <Text style={styles.userInfoValue}>{field.value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyStateText}>
              {isMe
                ? "No profile details yet. Tap Update profile to add your information."
                : "No profile details available."}
            </Text>
          )}
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
      {renderStatusBanner()}

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
        {isMe ? (
          <List.Item
            title="Settings"
            description="Account, legal, and support"
            left={(props) => <List.Icon {...props} icon="cog-outline" />}
            onPress={() => router.push("/settings" as Href)}
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
      profileFields,
      isMe,
      refreshing,
      onRefresh,
      resolvedUserId,
      router,
      showInsights,
      showShots,
      statusMessage,
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
