import React from "react";
import { Pressable, ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Card,
  Divider,
  Surface,
  Text,
} from "react-native-paper";
import { getSetScores } from "@/lib/match/singlesClient";
import { Avatar } from "@/components/ui/Avatar";
import { DesignTokens } from "@/constants/designTokens"

interface Round {
  roundNumber: number;
  matches: string[];
  groupName?: string;
  groupId?: string;
  roundName?: string;
}

interface Participant {
  _id?: string;
  id?: string;
  username?: string;
  fullName?: string;
  name?: string;
  profileImage?: string;
}

interface TeamInfo {
  _id?: string;
  id?: string;
  name?: string;
}

interface IndividualMatch {
  _id: string;
  id?: string;
  matchType?: "singles" | "doubles";
  teams?: { players?: Participant[] }[];
  participants?: Participant[];
  games?: any[];
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  finalScore?: {
    setsByTeam?: number[];
    setsById?: Map<string, number> | Record<string, number>;
  };
}

interface TeamMatch {
  _id: string;
  id?: string;
  team1?: TeamInfo;
  team2?: TeamInfo;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  finalScore?: {
    team1Matches?: number;
    team2Matches?: number;
    matchesByTeamId?: Map<string, number> | Record<string, number>;
  };
}

type Match = IndividualMatch | TeamMatch;

const DICEBEAR_BG_COLORS = "b6e3f4,c0aede,d1d4f9";
const tokens = DesignTokens;

interface TournamentScheduleProps {
  rounds: Round[];
  matches: Match[];
  onMatchClick?: (id: string) => void;
  showDate?: boolean;
  showTime?: boolean;
  venue?: string;
  isTeamTournament?: boolean;
  /** Fallback when hydrated matches omit `matchType` (e.g. doubles tournament). */
  tournamentMatchType?: "singles" | "doubles";
  format?: "round_robin" | "knockout";
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const isTeamMatch = (match: Match): match is TeamMatch =>
  typeof (match as TeamMatch).team1 !== "undefined" ||
  typeof (match as TeamMatch).team2 !== "undefined";

const getName = (value?: Participant | TeamInfo) => {
  if (!value) return "Participant";
  if ("name" in value && value.name) return value.name;
  if ("fullName" in value && value.fullName) return value.fullName;
  if ("username" in value && value.username) return value.username;
  return "Participant";
};

const isDoublesIndividualMatch = (
  match: Match,
  tournamentMatchType?: "singles" | "doubles",
): boolean => {
  if (isTeamMatch(match)) return false;
  const individual = match as IndividualMatch;
  if (individual.matchType === "doubles") return true;
  if (tournamentMatchType === "doubles") {
    const count = individual.participants?.length ?? 0;
    return count >= 4;
  }
  return false;
};

const formatDoublesSideName = (p0?: Participant, p1?: Participant) =>
  `${getName(p0)} & ${getName(p1)}`;

function DoublesSideAvatars({
  players,
  align = "left",
  size = 20,
}: {
  players: [Participant | undefined, Participant | undefined];
  align?: "left" | "right";
  size?: number;
}) {
  const [p0, p1] = players;
  if (align === "right") {
    return (
      <View style={styles.doublesAvatarRow}>
        <Avatar
          src={getParticipantImage(p0)}
          alt={getName(p0)}
          size={size}
        />
        <View style={styles.avatarOverlapRight}>
          <Avatar
            src={getParticipantImage(p1)}
            alt={getName(p1)}
            size={size}
          />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.doublesAvatarRow}>
      <Avatar
        src={getParticipantImage(p0)}
        alt={getName(p0)}
        size={size}
      />
      <View style={styles.avatarOverlap}>
        <Avatar
          src={getParticipantImage(p1)}
          alt={getName(p1)}
          size={size}
        />
      </View>
    </View>
  );
}

const getStatusLabel = (status?: string) => {
  if (status === "in_progress") return "Live";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Scheduled";
};

const getStatusBadgeStyle = (status?: string) => {
  if (status === "in_progress") {
    return { backgroundColor: "#fee2e2", borderColor: "#fecaca", textColor: "#b91c1c" };
  }
  if (status === "completed") {
    return { backgroundColor: "#dcfce7", borderColor: "#bbf7d0", textColor: "#166534" };
  }
  if (status === "cancelled") {
    return { backgroundColor: "#e2e8f0", borderColor: "#cbd5e1", textColor: "#334155" };
  }
  return { backgroundColor: "#eff6ff", borderColor: "#dbeafe", textColor: "#1d4ed8" };
};

const applyDicebearBackgroundColor = (uri?: string): string | undefined => {
  if (!uri?.trim()) return undefined;
  try {
    const parsed = new URL(uri.trim());
    if (!parsed.hostname.includes("api.dicebear.com")) return uri.trim();
    if (parsed.searchParams.has("backgroundColor")) return uri.trim();
    parsed.searchParams.set("backgroundColor", DICEBEAR_BG_COLORS);
    return parsed.toString();
  } catch {
    return uri.trim();
  }
};

const getParticipantImage = (value?: Participant | TeamInfo): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  if ("profileImage" in value) {
    return applyDicebearBackgroundColor(value.profileImage);
  }
  return undefined;
};

