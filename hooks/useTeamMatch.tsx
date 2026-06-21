// hooks/useTeamMatch.tsx
import { create } from "zustand";
import Toast from "react-native-toast-message";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  TeamMatch,
  SubMatch,
  MatchStatus,
  PlayerKey,
  IndividualGame,
} from "@/types/match.type";
import { singlesGamePointScores } from "@/lib/match/singlesClient";
import {
  isRubberComplete,
  readRubberSetCounts,
  rubberBestOf,
} from "@/lib/teamMatchRubber";
import { useMatchStore } from "./useMatchStore";

function subMatchHeadToHeadPlayerIds(sub: SubMatch | null): [string, string] | null {
  if (!sub) return null;
  const raw1 = sub.playerTeam1;
  const raw2 = sub.playerTeam2;
  const p1 = Array.isArray(raw1) ? raw1[0] : raw1;
  const p2 = Array.isArray(raw2) ? raw2[0] : raw2;
  const id1 = (p1 as { _id?: string })?._id?.toString();
  const id2 = (p2 as { _id?: string })?._id?.toString();
  if (id1 && id2) return [id1, id2];
  return null;
}

function readRubberGameScores(
  game: IndividualGame | undefined,
  sub: SubMatch | null,
  fallbackT1: number,
  fallbackT2: number
): { t1: number; t2: number } {
  if (!game) return { t1: fallbackT1, t2: fallbackT2 };
  const g = game as IndividualGame;
  const pair = subMatchHeadToHeadPlayerIds(sub);
  if (pair) {
    const pt = singlesGamePointScores(g, pair[0], pair[1]);
    return { t1: pt.team0, t2: pt.team1 };
  }
  return {
    t1: Number((g as IndividualGame).team1Score ?? fallbackT1),
    t2: Number((g as IndividualGame).team2Score ?? fallbackT2),
  };
}

function isRubberGameComplete(game: IndividualGame): boolean {
  const g = game as IndividualGame & {
    status?: string;
    completed?: boolean;
    winnerId?: unknown;
    winnerSide?: string | null;
  };
  return Boolean(
    g.completed ||
      g.winnerSide ||
      g.winnerId ||
      g.status === "completed"
  );
}

/** Last in-progress rubber game, or the latest game if all are complete. */
function resolveActiveRubberGame(
  subMatch: SubMatch,
  preferredGameNumber?: number
): { game: IndividualGame | undefined; gameNumber: number } {
  const games = subMatch.games || [];
  const preferred =
    preferredGameNumber ??
    games[games.length - 1]?.gameNumber ??
    1;

  if (!games.length) {
    return { game: undefined, gameNumber: preferred };
  }

  const atPreferred = games.find((g) => g.gameNumber === preferred);
  if (atPreferred && !isRubberGameComplete(atPreferred)) {
    return { game: atPreferred, gameNumber: preferred };
  }

  const inProgress = games.filter((g) => !isRubberGameComplete(g));
  if (inProgress.length > 0) {
    const latest = inProgress.reduce((a, b) =>
      (a.gameNumber ?? 0) >= (b.gameNumber ?? 0) ? a : b
    );
    return { game: latest, gameNumber: latest.gameNumber ?? preferred };
  }

  if (atPreferred) {
    return { game: atPreferred, gameNumber: preferred };
  }

  const last = games[games.length - 1];
  return {
    game: last,
    gameNumber: last?.gameNumber ?? preferred,
  };
}

type SetInitialTeamMatchOptions = {
  /** Keep the scorer's selected rubber when server `currentSubMatch` is stale. */
  preserveSubMatchIndex?: boolean;
};

function resolveActiveSubMatchIndex(
  match: TeamMatch,
  localIndex: number,
  preserveSubMatchIndex?: boolean
): number {
  const serverIndex = Math.max(0, (match.currentSubMatch || 1) - 1);
  if (!preserveSubMatchIndex) return serverIndex;

  if (localIndex < 0 || localIndex >= match.subMatches.length) {
    return serverIndex;
  }

  const localSub = match.subMatches[localIndex];
  if (!localSub) return serverIndex;

  if (localSub.status === "completed" || isRubberComplete(localSub, match)) {
    return serverIndex;
  }

  return localIndex;
}

