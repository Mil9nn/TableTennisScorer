import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatDateShort } from "@/lib/utils";
import { getParticipantDisplayName } from "@/types/tournament.type";
import { DesignTokens } from "@/constants/designTokens";

interface Tournament {
  _id: string;
  name: string;
  format: string;
  category?: string;
  matchType?: string;
  startDate: string;
  city: string;
  venue?: string;
  status: string;
  participants: any[];
  maxParticipants?: number;
  standings?: Array<{
    participant: any;
    rank: number;
  }>;
  bracket?: {
    completed?: boolean;
    rounds?: Array<{
      roundNumber: number;
      matches?: Array<{
        participant1?: any;
        participant2?: any;
        winner?: string;
      }>;
    }>;
  };
  knockoutStatistics?: {
    outcome?: {
      champion?: {
        participantId: string;
        participantName: string;
      };
    };
  };
}

interface TournamentListProps {
  tournaments: Tournament[];
  onEndReached?: () => void;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  /** Renders above rows; scrolls with the list (same pattern as `MatchesList`). */
  listHeader?: React.ReactNode;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  /** When list is empty, drop outer inset so skeleton / full-bleed empty UI spans screen width. */
  edgeToEdgeWhenEmpty?: boolean;
}

const tokens = DesignTokens;

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    completed: "Completed",
    in_progress: "Live",
    ongoing: "Live",
    upcoming: "Upcoming",
    draft: "Draft",
    cancelled: "Cancelled",
  };
  return labels[status] || "Scheduled";
}

function getStatusColor(status: string) {
  switch (status) {
    case "in_progress":
    case "ongoing":
      return tokens.colors.status.live;
    case "completed":
      return tokens.colors.status.completed;
    case "upcoming":
      return tokens.colors.status.scheduled;
    case "draft":
      return tokens.colors.status.tbd;
    default:
      return tokens.colors.status.tbd;
  }
}

