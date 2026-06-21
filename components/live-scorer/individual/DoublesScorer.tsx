import { useCallback, useEffect, useRef } from "react";
import { IndividualMatch, MatchStatus, PlayerKey } from "@/types/match.type";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useMatchStore } from "@/hooks/useMatchStore";
import { inferIndividualUndoSide } from "@/lib/matchUndo";
import { resolveIndividualScoringPlayerId } from "@/lib/scoringPlayer";
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
import { StyleSheet, View } from "react-native";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AddPointPayload } from "@/types/match.type";

interface DoublesScorerProps {
  match: IndividualMatch;
}

export default function DoublesScorer({ match }: DoublesScorerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    leftPoints,
    rightPoints,
    currentServer,
    currentGame,
    leftSets,
    rightSets,
    subtractPoint,
    resetGame,
    setInitialMatch,
    swapSides,
    updateScore,
  } = useIndividualMatch();

  const status = useIndividualMatch((s) => s.status);

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
  }, [match._id, match.status, setInitialMatch]);

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
    const currentGameData = games.find(
      (g: any) => g.gameNumber === currentGame
    );
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
          <ScoreBoard
            match={match}
            leftGamePoints={leftPoints}
            rightGamePoints={rightPoints}
            currentServer={currentServer}
            leftSetsWon={leftSets}
            rightSetsWon={rightSets}
            status={status}
            onAddPoint={({ side, playerId }: AddPointPayload) => {
              if (status === "completed") {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Match is completed!",
                });
                return;
              }
              const scoringId = resolveIndividualScoringPlayerId(
                match,
                side,
                playerId,
                currentServer
              );
              void updateScore(side, 1, undefined, scoringId);
            }}
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
            serverConfig={activeMatch.serverConfig ?? undefined}
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
  content: {
    padding: 0,
    gap: 16,
  },
});

