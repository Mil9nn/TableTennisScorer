import TeamListSkeleton from "@/components/skeletons/TeamListSkeleton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SearchInput } from "@/components/ui/SearchInput";
import { TabRoute, TournamentTabView } from "@/components/ui/TournamentTabView";
import { DesignTokens } from "@/constants/designTokens";
import { useAuthStore } from "@/hooks/useAuthStore";
import { axiosInstance } from "@/lib/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Menu } from "react-native-paper";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TEAM_TAB_ROUTES: TabRoute[] = [
  { key: "all-teams", title: "All Teams" },
  { key: "my-teams", title: "My Teams" },
];

type Team = {
  _id: string;
  name: string;
  city?: string;
  logo?: string;
  profileImage?: string;
  record?: { wins: number; losses: number };
  captain?: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  players: {
    user: {
      _id: string;
      username: string;
      fullName?: string;
      profileImage?: string;
    };
    assignment?: string;
  }[];
};

/** Deterministic placeholder when a team has no uploaded logo (DiceBear 9.x glass). */
const teamGlassAvatarUri = (team: Pick<Team, "name" | "_id">) => {
  const seed = (team.name?.trim() || team._id || "team").slice(0, 64);
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;
};

const LOGO_BASE_URL = "https://table-tennis-xi.vercel.app";

