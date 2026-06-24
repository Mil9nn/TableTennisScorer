import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useMatchSocket } from "@/hooks/useMatchSocket";
import { IndividualMatch } from "@/types/match.type";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, getInitial } from "@/lib/utils";
import ShotFeed from "../live-scorer/common/ShotFeed";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { DesignTokens } from "@/constants/designTokens";
import * as Haptics from 'expo-haptics';
import {
  getSetScores,
  getScoringIds,
  gamePointsByTeamIndex,
} from "@/lib/match/singlesClient";

interface LiveMatchDetailsProps {
  matchId: string;
  category?: "individual" | "team";
}

export default function LiveMatchDetails({ matchId, category }: LiveMatchDetailsProps) {
  const { match, fetchingMatch, fetchMatch } = useMatchStore();
  const insets = useSafeAreaInsets();
  const matchCategory = category ?? "individual";

  useEffect(() => {
    if (matchId) {
      fetchMatch(matchId, matchCategory);
    }
  }, [matchId, fetchMatch, matchCategory]);

  const { isConnected, isJoined } = useMatchSocket({
    matchId,
    matchCategory,
    role: "viewer",
    enabled: false,
  });

  // Loading state
  if (!match) {
    return (
      <View style={modernStyles.loadingContainer}>
        <View style={modernStyles.loadingIcon}>
          <ActivityIndicator size="large" color={tokens.colors.primary[400]} />
        </View>
        <Text style={modernStyles.loadingText}>Loading match details…</Text>
        <Text style={modernStyles.loadingSubtext}>Preparing live match view</Text>
      </View>
    );
  }

  // Safety cast
  const individualMatch = match as IndividualMatch;
  const participants = individualMatch.participants || [];
  const isDoubles = participants.length === 4;
  const side1 = isDoubles ? participants.slice(0, 2) : participants.slice(0, 1);
  const side2 = isDoubles ? participants.slice(2, 4) : participants.slice(1, 2);
  const scoringIds = getScoringIds(individualMatch);
  const [setsWonSide1, setsWonSide2] = getSetScores(individualMatch);
  const currentGame =
    individualMatch.games?.[
    Math.max(0, (individualMatch.currentGame || 1) - 1)
    ] || {};
  const [currentSide1Points, currentSide2Points] = gamePointsByTeamIndex(
    currentGame,
    scoringIds?.[0] ?? null,
    scoringIds?.[1] ?? null
  );

  // Completed match view
  if (individualMatch.status === "completed") {
    const winnerSide = individualMatch.winnerSide;
    const winners = winnerSide === "side1" ? side1 : side2;

    return (
      <View style={[modernStyles.safeArea, { paddingTop: insets.top }]}>
        <ScrollView style={modernStyles.completedContainer} contentContainerStyle={modernStyles.completedContent}>
          <Card style={modernStyles.completedCard}>
            <View style={modernStyles.completedHeader}>
              <View style={modernStyles.trophyContainer}>
                <Ionicons name="trophy" size={80} color={tokens.colors.warning} />
              </View>
              <Text style={modernStyles.completedTitle}>MATCH COMPLETED</Text>

              <View style={modernStyles.winnersContainer}>
                {winners.map((p: any, i: number) => (
                  <View key={i} style={modernStyles.winnerCard}>
                    <Avatar
                      src={p.profileImage}
                      alt={p.fullName || p.username}
                      size={48}
                      className="border-2 border-yellow-400"
                    />
                    <View style={modernStyles.winnerInfo}>
                      <Text style={modernStyles.winnerName}>
                        {p.fullName || p.username}
                      </Text>
                      <Text style={modernStyles.winnerLabel}>Winner</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={modernStyles.finalScoreContainer}>
                <View style={modernStyles.scoreBox}>
                  <Text style={modernStyles.finalScore}>
                    {setsWonSide1}
                  </Text>
                </View>
                <Text style={modernStyles.scoreDivider}>—</Text>
                <View style={modernStyles.scoreBox}>
                  <Text style={[modernStyles.finalScore, modernStyles.score2]}>
                    {setsWonSide2}
                  </Text>
                </View>
              </View>

              <View style={modernStyles.matchInfo}>
                <View style={modernStyles.infoRow}>
                  <Ionicons name="location" size={16} color={tokens.colors.text.tertiary} />
                  <Text style={modernStyles.infoText}>{individualMatch.city}</Text>
                </View>
                <View style={modernStyles.infoRow}>
                  <Ionicons name="time" size={16} color={tokens.colors.text.tertiary} />
                  <Text style={modernStyles.infoText}>
                    {formatDate(individualMatch.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Games history */}
          <Card style={modernStyles.gamesHistoryCard}>
            <Text style={modernStyles.gamesHistoryTitle}>Game Results</Text>
            <View style={modernStyles.gamesList}>
              {/* Header row */}
              <View style={modernStyles.gameHeaderRow}>
                <Text style={modernStyles.gameHeaderCell}>Game</Text>
                <Text style={modernStyles.gameHeaderCell}>
                  {side1.map((p: any) => p.fullName || p.username).join(" & ")}
                </Text>
                <Text style={modernStyles.gameHeaderCell}>
                  {side2.map((p: any) => p.fullName || p.username).join(" & ")}
                </Text>
              </View>
              
              {/* Game rows */}
              {individualMatch.games.map((game: any) => {
                const [side1Score, side2Score] = gamePointsByTeamIndex(
                  game,
                  scoringIds?.[0] ?? null,
                  scoringIds?.[1] ?? null
                );
                const winnerSide = game.winnerSide;

                return (
                  <View key={game.gameNumber} style={modernStyles.gameDataRow}>
                    <Text style={modernStyles.gameDataCell}>{game.gameNumber}</Text>
                    <Text style={[
                      modernStyles.gameDataCell,
                      modernStyles.gameScoreValue,
                      winnerSide === "side1" && modernStyles.winnerScore
                    ]}>
                      {side1Score}
                    </Text>
                    <Text style={[
                      modernStyles.gameDataCell,
                      modernStyles.gameScoreValue,
                      winnerSide === "side2" && modernStyles.winnerScore
                    ]}>
                      {side2Score}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  }

  // Live view
  return (
    <View style={[modernStyles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView style={modernStyles.liveContainer} contentContainerStyle={modernStyles.liveContent}>
        {/* Top header */}
        <View style={modernStyles.header}>
          <View style={modernStyles.headerTop}>
            <View style={modernStyles.matchTypeRow}>
              <Text style={modernStyles.matchType}>
                {individualMatch.matchType?.replaceAll("_", " ").toUpperCase()}
              </Text>
              <View style={modernStyles.liveBadge}>
                <View style={modernStyles.liveDot} />
                <Text style={modernStyles.liveText}>LIVE</Text>
              </View>
            </View>
            <View style={modernStyles.headerInfo}>
              <View style={modernStyles.infoRow}>
                <Ionicons name="location" size={14} color={tokens.colors.text.tertiary} />
                <Text style={modernStyles.headerInfoText}>{individualMatch.city}</Text>
              </View>
              <View style={modernStyles.infoRow}>
                <Ionicons name="time" size={14} color={tokens.colors.text.tertiary} />
                <Text style={modernStyles.headerInfoText}>
                  Game {individualMatch.currentGame} • Best of{" "}
                  {individualMatch.numberOfSets}
                </Text>
              </View>
              <View style={modernStyles.infoRow}>
                <Ionicons name="flag" size={14} color={tokens.colors.text.tertiary} />
                <Text style={modernStyles.headerInfoText}>
                  Started: {formatDate(individualMatch.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main scoreboard */}
        <Card style={modernStyles.scoreboardCard}>
          {/* Players and Scores */}
          <View style={modernStyles.playersScoresLayout}>
            {/* Players Row */}
            <View style={modernStyles.playersRow}>
              {/* Left Side Player - Extreme Left */}
              <View style={modernStyles.leftPlayerSection}>
                <View style={modernStyles.playerInfo}>
                  <Text style={modernStyles.playerName}>
                    {side1.map((p: any) => p.fullName || p.username).join(" & ")}
                  </Text>
                  <View style={modernStyles.avatarsRow}>
                    {side1.map((p: any, i: number) => (
                      <Avatar
                        key={i}
                        src={p.profileImage}
                        alt={p.fullName || p.username}
                        size={40}
                      />
                    ))}
                  </View>
                </View>
              </View>

              {/* Right Side Player - Extreme Right */}
              <View style={modernStyles.rightPlayerSection}>
                <View style={modernStyles.playerInfo}>
                  <Text style={modernStyles.playerName}>
                    {side2.map((p: any) => p.fullName || p.username).join(" & ")}
                  </Text>
                  <View style={modernStyles.avatarsRow}>
                    {side2.map((p: any, i: number) => (
                      <Avatar
                        key={i}
                        src={p.profileImage}
                        alt={p.fullName || p.username}
                        size={40}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Scores Row - Separate Line */}
            <View style={modernStyles.scoresRow}>
              <View style={modernStyles.scoreColumn}>
                <Text style={modernStyles.currentScore}>
                  {currentSide1Points}
                </Text>
                <Text style={modernStyles.scoreLabel}>Points</Text>
              </View>
              <View style={modernStyles.vsContainer}>
                <Text style={modernStyles.vsText}>VS</Text>
              </View>
              <View style={modernStyles.scoreColumn}>
                <Text style={[modernStyles.currentScore, modernStyles.score2]}>
                  {currentSide2Points}
                </Text>
                <Text style={modernStyles.scoreLabel}>Points</Text>
              </View>
            </View>
          </View>

          {/* Sets */}
          <View style={modernStyles.setsDisplay}>
            <View style={modernStyles.setColumn}>
              <Text style={modernStyles.setLabel}>Sets</Text>
              <Text style={modernStyles.setScore}>
                {setsWonSide1}
              </Text>
            </View>
            <View style={modernStyles.setColumn}>
              <Text style={modernStyles.setLabel}>Sets</Text>
              <Text style={[modernStyles.setScore, modernStyles.score2]}>
                {setsWonSide2}
              </Text>
            </View>
          </View>

          {/* Set tracker */}
          <View style={modernStyles.setTracker}>
            <View style={modernStyles.setTrackerRow}>
              {Array.from({ length: individualMatch.numberOfSets }).map(
                (_, idx) => {
                  const setNum = idx + 1;
                  const side1Won =
                    (setsWonSide1 || 0) >= setNum;
                  const side2Won =
                    (setsWonSide2 || 0) >= setNum;
                  const isCurrent =
                    !side1Won &&
                    !side2Won &&
                    setNum === individualMatch.currentGame;

                  return (
                    <View key={idx} style={modernStyles.setIndicator}>
                      <View
                        style={[
                          modernStyles.setCircle,
                          side1Won && modernStyles.setWon1,
                          side2Won && modernStyles.setWon2,
                          isCurrent && modernStyles.setCurrent,
                        ]}
                      >
                        <Text
                          style={[
                            modernStyles.setNumber,
                            (side1Won || side2Won) && modernStyles.setNumberWon,
                            isCurrent && modernStyles.setNumberCurrent,
                          ]}
                        >
                          {setNum}
                        </Text>
                      </View>
                      {isCurrent && (
                        <Text style={modernStyles.setLiveLabel}>Live</Text>
                      )}
                    </View>
                  );
                }
              )}
            </View>
            <Text style={modernStyles.setsToWinText}>
              First to {Math.ceil(individualMatch.numberOfSets / 2)} sets wins
            </Text>
          </View>
        </Card>

        {/* Match summary */}
        <Card style={modernStyles.summaryCard}>
          <Text style={modernStyles.summaryTitle}>Match Summary</Text>
          <Text style={modernStyles.summarySubtitle}>
            {individualMatch.city} • {individualMatch.venue || "Venue N/A"}
          </Text>
          <View style={modernStyles.summaryRow}>
            <View style={modernStyles.summaryItem}>
              <Text style={modernStyles.summaryLabel}>Current Game</Text>
              <Text style={modernStyles.summaryValue}>
                {individualMatch.currentGame}
              </Text>
            </View>
            <View style={modernStyles.liveIndicator}>
              <View style={modernStyles.liveDotSmall} />
              <Text style={modernStyles.liveIndicatorText}>LIVE</Text>
            </View>
          </View>
        </Card>

        {/* Game history */}
        {individualMatch.games?.length > 0 && (
          <Card style={modernStyles.historyCard}>
            <Text style={modernStyles.historyTitle}>Game History</Text>
            <View style={modernStyles.gamesList}>
              {/* Header row */}
              <View style={modernStyles.gameHeaderRow}>
                <Text style={modernStyles.gameHeaderCell}>Game</Text>
                <Text style={modernStyles.gameHeaderCell}>
                  {side1.map((p: any) => p.fullName || p.username).join(" & ")}
                </Text>
                <Text style={modernStyles.gameHeaderCell}>
                  {side2.map((p: any) => p.fullName || p.username).join(" & ")}
                </Text>
              </View>
              
              {/* Game rows */}
              {individualMatch.games.map((game: any) => {
                const [side1Score, side2Score] = gamePointsByTeamIndex(
                  game,
                  scoringIds?.[0] ?? null,
                  scoringIds?.[1] ?? null
                );
                const winnerSide = game.winnerSide;
                const isCurrent =
                  game.gameNumber === individualMatch.currentGame &&
                  !game.winnerSide;

                return (
                  <View key={game.gameNumber} style={[
                    modernStyles.gameDataRow,
                    isCurrent && modernStyles.historyRowCurrent
                  ]}>
                    <Text style={modernStyles.gameDataCell}>
                      {game.gameNumber}
                    </Text>
                    <Text style={[
                      modernStyles.gameDataCell,
                      modernStyles.gameScoreValue,
                      winnerSide === "side1" && modernStyles.winnerScore
                    ]}>
                      {side1Score}
                    </Text>
                    <Text style={[
                      modernStyles.gameDataCell,
                      modernStyles.gameScoreValue,
                      winnerSide === "side2" && modernStyles.winnerScore
                    ]}>
                      {side2Score}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Shot feed */}
        <View style={modernStyles.shotFeedContainer}>
          <ShotFeed
            games={individualMatch.games}
            currentGame={individualMatch.currentGame}
            participants={individualMatch.participants}
            finalScore={individualMatch.finalScore}
            serverConfig={individualMatch.serverConfig ?? undefined}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// Design tokens
const tokens = DesignTokens;

// Modern styles using design tokens
const modernStyles = StyleSheet.create({
  // Safe area
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  loadingIcon: {
    marginBottom: tokens.spacing[2],
  },
  loadingText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.normal,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
  },
  // Completed match
  completedContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  completedContent: {
    padding: tokens.spacing[4],
    paddingTop: tokens.spacing[6],
  },
  completedCard: {
    backgroundColor: tokens.colors.background.tertiary,
    borderColor: tokens.colors.border.light,
    padding: tokens.spacing[6],
    marginBottom: tokens.spacing[4],
    borderRadius: tokens.borderRadius.lg,
    ...tokens.shadows.lg,
  },
  completedHeader: {
    alignItems: 'center',
    gap: tokens.spacing[6],
  },
  trophyContainer: {
    width: 120,
    height: 120,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.warning + '10',
    borderWidth: 2,
    borderColor: tokens.colors.warning + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.extrabold,
    color: tokens.colors.text.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  winnersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[4],
    justifyContent: 'center',
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    backgroundColor: tokens.colors.background.secondary,
    padding: tokens.spacing[4],
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
  },
  winnerInfo: {
    gap: tokens.spacing[1],
  },
  winnerName: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  winnerLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  finalScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[6],
  },
  scoreBox: {
    alignItems: 'center',
  },
  finalScore: {
    fontSize: 64,
    fontWeight: tokens.typography.fontWeight.extrabold,
    color: tokens.colors.success,
    fontVariant: ['tabular-nums'],
  },
  score2: {
    color: tokens.colors.error,
  },
  scoreDivider: {
    fontSize: tokens.typography.fontSize['3xl'],
    color: tokens.colors.text.tertiary,
  },
  matchInfo: {
    gap: tokens.spacing[3],
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  infoText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
  },
  gamesHistoryCard: {
    backgroundColor: tokens.colors.background.tertiary,
    borderColor: tokens.colors.border.light,
    padding: tokens.spacing[5],
    borderRadius: tokens.borderRadius.lg,
    ...tokens.shadows.md,
  },
  gamesHistoryTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing[4],
  },
  gamesList: {
    gap: tokens.spacing[3],
  },
  gameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
  },
  gameNumber: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
  gameScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  gameScore: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },

  // Live match
  liveContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  liveContent: {
    padding: tokens.spacing[4],
    paddingTop: tokens.spacing[6],
  },
  header: {
    marginBottom: tokens.spacing[4],
  },
  headerTop: {
    gap: tokens.spacing[3],
  },
  matchTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  matchType: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    backgroundColor: tokens.colors.status.live,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.borderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.background.primary,
  },
  liveText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.background.primary,
  },
  headerInfo: {
    gap: tokens.spacing[2],
  },
  headerInfoText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  scoreboardCard: {
    backgroundColor: tokens.colors.background.tertiary,
    padding: tokens.spacing[5],
    marginBottom: tokens.spacing[4],
    borderRadius: tokens.borderRadius.md
  },
  // Players and scores layout
  playersScoresLayout: {
    gap: tokens.spacing[4],
    marginBottom: tokens.spacing[4],
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[6],
  },
  leftPlayerSection: {
    flex: 1,
    alignItems: 'flex-start',
    maxWidth: '30%',
  },
  rightPlayerSection: {
    flex: 1,
    alignItems: 'flex-end',
    maxWidth: '30%',
  },
  playerInfo: {
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  playerName: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: tokens.spacing[4],
  },
  avatarsRow: {
    flexDirection: 'row',
    gap: -8,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[6],
    marginVertical: tokens.spacing[5],
  },
  scoreColumn: {
    alignItems: 'center',
  },
  currentScore: {
    fontSize: 64,
    fontWeight: tokens.typography.fontWeight.extrabold,
    color: tokens.colors.success,
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    marginTop: tokens.spacing[2],
  },
  vsText: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.extrabold,
    color: tokens.colors.text.tertiary,
  },
  setsDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacing[6],
  },
  setColumn: {
    gap: tokens.spacing[1],
  },
  setLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  setScore: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.extrabold,
    color: tokens.colors.success,
    fontVariant: ['tabular-nums'],
  },
  setTracker: {
    marginTop: tokens.spacing[5],
    alignItems: 'center',
  },
  setTrackerRow: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  setIndicator: {
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  setCircle: {
    width: 40,
    height: 40,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
  },
  setWon1: {
    backgroundColor: tokens.colors.success,
    borderColor: tokens.colors.success,
  },
  setWon2: {
    backgroundColor: tokens.colors.error,
    borderColor: tokens.colors.error,
  },
  setCurrent: {
    backgroundColor: tokens.colors.primary[600],
    borderColor: tokens.colors.primary[400],
  },
  setNumber: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
  },
  setNumberWon: {
    color: tokens.colors.background.primary,
  },
  setNumberCurrent: {
    color: tokens.colors.background.primary,
  },
  setLiveLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.primary[400],
  },
  setsToWinText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    marginTop: tokens.spacing[3],
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: tokens.colors.background.tertiary,
    padding: tokens.spacing[5],
    marginBottom: tokens.spacing[4],
    borderRadius: tokens.borderRadius.md,
  },
  summaryTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  summarySubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    marginTop: tokens.spacing[2],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing[4],
  },
  summaryItem: {
    gap: tokens.spacing[1],
  },
  summaryLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  summaryValue: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    backgroundColor: tokens.colors.status.live,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.borderRadius.full,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.background.primary,
  },
  liveIndicatorText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.background.primary,
  },
  historyCard: {
    backgroundColor: tokens.colors.background.tertiary,
    padding: tokens.spacing[4],
    marginBottom: tokens.spacing[4],
    borderRadius: tokens.borderRadius.md,
  },
  historyTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing[3],
  },
  historyList: {
    gap: tokens.spacing[2],
  },
  // Game timeline styles
  gameHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.dark,
    paddingBottom: tokens.spacing[3],
    marginBottom: tokens.spacing[3],
  },
  gameHeaderCell: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
  },
  gameDataRow: {
    flexDirection: 'row',
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  gameDataCell: {
    flex: 1,
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.primary,
    textAlign: 'center',
  },
  gameScoreValue: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  winnerScore: {
    color: tokens.colors.success,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
  },
  historyRowCurrent: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[200],
  },
  historyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  historyGameNumber: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
  historyRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  historyScore: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  historyWinner: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  shotFeedContainer: {
    marginBottom: tokens.spacing[6],
  },
});

