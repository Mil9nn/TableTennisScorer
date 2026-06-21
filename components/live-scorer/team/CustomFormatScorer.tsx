import { useEffect, useRef, useCallback } from "react";
import {
  TeamMatch,
  MatchStatus,
  Participant,
  PlayerKey,
} from "@/types/match.type";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { useMatchStore } from "@/hooks/useMatchStore";
import { inferTeamUndoSide } from "@/lib/matchUndo";
import { resolveTeamScoringPlayerId } from "@/lib/scoringPlayer";
import ScoreBoard from "../common/ScoreBoard";
import GamesHistory from "../common/GamesHistory";
import ShotFeed from "../common/ShotFeed";
import InitialServerDialog from "@/components/ServerDialog";
import MatchStatusBadge from "@/components/MatchStatusBadge";
import MatchTypeBadge from "@/components/MatchTypeBadge";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import {
  isActiveScoringComplete,
  useTournamentMatchCompletionRedirect,
} from "@/hooks/useTournamentMatchCompletionRedirect";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesignTokens } from "@/constants/designTokens";
import { isRubberComplete } from "@/lib/teamMatchRubber";

interface CustomFormatScorerProps {
  match: TeamMatch;
}

const tokens = DesignTokens;

export default function CustomFormatScorer({
  match,
}: CustomFormatScorerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    currentSubMatchIndex,
    currentSubMatch,
    team1Score,
    team2Score,
    team1Sets,
    team2Sets,
    currentGame,
    status,
    currentServer,
    setInitialTeamMatch,
    subtractPoint,
    swapSides,
    resetSubMatch,
    updateSubMatchScore,
  } = useTeamMatch();

  const setServerDialogOpen = useMatchStore((s) => s.setServerDialogOpen);

  const lastMatchId = useRef<string | null>(null);
  const lastSubMatchIndex = useRef<number | null>(null);

  useEffect(() => {
    if (!match) return;

    const matchChanged = lastMatchId.current !== match._id;
    const subMatchChanged = lastSubMatchIndex.current !== currentSubMatchIndex;

    if (matchChanged || subMatchChanged) {
      setInitialTeamMatch(match);
      lastMatchId.current = match._id;
      lastSubMatchIndex.current = currentSubMatchIndex;
    }
  }, [match, currentSubMatchIndex, setInitialTeamMatch]);

  // Auto-open server dialog only when current submatch has no first server
  useEffect(() => {
    if (!currentSubMatch || currentSubMatch.status === "completed") return;

    if (currentSubMatch.serverConfig?.firstServer) {
      setServerDialogOpen(false);
      return;
    }

    setServerDialogOpen(true);
  }, [currentSubMatch, setServerDialogOpen]);

  const isCompleted = isActiveScoringComplete(match, status);
  useTournamentMatchCompletionRedirect(match);

  const handleUndo = useCallback(async () => {
    if (team1Score === 0 && team2Score === 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No points to undo",
      });
      return;
    }

    const currentGameData = currentSubMatch?.games?.find(
      (g: any) => g.gameNumber === currentGame
    );
    const shots = currentGameData?.shots || [];
    const lastShot = shots.length > 0 ? shots[shots.length - 1] : undefined;
    const lastSide = lastShot?.side as PlayerKey | undefined;

    const undoSide = inferTeamUndoSide(
      team1Score,
      team2Score,
      lastSide,
      shots.length > 0
    );
    await subtractPoint(undoSide);
  }, [team1Score, team2Score, currentSubMatch, currentGame, subtractPoint]);

  const handleReset = useCallback(async () => {
    const fullReset = currentSubMatch?.status === "completed";
    await resetSubMatch(fullReset);
  }, [currentSubMatch, resetSubMatch]);

  if (!match || !currentSubMatch) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No active match</Text>
        <Text style={styles.emptySubtext}>
          Please select a match to continue
        </Text>
      </View>
    );
  }

  const isDoublesMatch = currentSubMatch.matchType === "doubles";

  // Get player info for current submatch
  const team1Players = Array.isArray(currentSubMatch.playerTeam1)
    ? currentSubMatch.playerTeam1
    : [currentSubMatch.playerTeam1];
  const team2Players = Array.isArray(currentSubMatch.playerTeam2)
    ? currentSubMatch.playerTeam2
    : [currentSubMatch.playerTeam2];

  const player1 = team1Players as Participant[];
  const player2 = team2Players as Participant[];

  const teamMatchPlayers = isDoublesMatch
    ? {
        side1: [
          {
            name: player1[0]?.fullName || player1[0]?.username || "Player 1",
            playerId: player1[0]?._id,
            serverKey: "team1_main" as const,
            profileImage: player1[0]?.profileImage,
          },
          {
            name: player1[1]?.fullName || player1[1]?.username || "Partner 1",
            playerId: player1[1]?._id,
            serverKey: "team1_partner" as const,
            profileImage: player1[1]?.profileImage,
          },
        ],
        side2: [
          {
            name: player2[0]?.fullName || player2[0]?.username || "Player 2",
            playerId: player2[0]?._id,
            serverKey: "team2_main" as const,
            profileImage: player2[0]?.profileImage,
          },
          {
            name: player2[1]?.fullName || player2[1]?.username || "Partner 2",
            playerId: player2[1]?._id,
            serverKey: "team2_partner" as const,
            profileImage: player2[1]?.profileImage,
          },
        ],
      }
    : {
        side1: [
          {
            name: player1[0]?.fullName || player1[0]?.username || "Team 1 Player",
            playerId: player1[0]?._id,
            serverKey: "team1" as const,
            profileImage: player1[0]?.profileImage,
          },
        ],
        side2: [
          {
            name: player2[0]?.fullName || player2[0]?.username || "Team 2 Player",
            playerId: player2[0]?._id,
            serverKey: "team2" as const,
            profileImage: player2[0]?.profileImage,
          },
        ],
      };

  const goToSubMatch = (index: number) => {
    if (index < 0 || index >= match.subMatches.length) return;
    useMatchStore.getState().setMatch({
      ...match,
      currentSubMatch: index + 1,
    });
    setInitialTeamMatch({
      ...match,
      currentSubMatch: index + 1,
    });
  };

  if (isCompleted) return <View style={styles.container} />;

  const rubberComplete = isRubberComplete(currentSubMatch, match);

  const completedCount = match.subMatches.filter(
    (sm) => sm.status === "completed"
  ).length;
  const progressPercentage = (completedCount / match.subMatches.length) * 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 8), paddingBottom: 24 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <>
          {/* Team Match Score Overview */}
          <View style={styles.summaryCard}>
            <View style={styles.teamScoreRow}>
              <View style={styles.teamScoreItem}>
                <Text style={styles.teamName}>{match.team1?.name}</Text>
                <Text style={styles.teamScoreValue}>
                  {match.finalScore?.team1Matches || 0}
                </Text>
              </View>
              <View style={styles.teamScoreItem}>
                <Text style={styles.teamName}>{match.team2?.name}</Text>
                <Text style={styles.teamScoreValue}>
                  {match.finalScore?.team2Matches || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* SubMatch Navigator */}
          <View style={styles.navigatorCard}>
            <View style={styles.navigatorHeader}>
              <Text style={styles.navigatorTitle}>Match Sequence</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  Match {currentSubMatchIndex + 1} of {match.subMatches.length}
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.navigatorRow}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentSubMatchIndex === 0 && styles.navButtonDisabled,
                  ]}
                  onPress={() => goToSubMatch(currentSubMatchIndex - 1)}
                  disabled={currentSubMatchIndex === 0}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={currentSubMatchIndex === 0 ? "#9ca3af" : "#1f2937"}
                  />
                </TouchableOpacity>

                {match.subMatches.map((sm, idx) => {
                  const isActive = idx === currentSubMatchIndex;
                  const isCompleted = sm.status === "completed";

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.subMatchButton,
                        isActive && styles.subMatchButtonActive,
                        isCompleted && styles.subMatchButtonCompleted,
                      ]}
                      onPress={() => goToSubMatch(idx)}
                    >
                      <MatchTypeBadge
                        matchType={sm.matchType}
                        size="sm"
                      />
                      <Text
                        style={[
                          styles.subMatchButtonText,
                          isActive && styles.subMatchButtonTextActive,
                          isCompleted && styles.subMatchButtonTextCompleted,
                        ]}
                      >
                        M{idx + 1}
                        {isCompleted && sm.winnerSide && " ✓"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentSubMatchIndex === match.subMatches.length - 1 &&
                      styles.navButtonDisabled,
                  ]}
                  onPress={() => goToSubMatch(currentSubMatchIndex + 1)}
                  disabled={currentSubMatchIndex === match.subMatches.length - 1}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={
                      currentSubMatchIndex === match.subMatches.length - 1
                        ? "#9ca3af"
                        : "#1f2937"
                    }
                  />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Current SubMatch Details */}
          <View style={styles.subMatchCard}>
            <View style={styles.subMatchHeader}>
              <View style={styles.subMatchHeaderContent}>
                <Text style={styles.subMatchTitle}>
                  Match {currentSubMatchIndex + 1}:
                </Text>
                <MatchStatusBadge
                  status={currentSubMatch.status as MatchStatus}
                  size="sm"
                />
                <MatchTypeBadge matchType={currentSubMatch.matchType} size="sm" />
              </View>
              <Text style={styles.subMatchPlayers}>
                {teamMatchPlayers.side1.map((p) => p.name).join(" & ")} vs{" "}
                {teamMatchPlayers.side2.map((p) => p.name).join(" & ")}
              </Text>
            </View>

            {currentSubMatch.status === "completed" || rubberComplete ? (
              <View style={styles.completedContainer}>
                <Text style={styles.completedText}>Match Completed!</Text>
                <Text style={styles.completedWinner}>
                  Winner:{" "}
                  {currentSubMatch.winnerSide === "team1"
                    ? teamMatchPlayers.side1.map((p) => p.name).join(" & ")
                    : teamMatchPlayers.side2.map((p) => p.name).join(" & ")}
                </Text>
                <Text style={styles.completedScore}>
                  Score: {currentSubMatch.finalScore?.team1Sets || 0} -{" "}
                  {currentSubMatch.finalScore?.team2Sets || 0}
                </Text>
              </View>
            ) : (
              <>
                <ScoreBoard
                  match={match}
                  leftGamePoints={team1Score}
                  rightGamePoints={team2Score}
                  currentServer={currentServer || currentSubMatch.currentServer || null}
                  leftSetsWon={team1Sets}
                  rightSetsWon={team2Sets}
                  status={currentSubMatch.status as MatchStatus}
                  rubberComplete={rubberComplete}
                  onAddPoint={({ side, playerId }) => {
                    if (currentSubMatch.status === "completed") {
                      Toast.show({
                        type: "error",
                        text1: "Error",
                        text2: "Submatch is completed!",
                      });
                      return;
                    }
                    const teamSide =
                      side === "team1" || side === "side1" ? "team1" : "team2";
                    const srv =
                      currentServer ||
                      currentSubMatch.currentServer ||
                      null;
                    const scoringId = resolveTeamScoringPlayerId(
                      currentSubMatch,
                      teamSide,
                      playerId,
                      srv
                    );
                    void updateSubMatchScore(teamSide, 1, undefined, scoringId);
                  }}
                  onUndo={handleUndo}
                  onReset={handleReset}
                  onSwap={swapSides}
                  teamMatchPlayers={teamMatchPlayers}
                />

                <GamesHistory
                  games={currentSubMatch.games || []}
                  currentGame={currentGame}
                  participants={[...player1, ...player2] as any}
                />

                <ShotFeed
                  games={currentSubMatch.games || []}
                  currentGame={currentGame}
                  participants={[...player1, ...player2] as any}
                  serverConfig={currentSubMatch.serverConfig ?? undefined}
                />
              </>
            )}
          </View>

          <InitialServerDialog
            matchType={isDoublesMatch ? "doubles" : "singles"}
            participants={[...player1, ...player2] as any}
            isTeamMatch={true}
            subMatchId={currentSubMatch._id?.toString()}
          />
      </>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  content: {
    gap: tokens.spacing[2],
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  emptySubtext: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
  summaryCard: {
    backgroundColor: tokens.colors.background.secondary,
    padding: tokens.spacing[6],
    gap: tokens.spacing[6],
  },
  teamScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.spacing[6],
  },
  teamScoreItem: {
    flex: 1,
    gap: tokens.spacing[4],
  },
  teamName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
  teamScoreValue: {
    fontSize: tokens.typography.fontSize["2xl"],
    fontWeight: tokens.typography.fontWeight.bold,
  },
  navigatorCard: {
    backgroundColor: tokens.colors.background.secondary,
    padding: tokens.spacing[6],
  },
  navigatorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  navigatorTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  badge: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.background.primary,
  },
  badgeText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.primary,
  },
  navigatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[4],
  },
  navButton: {
    padding: tokens.spacing[4],
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.background.secondary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  subMatchButton: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.primary,
  },
  subMatchButtonActive: {
    borderColor: tokens.colors.border.light,
    backgroundColor: tokens.colors.background.primary,
  },
  subMatchButtonCompleted: {
    borderColor: tokens.colors.success,
    backgroundColor: tokens.colors.success,
  },
  subMatchButtonText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
  subMatchButtonTextActive: {
    color: "#2563eb",
  },
  subMatchButtonTextCompleted: {
    color: "#16a34a",
  },
  subMatchCard: {
    backgroundColor: tokens.colors.background.secondary,
    gap: tokens.spacing[4],
  },
  subMatchHeader: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  subMatchHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subMatchTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  subMatchPlayers: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
  completedContainer: {
    padding: tokens.spacing[6],
    alignItems: "center",
    gap: tokens.spacing[4],
  },
  completedText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  completedWinner: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
  completedScore: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
});