const readMappedScore = (
  value?: Map<string, number> | Record<string, number>,
  key?: string,
) => {
  if (!value || !key) return undefined;
  if (value instanceof Map) return value.get(key);
  return value[key];
};

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const resolveId = (value: any): string | undefined => {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number") {
    const id = String(value);
    return id && id !== "[object Object]" ? id : undefined;
  }
  if (typeof value === "object") {
    if (value.$oid) return String(value.$oid);
    if (typeof value.toHexString === "function") {
      try {
        const hex = value.toHexString();
        if (typeof hex === "string" && hex.length > 0) return hex;
      } catch {
        // continue
      }
    }
    const fromUnderscore = resolveId(value._id);
    if (fromUnderscore) return fromUnderscore;
    const fromId = resolveId(value.id);
    if (fromId) return fromId;
    const data = value?.buffer?.data;
    if (Array.isArray(data) && data.length === 12) {
      try {
        return data
          .map((b: number) => Number(b).toString(16).padStart(2, "0"))
          .join("");
      } catch {
        // continue
      }
    }
  }
  return undefined;
};

const getScore = (match: Match) => {
  if (isTeamMatch(match)) {
    const team1Id = resolveId(match.team1);
    const team2Id = resolveId(match.team2);
    const byId = match.finalScore?.matchesByTeamId;
    const team1ById = readMappedScore(byId, team1Id);
    const team2ById = readMappedScore(byId, team2Id);
    const team1Score =
      toNumberOrUndefined(team1ById) ??
      toNumberOrUndefined(match.finalScore?.team1Matches) ??
      toNumberOrUndefined((match.finalScore as any)?.team1Score) ??
      toNumberOrUndefined((match as any)?.team1Score);
    const team2Score =
      toNumberOrUndefined(team2ById) ??
      toNumberOrUndefined(match.finalScore?.team2Matches) ??
      toNumberOrUndefined((match.finalScore as any)?.team2Score) ??
      toNumberOrUndefined((match as any)?.team2Score);
    if (team1Score == null || team2Score == null) return null;
    return `${team1Score}-${team2Score}`;
  }
  const [side1Score, side2Score] = getSetScores(match as any);
  if (side1Score == null || side2Score == null) return null;
  // Avoid rendering 0-0 for unplayed scheduled rows.
  if (match.status !== "completed" && side1Score === 0 && side2Score === 0) return null;
  return `${side1Score}-${side2Score}`;
};

