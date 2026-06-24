import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { DataTable, Surface, Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import {
  getParticipantDisplayName,
  getParticipantImage,
  isUserParticipant,
} from "@/types/tournament.type";
import { DesignTokens } from "@/constants/designTokens";
import { Avatar } from "@/components/ui/Avatar";
import { getInitials } from "@/lib/utils";

interface StandingRow {
  rank?: number;
  played?: number;
  won?: number;
  lost?: number;
  setsWon?: number;
  setsLost?: number;
  setsDiff?: number;
  pointsDiff?: number;
  pointsScored?: number;
  drawn?: number;
  points?: number;
  form?: string[];
  subMatchesWon?: number;
  subMatchesLost?: number;
  playerStats?: Array<{
    player: {
      _id: string;
      username?: string;
      fullName?: string;
      profileImage?: string;
    };
    subMatchesWon?: number;
    subMatchesPlayed?: number;
    winRate?: number;
  }>;
  /** Populated object, or sometimes a string id from API */
  participant?: {
    _id?: string;
    username?: string;
    fullName?: string;
    name?: string;
    profileImage?: string;
    logo?: string;
    city?: string;
    players?: unknown[];
    isPair?: boolean;
    player1?: { username?: string; fullName?: string; profileImage?: string };
    player2?: { username?: string; fullName?: string; profileImage?: string };
  } | string;
  participantName?: string;
  playerName?: string;
  teamName?: string;
  fullName?: string;
  name?: string;
  username?: string;
  participantDetails?: {
    fullName?: string;
    name?: string;
    username?: string;
  };
  participantInfo?: {
    fullName?: string;
    name?: string;
    username?: string;
  };
  participantId?: string;
}

interface EnhancedStandingsTableProps {
  standings: StandingRow[];
  showDetailedStats?: boolean;
  highlightTop?: number;
  category?: "individual" | "team";
  matchType?: string;
  participantLabel?: string;
  isCompleted?: boolean;
  tournamentId?: string;
  participants?: Array<{
    _id?: string;
    fullName?: string;
    name?: string;
    username?: string;
    profileImage?: string;
    logo?: string;
    city?: string;
    players?: unknown[];
    isPair?: boolean;
    player1?: { username?: string; fullName?: string; profileImage?: string };
    player2?: { username?: string; fullName?: string; profileImage?: string };
  }>;
}

const tokens = DesignTokens;

const palette = {
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  indigo50: "#EEF2FF",
  indigo100: "#E0E7FF",
  indigo200: "#C7D2FE",
  indigo600: "#4F46E5",
  indigo700: "#4338CA",
  green50: "#F0FDF4",
  green100: "#DCFCE7",
  green600: "#16A34A",
  green700: "#15803D",
  red50: "#FEF2F2",
  red100: "#FEE2E2",
  red600: "#DC2626",
  red700: "#B91C1C",
  emerald100: "#D1FAE5",
  emerald700: "#047857",
};

const normalizeParticipantId = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const record = value as { _id?: unknown; $oid?: string };
    if (typeof record.$oid === "string") return record.$oid;
    if (record._id != null) return normalizeParticipantId(record._id);
    if (typeof (value as { toString?: () => string }).toString === "function") {
      const asString = (value as { toString: () => string }).toString();
      if (asString && asString !== "[object Object]") return asString;
    }
  }
  return String(value);
};

