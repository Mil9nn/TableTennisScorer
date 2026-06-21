import { useEffect, useRef, useCallback } from "react";
import { IndividualMatch, MatchStatus, PlayerKey } from "@/types/match.type";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useMatchStore } from "@/hooks/useMatchStore";
import { inferIndividualUndoSide } from "@/lib/matchUndo";
import ScoreBoard from "../common/ScoreBoard";
import GamesHistory from "../common/GamesHistory";
import ShotFeed from "../common/ShotFeed";
import InitialServerDialog from "@/components/ServerDialog";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import {
  isActiveScoringComplete,
  useTournamentMatchCompletionRedirect,
} from "@/hooks/useTournamentMatchCompletionRedirect";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { AddPointPayload } from "@/types/match.type";
import { DesignTokens } from "@/constants/designTokens";

interface SinglesScorerProps {
  match: IndividualMatch;
}

export default function SinglesScorer({ match }: SinglesScorerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    leftPoints,
    rightPoints,
    currentServer,
    currentGame,
    leftSets,
    rightSets,
    status,
    subtractPoint,
    resetGame,
    setInitialMatch,
    swapSides,
    updateScore,
  } = useIndividualMatch();

  const setServerDialogOpen = useMatchStore((s) => s.setServerDialogOpen);
  const storeMatch = useMatchStore((s) => s.match);
  const activeMatch: IndividualMatch =
    storeMatch &&
    storeMatch.matchCategory === "individual" &&
    String(storeMatch._id) === String(match._id)
      ? (storeMatch as IndividualMatch)
      : match;

  const lastMatchId = useRef<string | null>(null);
  const lastMatchStatus = useRef<MatchStatus | null>(null);

  useEffect(() => {
    if (!match) return;

    const matchChanged = lastMatchId.current !== match._id;
    const statusChanged = lastMatchStatus.current !== match.status;

    if (
      matchChanged ||
      (statusChanged &&
        (match.status === "completed" ||
          lastMatchStatus.current === "completed"))
    ) {
      setInitialMatch(match);
      lastMatchId.current = match._id;
      lastMatchStatus.current = match.status;
    }
  }, [match, setInitialMatch]);

  // Show server dialog immediately if no server is configured
  useEffect(() => {
    if (!match) return;

    const sc = match.serverConfig as
      | { firstServer?: unknown; firstServerPlayerId?: unknown }
      | null
      | undefined;
    const hasServer = Boolean(
      sc?.firstServerPlayerId ?? sc?.firstServer
    );

    if (!hasServer && match.status !== "completed") {
      setServerDialogOpen(true);
    }
  }, [match, setServerDialogOpen]);

  const handleAddPoint = useCallback(
    ({ side, playerId }: AddPointPayload) => {
      if (status === "completed") {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Match is completed!",
        });
        return;
      }
      void updateScore(side, 1, undefined, playerId);
    },
    [status, updateScore]
  );

  const handleUndo = useCallback(async () => {
    if (leftPoints === 0 && rightPoints === 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No points to undo",
      });
      return;
    }

    const games = activeMatch.games || [];
    const currentGameData = games.find((g: any) => g.gameNumber === currentGame);
    const shots = currentGameData?.shots || [];
    const lastShot = shots.length > 0 ? shots[shots.length - 1] : undefined;
    const lastSide = lastShot?.side as PlayerKey | undefined;

    const undoSide = inferIndividualUndoSide(
      leftPoints,
      rightPoints,
      lastSide,
      shots.length > 0
    );
    await subtractPoint(undoSide);
  }, [leftPoints, rightPoints, activeMatch, currentGame, subtractPoint]);

  const handleReset = useCallback(async () => {
    await resetGame(true);
  }, [resetGame]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!match) return <View style={styles.container} />;

  const isCompleted = isActiveScoringComplete(match, status);
  useTournamentMatchCompletionRedirect(match);

  if (isCompleted) return <View style={styles.container} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: 24 + insets.bottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <>
        {/* Header with back navigation */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons 
              name="chevron-back" 
              size={16}  
            />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        <ScoreBoard
              match={match}
              leftGamePoints={leftPoints}
              rightGamePoints={rightPoints}
              currentServer={currentServer}
              leftSetsWon={leftSets}
              rightSetsWon={rightSets}
              status={status}
              onAddPoint={handleAddPoint}
              onReset={handleReset}
              onUndo={handleUndo}
              onSwap={swapSides}
            />

          <GamesHistory
            games={activeMatch.games || []}
            currentGame={currentGame}
            participants={activeMatch.participants}
          />

          <ShotFeed
            games={activeMatch.games || []}
            currentGame={currentGame}
            participants={activeMatch.participants}
            finalScore={activeMatch.finalScore}
          />

          <InitialServerDialog
            matchType={match.matchType}
            participants={match.participants}
          />
      </>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    marginLeft: DesignTokens.spacing[4],
  },
  content: {
    padding: 0,
    gap: 16,
  },
});

