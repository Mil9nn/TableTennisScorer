import { formatTimeDuration, getFirstName } from "@/lib/utils";
import { teamDisplayImageSrc } from "@/lib/teamMatchRubber";
import { gamePointsByTeamIndex, getScoringIds, getSetScores } from "@/lib/match/singlesClient";
import { isIndividualMatch, Match, TeamMatch } from "@/types/match.type";
import { format } from "date-fns";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

// Design tokens
const tokens = DesignTokens;

function shortMatchCode(id: string): string {
  const s = String(id);
  return s.length <= 4 ? s.toUpperCase() : s.slice(-4).toUpperCase();
}

function safeDateLabel(raw: unknown): string {
  if (!raw) return "—";
  const v =
    typeof raw === "object" && raw !== null && "$date" in (raw as Record<string, unknown>)
      ? (raw as { $date?: unknown }).$date
      : raw;
  const d = new Date(v as any);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "d MMM yyyy");
}

function statusLineLabel(status: string, matchDuration?: number): string {
  if (status === "in_progress") return "Live";
  if (status === "scheduled") return "Scheduled";
  if (status === "cancelled") return "Cancelled";
  if (status === "completed") {
    if (matchDuration != null && matchDuration > 0) {
      return formatTimeDuration(matchDuration);
    }
    return "Completed";
  }
  return status;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "in_progress": return tokens.colors.status.live;
    case "completed": return tokens.colors.status.completed;
    case "scheduled": return tokens.colors.status.scheduled;
    case "cancelled": return tokens.colors.text.tertiary;
    default: return tokens.colors.text.tertiary;
  }
}

function getStatusIcon(status: string): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case "in_progress": return "radio-outline";
    case "completed": return "checkmark-circle-outline";
    case "scheduled": return "calendar-outline";
    case "cancelled": return "close-circle-outline";
    default: return "help-circle-outline";
  }
}

function matchTypeLabel(matchType?: string): string {
  if (!matchType) return "—";
  const m: Record<string, string> = {
    singles: "Singles",
    doubles: "Doubles",
    mixed_doubles: "Mixed doubles",
  };
  return m[matchType] || matchType.replace(/_/g, " ");
}

function teamFormatLabel(format: TeamMatch["matchFormat"]): string {
  if (format === "five_singles") return "Swaythling (best of 5)";
  if (format === "single_double_single") return "Single–Double–Single";
  if (format === "custom") return "Custom";
  return format;
}

function InfoRow({ label, value, highlighted }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <View style={modernStyles.infoRow}>
      <Text style={[modernStyles.infoLabel]}>{label}</Text>
      <Text style={[modernStyles.infoValue, highlighted && modernStyles.highlightedValue]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={modernStyles.infoCard}>
      <Text style={modernStyles.infoCardTitle}>{title}</Text>
      <View style={modernStyles.infoCardContent}>
        {children}
      </View>
    </View>
  );
}

function participantLabel(p?: { fullName?: string; username?: string }): string {
  return p?.fullName || p?.username || "";
}

/** Column titles for per-game scores: first name(s) per side. */
function individualGameColumnTitles(
  participants: { fullName?: string; username?: string }[] | undefined,
  isDoubles: boolean
): { left: string; right: string } {
  const p = participants || [];
  if (isDoubles) {
    const left = [getFirstName(participantLabel(p[0])), getFirstName(participantLabel(p[1]))]
      .filter((s) => s.length > 0)
      .join("/");
    const right = [getFirstName(participantLabel(p[2])), getFirstName(participantLabel(p[3]))]
      .filter((s) => s.length > 0)
      .join("/");
    return { left: left || "Side 1", right: right || "Side 2" };
  }
  return {
    left: getFirstName(participantLabel(p[0])) || "—",
    right: getFirstName(participantLabel(p[1])) || "—",
  };
}

function getIndividualSetScores(match: any): [number, number] {
  return getSetScores(match);
}