const getParticipantName = (
  row: StandingRow,
  participantById?: Map<string, { fullName?: string; name?: string; username?: string }>,
) => {
  if (row?.participant && typeof row.participant === "object") {
    const fromParticipant = getParticipantDisplayName(row.participant);
    if (fromParticipant !== "TBD" && fromParticipant !== "Unknown") {
      return fromParticipant;
    }
  }

  const participantObj =
    row?.participant && typeof row.participant === "object" ? row.participant : undefined;

  const resolved =
    participantObj?.fullName ||
    participantObj?.name ||
    participantObj?.username ||
    row?.participantName ||
    row?.playerName ||
    row?.teamName ||
    row?.fullName ||
    row?.name ||
    row?.username ||
    row?.participantDetails?.fullName ||
    row?.participantDetails?.name ||
    row?.participantDetails?.username ||
    row?.participantInfo?.fullName ||
    row?.participantInfo?.name ||
    row?.participantInfo?.username;

  if (resolved && String(resolved).trim().length > 0) {
    return String(resolved).trim();
  }

  const participantId =
    normalizeParticipantId(row?.participantId) || normalizeParticipantId(row?.participant);
  if (participantId && participantById?.has(participantId)) {
    const mapped = participantById.get(participantId);
    const mappedName = mapped ? getParticipantDisplayName(mapped) : "";
    if (mappedName && mappedName !== "TBD" && mappedName !== "Unknown") {
      return mappedName;
    }
  }

  return "Unknown player";
};

type ResolvedParticipant = Exclude<StandingRow["participant"], string> & Record<string, unknown>;

function resolveParticipant(
  row: StandingRow,
  participantById: Map<string, ResolvedParticipant>,
): ResolvedParticipant | undefined {
  const id =
    normalizeParticipantId(
      typeof row.participant === "object" && row.participant
        ? row.participant._id
        : row.participant,
    ) ||
    normalizeParticipantId(row?.participantId) ||
    normalizeParticipantId(row?.participant);
  if (row.participant && typeof row.participant === "object" && row.participant._id) {
    return row.participant as ResolvedParticipant;
  }
  if (id && participantById.has(id)) {
    return participantById.get(id);
  }
  return undefined;
}

