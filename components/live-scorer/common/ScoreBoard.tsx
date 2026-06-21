import PlayerCard from "./PlayerCard";
import CenterControls from "./CenterControls";
import {
  AddPointPayload,
  MatchStatus,
  IndividualMatch,
  TeamMatch,
} from "@/types/match.type";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { StyleSheet, Text, View, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DesignTokens } from "@/constants/designTokens";
import { Ionicons } from "@expo/vector-icons";

function checkGameWon(side1Score: number, side2Score: number): "side1" | "side2" | null {
  if (side1Score >= 11 && side1Score - side2Score >= 2) return "side1";
  if (side2Score >= 11 && side2Score - side1Score >= 2) return "side2";
  return null;
}

type ScoreBoardProps = {
  match: IndividualMatch | TeamMatch;
  leftGamePoints: number;
  rightGamePoints: number;
  currentServer: string | null;
  leftSetsWon: number;
  rightSetsWon: number;
  status: MatchStatus;
  onAddPoint: (payload: AddPointPayload) => void;
  onReset: () => void;
  onUndo: () => void;
  onSwap: () => void;
  /** When true, rubber/sub-match is won — block further point entry. */
  rubberComplete?: boolean;
  teamMatchPlayers?: {
    side1: {
      name: string;
      playerId?: string;
      serverKey: string;
      profileImage?: string;
    }[];
    side2: {
      name: string;
      playerId?: string;
      serverKey: string;
      profileImage?: string;
    }[];
  };
};