function getIndividualGameScores(match: any, game: any): [number, number] {
  const ids = getScoringIds(match);
  if (Array.isArray(game?.scoresByTeam) && game.scoresByTeam.length >= 2) {
    return [
      Number(game.scoresByTeam[0] ?? 0),
      Number(game.scoresByTeam[1] ?? 0),
    ];
  }

  const toRecord = (raw: any): Record<string, number> => {
    if (!raw) return {};
    if (raw instanceof Map) return Object.fromEntries(raw);
    if (Array.isArray(raw)) return Object.fromEntries(raw as [string, number][]);
    if (typeof raw === "object" && typeof raw.entries === "function") {
      try {
        return Object.fromEntries(Array.from(raw.entries()));
      } catch {
        // fall through
      }
    }
    if (typeof raw === "object" && typeof raw.toJSON === "function") {
      try {
        const json = raw.toJSON();
        if (json && typeof json === "object" && !Array.isArray(json)) {
          return Object.fromEntries(Object.entries(json));
        }
      } catch {
        // fall through
      }
    }
    if (typeof raw === "object") return Object.fromEntries(Object.entries(raw));
    return {};
  };

  const byId = toRecord(game?.scoresById);
  if (ids && Object.keys(byId).length > 0) {
    const hasMapped =
      Object.prototype.hasOwnProperty.call(byId, ids[0]) ||
      Object.prototype.hasOwnProperty.call(byId, ids[1]);
    if (hasMapped) {
      return [Number(byId[ids[0]] ?? 0), Number(byId[ids[1]] ?? 0)];
    }
    const vals = Object.values(byId).map((n) => Number(n));
    if (vals.length >= 2) return [vals[0], vals[1]];
  }

  if (game?.team1Score != null || game?.team2Score != null) {
    return [Number(game.team1Score ?? 0), Number(game.team2Score ?? 0)];
  }
  if (game?.side1Score != null || game?.side2Score != null) {
    return [Number(game.side1Score ?? 0), Number(game.side2Score ?? 0)];
  }

  return gamePointsByTeamIndex(
    { ...game, scoresById: byId },
    ids?.[0] ?? null,
    ids?.[1] ?? null
  );
}

function getIndividualGameWinners(match: any, game: any, a: number, b: number) {
  const toId = (raw: any): string => {
    if (raw == null) return "";
    if (typeof raw === "string") return raw;
    if (typeof raw === "number") return String(raw);
    if (typeof raw === "object") {
      if (raw.$oid) return String(raw.$oid);
      if (raw._id) return toId(raw._id);
    }
    return String(raw);
  };
  if (typeof game?.winnerTeamIndex === "number") {
    return {
      aWin: game.winnerTeamIndex === 0,
      bWin: game.winnerTeamIndex === 1,
    };
  }

  const ids = getScoringIds(match);
  if (ids && game?.winnerId) {
    const winnerId = toId(game.winnerId);
    return {
      aWin: winnerId === ids[0],
      bWin: winnerId === ids[1],
    };
  }

  if (game?.winnerSide) {
    return {
      aWin: game.winnerSide === "side1",
      bWin: game.winnerSide === "side2",
    };
  }

  return { aWin: a > b, bWin: b > a };
}

function getGameWinnerIndex(match: any, game: any): 0 | 1 | null {
  if (typeof game?.winnerTeamIndex === "number") {
    return game.winnerTeamIndex === 0 ? 0 : game.winnerTeamIndex === 1 ? 1 : null;
  }

  const toId = (raw: any): string => {
    if (raw == null) return "";
    if (typeof raw === "string") return raw;
    if (typeof raw === "number") return String(raw);
    if (typeof raw === "object") {
      if (raw.$oid) return String(raw.$oid);
      if (raw._id) return toId(raw._id);
    }
    return String(raw);
  };

  const leftId =
    toId(match?.participants?.[0]?._id ?? match?.participants?.[0]) ||
    toId(match?.teams?.[0]?.players?.[0]?._id ?? match?.teams?.[0]?.players?.[0]);
  const rightId =
    toId(match?.participants?.[1]?._id ?? match?.participants?.[1]) ||
    toId(match?.teams?.[1]?.players?.[0]?._id ?? match?.teams?.[1]?.players?.[0]);
  const winnerId = toId(game?.winnerId ?? game?.winner);
  if (winnerId && leftId && winnerId === leftId) return 0;
  if (winnerId && rightId && winnerId === rightId) return 1;

  if (game?.winnerSide === "side1") return 0;
  if (game?.winnerSide === "side2") return 1;

  const [a, b] = getIndividualGameScores(match, game);
  if (a > b) return 0;
  if (b > a) return 1;
  return null;
}

