import { PulsingLiveDot } from "@/components/matches/PulsingLiveDot";
import { useThemeColors } from "@/hooks/useThemeColors";
import { formatTournamentScheduleLabel } from "@/lib/utils";
import { getParticipantDisplayName } from "@/types/tournament.type";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type RefreshControlProps,
} from "react-native";

interface Tournament {
  _id: string;
  name: string;
  format: string;
  category?: string;
  matchType?: string;
  startDate: string;
  endDate?: string;
  city: string;
  venue?: string;
  status: string;
  participants: any[];
  maxParticipants?: number;
  minParticipants?: number;
  organizer?: {
    _id?: string;
    username?: string;
    fullName?: string;
    profileImage?: string;
  } | string;
  allowJoinByCode?: boolean;
  registrationDeadline?: string;
  currentPhase?: string;
  rounds?: Array<{
    roundNumber?: number;
    completed?: boolean;
    matches?: Array<{ completed?: boolean; status?: string; winner?: string }>;
  }>;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
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
  listHeader?: React.ReactNode;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  edgeToEdgeWhenEmpty?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  onScroll?: (event: any) => void;
  bottomInset?: number;
}

function getStatusMeta(status: string) {
  switch (status) {
    case "in_progress":
    case "ongoing":
      return { label: "LIVE", tone: "live" as const };
    case "completed":
      return { label: "COMPLETED", tone: "completed" as const };
    case "upcoming":
      return { label: "UPCOMING", tone: "upcoming" as const };
    case "draft":
      return { label: "DRAFT", tone: "draft" as const };
    case "cancelled":
      return { label: "CANCELLED", tone: "draft" as const };
    default:
      return { label: status?.toUpperCase() || "SCHEDULED", tone: "draft" as const };
  }
}

function getTypeLabel(tournament: Tournament) {
  if (tournament.category === "team") return "Team";
  if (tournament.matchType) {
    return tournament.matchType.charAt(0).toUpperCase() + tournament.matchType.slice(1);
  }
  return "Singles";
}

function getFormatLabel(format: string) {
  if (format === "hybrid") return "Hybrid";
  if (format === "knockout") return "Knockout";
  if (format === "round_robin") return "Round Robin";
  return format.replace(/_/g, " ");
}

function countMatches(tournament: Tournament) {
  let total = 0;
  let completed = 0;
  for (const round of tournament.rounds || []) {
    const matches = round.matches || [];
    total += matches.length;
    for (const m of matches) {
      if (m.completed || m.status === "completed" || m.winner) completed += 1;
    }
  }
  return { total, completed };
}

function getProgressLabel(tournament: Tournament): string | null {
  if (tournament.status !== "in_progress" && tournament.status !== "ongoing") {
    return null;
  }
  const rounds = tournament.rounds || [];
  if (tournament.currentPhase === "knockout") return "Knockout";
  if (tournament.currentPhase === "round_robin") return "Round robin";
  if (rounds.length > 0) {
    const active =
      rounds.find((r) => !r.completed) || rounds[rounds.length - 1];
    const num = active?.roundNumber ?? rounds.length;
    return `R${num}/${rounds.length}`;
  }
  const { total, completed } = countMatches(tournament);
  if (total > 0) return `${completed}/${total} matches`;
  return null;
}

