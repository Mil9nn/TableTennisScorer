import React, { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Button as PaperButton,
  Dialog,
  Divider,
  IconButton,
  Menu,
  Portal,
  Surface,
  Text as PaperText,
} from "react-native-paper";
import { useAuthStore } from "@/hooks/useAuthStore";
import { DesignTokens } from "@/constants/designTokens";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { TeamInviteDialog } from "@/components/teams/join-share";

interface Team {
  _id: string;
  name: string;
  city?: string;
  logo?: string;
  joinCode?: string;
  allowJoinByCode?: boolean;
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
}

export default function TeamDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/teams/${id}`);
      setTeam(res.data.team);
    } catch (error: any) {
      console.error("Error fetching team:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load team details",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = () => {
    setDeleteDialogVisible(true);
  };

  const confirmDeleteTeam = async () => {
    setDeleteDialogVisible(false);
    try {
      await axiosInstance.delete(`/teams/${id}`);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Team deleted successfully",
      });
      router.push("/(tabs)/teams");
    } catch (error: any) {
      console.error("Error deleting team:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to delete team",
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!team) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Team not found</Text>
          <Button
            onPress={() => router.push("/(tabs)/teams")}
            variant="outline"
            size="md"
            style={styles.backButton}
          >
            <Text>Go Back to Teams</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = user && team.captain?._id === user._id;
  const totalMatches = (team.record?.wins || 0) + (team.record?.losses || 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={22} color={tokens.colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Team Details</Text>
        {isOwner ? (
          <Menu
            visible={actionMenuVisible}
            onDismiss={() => setActionMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                mode="contained-tonal"
                containerColor="#EEF2FF"
                iconColor="#334155"
                size={20}
                onPress={() => setActionMenuVisible(true)}
                style={styles.actionMenuButton}
              />
            }
            contentStyle={styles.actionMenuContent}
          >
            <Menu.Item
              title="Invite Players"
              leadingIcon="account-plus-outline"
              onPress={() => {
                setActionMenuVisible(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setInviteDialogOpen(true);
              }}
            />
            <Menu.Item
              title="Edit Team"
              leadingIcon="pencil-outline"
              onPress={() => {
                setActionMenuVisible(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/team/${id}/edit`);
              }}
            />
            <Menu.Item
              title="Delete Team"
              leadingIcon="trash-can-outline"
              onPress={() => {
                setActionMenuVisible(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                deleteTeam();
              }}
              titleStyle={styles.deleteMenuLabel}
            />
          </Menu>
        ) : (
          <View style={styles.topBarSpacer} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.teamInfoSurface} elevation={1}>
          <View style={styles.teamInfo}>
            <View style={styles.logoContainer}>
              {team.logo ? (
                <Image source={{ uri: team.logo }} style={styles.logo} contentFit="cover" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoText}>
                    {(team.name?.[0] || "T").toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.teamName}>{team.name}</Text>
            {team.city && (
              <View style={styles.cityRow}>
                <Icon name="map-pin" library="material" size={14} color={"#fff"} />
                <Text style={styles.cityText}>{team.city}</Text>
              </View>
            )}

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{team.players?.length || 0}</Text>
                <Text style={styles.statLabel}>Players</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalMatches}</Text>
                <Text style={styles.statLabel}>Matches</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, styles.statValueWin]}>
                  {team.record?.wins || 0}
                </Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, styles.statValueLoss]}>
                  {team.record?.losses || 0}
                </Text>
                <Text style={styles.statLabel}>Losses</Text>
              </View>
            </View>
          </View>
        </Surface>

        <Surface style={styles.playersSection} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Squad ({team.players?.length || 0})
            </Text>
          </View>
          <Divider style={styles.sectionDivider} />
          <View style={styles.playersList}>
            {team.players.length > 0 ? (
              team.players.map((p) => {
                const isCaptain = team.captain?._id === p.user._id;
                return (
                  <Pressable
                    key={p.user._id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/profile/${p.user._id}`);
                    }}
                    style={styles.playerRow}
                  >
                    <View style={styles.playerLeft}>
                      {p.user.profileImage ? (
                        <Image
                          source={{ uri: p.user.profileImage }}
                          style={[
                            styles.playerAvatar,
                            isCaptain && styles.captainAvatarBorder,
                          ]}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.playerAvatarPlaceholder,
                            isCaptain && styles.captainAvatarBorder,
                          ]}
                        >
                          <Text style={styles.playerAvatarText}>
                            {(p.user.fullName?.[0] || p.user.username?.[0] || "?").toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.playerInfo}>
                        <View style={styles.playerNameRow}>
                          <Text style={styles.playerName}>
                            {p.user.fullName || p.user.username}
                          </Text>
                          {isCaptain && (
                            <View style={styles.captainBadge}>
                              <Text style={styles.captainBadgeText}>Captain</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.playerUsername}>@{p.user.username}</Text>
                      </View>
                    </View>
                    {p.assignment && (
                      <View style={styles.assignmentBadge}>
                        <Text style={styles.assignmentText}>{p.assignment}</Text>
                      </View>
                    )}
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyPlayersBlock}>
                <Text style={styles.emptyPlayersText}>No players yet</Text>
                {isOwner ? (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/team/${id}/edit`);
                    }}
                    style={styles.emptyRosterButton}
                  >
                    <Text style={styles.emptyRosterButtonText}>Edit roster</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        </Surface>
      </ScrollView>
      {isOwner && team ? (
        <TeamInviteDialog
          visible={inviteDialogOpen}
          onClose={() => setInviteDialogOpen(false)}
          teamId={team._id}
          teamName={team.name}
          joinCode={team.joinCode}
          allowJoinByCode={team.allowJoinByCode ?? false}
          onUpdate={(joinCode, allowJoinByCode) => {
            setTeam((prev) =>
              prev ? { ...prev, joinCode, allowJoinByCode } : prev,
            );
          }}
        />
      ) : null}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          style={styles.deleteDialog}
        >
          <Dialog.Title>Delete Team</Dialog.Title>
          <Dialog.Content>
            <PaperText variant="bodyMedium" style={styles.deleteDialogText}>
              This action cannot be undone. Are you sure you want to delete this team?
            </PaperText>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setDeleteDialogVisible(false)} textColor="#475569">
              Cancel
            </PaperButton>
            <PaperButton onPress={confirmDeleteTeam} textColor="#DC2626">
              Delete
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const tokens = DesignTokens;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.tertiary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.spacing[16],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[6],
    textAlign: "center",
  },
  topBar: {
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  topBarSpacer: {
    width: 36,
  },
  header: {
    paddingHorizontal: tokens.spacing[4],
    paddingTop: tokens.spacing[4],
    paddingBottom: tokens.spacing[4],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: tokens.spacing[3],
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.background.secondary,
  },
  actionMenuButton: {
    margin: 0,
  },
  actionMenuContent: {
    backgroundColor: tokens.colors.background.primary,
  },
  deleteMenuLabel: {
    color: tokens.colors.error,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: tokens.spacing[20],
    gap: tokens.spacing[6],
  },
  teamInfoSurface: {
    overflow: "hidden",
    backgroundColor: tokens.colors.background.primary,
  },
  teamInfo: {
    paddingHorizontal: tokens.spacing[8],
    paddingTop: tokens.spacing[4],
    paddingBottom: tokens.spacing[8],
    alignItems: "center",
    backgroundColor: tokens.colors.primary[600],
  },
  logoContainer: {
    marginTop: tokens.spacing[6],
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoText: {
    fontSize: tokens.typography.fontSize["3xl"],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
  },
  teamName: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
    marginTop: tokens.spacing[4],
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
    marginTop: tokens.spacing[2],
  },
  cityText: {
    fontSize: tokens.typography.fontSize.sm,
    color: "rgba(255,255,255,0.85)",
  },
  statsGrid: {
    flexDirection: "row",
    gap: tokens.spacing[4],
    marginTop: tokens.spacing[6],
    width: "100%",
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: tokens.borderRadius.sm,
    padding: tokens.spacing[4],
    alignItems: "center",
  },
  statValue: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
  },
  statValueWin: {
    color: tokens.colors.success,
  },
  statValueLoss: {
    color: tokens.colors.error,
  },
  statLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    fontWeight: tokens.typography.fontWeight.medium,
    letterSpacing: 0.5,
  },
  playersSection: {
    backgroundColor: tokens.colors.background.primary,
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[6],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacing[4],
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  assignButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[4],
    backgroundColor: tokens.colors.primary[50],
    borderRadius: tokens.borderRadius.full,
  },
  assignButtonText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.primary[600],
  },
  sectionDivider: {
    marginBottom: tokens.spacing[4],
    backgroundColor: tokens.colors.border.light,
  },
  playersList: {
    gap: tokens.spacing[2],
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: tokens.spacing[6],
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.base,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
  },
  playerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[4],
    flex: 1,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  playerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  captainAvatarBorder: {
    borderWidth: 2,
    borderColor: tokens.colors.warning,
  },
  playerAvatarText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
  },
  playerName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.primary,
  },
  captainBadge: {
    backgroundColor: tokens.colors.warning,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.full,
  },
  captainBadgeText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.gray[800],
  },
  playerUsername: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
  },
  assignmentBadge: {
    backgroundColor: tokens.colors.primary[100],
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.full,
    marginRight: tokens.spacing[2],
  },
  assignmentText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[600],
  },
  emptyPlayersBlock: {
    alignItems: "center",
    paddingVertical: tokens.spacing[8],
    gap: tokens.spacing[4],
  },
  emptyPlayersText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    textAlign: "center",
  },
  emptyRosterButton: {
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[4],
    backgroundColor: tokens.colors.primary[50],
    borderRadius: tokens.borderRadius.full,
  },
  emptyRosterButtonText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.primary[600],
  },
  deleteDialog: {
    backgroundColor: tokens.colors.background.primary,
    borderRadius: tokens.borderRadius.base,
  },
  deleteDialogText: {
    color: tokens.colors.text.secondary,
  },
});