export default function ScoreBoard(props: ScoreBoardProps) {
  const {
    match,
    leftGamePoints,
    rightGamePoints,
    currentServer,
    leftSetsWon,
    rightSetsWon,
    status,
    onAddPoint,
    onReset,
    onUndo,
    onSwap,
    rubberComplete = false,
    teamMatchPlayers,
  } = props;

  const isUpdatingIndividual = useIndividualMatch((s) => s.isUpdatingScore);
  const isUndoingIndividual = useIndividualMatch((s) => s.isUndoing);
  const isStartingIndividual = useIndividualMatch((s) => s.isStartingMatch);
  const isUpdatingTeam = useTeamMatch((s) => s.isUpdatingTeamScore);
  const isUndoingTeam = useTeamMatch((s) => s.isUndoing);
  const isStartingTeam = useTeamMatch((s) => s.isStartingSubMatch);

  const isIndividual = match?.matchCategory === "individual";
  const isUpdating = isIndividual ? isUpdatingIndividual : isUpdatingTeam;
  const isUndoing = isIndividual ? isUndoingIndividual : isUndoingTeam;
  const isStarting = isIndividual ? isStartingIndividual : isStartingTeam;
  const isAnyOperationInProgress = isStarting || isUpdating || isUndoing;

  const buildPlayers = () => {
    if (!match) {
      return { p1: [{ name: "Side 1" }], p2: [{ name: "Side 2" }] };
    }

    if (match.matchCategory === "team" && teamMatchPlayers) {
      return {
        p1: teamMatchPlayers.side1,
        p2: teamMatchPlayers.side2,
      };
    }

    if (match.matchCategory === "individual") {
      const individualMatch = match as IndividualMatch;
      if (individualMatch.matchType === "singles") {
        return {
          p1: [
            {
              name: individualMatch.participants?.[0]?.fullName || "Player 1",
              playerId: individualMatch.participants?.[0]?._id,
              serverKey: String(individualMatch.participants?.[0]?._id ?? ""),
              profileImage: individualMatch.participants?.[0]?.profileImage,
            },
          ],
          p2: [
            {
              name: individualMatch.participants?.[1]?.fullName || "Player 2",
              playerId: individualMatch.participants?.[1]?._id,
              serverKey: String(individualMatch.participants?.[1]?._id ?? ""),
              profileImage: individualMatch.participants?.[1]?.profileImage,
            },
          ],
        };
      }

      return {
        p1: [
          {
            name: individualMatch.participants?.[0]?.fullName || "Player 1",
            playerId: individualMatch.participants?.[0]?._id,
            serverKey: String(individualMatch.participants?.[0]?._id ?? ""),
            profileImage: individualMatch.participants?.[0]?.profileImage,
          },
          {
            name: individualMatch.participants?.[1]?.fullName || "Partner 1",
            playerId: individualMatch.participants?.[1]?._id,
            serverKey: String(individualMatch.participants?.[1]?._id ?? ""),
            profileImage: individualMatch.participants?.[1]?.profileImage,
          },
        ],
        p2: [
          {
            name: individualMatch.participants?.[2]?.fullName || "Player 2",
            playerId: individualMatch.participants?.[2]?._id,
            serverKey: String(individualMatch.participants?.[2]?._id ?? ""),
            profileImage: individualMatch.participants?.[2]?.profileImage,
          },
          {
            name: individualMatch.participants?.[3]?.fullName || "Partner 2",
            playerId: individualMatch.participants?.[3]?._id,
            serverKey: String(individualMatch.participants?.[3]?._id ?? ""),
            profileImage: individualMatch.participants?.[3]?.profileImage,
          },
        ],
      };
    }

    return { p1: [{ name: "Side 1" }], p2: [{ name: "Side 2" }] };
  };

  const { p1, p2 } = buildPlayers();

  const leftSide = p1;
  const rightSide = p2;
  const leftScore = leftGamePoints;
  const rightScore = rightGamePoints;
  const leftSets = leftSetsWon;
  const rightSets = rightSetsWon;
  const leftSideKey = isIndividual ? ("side1" as const) : ("team1" as const);
  const rightSideKey = isIndividual ? ("side2" as const) : ("team2" as const);

  const canSwap =
    leftGamePoints === 0 &&
    rightGamePoints === 0 &&
    status !== "completed" &&
    !isAnyOperationInProgress;

  const gameWinner = checkGameWon(leftGamePoints, rightGamePoints);
  const isGameWon = gameWinner !== null;
  const scoringLocked =
    isAnyOperationInProgress || status === "completed" || rubberComplete;
  const canUndo = leftGamePoints > 0 || rightGamePoints > 0;

  return (
    <View style={modernStyles.container}>
      <View style={modernStyles.boardShell}>
        <LinearGradient
          colors={[
            tokens.colors.success + '10', 
            tokens.colors.background.primary, 
            tokens.colors.error + '10'
          ]}
          locations={[0, 0.52, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={modernStyles.boardGradient}
        >
          <View style={modernStyles.scoreCardsRow}>
            <PlayerCard
              players={leftSide}
              score={leftScore}
              side={leftSideKey}
              onAddPoint={onAddPoint}
              setsWon={leftSets}
              disabled={scoringLocked || isGameWon}
              currentServer={currentServer}
              isFirstColumn
            />

            <PlayerCard
              players={rightSide}
              score={rightScore}
              side={rightSideKey}
              onAddPoint={onAddPoint}
              setsWon={rightSets}
              disabled={scoringLocked || isGameWon}
              currentServer={currentServer}
            />
          </View>
        </LinearGradient>
      </View>

      <View style={modernStyles.controlsContainer}>
        <CenterControls
          onReset={onReset}
          onUndo={onUndo}
          canUndo={canUndo}
          onSwap={onSwap}
          canSwap={canSwap}
        />
      </View>

      {isGameWon && !rubberComplete && status !== "completed" && (
        <View style={modernStyles.banner}>
          <View style={modernStyles.bannerContent}>
            <View style={modernStyles.bannerIcon}>
              <Ionicons name="trophy-outline" size={20} color={tokens.colors.success} />
            </View>
            <View style={modernStyles.bannerText}>
              <Text style={modernStyles.bannerTitle}>
                Game won — {gameWinner === "side1" ? "Left" : "Right"}
              </Text>
              <Text style={modernStyles.bannerSub}>Advancing to the next game…</Text>
            </View>
          </View>
        </View>
      )}

      {rubberComplete && status !== "completed" && (
        <View style={modernStyles.banner}>
          <View style={modernStyles.bannerContent}>
            <View style={modernStyles.bannerIcon}>
              <Ionicons name="trophy-outline" size={20} color={tokens.colors.success} />
            </View>
            <View style={modernStyles.bannerText}>
              <Text style={modernStyles.bannerTitle}>Rubber complete</Text>
              <Text style={modernStyles.bannerSub}>
                Select the next tie match to continue scoring
              </Text>
            </View>
          </View>
        </View>
      )}

      {status === "completed" && (
        <View style={[modernStyles.banner, modernStyles.bannerCompleted]}>
          <View style={modernStyles.bannerContent}>
            <View style={modernStyles.bannerIcon}>
              <Ionicons name="checkmark-circle-outline" size={20} color={tokens.colors.primary[600]} />
            </View>
            <View style={modernStyles.bannerText}>
              <Text style={modernStyles.bannerTitleCompleted}>Match complete</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Design tokens
const tokens = DesignTokens;

// Modern styles using design tokens
const modernStyles = StyleSheet.create({
  container: {
    gap: 0,
  },
  boardShell: {
    overflow: 'hidden',
    backgroundColor: tokens.colors.background.primary,
  },
  boardGradient: {
    overflow: 'hidden',
  },
  scoreCardsRow: {
    flexDirection: 'row',
  },
  controlsContainer: {
    backgroundColor: tokens.colors.background.primary,
    paddingVertical: tokens.spacing[4],
  },
  
  // Modern banners
  banner: {
    marginTop: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[4],
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.success + '10',
    borderWidth: 1,
    borderColor: tokens.colors.success + '30',
  },
  bannerCompleted: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[200],
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: tokens.borderRadius.base,
    backgroundColor: tokens.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.success,
    letterSpacing: -0.2,
  },
  bannerTitleCompleted: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[600],
    letterSpacing: -0.2,
  },
  bannerSub: {
    marginTop: tokens.spacing[1],
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.normal,
    color: tokens.colors.success,
  },
});