const resolveLogoUri = (logo?: string) => {
  if (!logo) return "";
  const trimmed = logo.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `${LOGO_BASE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [tabIndex, setTabIndex] = useState(0);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const user = useAuthStore((state) => state.user);

  const fetchTeams = async () => {
    try {
      const res = await axiosInstance.get("/teams");
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error("Error fetching teams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const myTeams = useMemo(() => {
    if (!user) return [];
    return teams.filter((team) => {
      const isCaptain = team.captain?._id === user._id;
      const isMember = team.players?.some((p) => p.user?._id === user._id);
      return isCaptain || isMember;
    });
  }, [teams, user]);

  const applyFilters = (teamList: Team[]) => {
    let filtered = teamList;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.captain?.username?.toLowerCase().includes(q) ||
          t.captain?.fullName?.toLowerCase().includes(q) ||
          t.players.some(
            (p) =>
              p.user.username.toLowerCase().includes(q) ||
              p.user.fullName?.toLowerCase().includes(q)
          )
      );
    }

    if (cityFilter !== "all") {
      filtered = filtered.filter((t) => t.city === cityFilter);
    }

    if (sortBy === "wins") {
      filtered = [...filtered].sort(
        (a, b) => (b.record?.wins || 0) - (a.record?.wins || 0)
      );
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  };

  const filteredMyTeams = useMemo(
    () => applyFilters(myTeams),
    [myTeams, search, cityFilter, sortBy]
  );
  const filteredAllTeams = useMemo(
    () => applyFilters(teams),
    [teams, search, cityFilter, sortBy]
  );

  const cities = Array.from(new Set(teams.map((t) => t.city).filter(Boolean))) as string[];

  const TeamCard = ({ team }: { team: Team }) => {
    const [logoLoadFailed, setLogoLoadFailed] = useState(false);
    const resolvedLogo = resolveLogoUri(team.logo);
    const glassUri = teamGlassAvatarUri(team);
    const logoUri = resolvedLogo && !logoLoadFailed ? resolvedLogo : glassUri;

    return (
      <TouchableOpacity
        style={styles.teamCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/team/${team._id}`);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.teamTopRow}>
          {/* Team logo, or DiceBear glass when missing / failed */}
          <View style={styles.teamLogoContainer}>
            <Image
              source={{ uri: logoUri }}
              style={styles.teamLogo}
              contentFit="cover"
              onError={() => {
                if (resolvedLogo) setLogoLoadFailed(true);
              }}
            />
          </View>

          {/* Team Info */}
          <View style={styles.teamInfoContainer}>
            <Text style={styles.teamNameText} numberOfLines={1}>
              {team.name}
            </Text>
            <View style={styles.teamMetaRow}>
              <Text style={styles.teamMetaText}>
                {team.players?.length || 0} players
              </Text>
              {team.city && (
                <>
                  <Text style={styles.teamMetaDot}>•</Text>
                  <Text style={styles.teamMetaText}>{team.city}</Text>
                </>
              )}
            </View>
            {team.captain && (
              <View style={styles.teamCaptainRow}>
                <Text style={styles.teamCaptainText}>Captain:</Text>
                <View style={styles.teamCaptainInline}>
                  <Text style={styles.teamCaptainName} numberOfLines={1}>
                    {team.captain.fullName || team.captain.username}
                  </Text>
                  {team.captain.profileImage ? (
                    <Image
                      source={{ uri: team.captain.profileImage }}
                      style={styles.teamCaptainAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.teamCaptainAvatarFallback}>
                      <Text style={styles.teamCaptainAvatarInitial}>
                        {(team.captain.fullName || team.captain.username || "C")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleTabIndexChange = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTabIndex(index);
  }, []);

  const renderEmptyState = useCallback(
    (tab: "all-teams" | "my-teams") => (
      <View className="flex-1 justify-center items-center px-8">
        <View className="bg-white border border-slate-200 rounded-3xl px-8 py-10 items-center">
          <Icon name="users" library="material" size={48} color={DesignTokens.colors.gray[400]} />
          <Text className="text-sm text-gray-600 text-center mt-3">
            {!user
              ? "Please log in to see your teams."
              : search || cityFilter !== "all"
                ? "No teams found matching your filters."
                : tab === "my-teams"
                  ? "You are not on any teams yet."
                  : "No teams found."}
          </Text>
          {user && !search && cityFilter === "all" && tab === "my-teams" && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => router.push("/team/create")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 16,
              }}
            >
              <Icon name="plus" library="material" size={14} color={DesignTokens.colors.white} />
              <Text className="text-white text-sm font-semibold">Create Your First Team</Text>
            </Button>
          )}
        </View>
      </View>
    ),
    [user, search, cityFilter],
  );

  const renderScene = useCallback(
    ({ route }: { route: TabRoute }) => {
      const tab = route.key as "all-teams" | "my-teams";
      const data = tab === "my-teams" ? filteredMyTeams : filteredAllTeams;

      if (loading) {
        return (
          <View style={styles.scene}>
            <TeamListSkeleton />
          </View>
        );
      }

      if (!data.length) {
        return <View style={styles.scene}>{renderEmptyState(tab)}</View>;
      }

      return (
        <View style={styles.scene}>
          <FlatList
            data={data}
            renderItem={({ item }) => <TeamCard team={item} />}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingVertical: 4 }}
            ItemSeparatorComponent={() => <View className="h-px bg-gray-100 mx-3" />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    },
    [loading, filteredMyTeams, filteredAllTeams, renderEmptyState],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header - matching Next.js design */}
      <View style={styles.headerContainer}>
        {/* Search Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <SearchInput
              placeholder="Search teams..."
              value={search}
              onChangeText={setSearch}
              iconColor={DesignTokens.colors.primary[600]}
              iconSize={18}
              containerStyle={styles.searchInput}
              inputStyle={styles.searchInputText}
            />
          </View>
          {user ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/team/create");
              }}
              style={styles.headerCreateButton}
              accessibilityLabel="Create team"
            >
              <Icon name="plus" library="material" size={20} color={DesignTokens.colors.primary[600]} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.filtersInline}>
        <View style={styles.filterItem}>
          <Menu
            visible={cityMenuVisible}
            onDismiss={() => setCityMenuVisible(false)}
            anchor={
              <Pressable
                style={styles.cityDropdownButton}
                onPress={() => setCityMenuVisible(true)}
              >
                <Text style={styles.cityDropdownText} numberOfLines={1}>
                  {cityFilter === "all" ? "All Cities" : `${cityFilter}`}
                </Text>
                <Ionicons name="chevron-down" size={14} color={DesignTokens.colors.gray[500]} />
              </Pressable>
            }
            contentStyle={styles.cityMenuContent}
          >
            <Menu.Item
              title="All Cities"
              onPress={() => {
                setCityFilter("all");
                setCityMenuVisible(false);
              }}
            />
            {cities.map((city) => (
              <Menu.Item
                key={city}
                title={city}
                onPress={() => {
                  setCityFilter(city);
                  setCityMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.filterItem}>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Pressable
                style={styles.cityDropdownButton}
                onPress={() => setSortMenuVisible(true)}
              >
                <Text style={styles.cityDropdownText}>
                  {`Sort By: ${sortBy === "wins" ? "Wins" : "Name"}`}
                </Text>
                <Ionicons name="chevron-down" size={14} color={DesignTokens.colors.gray[500]} />
              </Pressable>
            }
            contentStyle={styles.cityMenuContent}
          >
            <Menu.Item
              title="Name"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSortBy("name");
                setSortMenuVisible(false);
              }}
            />
            <Menu.Item
              title="Wins"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSortBy("wins");
                setSortMenuVisible(false);
              }}
            />
          </Menu>
        </View>
      </View>

      <View style={styles.tabViewWrapper}>
        <TournamentTabView
          routes={TEAM_TAB_ROUTES}
          index={tabIndex}
          onIndexChange={handleTabIndexChange}
          renderScene={renderScene}
          swipeEnabled
          lazy
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.gray[100],
  },
  // Header styles matching Next.js
  headerContainer: {
    backgroundColor: DesignTokens.colors.white,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingTop: DesignTokens.spacing[1],
    paddingBottom: DesignTokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[3],
  },
  searchInputContainer: {
    flex: 1,
    position: "relative",
  },
  headerCreateButton: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.borderRadius.full,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    backgroundColor: DesignTokens.colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: {
    position: "absolute",
    left: DesignTokens.spacing[3],
    top: DesignTokens.spacing[3],
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: DesignTokens.colors.background.secondary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    borderRadius: DesignTokens.borderRadius.full,
    marginBottom: 0,
  },
  searchInputText: {
    color: DesignTokens.colors.text.primary,
    paddingLeft: DesignTokens.spacing[3],
  },
  filtersInline: {
    backgroundColor: DesignTokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[2],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DesignTokens.spacing[2],
  },
  filterItem: {
    flex: 1,
  },
  cityDropdownButton: {
    borderWidth: 1,
    borderRadius: DesignTokens.borderRadius.sm,
    borderColor: DesignTokens.colors.border.light,
    backgroundColor: DesignTokens.colors.background.primary,
    paddingHorizontal: DesignTokens.spacing[3],
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cityDropdownText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.primary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    maxWidth: "90%",
  },
  cityMenuContent: {
    backgroundColor: DesignTokens.colors.white,
  },
  // Team Card styles matching Next.js
  teamCard: {
    backgroundColor: DesignTokens.colors.white,
    padding: DesignTokens.spacing[4],
    paddingHorizontal: DesignTokens.spacing[6],
  },
  teamTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignTokens.spacing[3],
  },
  teamLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.borderRadius.full,
    backgroundColor: DesignTokens.colors.primary[50],
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogo: {
    width: 40,
    height: 40,
    borderRadius: DesignTokens.borderRadius.full,
  },
  teamLogoPlaceholder: {
    width: DesignTokens.spacing[10],
    height: DesignTokens.spacing[10],
    borderRadius: DesignTokens.spacing[5],
    backgroundColor: DesignTokens.colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
  teamInfoContainer: {
    flex: 1,
    minWidth: 0,
  },
  teamNameText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  teamMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[1],
  },
  teamMetaText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.gray[400],
  },
  teamMetaDot: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.gray[400],
  },
  teamCaptainText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.gray[400],
  },
  teamCaptainName: {
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.gray[500],
    fontSize: DesignTokens.typography.fontSize.sm,
  },
  teamCaptainRow: {
    marginTop: DesignTokens.spacing[1],
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  teamCaptainInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    flex: 1,
    minWidth: 0,
  },
  teamCaptainAvatar: {
    width: 34,
    height: 34,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
  },
  teamCaptainAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 24,
    backgroundColor: DesignTokens.colors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },
  teamCaptainAvatarInitial: {
    fontSize: 11,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.gray[500],
  },
  tabViewWrapper: {
    flex: 1,
    backgroundColor: DesignTokens.colors.gray[100],
  },
  scene: {
    flex: 1,
    backgroundColor: DesignTokens.colors.gray[100],
  },
  // Legacy styles
  header: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingTop: DesignTokens.spacing[4],
    paddingBottom: DesignTokens.spacing[6],
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.white,
  },
  createButton: {
    backgroundColor: DesignTokens.colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[1],
  },
  createButtonText: {
    color: DesignTokens.colors.text.secondary,
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
  searchContainer: {
    flexDirection: "row",
    gap: DesignTokens.spacing[2],
    alignItems: "center",
  },
  tabContainer: {
    marginHorizontal: DesignTokens.spacing[4],
    marginTop: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[4],
  },
  listContent: {
    paddingVertical: DesignTokens.spacing[2],
  },
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[3] - 4,
    backgroundColor: DesignTokens.colors.gray[100],
  },
  logoContainer: {
    width: DesignTokens.spacing[10],
    height: DesignTokens.spacing[10],
  },
  logo: {
    width: DesignTokens.spacing[10],
    height: DesignTokens.spacing[10],
    borderRadius: DesignTokens.spacing[5],
  },
  logoPlaceholder: {
    width: DesignTokens.spacing[10],
    height: DesignTokens.spacing[10],
    borderRadius: DesignTokens.spacing[5],
    backgroundColor: DesignTokens.colors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.secondary,
  },
  teamInfo: {
    flex: 1,
    minWidth: 0,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[1],
  },
  teamName: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text.primary,
  },
  cityText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.gray[400],
  },
  teamStats: {
    flexDirection: "row",
    gap: DesignTokens.spacing[2],
    marginTop: DesignTokens.spacing[1],
  },
  statText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.gray[400],
  },
  captainAvatar: {
    width: DesignTokens.spacing[8] - 4,
    height: DesignTokens.spacing[8] - 4,
    borderRadius: (DesignTokens.spacing[8] - 4) / 2,
  },
  captainAvatarPlaceholder: {
    width: DesignTokens.spacing[8] - 4,
    height: DesignTokens.spacing[8] - 4,
    borderRadius: (DesignTokens.spacing[8] - 4) / 2,
    backgroundColor: DesignTokens.colors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },
  captainAvatarText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.secondary,
  },
  separator: {
    height: 1,
    backgroundColor: DesignTokens.colors.border.light,
    marginHorizontal: DesignTokens.spacing[3],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: DesignTokens.spacing[16],
  },
  emptyText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.secondary,
    textAlign: "center",
    marginTop: DesignTokens.spacing[4],
  },
  createFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    marginTop: DesignTokens.spacing[4],
  },
  createFirstButtonText: {
    color: DesignTokens.colors.white,
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
});
