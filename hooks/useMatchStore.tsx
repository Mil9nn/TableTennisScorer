import { axiosInstance } from "@/lib/axiosInstance";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { IndividualMatch, Participant, TeamMatch } from "@/types/match.type";
import { Alert } from "react-native";
import { create } from "zustand";

interface MatchStore {
  match: IndividualMatch | TeamMatch | null;
  setMatch: (m: IndividualMatch | TeamMatch | null) => void;

  updating: boolean;
  fetchingMatch: boolean;

  setupDialogOpen: boolean;
  setSetupDialogOpen: (open: boolean) => void;

  serverDialogOpen: boolean;
  setServerDialogOpen: (open: boolean) => void;

  fetchMatch: (
    matchId: string,
    category: "individual" | "team",
    options?: { view?: "summary" | "details" | "stats" | "legacy"; includeShots?: boolean }
  ) => Promise<void>;
}

export const useMatchStore = create<MatchStore>((set, get) => {
  function objectIdBufferToHex(raw: any): string | null {
    const data = raw?.buffer?.data;
    if (!Array.isArray(data) || data.length !== 12) return null;
    try {
      return data
        .map((b: number) => Number(b).toString(16).padStart(2, "0"))
        .join("");
    } catch {
      return null;
    }
  }

  function asId(raw: any): string {
    if (raw == null) return "";
    if (typeof raw === "string") return raw;
    if (typeof raw === "number") return String(raw);
    if (typeof raw === "object") {
      if (typeof raw.toHexString === "function") {
        try {
          const hex = raw.toHexString();
          if (typeof hex === "string" && hex.length > 0) return hex;
        } catch {
          // continue with other strategies
        }
      }
      if (raw.$oid) return String(raw.$oid);
      if (typeof raw.id === "string" && raw.id.length > 0) return raw.id;
      if (raw._id) return asId(raw._id);
      const bufferHex = objectIdBufferToHex(raw);
      if (bufferHex) return bufferHex;
    }
    const str = String(raw);
    return str === "[object Object]" ? "" : str;
  }

  function firstValidId(...candidates: any[]): string {
    for (const candidate of candidates) {
      const id = asId(candidate);
      if (id) return id;
    }
    return "";
  }

  function mapLikeToRecord(raw: any): Record<string, number> {
    if (!raw) return {};
    if (raw instanceof Map) return Object.fromEntries(raw);
    if (Array.isArray(raw)) return Object.fromEntries(raw as [string, number][]);
    if (typeof raw === "object" && typeof raw.entries === "function") {
      try {
        return Object.fromEntries(Array.from(raw.entries()));
      } catch {
        // fall through to object-entries path
      }
    }
    if (typeof raw === "object" && typeof raw.toJSON === "function") {
      try {
        const json = raw.toJSON();
        if (json && typeof json === "object" && !Array.isArray(json)) {
          return Object.fromEntries(Object.entries(json));
        }
      } catch {
        // fall through to object-entries path
      }
    }
    if (typeof raw === "object") return Object.fromEntries(Object.entries(raw));
    return {};
  }

  function normalizeParticipants(raw: any[]): Participant[] {
    return (raw || []).map((p: any) => ({
      _id: firstValidId(
        p && typeof p === "object" ? p._id : undefined,
        p && typeof p === "object" ? p.id : undefined,
        p
      ),
      username: p.username,
      fullName: p.fullName,
      profileImage: p.profileImage,
    }));
  }

  function firstNonEmptyRecord(...records: Record<string, number>[]): Record<string, number> {
    for (const rec of records) {
      if (rec && Object.keys(rec).length > 0) return rec;
    }
    return {};
  }

  function normalizeScorer(raw: any): Participant | string | undefined {
    if (!raw) return undefined;
    if (typeof raw === "string") {
      // If it's just an ID string, return it as-is (match details page handles this)
      return raw;
    }
    // If it's a populated object, normalize it to Participant
    const scorerId = firstValidId(raw._id, raw.id, raw);
    if (scorerId) {
      return {
        _id: scorerId,
        username: raw.username || "",
        fullName: raw.fullName,
        profileImage: raw.profileImage,
      };
    }
    return undefined;
  }

  function normalizeTeams(rawTeams: any[] | undefined, participants: Participant[]) {
    if (!Array.isArray(rawTeams) || rawTeams.length === 0) return undefined;

    const participantById = new Map(participants.map((p) => [asId(p._id), p]));

    return rawTeams.map((team: any) => ({
      players: (team?.players || [])
        .map((player: any) => {
          if (
            player &&
            typeof player === "object" &&
            (player._id || player.id)
          ) {
            return {
              _id: firstValidId(player._id, player.id, player),
              username: player.username || "",
              fullName: player.fullName,
              profileImage: player.profileImage,
            };
          }
          return participantById.get(asId(player));
        })
        .filter(Boolean),
    }));
  }

  function normalizeTeamPlayer(player: any) {
    if (!player || typeof player !== "object") return player;
    const userRaw = player.user;
    const user =
      userRaw && typeof userRaw === "object"
        ? {
            _id: firstValidId(userRaw._id, userRaw.id),
            username: userRaw.username || "",
            fullName: userRaw.fullName,
            profileImage: userRaw.profileImage,
          }
        : {
            _id: firstValidId(player._id, player.id),
            username: player.username || "",
            fullName: player.fullName,
            profileImage: player.profileImage,
          };
    return {
      _id: firstValidId(player._id, user._id),
      user,
      role: player.role,
    };
  }

  function normalizeSubMatchPlayers(raw: unknown): Participant[] {
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return list
      .map((p: any) => {
        if (!p) return null;
        if (typeof p === "string") return { _id: asId(p), username: "" };
        if (p.user && typeof p.user === "object") {
          return {
            _id: firstValidId(p.user._id, p.user.id, p._id),
            username: p.user.username || "",
            fullName: p.user.fullName,
            profileImage: p.user.profileImage,
          };
        }
        return {
          _id: firstValidId(p._id, p.id),
          username: p.username || "",
          fullName: p.fullName,
          profileImage: p.profileImage,
        };
      })
      .filter(Boolean) as Participant[];
  }

  function normalizeTeamSubMatch(sm: any, team1Id: string, team2Id: string) {
    const fs = sm?.finalScore || {};
    const scoreMap = mapLikeToRecord(fs.scoresByTeamId);
    const team1Sets =
      fs.team1Sets ??
      fs.team1Games ??
      (team1Id ? Number(scoreMap[team1Id] ?? 0) : 0);
    const team2Sets =
      fs.team2Sets ??
      fs.team2Games ??
      (team2Id ? Number(scoreMap[team2Id] ?? 0) : 0);

    return {
      ...sm,
      _id: sm._id ? asId(sm._id) : sm._id,
      numberOfSets: Number(sm.numberOfSets ?? sm.numberOfGames ?? 3),
      playerTeam1: normalizeSubMatchPlayers(sm.playerTeam1),
      playerTeam2: normalizeSubMatchPlayers(sm.playerTeam2),
      finalScore: {
        team1Sets: Number(team1Sets ?? 0),
        team2Sets: Number(team2Sets ?? 0),
      },
      games: (Array.isArray(sm.games) ? sm.games : []).map((g: any, idx: number) => ({
        ...g,
        gameNumber: g.gameNumber ?? idx + 1,
        team1Score: g.team1Score,
        team2Score: g.team2Score,
        completed: g.completed ?? g.status === "completed",
        winnerSide: g.winnerSide ?? null,
        shots: g.shots ?? [],
      })),
    };
  }

  const normalizeMatch = (raw: any): IndividualMatch | TeamMatch => {
    if (raw.matchCategory === "team") {
      const team1Id = String(raw.team1?._id ?? "");
      const team2Id = String(raw.team2?._id ?? "");
      const setsPerRubber = Number(
        raw.numberOfSetsPerSubMatch ??
          raw.numberOfGamesPerRubber ??
          raw.subMatches?.[0]?.numberOfSets ??
          raw.subMatches?.[0]?.numberOfGames ??
          3
      );

      return {
        _id: firstValidId(raw._id, raw.id),
        matchCategory: "team",
        matchFormat: raw.matchFormat,
        numberOfSetsPerSubMatch: setsPerRubber,
        team1: {
          _id: team1Id,
          name: raw.team1.name,
          players: (raw.team1.players || []).map(normalizeTeamPlayer),
          logo: raw.team1.logo,
          assignments: raw.team1.assignments || {},
          city: raw.team1.city || "",
          stats: raw.team1.stats || {},
        },
        team2: {
          _id: team2Id,
          name: raw.team2.name,
          players: (raw.team2.players || []).map(normalizeTeamPlayer),
          logo: raw.team2.logo,
          assignments: raw.team2.assignments || {},
          city: raw.team2.city || "",
          stats: raw.team2.stats || {},
        },
        city: raw.city,
        venue: raw.venue,
        scorer: normalizeScorer(raw.scorer),
        tournament: raw.tournament ?? null,
        subMatches: (raw.subMatches || []).map((sm: any) =>
          normalizeTeamSubMatch(sm, team1Id, team2Id)
        ),
        currentSubMatch: raw.currentSubMatch || 1,
        status: raw.status,
        finalScore: raw.finalScore,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };
    }

    // otherwise individual
    const participants = normalizeParticipants(raw.participants);
    const teams = normalizeTeams(raw.teams, participants);
    return {
      _id: firstValidId(raw._id, raw.id),
      matchCategory: "individual",
      matchType: raw.matchType,
      numberOfSets: Number(raw.numberOfSets ?? 3),
      teams,
      participants,
      scorer: normalizeScorer(raw.scorer),
      city: raw.city,
      venue: raw.venue,
      status: raw.status,
      currentGame: raw.currentGame ?? 1,
      bracketPosition: raw.bracketPosition,
      roundName: raw.roundName,
      games: (Array.isArray(raw.games) ? raw.games : []).map(
        (g: any, idx: number) => {
          const scoreMap = firstNonEmptyRecord(
            mapLikeToRecord(g.scoresById),
            mapLikeToRecord(g.scores),
            mapLikeToRecord(g.scoresByPlayerId)
          );
          return ({
          gameNumber: g.gameNumber ?? idx + 1,
          scoresByTeam: (() => {
            if (Array.isArray(g.scoresByTeam) && g.scoresByTeam.length >= 2) {
              return g.scoresByTeam.map(Number);
            }
            if (g.team1Score != null || g.team2Score != null) {
              return [
                Number(g.team1Score ?? 0),
                Number(g.team2Score ?? 0),
              ];
            }
            if (g.side1Score != null || g.side2Score != null) {
              return [
                Number(g.side1Score ?? 0),
                Number(g.side2Score ?? 0),
              ];
            }
            const vals = Object.values(scoreMap).map((n) => Number(n));
            if (vals.length >= 2) return [vals[0], vals[1]];
            return undefined;
          })(),
          scoresById: scoreMap,
          winnerId: g.winnerId ? asId(g.winnerId) : null,
          winnerTeamIndex:
            typeof g.winnerTeamIndex === "number" ? g.winnerTeamIndex : null,
          winnerSide:
            g.winnerSide ??
            (g.winnerTeamIndex === 0
              ? "side1"
              : g.winnerTeamIndex === 1
                ? "side2"
                : null),
          completed: g.completed ?? false,
          expedite: g.expedite ?? false,
          shots: g.shots ?? [],
          duration: g.duration,
          startTime: g.startTime,
          endTime: g.endTime,
        })}
      ),
      finalScore: {
        setsByTeam: (() => {
          if (Array.isArray(raw.finalScore?.setsByTeam) && raw.finalScore.setsByTeam.length >= 2) {
            return raw.finalScore.setsByTeam.map(Number);
          }
          if (raw.finalScore?.side1Sets != null || raw.finalScore?.side2Sets != null) {
            return [
              Number(raw.finalScore?.side1Sets ?? 0),
              Number(raw.finalScore?.side2Sets ?? 0),
            ];
          }
          return undefined;
        })(),
        setsById: mapLikeToRecord(raw.finalScore?.setsById),
      },
      winnerTeamIndex:
        typeof raw.winnerTeamIndex === "number" ? raw.winnerTeamIndex : null,
      winnerId: raw.winnerId ? asId(raw.winnerId) : null,
      winnerSide:
        raw.winnerSide ??
        (raw.winnerTeamIndex === 0
          ? "side1"
          : raw.winnerTeamIndex === 1
            ? "side2"
            : null),
      matchDuration: raw.matchDuration,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      currentServer: raw.currentServer ?? null,
      currentServerPlayerId: raw.currentServerPlayerId
        ? asId(raw.currentServerPlayerId)
        : null,
      serverConfig: raw.serverConfig ?? null,
      tournament: raw.tournament ?? null,
    } as IndividualMatch;
  };

  return {
    match: null,
    setMatch: (m) => set({ match: m }),

    updating: false,
    fetchingMatch: false,

    setupDialogOpen: false,
    setSetupDialogOpen: (open) => set({ setupDialogOpen: open }),

    serverDialogOpen: false,
    setServerDialogOpen: (open) => set({ serverDialogOpen: open }),

    fetchMatch: async (id, category, options) => {
      const normalizedId = normalizeMatchIdParam(id);
      const currentMatchId = normalizeMatchIdParam(get().match?._id);
      if (!normalizedId || normalizedId !== currentMatchId) {
        set({ match: null, fetchingMatch: true });
      } else {
        set({ fetchingMatch: true });
      }
      try {
        if (!normalizedId) {
          console.error("fetchMatch: missing or invalid match id", id);
          Alert.alert("Error", "Invalid match link");
          set({ match: null });
          return;
        }

        const queryParts: string[] = [];
        const view = options?.view ?? "details";
        queryParts.push(`view=${encodeURIComponent(view)}`);
        if (typeof options?.includeShots === "boolean") {
          queryParts.push(`includeShots=${options.includeShots ? "1" : "0"}`);
        }
        const query = queryParts.join("&");
        const res = await axiosInstance.get(
          `/matches/${category}/${normalizedId}${query ? `?${query}` : ""}`
        );
        const normalizedMatch = normalizeMatch(res.data.match || res.data);
        set({ match: normalizedMatch });
      } catch (err: any) {
        console.error(
          `Error fetching ${category} match:`,
          err.response?.data || err
        );
        Alert.alert("Error", `Failed to load ${category} match`);
        set({ match: null });
        throw err;
      } finally {
        set({ fetchingMatch: false });
      }
    },
  };
});