import { useEffect, useMemo, useState } from "react";

import { Shot } from "@/types/shot.type";

import { Participant, InitialServerConfig } from "@/types/match.type";

import { Ionicons } from "@expo/vector-icons";

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  generateFullCommentary,
  generateShortCommentary,
} from "@/lib/shot-commentary-utils";
import { DesignTokens } from "@/constants/designTokens";

interface ShotFeedProps {
  games: {
    gameNumber: number;

    shots: Shot[];

    side1Score?: number;

    side2Score?: number;

    winnerSide?: string | null;
  }[];

  currentGame: number;

  participants: Participant[];

  finalScore?: {
    side1Sets?: number;
    side2Sets?: number;
    setsByTeam?: number[];
    setsById?: Record<string, number>;
  };

  serverConfig?: InitialServerConfig | null;

  /** When set, overrides the default of expanding only the current game. */
  defaultExpandedGames?: number[];

  /** Hide the "In progress" label on the active game (e.g. completed match stats). */
  showInProgressIndicator?: boolean;

  /** Reduced chrome when nested inside another section (e.g. stats breakdown). */
  embedded?: boolean;
}

const tokens = DesignTokens;

function formatShotType(stroke?: string | null) {
  if (!stroke) return "—";

  return stroke

    .split("_")

    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))

    .join(" ");
}

const getParticipantName = (p: Participant | string): string => {
  if (typeof p === "string") return p;

  return p.fullName || p.username || "Unknown";
};

const GAME_SCORE_PATTERN = /^\d+[–\-]\d+$/;
const WINS_THE_POINT_PATTERN = /^\s+wins the point/i;

type CommentarySegment = { type: "text" | "score" | "winner"; value: string };

function parseCommentarySegments(html: string): CommentarySegment[] {
  const segments: CommentarySegment[] = [];
  const re = /<strong>(.*?)<\/strong>|([^<]+)/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    const strongContent = match[1];
    const plainContent = match[2];

    if (strongContent !== undefined) {
      const afterStrong = html.slice(match.index + match[0].length);
      let type: CommentarySegment["type"] = "text";

      if (GAME_SCORE_PATTERN.test(strongContent.trim())) {
        type = "score";
      } else if (WINS_THE_POINT_PATTERN.test(afterStrong)) {
        type = "winner";
      }

      segments.push({ type, value: strongContent });
      continue;
    }

    if (!plainContent) continue;

    const parts = plainContent.split(/(\d+[–\-]\d+)/);
    for (const part of parts) {
      if (!part) continue;
      segments.push({
        type: GAME_SCORE_PATTERN.test(part.trim()) ? "score" : "text",
        value: part,
      });
    }
  }

  return segments;
}

function CommentaryText({ html }: { html: string }) {
  const segments = parseCommentarySegments(html);

  return (
    <Text style={styles.commentaryText}>
      {segments.map((segment, index) =>
        segment.type === "score" ? (
          <Text key={index} style={styles.commentaryScore}>
            {segment.value}
          </Text>
        ) : segment.type === "winner" ? (
          <Text key={index} style={styles.commentaryWinner}>
            {segment.value}
          </Text>
        ) : (
          <Text key={index}>{segment.value}</Text>
        )
      )}
    </Text>
  );
}