interface TeamMatchState {
  currentSubMatchIndex: number;
  currentSubMatch: SubMatch | null;

  team1Score: number;
  team2Score: number;
  currentGame: number;
  team1Sets: number;
  team2Sets: number;

  currentServer: string | null;

  isMatchActive: boolean;
  isSubMatchActive: boolean;
  status: MatchStatus;

  isUpdatingTeamScore: boolean;
  isStartingSubMatch: boolean;
  isUndoing?: boolean;

  setInitialTeamMatch: (
    match: TeamMatch,
    options?: SetInitialTeamMatchOptions
  ) => void;
  updateSubMatchScore: (
    side: "team1" | "team2",
    increment: number,
    shotType?: string,
    playerId?: string,
    shotLocationData?: {
      originX: number;
      originY: number;
      landingX: number;
      landingY: number;
    }
  ) => Promise<void>;
  subtractPoint: (side: PlayerKey) => Promise<void>;
  toggleSubMatch: () => Promise<void>;
  resetSubMatch: (fullReset?: boolean) => Promise<void>;
  swapSides: () => Promise<void>;
}

export const useTeamMatch = create<TeamMatchState>((set, get) => ({
  currentSubMatchIndex: 0,
  currentSubMatch: null,

  team1Score: 0,
  team2Score: 0,
  currentGame: 1,
  team1Sets: 0,
  team2Sets: 0,

  currentServer: null,

  isMatchActive: false,
  isSubMatchActive: false,
  status: "scheduled" as MatchStatus,

  isUpdatingTeamScore: false,
  isStartingSubMatch: false,
  isUndoing: false,

  setInitialTeamMatch: (match: TeamMatch, options?: SetInitialTeamMatchOptions) => {
    if (!match) return;

    const currentIndex = resolveActiveSubMatchIndex(
      match,
      get().currentSubMatchIndex,
      options?.preserveSubMatchIndex
    );
    const subMatch = match.subMatches[currentIndex];

    if (!subMatch) {
      set({
        currentSubMatchIndex: 0,
        currentSubMatch: null,
        team1Score: 0,
        team2Score: 0,
        currentGame: 1,
        team1Sets: 0,
        team2Sets: 0,
        isSubMatchActive: false,
        status: match.status,
        currentServer: null,
      });
      return;
    }

    const rubberDone = isRubberComplete(subMatch, match);
    const { team1Sets, team2Sets } = readRubberSetCounts(
      subMatch,
      match.team1?._id,
      match.team2?._id
    );

    const preferredGame = get().currentGame;
    const { game: activeGame, gameNumber: gameToUse } = resolveActiveRubberGame(
      subMatch,
      rubberDone ? undefined : preferredGame
    );

    let serverToUse: string | null = null;

    if (subMatch.currentServer) {
      serverToUse = subMatch.currentServer;
    }

    const rubber = readRubberGameScores(activeGame, subMatch, 0, 0);

    set({
      currentSubMatchIndex: currentIndex,
      currentSubMatch: subMatch,
      team1Score: rubber.t1,
      team2Score: rubber.t2,
      currentGame: gameToUse,
      team1Sets,
      team2Sets,
      isSubMatchActive: subMatch.status === "in_progress" && !rubberDone,
      status: match.status,
      currentServer: serverToUse,
    });
  },

  updateSubMatchScore: async (
    side,
    increment,
    shotType,
    playerId,
    shotLocationData?: {
      originX: number;
      originY: number;
      landingX: number;
      landingY: number;
    }
  ) => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) return;

    const subMatchId = get().currentSubMatch?._id;
    if (!subMatchId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No submatch selected!",
      });
      return;
    }

    const {
      currentSubMatchIndex,
      team1Score,
      team2Score,
      currentGame,
      isSubMatchActive,
      status,
      isUpdatingTeamScore,
      isUndoing,
      isStartingSubMatch,
    } = get();

    // Hard guard against rapid multi-taps causing overlapping score requests.
    if (isUpdatingTeamScore || isUndoing || isStartingSubMatch) {
      return;
    }

    if (status === "completed") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Match is completed!",
      });
      return;
    }

    // Auto-start rubber when it is still scheduled (team match may already be in_progress).
    if (!isSubMatchActive) {
      const subStatus = get().currentSubMatch?.status;
      if (subStatus === "scheduled") {
        try {
          await get().toggleSubMatch();
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error("Failed to auto-start submatch:", error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to start the submatch",
          });
          return;
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Start the submatch first",
        });
        return;
      }
    }

    const subMatch = get().currentSubMatch;
    if (subMatch && isRubberComplete(subMatch, match)) {
      Toast.show({
        type: "error",
        text1: "Rubber complete",
        text2: `Best of ${rubberBestOf(subMatch, match)} — start the next tie match`,
      });
      return;
    }

    const newT1 = side === "team1" ? team1Score + increment : team1Score;
    const newT2 = side === "team2" ? team2Score + increment : team2Score;

    if (newT1 < 0 || newT2 < 0) return;

    const isGameWon =
      (newT1 >= 11 || newT2 >= 11) && Math.abs(newT1 - newT2) >= 2;

    const requestBody: any = {
      gameNumber: currentGame,
      team1Score: newT1,
      team2Score: newT2,
    };

    if (increment > 0 && playerId) {
      requestBody.shotData = {
        side,
        player: playerId,
        stroke: shotType ?? null,
        server: null,
        originX: shotLocationData?.originX,
        originY: shotLocationData?.originY,
        landingX: shotLocationData?.landingX,
        landingY: shotLocationData?.landingY,
      };
    }

    set({ isUpdatingTeamScore: true });
    try {
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/submatch/${subMatchId}/score`,
        requestBody
      );

      if (data?.match) {
        const updated = data.match as TeamMatch;
        const idx = resolveActiveSubMatchIndex(
          updated,
          get().currentSubMatchIndex,
          true
        );
        const withIndex = { ...updated, currentSubMatch: idx + 1 };
        useMatchStore.getState().setMatch(withIndex);
        get().setInitialTeamMatch(withIndex, { preserveSubMatchIndex: true });

        if (isGameWon) {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: `Game ${currentGame} won!`,
          });
        }
      }
    } catch (err) {
      console.error("Score update error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update score",
      });
    } finally {
      set({ isUpdatingTeamScore: false });
    }
  },

  subtractPoint: async (side) => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) return;

    const subMatchId = get().currentSubMatch?._id;
    if (!subMatchId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No submatch selected!",
      });
      return;
    }

    const {
      currentSubMatchIndex,
      currentGame,
      isSubMatchActive,
      status,
      isUpdatingTeamScore,
      isUndoing,
      isStartingSubMatch,
      team1Score,
      team2Score,
      currentServer,
    } = get();

    // Guard against concurrent score/undo/start operations.
    if (isUpdatingTeamScore || isUndoing || isStartingSubMatch) {
      return;
    }

    if (status === "completed") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Match is completed!",
      });
      return;
    }

    if (!isSubMatchActive) {
      const subStatus = get().currentSubMatch?.status;
      if (subStatus === "scheduled") {
        try {
          await get().toggleSubMatch();
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error("Failed to auto-start submatch:", error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to start the submatch",
          });
          return;
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Start the submatch first",
        });
        return;
      }
    }

    set({ isUndoing: true });
    try {
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/submatch/${subMatchId}/score`,
        {
          action: "subtract",
          side,
          gameNumber: currentGame,
        }
      );

      if (data?.match) {
        const updatedMatch = data.match as TeamMatch;
        const idx = resolveActiveSubMatchIndex(
          updatedMatch,
          get().currentSubMatchIndex,
          true
        );
        const withIndex = { ...updatedMatch, currentSubMatch: idx + 1 };
        useMatchStore.getState().setMatch(withIndex);
        get().setInitialTeamMatch(withIndex, { preserveSubMatchIndex: true });
        const sub = withIndex.subMatches?.[get().currentSubMatchIndex];
        if (sub) {
          const { game, gameNumber } = resolveActiveRubberGame(sub, currentGame);
          const rubber = readRubberGameScores(game, sub, 0, 0);
          set({
            team1Score: rubber.t1,
            team2Score: rubber.t2,
            currentGame: gameNumber,
          });
        }
      }
    } catch (err) {
      console.error("Subtract point error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to subtract point",
      });
    } finally {
      set({ isUndoing: false });
    }
  },

  toggleSubMatch: async () => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) return;

    const subMatchId = get().currentSubMatch?._id;
    if (!subMatchId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No submatch selected!",
      });
      return;
    }

    const { isSubMatchActive } = get();
    const nextStatus: MatchStatus = isSubMatchActive
      ? "scheduled"
      : "in_progress";

    set({ isStartingSubMatch: true });
    try {
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/submatch/${subMatchId}/status`,
        { status: nextStatus }
      );

      if (data?.match) {
        const updated = data.match as TeamMatch;
        const idx = resolveActiveSubMatchIndex(
          updated,
          get().currentSubMatchIndex,
          true
        );
        const withIndex = { ...updated, currentSubMatch: idx + 1 };
        useMatchStore.getState().setMatch(withIndex);
        get().setInitialTeamMatch(withIndex, { preserveSubMatchIndex: true });

        if (nextStatus === "in_progress") {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "SubMatch started!",
          });
        } else {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "SubMatch paused",
          });
        }
      }
    } catch (err) {
      console.error("Toggle submatch error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to toggle submatch",
      });
    } finally {
      set({ isStartingSubMatch: false });
    }
  },

  resetSubMatch: async (fullReset = false) => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No match loaded",
      });
      return;
    }

    const subMatchId = get().currentSubMatch?._id;
    if (!subMatchId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No submatch selected!",
      });
      return;
    }

    const resetType = fullReset || get().currentSubMatch?.status === "completed" ? "submatch" : "game";

    try {
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/submatch/${subMatchId}/reset`,
        { resetType }
      );

      if (data?.match) {
        const updated = data.match as TeamMatch;
        const idx = resolveActiveSubMatchIndex(
          updated,
          get().currentSubMatchIndex,
          true
        );
        const withIndex = { ...updated, currentSubMatch: idx + 1 };
        useMatchStore.getState().setMatch(withIndex);
        get().setInitialTeamMatch(withIndex, { preserveSubMatchIndex: true });
        Toast.show({
          type: "success",
          text1: "Success",
          text2: resetType === "submatch" ? "Submatch restarted" : "Game reset",
        });
      }
    } catch (err: any) {
      console.error("resetSubMatch error", err);
      const errorMessage = err?.response?.data?.error || err?.message || "Failed to reset submatch";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      });
    }
  },

  swapSides: async () => {
    const match = useMatchStore.getState().match as TeamMatch | null;
    if (!match) return;

    set({ isUpdatingTeamScore: true });
    try {
      const { data } = await axiosInstance.post(
        `/matches/team/${match._id}/swap`
      );

      if (data?.match) {
        const updated = data.match as TeamMatch;
        const idx = resolveActiveSubMatchIndex(
          updated,
          get().currentSubMatchIndex,
          true
        );
        const withIndex = { ...updated, currentSubMatch: idx + 1 };
        useMatchStore.getState().setMatch(withIndex);
        get().setInitialTeamMatch(withIndex, { preserveSubMatchIndex: true });
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Teams swapped!",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Failed to swap teams",
      });
    } finally {
      set({ isUpdatingTeamScore: false });
    }
  },
}));