export default function TournamentSchedule({
  rounds,
  matches,
  onMatchClick,
  showTime = true,
  tournamentMatchType,
  format = "round_robin",
  isLoading = false,
  onRefresh,
  refreshing = false,
}: TournamentScheduleProps) {
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = Math.max(insets.bottom, 12) + 32;

  const getMatchById = (id: string) =>
    matches.find((m) => {
      const matchId = resolveId(m);
      return matchId ? String(matchId) === String(id) : false;
    });

  if (!Array.isArray(rounds) || rounds.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          No schedule available yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: scrollBottomPadding },
      ]}
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled
      removeClippedSubviews={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4f46e5"
            colors={["#4f46e5"]}
          />
        ) : undefined
      }
    >
      {isLoading ? (
        <Surface style={styles.loadingSurface} elevation={0}>
          <Text variant="bodySmall" style={styles.muted}>
            Updating schedule...
          </Text>
        </Surface>
      ) : null}

      {rounds.map((round, index) => {
        const roundMatches = (round.matches || [])
          .map((id) => getMatchById(String(id)))
          .filter(Boolean) as Match[];

        const showGroupHeader =
          !!round.groupName &&
          (index === 0 || rounds[index - 1]?.groupName !== round.groupName);

        return (
          <Surface
            key={`${round.groupId || "main"}-${round.roundNumber}-${index}`}
            style={styles.roundSurface}
            elevation={0}
          >
            {showGroupHeader && (
              <Text variant="titleSmall" style={styles.groupTitle}>
                {round.groupName}
              </Text>
            )}

            <View style={styles.roundHeader}>
              <Text variant="labelLarge" style={styles.roundTitle}>
                {format === "knockout" && round.roundName
                  ? round.roundName
                  : `Round ${round.roundNumber}`}
              </Text>
            </View>

            {roundMatches.length === 0 ? (
              <Card mode="outlined">
                <Card.Content>
                  <Text variant="bodySmall" style={styles.muted}>
                    No matches in this round.
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              roundMatches.map((match, matchIndex) => {
                const isDoubles = isDoublesIndividualMatch(match, tournamentMatchType);
                const participants = !isTeamMatch(match)
                  ? (match as IndividualMatch).participants
                  : undefined;

                const participant1 = isTeamMatch(match)
                  ? match.team1
                  : participants?.[0];
                const participant2 = isTeamMatch(match)
                  ? match.team2
                  : isDoubles
                    ? participants?.[2]
                    : participants?.[1];

                const side1Name = isDoubles
                  ? formatDoublesSideName(participants?.[0], participants?.[1])
                  : getName(participant1);
                const side2Name = isDoubles
                  ? formatDoublesSideName(participants?.[2], participants?.[3])
                  : getName(participant2);

                const participant1Image = getParticipantImage(participant1);
                const participant2Image = getParticipantImage(participant2);

                const score = getScore(match);
                const status = getStatusLabel(match.status);
                const isLive = match.status === "in_progress";
                const isCompleted = match.status === "completed";

                if (__DEV__ && isCompleted && score == null) {
                  
                }

                return (
                  <Pressable
                    key={`${resolveId(match) || matchIndex}-${matchIndex}`}
                    onPress={() => {
                      
                      const matchId = resolveId(match);
                      if (matchId) {
                        
                        onMatchClick?.(String(matchId));
                      }
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                    style={styles.matchPressable}
                    android_ripple={{ color: 'rgba(79, 70, 229, 0.1)', borderless: false }}
                  >
                    <Card mode="contained" style={styles.matchCard}>
                      <Card.Content style={styles.matchContent}>
                        <View style={styles.rowTop}>
                          <View style={styles.rowSide}>
                            {isDoubles ? (
                              <View style={styles.participantInline}>
                                <DoublesSideAvatars
                                  players={[participants?.[0], participants?.[1]]}
                                  align="left"
                                />
                                <Text
                                  variant="bodyMedium"
                                  style={[
                                    styles.nameText,
                                    isCompleted && score?.startsWith("0-")
                                      ? styles.dimText
                                      : undefined,
                                  ]}
                                  numberOfLines={2}
                                >
                                  {side1Name}
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.participantInline}>
                                <Avatar
                                  src={participant1Image}
                                  alt={getName(participant1)}
                                  size={20}
                                />
                                <Text
                                  variant="bodyMedium"
                                  style={[
                                    styles.nameText,
                                    isCompleted && score?.startsWith("0-")
                                      ? styles.dimText
                                      : undefined,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {side1Name}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text variant="bodyMedium" style={styles.scoreText}>
                            {score ?? "vs"}
                          </Text>
                          <View style={styles.rowSide}>
                            {isDoubles ? (
                              <View style={styles.participantInlineRight}>
                                <Text
                                  variant="bodyMedium"
                                  style={[
                                    styles.nameTextRight,
                                    isCompleted && score?.endsWith("-0")
                                      ? styles.dimText
                                      : undefined,
                                  ]}
                                  numberOfLines={2}
                                >
                                  {side2Name}
                                </Text>
                                <DoublesSideAvatars
                                  players={[participants?.[2], participants?.[3]]}
                                  align="right"
                                />
                              </View>
                            ) : (
                              <View style={styles.participantInlineRight}>
                                <Text
                                  variant="bodyMedium"
                                  style={[
                                    styles.nameTextRight,
                                    isCompleted && score?.endsWith("-0")
                                      ? styles.dimText
                                      : undefined,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {side2Name}
                                </Text>
                                <Avatar
                                  src={participant2Image}
                                  alt={getName(participant2)}
                                  size={20}
                                />
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.statusRow}>
                          <View style={styles.statusRight}>
                            {showTime && (match as any).time ? (
                              <Text style={styles.metaText}>{(match as any).time}</Text>
                            ) : null}
                            <View
                              style={[
                                styles.statusBadge,
                                {
                                  backgroundColor: getStatusBadgeStyle(match.status).backgroundColor,
                                  borderColor: getStatusBadgeStyle(match.status).borderColor,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  { color: getStatusBadgeStyle(match.status).textColor },
                                ]}
                              >
                                {status}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  </Pressable>
                );
              })
            )}
          </Surface>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    gap: tokens.spacing[8],
  },
  loadingSurface: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  roundWrap: {
    gap: 8,
  },
  roundSurface: {
    paddingVertical: 6,
    paddingHorizontal: 7,
    backgroundColor: "#ffffff",
    gap: 6,
  },
  groupTitle: {
    color: "#4f46e5",
    fontWeight: "700",
    fontSize: 12,
  },
  roundHeader: {
    paddingVertical: 2,
  },
  roundTitle: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 12,
  },
  matchPressable: {
    marginVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  matchCard: {
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
  },
  matchContent: {
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  row: {
    display: "none",
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowSide: {
    flex: 1,
  },
  participantInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  participantInlineRight: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
  },
  doublesAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarOverlap: {
    marginLeft: -6,
  },
  avatarOverlapRight: {
    marginRight: -6,
  },
  nameText: {
    color: "#1f2937",
    fontWeight: "500",
    fontSize: 12,
    flexShrink: 1,
  },
  nameTextRight: {
    color: "#1f2937",
    textAlign: "right",
    fontWeight: "500",
    fontSize: 12,
    flexShrink: 1,
  },
  scoreText: {
    fontWeight: "700",
    color: "#111827",
    minWidth: 26,
    textAlign: "center",
    fontSize: 12,
  },
  divider: {
    backgroundColor: "#e5e7eb",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 22,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveBadge: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    paddingHorizontal: 6,
    minWidth: 36,
    minHeight: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  liveBadgeText: {
    color: "#b91c1c",
    fontSize: 9,
    fontWeight: "700",
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    minHeight: 18,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  metaText: {
    color: "#64748b",
    fontSize: 9,
  },
  dimText: {
    opacity: 0.55,
  },
  muted: {
    color: "#64748b",
  },
  emptyWrap: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
  },
});
