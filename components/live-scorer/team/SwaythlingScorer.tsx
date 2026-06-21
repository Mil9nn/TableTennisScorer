import { useEffect, useRef, useCallback } from "react";
import {
  TeamMatch,
  MatchStatus,
  Participant,
  PlayerKey,
  isTeamMatch,
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
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import {
  isActiveScoringComplete,
  useTournamentMatchCompletionRedirect,
} from "@/hooks/useTournamentMatchCompletionRedirect";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isRubberComplete } from "@/lib/teamMatchRubber";
import { DesignTokens } from "@/constants/designTokens";

interface SwaythlingScorerProps {
  match: TeamMatch;
}

const tokens = DesignTokens;
const TEAM_LOGO_SIZE = tokens.spacing[12];

function TeamLogo({ name, logo }: { name?: string; logo?: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || "T";

  if (logo) {
    return (
      <Image
        source={{ uri: logo }}
        contentFit="cover"
        style={[
          styles.teamLogoImage,
          {
            width: TEAM_LOGO_SIZE,
            height: TEAM_LOGO_SIZE,
            borderRadius: TEAM_LOGO_SIZE / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.teamLogoFallback,
        {
          width: TEAM_LOGO_SIZE,
          height: TEAM_LOGO_SIZE,
          borderRadius: TEAM_LOGO_SIZE / 2,
        },
      ]}
    >
      <Text style={[styles.teamLogoInitial, { fontSize: TEAM_LOGO_SIZE * 0.45 }]}>
        {initial}
      </Text>
    </View>
  );
}

function TeamScoreRow({
  name,
  logo,
  score,
}: {
  name?: string;
  logo?: string;
  score: number;
}) {
  return (
    <View style={styles.teamScoreRow}>
      <View style={styles.teamScoreLeft}>
        <TeamLogo name={name} logo={logo} />
        <Text style={styles.teamName} numberOfLines={1}>
          {name || "Team"}
        </Text>
      </View>
      <Text style={styles.teamScoreValue}>{score}</Text>
    </View>
  );
}

export default function SwaythlingScorer({ match }: SwaythlingScorerProps) {
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
    setInitialTeamMatch,
    subtractPoint,
    swapSides,
    currentServer,
    resetSubMatch,
    updateSubMatchScore,
  } = useTeamMatch();

  const setServerDialogOpen = useMatchStore((s) => s.setServerDialogOpen);
  const storeMatch = useMatchStore((s) => s.match);
  const activeMatch: TeamMatch =
    storeMatch && isTeamMatch(storeMatch as TeamMatch) &&
    String(storeMatch._id) === String(match._id)
      ? (storeMatch as TeamMatch)
      : match;

  const lastMatchId = useRef<string | null>(null);

  useEffect(() => {
    if (!activeMatch) return;

    const matchChanged = lastMatchId.current !== activeMatch._id;
    if (matchChanged) {
      setInitialTeamMatch(activeMatch);
      lastMatchId.current = activeMatch._id;
    }
  }, [activeMatch._id, setInitialTeamMatch]);

  // Auto-open server dialog only when current submatch has no first server
  useEffect(() => {
    if (!currentSubMatch || currentSubMatch.status === "completed") return;

    if (currentSubMatch.serverConfig?.firstServer) {
      setServerDialogOpen(false);
      return;
    }

    setServerDialogOpen(true);
  }, [currentSubMatch, setServerDialogOpen]);

  const isCompleted = isActiveScoringComplete(activeMatch, status);
  useTournamentMatchCompletionRedirect(activeMatch);

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

  if (!activeMatch || !currentSubMatch) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No active submatch</Text>
      </View>
    );
  }

  // Get player info for current submatch
  const player1Raw = currentSubMatch.playerTeam1;
  const player2Raw = currentSubMatch.playerTeam2;

  const player1 = (Array.isArray(player1Raw) ? player1Raw[0] : player1Raw) as Participant;
  const player2 = (Array.isArray(player2Raw) ? player2Raw[0] : player2Raw) as Participant;

  const player1Name = player1?.fullName || player1?.username || "Player 1";
  const player2Name = player2?.fullName || player2?.username || "Player 2";

  const teamMatchPlayers = {
    side1: [
      {
        name: player1Name,
        playerId: player1?._id,
        serverKey: "team1",
        profileImage: player1?.profileImage,
      },
    ],
    side2: [
      {
        name: player2Name,
        playerId: player2?._id,
        serverKey: "team2",
        profileImage: player2?.profileImage,
      },
    ],
  };

  const goToSubMatch = useCallback(
    (index: number) => {
      const base =
        (useMatchStore.getState().match as TeamMatch | null) ?? activeMatch;
      if (index < 0 || index >= base.subMatches.length) return;
      const next = { ...base, currentSubMatch: index + 1 };
      useMatchStore.getState().setMatch(next);
      setInitialTeamMatch(next);
    },
    [activeMatch, setInitialTeamMatch]
  );

  if (isCompleted) return <View style={styles.container} />;

  const rubberComplete = isRubberComplete(currentSubMatch, activeMatch);

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
          <View style={styles.teamScoreCard}>
            <TeamScoreRow
              name={activeMatch.team1?.name}
              logo={activeMatch.team1?.logo}
              score={activeMatch.finalScore?.team1Matches || 0}
            />
            <TeamScoreRow
              name={activeMatch.team2?.name}
              logo={activeMatch.team2?.logo}
              score={activeMatch.finalScore?.team2Matches || 0}
            />
          </View>

          {/* SubMatch Navigator */}
          <View style={styles.navigatorCard}>
            <View style={styles.navigatorHeader}>
              <Text style={styles.navigatorTitle}>Individual Matches</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  Match {currentSubMatchIndex + 1} of {activeMatch.subMatches.length}
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

                {activeMatch.subMatches.map((sm, idx) => {
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
                    currentSubMatchIndex === activeMatch.subMatches.length - 1 &&
                      styles.navButtonDisabled,
                  ]}
                  onPress={() => goToSubMatch(currentSubMatchIndex + 1)}
                  disabled={
                    currentSubMatchIndex === activeMatch.subMatches.length - 1
                  }
                >
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={
                      currentSubMatchIndex === activeMatch.subMatches.length - 1
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
                  Match {currentSubMatchIndex + 1}
                </Text>
                <MatchStatusBadge
                  status={currentSubMatch.status as MatchStatus}
                  size="sm"
                />
              </View>
              <Text style={styles.subMatchPlayers}>
                {player1Name} vs {player2Name}
              </Text>
            </View>

            {currentSubMatch.status === "completed" || rubberComplete ? (
              <View style={styles.completedContainer}>
                <Text style={styles.completedText}>Match Completed!</Text>
                <Text style={styles.completedWinner}>
                  Winner:{" "}
                  {currentSubMatch.winnerSide === "team1"
                    ? player1Name
                    : player2Name}
                </Text>
                <Text style={styles.completedScore}>
                  Score: {currentSubMatch.finalScore?.team1Sets || 0} -{" "}
                  {currentSubMatch.finalScore?.team2Sets || 0}
                </Text>
              </View>
            ) : (
              <>
                <ScoreBoard
                  match={activeMatch}
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
                  participants={[player1, player2] as any}
                />

                <ShotFeed
                  games={currentSubMatch.games || []}
                  currentGame={currentGame}
                  participants={[player1, player2] as any}
                />
              </>
            )}
          </View>

          <InitialServerDialog
            matchType="singles"
            participants={[player1, player2] as any}
            isTeamMatch={true}
            subMatchId={currentSubMatch._id?.toString()}
          />
      </>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background.primary,
  },
  content: {
    gap: tokens.spacing[4],
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
  teamScoreCard: {
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.secondary,
    gap: tokens.spacing[4],
  },
  teamScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing[4],
  },
  teamScoreLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[4],
  },
  teamLogoImage: {
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
  },
  teamLogoFallback: {
    backgroundColor: tokens.colors.gray[100],
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoInitial: {
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
  },
  teamName: {
    flex: 1,
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.primary,
  },
  teamScoreValue: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    flexShrink: 0,
    minWidth: tokens.spacing[7],
    textAlign: "right",
  },
  navigatorCard: {
    backgroundColor: tokens.colors.background.secondary,
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  navigatorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacing[4],
  },
  navigatorTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
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
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  subMatchButton: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    backgroundColor: tokens.colors.background.primary,
  },
  subMatchButtonActive: {
    backgroundColor: tokens.colors.background.secondary,
  },
  subMatchButtonCompleted: {
    backgroundColor: tokens.colors.background.secondary,
  },
  subMatchButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.primary,
  },
  subMatchButtonTextActive: {
    color: "#2563eb",
  },
  subMatchButtonTextCompleted: {
    color: "#16a34a",
  },
  subMatchCard: {
    backgroundColor: tokens.colors.background.primary,
    gap: tokens.spacing[4],
  },
  subMatchHeader: {
    gap: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[4],
  },
  subMatchHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subMatchTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.primary,
  },
  subMatchPlayers: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
  completedContainer: {
    gap: tokens.spacing[4],
  },
  completedText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.primary,
  },
  completedWinner: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.primary,
  },
  completedScore: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
});