export default function TournamentList({
  tournaments,
  onEndReached,
  ListFooterComponent,
  listHeader,
  ListEmptyComponent,
  edgeToEdgeWhenEmpty = false,
}: TournamentListProps) {
  const router = useRouter();
  const data = tournaments ?? [];
  const edgeToEdge = edgeToEdgeWhenEmpty && data.length === 0;
  
  // Animation refs for spring effect
  const animatedValues = React.useRef<Record<string, Animated.Value>>({}).current;
  const animationRefs = React.useRef<Record<string, Animated.CompositeAnimation>>({}).current;

  const getTournamentTypeLabel = (tournament: Tournament) => {
    if (tournament.category === "team") {
      return "Team";
    }
    if (tournament.matchType) {
      return tournament.matchType.charAt(0).toUpperCase() + tournament.matchType.slice(1);
    }
    return "Singles";
  };

  const getWinnerName = (tournament: Tournament) => {
    if (tournament.status !== "completed") {
      return null;
    }

    if (tournament.knockoutStatistics?.outcome?.champion?.participantName) {
      return tournament.knockoutStatistics.outcome.champion.participantName;
    }

    if ((tournament.format === "knockout" || tournament.format === "hybrid") && tournament.bracket) {
      if (tournament.bracket.completed && tournament.bracket.rounds && tournament.bracket.rounds.length > 0) {
        const finalRound = tournament.bracket.rounds[tournament.bracket.rounds.length - 1];
        if (finalRound.matches && finalRound.matches.length > 0) {
          const finalMatch = finalRound.matches[0];
          if (finalMatch.winner) {
            const winnerId = finalMatch.winner.toString();
            const winnerParticipant = tournament.participants.find((p: any) => {
              const pId = p._id?.toString() || p.toString();
              return pId === winnerId;
            });
            if (winnerParticipant) {
              return getParticipantDisplayName(winnerParticipant);
            }
            if (finalMatch.participant1 && finalMatch.participant1.toString() === winnerId) {
              return getParticipantDisplayName(finalMatch.participant1);
            }
            if (finalMatch.participant2 && finalMatch.participant2.toString() === winnerId) {
              return getParticipantDisplayName(finalMatch.participant2);
            }
          }
        }
      }
    }

    if (tournament.format === "round_robin" && tournament.standings && tournament.standings.length > 0) {
      const winner = tournament.standings.find((s) => s.rank === 1);
      if (winner && winner.participant) {
        return getParticipantDisplayName(winner.participant);
      }
    }

    if (tournament.standings && tournament.standings.length > 0) {
      const winner = tournament.standings.find((s) => s.rank === 1);
      if (winner && winner.participant) {
        return getParticipantDisplayName(winner.participant);
      }
    }

    return null;
  };

  const renderTournament = ({ item: tournament, index }: { item: Tournament; index: number }) => {
    const statusLabel = getStatusLabel(tournament.status);
    const formatLabel = tournament.format === "hybrid"
      ? "Hybrid"
      : tournament.format.replace(/_/g, " ");
    const tournamentTypeLabel = getTournamentTypeLabel(tournament);
    const statusColor = getStatusColor(tournament.status);
    const winnerName = getWinnerName(tournament);
    
    // Initialize animated value for this tournament if not exists
    if (!animatedValues[tournament._id]) {
      animatedValues[tournament._id] = new Animated.Value(1);
    }
    const scaleAnim = animatedValues[tournament._id];

    const playersLabel = `${tournament.participants?.length || 0}${
      tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ""
    } players`;

    const cityTrim = tournament.city?.trim();
    const venueTrim = tournament.venue?.trim();

    return (
      <View style={styles.cardContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={() => router.push(`/tournaments/${tournament._id}`)}
            style={styles.tournamentItem}
            activeOpacity={0.8}
            onPressIn={() => {
              // Stop any existing animation for this tournament
              if (animationRefs[tournament._id]) {
                animationRefs[tournament._id].stop();
              }
              
              animationRefs[tournament._id] = Animated.spring(scaleAnim, {
                toValue: 0.85,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
              });
              animationRefs[tournament._id].start();
            }}
            onPressOut={() => {
              // Stop any existing animation for this tournament
              if (animationRefs[tournament._id]) {
                animationRefs[tournament._id].stop();
              }
              
              animationRefs[tournament._id] = Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
              });
              animationRefs[tournament._id].start();
            }}
          >
        <View
          className="p-4"
          style={{
            backgroundColor: tokens.colors.background.primary,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderTopWidth: index === 0 ? 1 : 0,
            borderColor: tokens.colors.border.light,
          }}
        >
          {/* Line 1: Name + status (ends aligned like a live badge) */}
          <View className="flex-row items-center justify-between gap-2">
            <Text
              className="text-sm font-medium text-gray-800 flex-1 min-w-0"
              numberOfLines={1}
            >
              {tournament.name}
            </Text>
            <Text
              className="text-xs font-semibold capitalize shrink-0"
              style={{ color: statusColor }}
            >
              {statusLabel}
            </Text>
          </View>

          {/* Line 2: Singles • Round Robin • 8 players (inline, wraps naturally) */}
          <View className="flex-row flex-wrap items-center gap-1 mt-3">
            <Text className="text-xs text-gray-400 capitalize">
              {tournamentTypeLabel}
            </Text>
            <Text className="text-xs text-gray-400">•</Text>
            <Text className="text-xs text-gray-400 capitalize">
              {formatLabel}
            </Text>
            <Text className="text-xs text-gray-400">•</Text>
            <Text className="text-xs text-gray-400" numberOfLines={1}>
              {playersLabel}
            </Text>
            {winnerName ? (
              <>
                <Text className="text-xs text-gray-400">•</Text>
                <Text className="text-xs font-semibold" style={{ color: tokens.colors.status.completed }} numberOfLines={1}>
                  Winner: {winnerName}
                </Text>
              </>
            ) : null}
          </View>

          {/* Line 3: Date • city • venue */}
          <View className="flex-row flex-wrap items-center gap-1 mt-2">
            <Text className="text-xs text-gray-400">
              {formatDateShort(tournament.startDate)}
            </Text>
            {cityTrim ? (
              <>
                <Text className="text-xs text-gray-400">•</Text>
                <Text className="text-xs text-gray-400" numberOfLines={1}>
                  {cityTrim}
                </Text>
              </>
            ) : null}
            {venueTrim ? (
              <>
                <Text className="text-xs text-gray-400">•</Text>
                <Text
                  className="text-xs text-gray-400 min-w-0"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ flexShrink: 1 }}
                >
                  {venueTrim}
                </Text>
              </>
            ) : null}
          </View>
        </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const headerNode = listHeader ? (
    <View style={edgeToEdge ? styles.listHeaderFlush : styles.listHeaderBleed}>{listHeader}</View>
  ) : null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.colors.background.secondary,
      }}
    >
      <FlatList
        data={data}
        renderItem={renderTournament}
        keyExtractor={(item) => item._id}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={headerNode}
        ListEmptyComponent={ListEmptyComponent ?? undefined}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          data.length > 0 && styles.listContentWithData,
          data.length === 0 && styles.listContentEmpty,
          edgeToEdge && styles.listContentEmptyEdgeToEdge,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: tokens.colors.background.tertiary,
  },
  tournamentItem: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  listContent: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[2],
    backgroundColor: tokens.colors.background.tertiary,
  },
  listContentWithData: {
    paddingBottom: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listContentEmptyEdgeToEdge: {
    width: "100%",
    alignItems: "stretch",
  },
  listHeaderBleed: {
    marginHorizontal: -4,
    marginTop: -4,
    marginBottom: 4,
  },
  listHeaderFlush: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
});