export default function TournamentList({
  tournaments,
  onEndReached,
  ListFooterComponent,
  listHeader,
  ListEmptyComponent,
  edgeToEdgeWhenEmpty = false,
  refreshControl,
  onScroll,
  bottomInset = 0,
}: TournamentListProps) {
  const router = useRouter();
  const theme = useThemeColors();
  const data = tournaments ?? [];
  const edgeToEdge = edgeToEdgeWhenEmpty && data.length === 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        listFrame: {
          flex: 1,
          backgroundColor: theme.colors.background.tertiary,
        },
        list: {
          flex: 1,
          backgroundColor: theme.colors.background.tertiary,
        },
        listContent: {
          backgroundColor: theme.colors.background.tertiary,
        },
        listContentWithData: {
          paddingBottom: 16,
        },
        listContentEmpty: {
          flexGrow: 1,
          paddingHorizontal: 0,
        },
        listContentEmptyEdgeToEdge: {
          width: "100%",
          alignItems: "stretch",
        },
        listHeaderBleed: {
          marginBottom: theme.spacing[1],
        },
        listHeaderFlush: {
          marginHorizontal: 0,
        },
        cardContainer: {
          backgroundColor: theme.colors.background.primary,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.light,
        },
        cardLive: {
          backgroundColor: "rgba(239, 68, 68, 0.03)",
        },
        cardInner: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
          gap: theme.spacing[3],
          minHeight: 72,
        },
        logo: {
          width: 52,
          height: 52,
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.background.secondary,
        },
        logoFallback: {
          width: 52,
          height: 52,
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.background.secondary,
          alignItems: "center",
          justifyContent: "center",
        },
        body: {
          flex: 1,
          minWidth: 0,
          gap: 3,
        },
        titleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
        },
        tournamentName: {
          flex: 1,
          minWidth: 0,
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        statusBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 7,
          paddingVertical: 3,
          borderRadius: theme.borderRadius.full,
          borderWidth: 1,
          flexShrink: 0,
        },
        statusBadgeLive: {
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderColor: "rgba(239, 68, 68, 0.28)",
        },
        statusBadgeCompleted: {
          backgroundColor: "rgba(5, 150, 105, 0.1)",
          borderColor: "rgba(5, 150, 105, 0.28)",
        },
        statusBadgeUpcoming: {
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          borderColor: "rgba(37, 99, 235, 0.28)",
        },
        statusBadgeDraft: {
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.medium,
        },
        statusBadgeText: {
          fontSize: 10,
          fontWeight: theme.typography.fontWeight.bold,
          letterSpacing: 0.4,
        },
        metaLine: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.tertiary,
        },
        metaSecondary: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.tertiary,
        },
        winnerLine: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.status.completed,
        },
        chevron: {
          marginLeft: 2,
        },
      }),
    [theme],
  );

  const animatedValues = React.useRef<Record<string, Animated.Value>>({}).current;
  const animationRefs = React.useRef<Record<string, Animated.CompositeAnimation>>({}).current;

  const getWinnerName = (tournament: Tournament) => {
    if (tournament.status !== "completed") return null;

    if (tournament.knockoutStatistics?.outcome?.champion?.participantName) {
      return tournament.knockoutStatistics.outcome.champion.participantName;
    }

    if (
      (tournament.format === "knockout" || tournament.format === "hybrid") &&
      tournament.bracket
    ) {
      if (
        tournament.bracket.completed &&
        tournament.bracket.rounds &&
        tournament.bracket.rounds.length > 0
      ) {
        const finalRound = tournament.bracket.rounds[tournament.bracket.rounds.length - 1];
        if (finalRound.matches && finalRound.matches.length > 0) {
          const finalMatch = finalRound.matches[0];
          if (finalMatch.winner) {
            const winnerId = finalMatch.winner.toString();
            const winnerParticipant = tournament.participants.find((p: any) => {
              const pId = p._id?.toString() || p.toString();
              return pId === winnerId;
            });
            if (winnerParticipant) return getParticipantDisplayName(winnerParticipant);
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

    if (tournament.standings && tournament.standings.length > 0) {
      const winner = tournament.standings.find((s) => s.rank === 1);
      if (winner?.participant) return getParticipantDisplayName(winner.participant);
    }

    return null;
  };

  const renderTournament = ({ item: tournament }: { item: Tournament; index: number }) => {
    const isLive = tournament.status === "in_progress" || tournament.status === "ongoing";
    const statusMeta = getStatusMeta(tournament.status);
    const winnerName = getWinnerName(tournament);
    const progress = getProgressLabel(tournament);
    const { total: matchTotal, completed: matchCompleted } = countMatches(tournament);
    const playerCount = tournament.participants?.length || 0;
    const scheduleLabel = formatTournamentScheduleLabel(tournament.startDate, {
      endRaw: tournament.endDate,
      status: tournament.status,
    });
    const location = tournament.city?.trim() || tournament.venue?.trim() || null;
    const logoUri = tournament.customBranding?.logo;

    const metaParts = [
      location,
      scheduleLabel,
    ].filter(Boolean);

    const detailParts = [
      getTypeLabel(tournament),
      getFormatLabel(tournament.format),
      playerCount > 0 ? `${playerCount} players` : null,
      matchTotal > 0 ? `${matchCompleted}/${matchTotal} matches` : null,
      progress,
    ].filter(Boolean);

    if (!animatedValues[tournament._id]) {
      animatedValues[tournament._id] = new Animated.Value(1);
    }
    const scaleAnim = animatedValues[tournament._id];

    const statusBadgeStyle =
      statusMeta.tone === "live"
        ? styles.statusBadgeLive
        : statusMeta.tone === "completed"
          ? styles.statusBadgeCompleted
          : statusMeta.tone === "upcoming"
            ? styles.statusBadgeUpcoming
            : styles.statusBadgeDraft;

    const statusColor =
      statusMeta.tone === "live"
        ? theme.colors.status.live
        : statusMeta.tone === "completed"
          ? theme.colors.status.completed
          : statusMeta.tone === "upcoming"
            ? theme.colors.status.scheduled
            : theme.colors.text.tertiary;

    return (
      <View style={styles.cardContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={() => router.push(`/tournaments/${tournament._id}`)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${tournament.name}, ${statusMeta.label}`}
            onPressIn={() => {
              if (animationRefs[tournament._id]) animationRefs[tournament._id].stop();
              animationRefs[tournament._id] = Animated.spring(scaleAnim, {
                toValue: 0.98,
                useNativeDriver: true,
                tension: 120,
                friction: 10,
              });
              animationRefs[tournament._id].start();
            }}
            onPressOut={() => {
              if (animationRefs[tournament._id]) animationRefs[tournament._id].stop();
              animationRefs[tournament._id] = Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 120,
                friction: 10,
              });
              animationRefs[tournament._id].start();
            }}
          >
            <View style={[styles.cardInner, isLive ? styles.cardLive : undefined]}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logo} contentFit="cover" />
              ) : (
                <View style={styles.logoFallback}>
                  <Ionicons name="trophy" size={22} color={theme.colors.text.tertiary} />
                </View>
              )}

              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text style={styles.tournamentName} numberOfLines={1} ellipsizeMode="tail">
                    {tournament.name}
                  </Text>
                  <View style={[styles.statusBadge, statusBadgeStyle]}>
                    {isLive ? <PulsingLiveDot size={5} /> : null}
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                      {statusMeta.label}
                    </Text>
                  </View>
                </View>

                {metaParts.length > 0 ? (
                  <Text style={styles.metaLine} numberOfLines={1}>
                    {metaParts.join("  ·  ")}
                  </Text>
                ) : null}

                {detailParts.length > 0 ? (
                  <Text style={styles.metaSecondary} numberOfLines={1}>
                    {detailParts.join("  ·  ")}
                  </Text>
                ) : null}

                {winnerName ? (
                  <Text style={styles.winnerLine} numberOfLines={1}>
                    Winner · {winnerName}
                  </Text>
                ) : null}
              </View>

              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.text.tertiary}
                style={styles.chevron}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const headerNode = listHeader ? (
    <View style={edgeToEdge ? styles.listHeaderFlush : styles.listHeaderBleed}>
      {listHeader}
    </View>
  ) : null;

  return (
    <View style={styles.listFrame}>
      <FlatList
        data={data}
        renderItem={renderTournament}
        keyExtractor={(item) => item._id}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={headerNode}
        ListEmptyComponent={ListEmptyComponent ?? undefined}
        ListFooterComponent={ListFooterComponent}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          data.length > 0 && styles.listContentWithData,
          data.length === 0 && styles.listContentEmpty,
          edgeToEdge && styles.listContentEmptyEdgeToEdge,
          bottomInset > 0 && { paddingBottom: bottomInset },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.list}
      />
    </View>
  );
}