export default function ShotFeed({
  games,

  currentGame,

  participants,

  finalScore,

  serverConfig,

  defaultExpandedGames,

  showInProgressIndicator = true,

  embedded = false,
}: ShotFeedProps) {
  // Use props directly for consistency with web version

  // This ensures updates are properly tracked through React re-renders

  const latestGames = games;

  const latestCurrentGame = currentGame;

  const latestParticipants = participants;

  const latestFinalScore = finalScore
    ? {
        side1Sets:
          finalScore.side1Sets ??
          finalScore.setsByTeam?.[0] ??
          0,
        side2Sets:
          finalScore.side2Sets ??
          finalScore.setsByTeam?.[1] ??
          0,
      }
    : undefined;

  const latestServerConfig = serverConfig;

  // Derive side names from participants

  // For doubles (4 participants): Side 1 = [0,1], Side 2 = [2,3]

  // For singles (2 participants): Side 1 = [0], Side 2 = [1]

  const isDoubles = latestParticipants.length === 4;

  const side1Name = isDoubles
    ? latestParticipants.length >= 2
      ? `${getParticipantName(latestParticipants[0])} & ${getParticipantName(
          latestParticipants[1]
        )}`
      : "Side 1"
    : latestParticipants.length > 0
    ? getParticipantName(latestParticipants[0])
    : "Player 1";

  const side2Name = isDoubles
    ? latestParticipants.length >= 4
      ? `${getParticipantName(latestParticipants[2])} & ${getParticipantName(
          latestParticipants[3]
        )}`
      : "Side 2"
    : latestParticipants.length > 1
    ? getParticipantName(latestParticipants[1])
    : "Player 2";

  const [expandedGames, setExpandedGames] = useState<number[]>(
    defaultExpandedGames ?? [latestCurrentGame]
  );

  // Active game on top; completed games below (newest first).
  const displayGames = useMemo(
    () =>
      [...latestGames].sort((a, b) => {
        if (a.gameNumber === latestCurrentGame) return -1;
        if (b.gameNumber === latestCurrentGame) return 1;
        return b.gameNumber - a.gameNumber;
      }),
    [latestGames, latestCurrentGame]
  );

  // Live scoring: when a new game starts, expand it and collapse prior games.
  useEffect(() => {
    if (defaultExpandedGames !== undefined) return;
    setExpandedGames([latestCurrentGame]);
  }, [latestCurrentGame, defaultExpandedGames]);

  const side1Ids = new Set(
    (isDoubles
      ? [latestParticipants?.[0], latestParticipants?.[1]]
      : [latestParticipants?.[0]]
    )

      .map((p) => (typeof p === "string" ? p : p?._id?.toString()))

      .filter(Boolean) as string[]
  );

  const side2Ids = new Set(
    (isDoubles
      ? [latestParticipants?.[2], latestParticipants?.[3]]
      : [latestParticipants?.[1]]
    )

      .map((p) => (typeof p === "string" ? p : p?._id?.toString()))

      .filter(Boolean) as string[]
  );

  const resolveShotSide = (shot: Shot): "side1" | "side2" | null => {
    const scorerId =
      (typeof shot.side === "string" ? shot.side : "") ||
      (typeof shot.player === "string"
        ? shot.player
        : shot.player?._id?.toString() || "");

    if (!scorerId) return null;

    if (side1Ids.has(scorerId)) return "side1";

    if (side2Ids.has(scorerId)) return "side2";

    // Handle team1/team2 by mapping them to side1/side2

    if (["side1", "team1"].includes(shot.side)) return "side1";

    if (["side2", "team2"].includes(shot.side)) return "side2";

    return null;
  };

  const resolveGameWinnerSide = (
    game: (typeof games)[number]
  ): "side1" | "side2" | null => {
    // Check for winnerTeamIndex first (from web version)

    if (typeof (game as any).winnerTeamIndex === "number") {
      return (game as any).winnerTeamIndex === 0 ? "side1" : "side2";
    }

    // Check for winnerPlayerId

    const winnerId = (game as any).winnerPlayerId || game.winnerSide;

    if (!winnerId) return null;

    if (side1Ids.has(String(winnerId))) return "side1";

    if (side2Ids.has(String(winnerId))) return "side2";

    return null;
  };

  const toggleGame = (gameNumber: number) => {
    setExpandedGames((prev) =>
      prev.includes(gameNumber)
        ? prev.filter((g) => g !== gameNumber)
        : [...prev, gameNumber]
    );
  };

  if (!latestGames?.length) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.noShotsDot} />

        <Text style={styles.emptyText}>No shots recorded yet</Text>

        <Text style={styles.emptySubtext}>
          Start tracking to see your shot feed here.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, embedded && styles.containerEmbedded]}>
      {!embedded && (
        <View style={styles.header}>
          <Text style={styles.title}>Shot Feed</Text>
        </View>
      )}

      {displayGames.map((game: any) => {
        const isExpanded = expandedGames.includes(game.gameNumber);

        const shotsRaw = game.shots || [];
        // Defensive: same shot can appear twice if socket + API state get out of sync; dedupe by id / shotNumber.
        const seenShotKeys = new Set<string>();
        const shots = shotsRaw.filter((s: any) => {
          const id = s?._id != null ? String(s._id) : "";
          if (id) {
            const k = `id:${id}`;
            if (seenShotKeys.has(k)) return false;
            seenShotKeys.add(k);
            return true;
          }
          const n = s?.shotNumber != null ? Number(s.shotNumber) : NaN;
          const ts = s?.timestamp != null ? String(s.timestamp) : "";
          const k = `noid:${Number.isFinite(n) ? n : "x"}:${ts}`;
          if (seenShotKeys.has(k)) return false;
          seenShotKeys.add(k);
          return true;
        });

        const isCurrentGame = game.gameNumber === latestCurrentGame;

        return (
          <View key={game.gameNumber} style={styles.gameCard}>
            {/* Game Header */}

            <TouchableOpacity
              onPress={() => toggleGame(game.gameNumber)}
              style={[
                styles.gameHeader,

                isCurrentGame && styles.currentGameHeader,
              ]}
            >
              <Text
                style={[
                  styles.gameHeaderText,
                  isCurrentGame && styles.currentGameText,
                ]}
              >
                Game {game.gameNumber}
                {showInProgressIndicator && isCurrentGame && (
                  <Text style={styles.inProgressText}> (In progress)</Text>
                )}
              </Text>

              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={isCurrentGame ? "#16a34a" : "#6b7280"}
              />
            </TouchableOpacity>

            {/* Game Shots */}

            {isExpanded && (
              <View style={styles.shotsList}>
                {shots.length ? (
                  [...shots].reverse().map((shot, i) => {
                    // Calculate game score at the time of this shot

                    // Since array is reversed, calculate the original index

                    const originalIndex = shots.length - 1 - i;

                    let gameScoreSide1 = 0;

                    let gameScoreSide2 = 0;

                    for (let j = 0; j <= originalIndex; j++) {
                      const shotSide = resolveShotSide(shots[j]);

                      if (shotSide === "side1") {
                        gameScoreSide1++;
                      } else if (shotSide === "side2") {
                        gameScoreSide2++;
                      }
                    }

                    const currentGameScore = {
                      side1Score: gameScoreSide1,

                      side2Score: gameScoreSide2,
                    };

                    // Calculate set score at the time of this shot

                    let setsWonSide1 = 0;

                    let setsWonSide2 = 0;

                    for (let j = 0; j < games.length; j++) {
                      const g = games[j];

                      const winnerSide = resolveGameWinnerSide(g);

                      if (
                        g.gameNumber < game.gameNumber &&
                        winnerSide === "side1"
                      ) {
                        setsWonSide1++;
                      } else if (
                        g.gameNumber < game.gameNumber &&
                        winnerSide === "side2"
                      ) {
                        setsWonSide2++;
                      }
                    }

                    const currentSetScore = latestFinalScore || {
                      side1Sets: setsWonSide1,

                      side2Sets: setsWonSide2,
                    };

                    const normalizedShot = {
                      ...shot,

                      side: (resolveShotSide(shot) ||
                        shot.side) as Shot["side"],
                    };

                    // Generate commentary

                    let commentary: string | null = null;

                    if (latestParticipants?.length) {
                      commentary = generateFullCommentary(
                        normalizedShot,

                        latestParticipants,

                        latestGames,

                        currentSetScore,

                        side1Name,

                        side2Name,

                        currentGameScore,

                        latestServerConfig,

                        game.gameNumber
                      );
                    } else {
                      commentary = generateShortCommentary(normalizedShot);
                    }

                    const isSide1 = resolveShotSide(shot) === "side1";

                    const shotKey =
                      shot._id != null && String(shot._id)
                        ? String(shot._id)
                        : `g${game.gameNumber}-i${originalIndex}`;

                    return (
                      <View
                        key={`${game.gameNumber}-${shotKey}-${i}`}
                        style={styles.shotItem}
                      >
                        <Text style={styles.shotNumber}>
                          {shots.length - i}.
                        </Text>

                        <View
                          style={[
                            styles.shotAccent,

                            isSide1 ? styles.side1Accent : styles.side2Accent,
                          ]}
                        />

                        <View style={styles.shotTextContainer}>
                          {commentary ? (
                            <CommentaryText html={commentary} />
                          ) : (
                            <Text style={styles.shotText}>
                              No commentary available
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.noShots}>
                    <View style={styles.noShotsDot} />

                    <Text style={styles.noShotsText}>
                      No shots recorded yet...
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
  },

  containerEmbedded: {
    padding: 0,
    gap: tokens.spacing[2],
  },

  header: {
    
  },

  title: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: tokens.spacing[6],
  },

  emptyContainer: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  emptySubtext: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  gameCard: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.primary,
  },

  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.primary,
  },

  currentGameHeader: {
    backgroundColor: tokens.colors.info + '10',
  },

  gameHeaderText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  currentGameText: {
    color: tokens.colors.text.primary,
  },

  inProgressText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  shotsList: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.secondary,
  },

  shotItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.spacing[4],
    padding: tokens.spacing[4],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.primary,
  },

  shotAccent: {
    width: tokens.spacing[2],
    height: "100%",
    minHeight: tokens.spacing[10],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.tertiary,
  },

  side1Accent: {
    backgroundColor: tokens.colors.background.tertiary,
  },

  side2Accent: {
    backgroundColor: tokens.colors.background.tertiary,
  },

  shotNumber: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  shotTextContainer: {
    flex: 1,
    padding: tokens.spacing[4],
  },

  shotText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: tokens.spacing[6],
  },

  commentaryText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  commentaryScore: {
    color: tokens.colors.info,
    fontWeight: tokens.typography.fontWeight.semibold,
  },

  commentaryWinner: {
    color: tokens.colors.success,
  },

  playerName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: tokens.spacing[6],
  },

  shotType: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: tokens.spacing[6],
  },

  side1ShotType: {
    color: tokens.colors.text.secondary,
  },

  side2ShotType: {
    color: tokens.colors.text.secondary,
  },

  shotDetails: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.background.primary,
  },

  noShots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.primary,
  },

  noShotsDot: {
    width: tokens.spacing[6],
    height: tokens.spacing[6],
    borderRadius: tokens.borderRadius.full,
    backgroundColor: '#F26A21',
    ...tokens.shadows.sm,
  },

  noShotsText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});