export default function MatchDetailsContent({ match }: { match: Match }) {
  const meta = `Match #${match._id} • ${statusLineLabel(match.status, match.matchDuration)}`;

  if (isIndividualMatch(match)) {
    const isDoubles = match.matchType === "doubles" || match.matchType === "mixed_doubles";
    const leftName = match.teams?.[0]?.players?.length
      ? match.teams[0].players
        .map((p) => p.fullName || p.username)
        .filter(Boolean)
        .join(" & ")
      : isDoubles
        ? [match.participants?.[0]?.fullName, match.participants?.[1]?.fullName]
          .filter(Boolean)
          .join(" & ")
        : match.participants?.[0]?.fullName || "Player A";
    const rightName = match.teams?.[1]?.players?.length
      ? match.teams[1].players
        .map((p) => p.fullName || p.username)
        .filter(Boolean)
        .join(" & ")
      : isDoubles
        ? [match.participants?.[2]?.fullName, match.participants?.[3]?.fullName]
          .filter(Boolean)
          .join(" & ")
        : match.participants?.[1]?.fullName || "Player B";

    const dateStr = safeDateLabel(match.createdAt);

    const games = [...(match.games || [])].sort((a, b) => a.gameNumber - b.gameNumber);
    const gameCols = individualGameColumnTitles(match.participants, isDoubles);
    const [setScore1, setScore2] = getIndividualSetScores(match);
    const winsFromRows = games.reduce(
      (acc, g) => {
        const w = getGameWinnerIndex(match, g);
        if (w === 0) acc[0] += 1;
        if (w === 1) acc[1] += 1;
        return acc;
      },
      [0, 0] as [number, number]
    );
    const apiLooksValid =
      setScore1 + setScore2 > 0 &&
      setScore1 + setScore2 <= Math.max(games.length, 1) &&
      !(
        Number(match.numberOfSets ?? 0) === 1 &&
        setScore1 > 0 &&
        setScore2 > 0
      );
    const s1 = apiLooksValid ? setScore1 : winsFromRows[0];
    const s2 = apiLooksValid ? setScore2 : winsFromRows[1];

    return (
      <View style={modernStyles.page}>
        {/* Match Status Card */}
        <View style={modernStyles.statusCard}>
          <View style={modernStyles.statusLeft}>
            <Ionicons
              name={getStatusIcon(match.status)}
              size={20}
              color={getStatusColor(match.status)}
            />
            <Text style={[modernStyles.statusText, modernStyles.highlightedStatus]}>
              {statusLineLabel(match.status, match.matchDuration)}
            </Text>
          </View>
          <View style={modernStyles.matchCodeContainer}>
            <Text style={modernStyles.matchCode}>#{match._id}</Text>
            <TouchableOpacity
              style={modernStyles.copyButton}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const matchCode = `#${match._id}`;
                await Clipboard.setStringAsync(matchCode);
                Alert.alert('Copied!', `Match code ${matchCode} copied to clipboard`);
              }}
              hitSlop={8}
            >
              <Ionicons name="copy-outline" size={14} color={tokens.colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Score Card */}
        <View style={modernStyles.scoreCard}>
          <View style={modernStyles.scoreRow}>
            <View style={modernStyles.playerInfo}>
              <View style={modernStyles.playerAvatarContainer}>
                <Avatar
                  src={(match.participants?.[0] as any)?.profileImage}
                  alt={leftName}
                  size={40}
                />
              </View>
              <View style={modernStyles.playerTextContainer}>
                <Text style={modernStyles.playerName} numberOfLines={isDoubles ? 3 : 2}>
                  {leftName}
                </Text>
                <Text style={modernStyles.playerSubtext}>Player 1</Text>
              </View>
            </View>
            <View style={modernStyles.scoreDisplay}>
              <Text style={[modernStyles.scoreBig, modernStyles.highlightedScore]}>{s1}</Text>
            </View>
          </View>
          <View style={modernStyles.scoreDivider} />
          <View style={modernStyles.scoreRow}>
            <View style={modernStyles.playerInfo}>
              <View style={modernStyles.playerAvatarContainer}>
                <Avatar
                  src={(match.participants?.[1] as any)?.profileImage}
                  alt={rightName}
                  size={40}
                />
              </View>
              <View style={modernStyles.playerTextContainer}>
                <Text style={modernStyles.playerName} numberOfLines={isDoubles ? 3 : 2}>
                  {rightName}
                </Text>
                <Text style={modernStyles.playerSubtext}>Player 2</Text>
              </View>
            </View>
            <View style={modernStyles.scoreDisplay}>
              <Text style={[modernStyles.scoreBig, modernStyles.highlightedScore]}>{s2}</Text>
            </View>
          </View>
        </View>

        {/* Match Info Card */}
        <InfoCard title="Match Information">
          <InfoRow label="Date" value={dateStr} />
          <InfoRow label="Location" value={match.city || "—"} />
          <InfoRow label="Venue" value={match.venue || "—"} />
          <InfoRow label="Type" value={matchTypeLabel(match.matchType)} highlighted={true} />
          <InfoRow label="Format" value={`Best of ${match.numberOfSets}`} />
        </InfoCard>

        {/* Tournament Info Card */}
        {/* Debug: Check if tournament card renders */}
        
        {match.tournament?.name ? (
          <InfoCard title="Tournament Information">
            <InfoRow label="Tournament" value={match.tournament.name} highlighted={true} />
            {match.tournament.format && (
              <InfoRow label="Format" value={match.tournament.format.replace(/_/g, ' ')} />
            )}
            {match.tournament.status && (
              <InfoRow label="Status" value={match.tournament.status.replace(/_/g, ' ')} />
            )}
            {(match as any).roundName && (
              <InfoRow label="Round" value={(match as any).roundName} />
            )}
            {(match as any).bracketPosition && (
              <>
                {(match as any).bracketPosition.round && (
                  <InfoRow label="Round Number" value={`Round ${(match as any).bracketPosition.round}`} />
                )}
                {(match as any).bracketPosition.matchNumber && (
                  <InfoRow label="Match Number" value={`Match ${(match as any).bracketPosition.matchNumber}`} />
                )}
                {(match as any).bracketPosition.nextMatchNumber && (
                  <InfoRow label="Next Match" value={`Match ${(match as any).bracketPosition.nextMatchNumber}`} />
                )}
              </>
            )}
            {(match.tournament as any).organizer?.fullName && (
              <View style={modernStyles.orgainzerRow}>
                <Text style={modernStyles.infoLabel}>Organizer</Text>
                <View style={modernStyles.organizerInfo}>
                  <Avatar
                    src={(match.tournament as any).organizer.profileImage}
                    alt={(match.tournament as any).organizer.fullName}
                    size={32}
                  />
                  <Text style={modernStyles.organizerName}>
                    {(match.tournament as any).organizer.fullName}
                  </Text>
                </View>
              </View>
            )}
            {match.scorer && (
              <InfoRow 
                label="Scored By" 
                value={
                  typeof match.scorer === 'object' 
                    ? match.scorer.fullName || match.scorer.username
                    : match.tournament.scorers.find((s: any) => s._id === match.scorer)?.fullName || 
                      match.tournament.scorers.find((s: any) => s._id === match.scorer)?.username || 
                      'Unknown'
                } 
                highlighted={true}
              />
            )}
          </InfoCard>
        ) : null}

        {/* Games Card */}
        {games.length > 0 && (
          <InfoCard title="Game Results">
            <View style={modernStyles.gamesHeader}>
              <Text style={modernStyles.gamesColGame}>Game</Text>
              <Text style={modernStyles.gamesColScore} numberOfLines={2}>
                {gameCols.left}
              </Text>
              <Text style={modernStyles.gamesColScore} numberOfLines={2}>
                {gameCols.right}
              </Text>
            </View>
            <View style={modernStyles.gamesList}>
              {games.map((g) => {
                const [a, b] = getIndividualGameScores(match, g);
                const { aWin, bWin } = getIndividualGameWinners(match, g, a, b);
                return (
                  <TouchableOpacity
                    key={g.gameNumber}
                    style={modernStyles.gameRow}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    <View style={modernStyles.gameNum}>
                      <Text style={modernStyles.gameNumText}>{g.gameNumber}</Text>
                    </View>
                    <View style={[
                      modernStyles.gameScore,
                      aWin && modernStyles.gameWinner
                    ]}>
                      <Text style={modernStyles.gameScoreText}>{a}</Text>
                    </View>
                    <View style={[
                      modernStyles.gameScore,
                      bWin && modernStyles.gameWinner
                    ]}>
                      <Text style={modernStyles.gameScoreText}>{b}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </InfoCard>
        )}
      </View>
    );
  }

  const tm = match as TeamMatch;
  const t1 = tm.finalScore?.team1Matches ?? 0;
  const t2 = tm.finalScore?.team2Matches ?? 0;
  const dateStr = safeDateLabel(tm.createdAt);
  const tieColLeft = getFirstName(tm.team1?.name) || "Team 1";
  const tieColRight = getFirstName(tm.team2?.name) || "Team 2";

  return (
    <View style={modernStyles.page}>
      {/* Match Status Card */}
      <View style={modernStyles.statusCard}>
        <View style={modernStyles.statusLeft}>
          <Ionicons
            name={getStatusIcon(tm.status)}
            size={20}
            color={getStatusColor(tm.status)}
          />
          <Text style={modernStyles.statusText}>
            {statusLineLabel(tm.status, tm.matchDuration)}
          </Text>
        </View>
        <View style={modernStyles.matchCodeContainer}>
          <Text style={modernStyles.matchCode}>#{tm._id}</Text>
          <TouchableOpacity
            style={modernStyles.copyButton}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const matchCode = `#${tm._id}`;
              await Clipboard.setStringAsync(matchCode);
              Alert.alert('Copied!', `Match code ${matchCode} copied to clipboard`);
            }}
            hitSlop={8}
          >
            <Ionicons name="copy-outline" size={14} color={tokens.colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Score Card */}
      <View style={modernStyles.scoreCard}>
        <View style={modernStyles.scoreRow}>
          <View style={modernStyles.playerInfo}>
            <View style={modernStyles.playerAvatarContainer}>
              <Avatar
                src={teamDisplayImageSrc(tm.team1)}
                alt={tm.team1?.name || "Team 1"}
                size={40}
              />
            </View>
            <View style={modernStyles.playerTextContainer}>
              <Text style={modernStyles.playerName} numberOfLines={2}>
                {tm.team1?.name || "Team 1"}
              </Text>
              <Text style={modernStyles.playerSubtext}>Team 1</Text>
            </View>
          </View>
          <View style={modernStyles.scoreDisplay}>
            <Text style={[modernStyles.scoreBig, modernStyles.highlightedScore]}>{t1}</Text>
          </View>
        </View>
        <View style={modernStyles.scoreDivider} />
        <View style={modernStyles.scoreRow}>
          <View style={modernStyles.playerInfo}>
            <View style={modernStyles.playerAvatarContainer}>
              <Avatar
                src={teamDisplayImageSrc(tm.team2)}
                alt={tm.team2?.name || "Team 2"}
                size={40}
              />
            </View>
            <View style={modernStyles.playerTextContainer}>
              <Text style={modernStyles.playerName} numberOfLines={2}>
                {tm.team2?.name || "Team 2"}
              </Text>
              <Text style={modernStyles.playerSubtext}>Team 2</Text>
            </View>
          </View>
          <View style={modernStyles.scoreDisplay}>
            <Text style={[modernStyles.scoreBig, modernStyles.highlightedScore]}>{t2}</Text>
          </View>
        </View>
      </View>

      {/* Match Info Card */}
      <InfoCard title="Match Information">
        <InfoRow label="Date" value={dateStr} />
        <InfoRow label="Location" value={tm.city || "—"} />
        <InfoRow label="Venue" value={tm.venue || "—"} />
        <InfoRow label="Type" value="Team" highlighted={true} />
        <InfoRow label="Format" value={teamFormatLabel(tm.matchFormat)} />
        <InfoRow
          label="Sets / tie"
          value={`Best of ${
            tm.numberOfSetsPerSubMatch ??
            (tm as { numberOfGamesPerRubber?: number }).numberOfGamesPerRubber ??
            tm.subMatches?.[0]?.numberOfSets ??
            (tm.subMatches?.[0] as { numberOfGames?: number } | undefined)?.numberOfGames ??
            "—"
          } per sub-match`}
        />
      </InfoCard>

      {tm.matchFormat === "custom" && (!tm.subMatches || tm.subMatches.length === 0) && (
        <InfoCard title="Rubbers">
          <Text style={modernStyles.emptyRubbersText}>
            No rubbers configured yet. Add sub-matches (e.g. player vs player) from Quick Actions.
          </Text>
        </InfoCard>
      )}

      {/* Tournament Info Card */}
      {(tm as any).tournament?.name ? (
        <InfoCard title="Tournament Information">
          <InfoRow label="Tournament" value={(tm as any).tournament.name} highlighted={true} />
          {(tm as any).tournament.format && (
            <InfoRow label="Format" value={(tm as any).tournament.format.replace(/_/g, ' ')} />
          )}
          {(tm as any).tournament.status && (
            <InfoRow label="Status" value={(tm as any).tournament.status.replace(/_/g, ' ')} />
          )}
          {(tm as any).roundName && (
            <InfoRow label="Round" value={(tm as any).roundName} />
          )}
          {(tm as any).bracketPosition && (
            <>
              {(tm as any).bracketPosition.round && (
                <InfoRow label="Round Number" value={`Round ${(tm as any).bracketPosition.round}`} />
              )}
              {(tm as any).bracketPosition.matchNumber && (
                <InfoRow label="Match Number" value={`Match ${(tm as any).bracketPosition.matchNumber}`} />
              )}
              {(tm as any).bracketPosition.nextMatchNumber && (
                <InfoRow label="Next Match" value={`Match ${(tm as any).bracketPosition.nextMatchNumber}`} />
              )}
            </>
          )}
          {(tm as any).tournament.organizer?.fullName && (
            <InfoRow label="Organizer" value={(tm as any).tournament.organizer.fullName} />
          )}
          {tm.scorer && (
            <InfoRow 
              label="Scored By" 
              value={
                typeof tm.scorer === 'object' 
                  ? tm.scorer.fullName || tm.scorer.username
                  : (tm as any).tournament.scorers.find((s: any) => s._id === tm.scorer)?.fullName || 
                    (tm as any).tournament.scorers.find((s: any) => s._id === tm.scorer)?.username || 
                    'Unknown'
              } 
              highlighted={true}
            />
          )}
        </InfoCard>
      ) : null}

      {/* Sub-matches Card */}
      {tm.subMatches && tm.subMatches.length > 0 && (
        <InfoCard title="Tie Results">
          <View style={modernStyles.gamesHeader}>
            <Text style={modernStyles.gamesColGame}>Tie</Text>
            <Text style={modernStyles.gamesColScore} numberOfLines={2}>
              {tieColLeft}
            </Text>
            <Text style={modernStyles.gamesColScore} numberOfLines={2}>
              {tieColRight}
            </Text>
          </View>
          <View style={modernStyles.gamesList}>
            {tm.subMatches.map((sm) => {
              const fs = sm.finalScore;
              const a =
                fs?.team1Sets ??
                (fs as { team1Games?: number } | undefined)?.team1Games ??
                0;
              const b =
                fs?.team2Sets ??
                (fs as { team2Games?: number } | undefined)?.team2Games ??
                0;
              const aWin = a > b;
              const bWin = b > a;
              return (
                <TouchableOpacity
                  key={sm.matchNumber}
                  style={modernStyles.gameRow}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <View style={modernStyles.gameNum}>
                    <Text style={modernStyles.gameNumText}>{sm.matchNumber}</Text>
                  </View>
                  <View style={[
                    modernStyles.gameScore,
                    aWin && modernStyles.gameWinner
                  ]}>
                    <Text style={modernStyles.gameScoreText}>{a}</Text>
                  </View>
                  <View style={[
                    modernStyles.gameScore,
                    bWin && modernStyles.gameWinner
                  ]}>
                    <Text style={modernStyles.gameScoreText}>{b}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </InfoCard>
      )}
    </View>
  );
}

// Modern styles using design tokens
const modernStyles = StyleSheet.create({
  page: {
    backgroundColor: tokens.colors.background.secondary,
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },

  // Status card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.sm,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  statusText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  matchCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  matchCode: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    backgroundColor: tokens.colors.background.secondary,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.borderRadius.sm,
  },
  copyButton: {
    padding: tokens.spacing[1],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Score card
  scoreCard: {
    padding: tokens.spacing[4],
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing[4],
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  playerAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerTextContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
  },
  playerSubtext: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.normal,
    color: tokens.colors.text.tertiary,
    marginTop: tokens.spacing[1],
  },
  scoreDisplay: {
    alignItems: 'flex-end',
  },
  scoreBig: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  scoreDivider: {
    height: 1,
    backgroundColor: tokens.colors.border.light,
    marginVertical: tokens.spacing[4],
  },

  // Info card
  infoCard: {
    overflow: 'hidden',
  },
  infoCardTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    padding: tokens.spacing[4],
    paddingBottom: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  infoCardContent: {
    padding: tokens.spacing[4],
    paddingTop: tokens.spacing[3],
    gap: tokens.spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacing[4],
  },
  infoLabel: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.tertiary,
    flexShrink: 0,
    minWidth: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textAlign: 'right',
  },

  // Games
  gamesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
    marginBottom: tokens.spacing[4],
  },
  gamesColGame: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gamesColScore: {
    minWidth: 60,
    maxWidth: 120,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  gamesList: {
    gap: tokens.spacing[2],
  },
  gameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing[2],
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.sm,
  },
  gameNum: {
    flex: 1,
    alignItems: 'center',
    padding: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
  },
  gameNumText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  gameScore: {
    minWidth: 60,
    maxWidth: 120,
    alignItems: 'center',
    padding: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
  },
  gameScoreText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  orgainzerRow: {
    gap: tokens.spacing[4],
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    flexShrink: 0,
  },
  organizerName: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },

  // Game winner style
  gameWinner: {
    backgroundColor: tokens.colors.success + '20',
  },
  
  // Highlight styles for important fields
  highlightedValue: {
    color: tokens.colors.lightBlue,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  highlightedScore: {
    color: tokens.colors.primary[700],
    fontWeight: tokens.typography.fontWeight.bold,
  },
  highlightedStatus: {
    fontWeight: tokens.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyRubbersText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    lineHeight: 20,
  },
});