export function EnhancedStandingsTable({
  standings,
  showDetailedStats = true,
  highlightTop = 3,
  category = "individual",
  matchType = "singles",
  participantLabel,
  participants = [],
}: EnhancedStandingsTableProps) {
  const safeStandings = Array.isArray(standings) ? standings : [];
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const isTeamTournament = category === "team";
  const isDoubles = matchType === "doubles";

  const participantById = useMemo(() => {
    const map = new Map<string, ResolvedParticipant>();
    (Array.isArray(participants) ? participants : []).forEach((participant) => {
      const id = normalizeParticipantId(participant?._id ?? participant);
      if (id) map.set(id, participant as ResolvedParticipant);
    });
    return map;
  }, [participants]);

  const calculateWinRate = (won = 0, played = 0) => {
    if (!played) return 0;
    return Math.round((won / played) * 100);
  };

  const calculateStreak = (form: string[] = []) => {
    if (!form.length) return 0;
    const latest = form[form.length - 1];
    let streak = 0;
    for (let i = form.length - 1; i >= 0; i -= 1) {
      if (form[i] !== latest) break;
      if (latest === "W") streak += 1;
      if (latest === "L") streak -= 1;
    }
    return streak;
  };

  const getDisplayName = (p: ResolvedParticipant | undefined, row: StandingRow): string => {
    if (!p) return getParticipantName(row, participantById);
    if (isDoubles) {
      const anyP = p as {
        isPair?: boolean;
        player1?: { username?: string; fullName?: string };
        player2?: { username?: string; fullName?: string };
        fullName?: string;
      };
      if (anyP.isPair || (anyP.player1 && anyP.player2)) {
        const n1 = getParticipantDisplayName(anyP.player1);
        const n2 = getParticipantDisplayName(anyP.player2);
        return `${n1}/${n2}`;
      }
      if (anyP.fullName && typeof anyP.fullName === "string" && anyP.fullName.includes(" / ")) {
        return anyP.fullName.replace(" / ", "/");
      }
    }
    return getParticipantDisplayName(p);
  };

  const getSubtext = (p: ResolvedParticipant | undefined): string => {
    if (!p) return "";
    if (!isUserParticipant(p)) {
      const team = p as { city?: string; players?: unknown[] };
      return team.city || `${team.players?.length || 0} players`;
    }
    if (isDoubles) {
      const anyP = p as {
        isPair?: boolean;
        player1?: { username?: string };
        player2?: { username?: string };
      };
      if (anyP.isPair || (anyP.player1 && anyP.player2)) {
        const u1 = anyP.player1?.username || "p1";
        const u2 = anyP.player2?.username || "p2";
        return `@${u1} & @${u2}`;
      }
    }
    return `@${(p as { username?: string }).username || "unknown"}`;
  };

  const getImageUri = (p: ResolvedParticipant | undefined): string | undefined => {
    if (!p) return undefined;
    if (isDoubles) {
      const anyP = p as {
        isPair?: boolean;
        player1?: unknown;
        player2?: unknown;
      };
      if (anyP.isPair || (anyP.player1 && anyP.player2)) {
        return getParticipantImage(anyP.player1) || getParticipantImage(anyP.player2);
      }
    }
    return getParticipantImage(p);
  };

  const getAvatarFallback = (p: ResolvedParticipant | undefined, row: StandingRow): string => {
    if (!p) return getParticipantName(row, participantById).charAt(0).toUpperCase() || "?";
    if (isDoubles) {
      const anyP = p as {
        isPair?: boolean;
        player1?: unknown;
        player2?: unknown;
      };
      if (anyP.isPair || (anyP.player1 && anyP.player2)) {
        const n1 = getParticipantDisplayName(anyP.player1);
        return n1.charAt(0).toUpperCase() || "?";
      }
    }
    const name = getDisplayName(p, row);
    return name.charAt(0).toUpperCase() || "?";
  };

  const resolvedRows = useMemo(() => {
    const byId = new Map<string, StandingRow>();
    safeStandings.forEach((row, index) => {
      const id =
        typeof row?.participant === "object" && row.participant?._id
          ? String(row.participant._id)
          : typeof row?.participant === "string"
            ? row.participant
            : `idx-${index}`;
      const existing = byId.get(id);
      if (!existing) {
        byId.set(id, row);
        return;
      }
      const keepNew =
        (row.played ?? 0) > (existing.played ?? 0) ||
        ((row.played ?? 0) === (existing.played ?? 0) &&
          (row.points ?? 0) > (existing.points ?? 0));
      if (keepNew) {
        byId.set(id, row);
      }
    });
    return Array.from(byId.values());
  }, [safeStandings]);

  const nameColumnLabel = participantLabel || (isTeamTournament ? "Team" : "Player");

  const formatSigned = (n: number) => {
    if (n > 0) return `+${n}`;
    return String(n);
  };

  const renderStreak = (streak: number) => {
    if (streak === 0) {
      return <Text style={styles.streakDash}>-</Text>;
    }
    const win = streak > 0;
    return (
      <View
        style={[
          styles.streakBadge,
          win ? styles.streakBadgeWin : styles.streakBadgeLoss,
        ]}
      >
        <Ionicons name="flame" size={10} color={win ? palette.green700 : palette.red700} />
        <Text style={[styles.streakBadgeText, win ? styles.streakTextWin : styles.streakTextLoss]}>
          {Math.abs(streak)}
          {win ? "W" : "L"}
        </Text>
      </View>
    );
  };

  if (safeStandings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          No standings available.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <Surface style={styles.container} elevation={0}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title style={styles.rankCol}><Text style={styles.headTitle}>Rank</Text></DataTable.Title>
              <DataTable.Title style={styles.nameCol}><Text style={styles.headTitle}>{nameColumnLabel}</Text></DataTable.Title>
              <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>MP</Text></DataTable.Title>
              <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>W</Text></DataTable.Title>
              <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>L</Text></DataTable.Title>
              <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>D</Text></DataTable.Title>
              {isTeamTournament ? (
                <>
                  <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>SM.W</Text></DataTable.Title>
                  <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>SM.L</Text></DataTable.Title>
                </>
              ) : (
                <>
                  <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>SW</Text></DataTable.Title>
                  <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>SL</Text></DataTable.Title>
                  {showDetailedStats && (
                    <>
                      <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>SD</Text></DataTable.Title>
                      <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>PS</Text></DataTable.Title>
                      <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>PD</Text></DataTable.Title>
                    </>
                  )}
                </>
              )}
              <DataTable.Title style={styles.statColPts}><Text style={styles.headTitle}>Pts</Text></DataTable.Title>
              <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>Win%</Text></DataTable.Title>
              <DataTable.Title style={styles.statCol}><Text style={styles.headTitle}>Streak</Text></DataTable.Title>
              <DataTable.Title style={styles.formCol}><Text style={styles.headTitle}>Form</Text></DataTable.Title>
              {isTeamTournament && <DataTable.Title style={styles.actionCol}><Text style={styles.headTitle}> </Text></DataTable.Title>}
            </DataTable.Header>

            {resolvedRows.map((row, index) => {
              const rank = row.rank || index + 1;
              const highlight = rank <= highlightTop;
              const resolved = resolveParticipant(row, participantById);
              const participantId = normalizeParticipantId(resolved?._id);
              const hasError = !resolved?._id;
              const hasTeamPlayers =
                isTeamTournament && Array.isArray(row.playerStats) && row.playerStats.length > 0;
              const isExpanded = participantId && expandedTeamId === participantId;
              const streak = calculateStreak(row.form || []);
              const winRate = calculateWinRate(row.won || 0, row.played || 0);
              const setsWonVal = isTeamTournament ? (row.subMatchesWon ?? row.setsWon ?? 0) : (row.setsWon ?? 0);
              const setsLostVal = isTeamTournament ? (row.subMatchesLost ?? row.setsLost ?? 0) : (row.setsLost ?? 0);
              const setsDiffVal = row.setsDiff ?? 0;
              const pointsDiffVal = row.pointsDiff ?? 0;
              const displayTitle = hasError
                ? getParticipantName(row, participantById)
                : getDisplayName(resolved, row);
              const subtext = hasError ? "Data integrity issue" : getSubtext(resolved);

              const rowSurfaceStyle = [
                styles.dataRow,
                hasError ? styles.rowError : highlight ? styles.rowHighlight : styles.rowDefault,
              ];

              return (
                <View key={`${participantId || "row"}-${index}`}>
                  <DataTable.Row style={rowSurfaceStyle}>
                    <DataTable.Cell style={[styles.cell, styles.rankCol]}>
                      <View style={styles.cellCenter}>
                        <Text style={styles.cellTextMuted}>{rank}</Text>
                      </View>
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.cell, styles.nameCol]}>
                      {hasError ? (
                        <View style={styles.nameRow}>
                          <View style={styles.errorAvatarRing}>
                            <Avatar size={28} alt="!" fallback="!" />
                          </View>
                          <View style={styles.nameTexts}>
                            <Text style={styles.nameTitleError} numberOfLines={1}>
                              {displayTitle || "[Invalid participant]"}
                            </Text>
                            <Text style={styles.nameSubError} numberOfLines={1}>
                              {subtext}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.nameRow}>
                          <Avatar
                            src={getImageUri(resolved)}
                            alt={displayTitle}
                            fallback={getAvatarFallback(resolved, row)}
                            size={28}
                          />
                          <View style={styles.nameTexts}>
                            <Text style={styles.nameTitle} numberOfLines={1}>
                              {displayTitle}
                            </Text>
                            <Text style={styles.nameSub} numberOfLines={1}>
                              {subtext}
                            </Text>
                          </View>
                        </View>
                      )}
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.cell, styles.statCol]}>
                      <View style={styles.cellCenter}>
                        <Text style={styles.cellText}>{row.played || 0}</Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell style={[styles.cell, styles.statCol]}>
                      <View style={styles.cellCenter}>
                        <Text style={styles.statWin}>{row.won || 0}</Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell style={[styles.cell, styles.statCol]}>
                      <View style={styles.cellCenter}>
                        <Text style={styles.statLoss}>{row.lost || 0}</Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell style={[styles.cell, styles.statCol]}>
                      <View style={styles.cellCenter}>
                        <Text style={styles.cellTextMuted}>{row.drawn || 0}</Text>
                      </View>
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.cell, styles.statCol]}>
                      <View style={styles.cellCenter}>
                        <Text style={isTeamTournament ? styles.statWin : styles.cellText}>
                          {setsWonVal}
                        </Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell style={[styles.cell, styles.statCol]}>
                      <View style={styles.cellCenter}>
                        <Text style={isTeamTournament ? styles.statLoss : styles.cellText}>
                          {setsLostVal}
                        </Text>
                      </View>
                    </DataTable.Cell>

                    {!isTeamTournament && showDetailedStats && (
                      <>
                        <DataTable.Cell style={[styles.cell, styles.statCol]}>
                          <View style={styles.cellCenter}>
                            <Text
                              style={
                                setsDiffVal > 0
                                  ? styles.statWin
                                  : setsDiffVal < 0
                                    ? styles.statLoss
                                    : styles.cellTextMuted
                              }
                            >
                              {formatSigned(setsDiffVal)}
                            </Text>
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, styles.statCol]}>
                          <View style={styles.cellCenter}>
                            <Text style={styles.cellText}>{row.pointsScored || 0}</Text>
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, styles.statCol]}>
                          <View style={styles.cellCenter}>
                            <Text
                              style={
                                pointsDiffVal > 0
                                  ? styles.statWin
                                  : pointsDiffVal < 0
                                    ? styles.statLoss
                                    : styles.cellTextMuted
                              }
                            >
                              {formatSigned(pointsDiffVal)}
                            </Text>
                          </View>
                        </DataTable.Cell>
                      </>
                    )}

                    <DataTable.Cell style={[styles.cell, styles.statColPts]}>
                      <View style={styles.cellCenter}>
                        <View style={styles.pointsPill}>
                          <Text style={styles.pointsPillText}>{row.points || 0}</Text>
                        </View>
                      </View>
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.cell, styles.statCol]}>
                      <View style={styles.cellCenter}>
                        <Text style={styles.cellTextStrong}>{winRate}%</Text>
                      </View>
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.cell, styles.statCol]}>
                      <View style={styles.cellCenter}>{renderStreak(streak)}</View>
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.cell, styles.formCol]}>
                      <View style={styles.formWrap}>
                        {(row.form || []).slice(-5).map((result, resultIdx) => (
                          <View
                            key={`${participantId || index}-f-${resultIdx}`}
                            style={[
                              styles.formBadge,
                              result === "W"
                                ? styles.formWin
                                : result === "L"
                                  ? styles.formLoss
                                  : styles.formDraw,
                            ]}
                          >
                            <Text
                              style={[
                                styles.formBadgeLetter,
                                result === "W"
                                  ? styles.formLetterWin
                                  : result === "L"
                                    ? styles.formLetterLoss
                                    : styles.formLetterDraw,
                              ]}
                            >
                              {result}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </DataTable.Cell>

                    {isTeamTournament && (
                      <DataTable.Cell style={[styles.cell, styles.actionCol]}>
                        <View style={styles.cellCenter}>
                          {hasTeamPlayers && participantId ? (
                            <Pressable
                              onPress={() => setExpandedTeamId(isExpanded ? null : participantId)}
                              style={({ pressed }) => [styles.expandHit, pressed && styles.expandHitPressed]}
                            >
                              <Ionicons
                                name="chevron-down"
                                size={16}
                                color={palette.slate500}
                                style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
                              />
                            </Pressable>
                          ) : null}
                        </View>
                      </DataTable.Cell>
                    )}
                  </DataTable.Row>

                  {isExpanded && (
                    <View style={styles.teamStatsPanel}>
                      <Text style={styles.teamStatsTitle}>Player performance</Text>
                      {(row.playerStats || []).map((playerStat) => {
                        const label =
                          playerStat.player.fullName || playerStat.player.username || "Player";
                        return (
                          <View key={playerStat.player._id} style={styles.teamPlayerRow}>
                            <Avatar
                              src={playerStat.player.profileImage}
                              alt={label}
                              fallback={getInitials(label)}
                              size={24}
                            />
                            <Text style={styles.teamPlayerName} numberOfLines={1}>
                              {label}
                            </Text>
                            <Text style={styles.teamPlayerMeta}>
                              {playerStat.subMatchesWon || 0}/{playerStat.subMatchesPlayed || 0}
                            </Text>
                            <View style={styles.teamWinRatePill}>
                              <Text style={styles.teamWinRateText}>
                                {Math.round(playerStat.winRate || 0)}%
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </DataTable>
        </ScrollView>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: tokens.colors.background.primary,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  container: {
    backgroundColor: tokens.colors.background.primary,
  },
  tableHeader: {
    backgroundColor: palette.slate50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border.light,
  },
  headTitle: {
    fontSize: 11,
    fontWeight: tokens.typography.fontWeight.medium,
    color: palette.slate600,
  },
  dataRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border.light,
  },
  rowDefault: {
    backgroundColor: tokens.colors.background.primary,
  },
  rowHighlight: {
    backgroundColor: palette.indigo50,
  },
  rowError: {
    backgroundColor: palette.red50,
  },
  rankCol: {
    width: 44,
  },
  nameCol: {
    width: 232,
  },
  statCol: {
    width: 44,
  },
  statColPts: {
    width: 52,
    alignItems: 'center',
  },
  formCol: {
    width: 124,
  },
  actionCol: {
    width: 40,
  },
  cell: {
    paddingVertical: 6,
  },
  cellCenter: {
    flex: 1,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 12,
    color: palette.slate700,
  },
  cellTextStrong: {
    fontSize: 12,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: palette.slate700,
  },
  cellTextMuted: {
    fontSize: 12,
    color: palette.slate500,
  },
  statWin: {
    fontSize: 12,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: palette.green600,
  },
  statLoss: {
    fontSize: 12,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: palette.red600,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorAvatarRing: {
    borderWidth: 2,
    borderColor: "#FCA5A5",
    borderRadius: 999,
    backgroundColor: palette.red100,
    overflow: "hidden",
  },
  nameTexts: {
    flex: 1,
    minWidth: 0,
  },
  nameTitle: {
    fontSize: 13,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: palette.slate700,
  },
  nameSub: {
    fontSize: 11,
    color: palette.slate500,
    marginTop: 1,
  },
  nameTitleError: {
    fontSize: 13,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: palette.red700,
  },
  nameSubError: {
    fontSize: 11,
    color: palette.red600,
    marginTop: 1,
  },
  pointsPill: {
    backgroundColor: palette.indigo100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    width: 36,
    alignItems: 'center',
  },
  pointsPillText: {
    fontSize: 11,
    fontWeight: tokens.typography.fontWeight.bold,
    color: palette.indigo700,
  },
  streakDash: {
    fontSize: 11,
    color: palette.slate500,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  streakBadgeWin: {
    backgroundColor: palette.green50,
    borderColor: palette.green100,
  },
  streakBadgeLoss: {
    backgroundColor: palette.red50,
    borderColor: palette.red100,
  },
  streakBadgeText: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  streakTextWin: {
    color: palette.green700,
  },
  streakTextLoss: {
    color: palette.red700,
  },
  formWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  formBadge: {
    width: 16,
    height: 16,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  formWin: {
    backgroundColor: palette.green100,
  },
  formLoss: {
    backgroundColor: palette.red100,
  },
  formDraw: {
    backgroundColor: palette.slate200,
  },
  formBadgeLetter: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  formLetterWin: {
    color: palette.green700,
  },
  formLetterLoss: {
    color: palette.red700,
  },
  formLetterDraw: {
    color: palette.slate600,
  },
  expandHit: {
    padding: 4,
    borderRadius: 6,
  },
  expandHitPressed: {
    backgroundColor: palette.slate200,
  },
  teamStatsPanel: {
    backgroundColor: "rgba(248, 250, 252, 0.85)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  teamStatsTitle: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: palette.slate500,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  teamPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: tokens.colors.background.primary,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  teamPlayerName: {
    flex: 1,
    fontSize: 12,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: palette.slate700,
  },
  teamPlayerMeta: {
    fontSize: 11,
    color: palette.slate500,
  },
  teamWinRatePill: {
    backgroundColor: palette.emerald100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  teamWinRateText: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: palette.emerald700,
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyText: {
    color: palette.slate500,
  },
});
