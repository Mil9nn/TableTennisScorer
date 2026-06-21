import { create } from "zustand";

import Toast from "react-native-toast-message";

import { axiosInstance } from "@/lib/axiosInstance";

import { useMatchStore } from "./useMatchStore";

import { checkGameWon } from "@/lib/helpers";

import {

  IndividualMatch,

  MatchStatus,

  PlayerKey,

  ServerKey,

  IndividualGame,

  Participant,

} from "@/types/match.type";

import {
  getScoringIds,
  getSetScores,
  gamePointsByTeamIndex,
  resolveActiveIndividualGame,
} from "@/lib/match/singlesClient";



interface IndividualMatchState {

  match: IndividualMatch | null;

  leftPoints: number;

  rightPoints: number;

  currentServer: ServerKey | null;

  currentGame: number;

  leftSets: number;

  rightSets: number;

  status: MatchStatus;

  isMatchActive: boolean;

  isUpdatingScore: boolean;

  isUndoing: boolean;

  isStartingMatch: boolean;



  setInitialMatch: (match: IndividualMatch) => void;

  updateScore: (

    side: PlayerKey,

    points: number,

    shotType?: string,

    playerId?: string,

    shotData?: {

      originX?: number;

      originY?: number;

      landingX?: number;

      landingY?: number;

      serveType?: string | null;

    }

  ) => Promise<void>;

  subtractPoint: (side: PlayerKey) => Promise<void>;

  resetGame: (fullReset?: boolean) => Promise<void>;

  toggleMatch: () => Promise<void>;

  swapSides: () => Promise<void>;

}



function readScoresFromMatch(
  match: IndividualMatch,
  preferredGameNumber?: number
): {
  p1: number;
  p2: number;
  currentGameNum: number;
} {
  const { game: currentGameData, gameNumber: currentGameNum } =
    resolveActiveIndividualGame(match, preferredGameNumber);

  let p1 = 0;
  let p2 = 0;
  if (currentGameData) {
    const ids = getScoringIds(match);
    if (ids) {
      const [a, b] = gamePointsByTeamIndex(currentGameData, ids[0], ids[1]);
      p1 = a;
      p2 = b;
    } else {
      const [a, b] = gamePointsByTeamIndex(currentGameData, null, null);
      p1 = a;
      p2 = b;
    }
  }
  return { p1, p2, currentGameNum };
}



export const useIndividualMatch = create<IndividualMatchState>((set, get) => {

  const syncFromMatch = (match: IndividualMatch, preferredGameNumber?: number) => {
    const { p1, p2, currentGameNum } = readScoresFromMatch(
      match,
      preferredGameNumber ?? get().currentGame
    );

    const [s1, s2] = getSetScores(match);

    set({

      match,

      leftPoints: p1,

      rightPoints: p2,

      currentServer: (match.currentServerPlayerId || match.currentServer) ?? null,

      currentGame: currentGameNum,

      leftSets: s1,

      rightSets: s2,

      status: match.status,

      isMatchActive: match.status === "in_progress",

    });

    useMatchStore.getState().setMatch(match);

  };



  return {

    match: null,

    leftPoints: 0,

    rightPoints: 0,

    currentServer: null,

    currentGame: 1,

    leftSets: 0,

    rightSets: 0,

    status: "scheduled",

    isMatchActive: false,

    isUpdatingScore: false,

    isUndoing: false,

    isStartingMatch: false,



    setInitialMatch: (match) => {

      if (!match) return;



      if (match.status === "completed") {

        const lastGameNumber = match.games?.length

          ? Math.max(...match.games.map((g) => g.gameNumber || 0))

          : match.currentGame ?? 1;

        const [s1, s2] = getSetScores(match);

        set({

          match,

          currentServer: (match.currentServer as ServerKey) ?? null,

          leftPoints: 0,

          rightPoints: 0,

          currentGame: lastGameNumber,

          leftSets: s1,

          rightSets: s2,

          status: "completed",

          isMatchActive: false,

        });

        useMatchStore.getState().setMatch(match);

        return;

      }



      const { p1, p2, currentGameNum } = readScoresFromMatch(match);
      const [s1, s2] = getSetScores(match);
      const serverFromConfig = match.serverConfig?.firstServerPlayerId as
        | ServerKey
        | undefined;

      set({
        match,
        leftPoints: p1,
        rightPoints: p2,
        currentServer:
          serverFromConfig ??
          ((match.currentServerPlayerId || match.currentServer) as ServerKey) ??
          null,
        currentGame: currentGameNum,
        leftSets: s1,
        rightSets: s2,
        status: match.status,
        isMatchActive: match.status === "in_progress",
      });
      useMatchStore.getState().setMatch(match);
    },



    updateScore: async (player, increment, shotType, playerId, shotLocationData) => {

      const match = useMatchStore.getState().match as IndividualMatch | null;

      if (!match) {

        Toast.show({ type: "error", text1: "Error", text2: "No match loaded" });

        return;

      }



      const { leftPoints, rightPoints, currentGame, isMatchActive, status } = get();



      if (match.status === "completed" || status === "completed") {

        Toast.show({

          type: "error",

          text1: "Error",

          text2: "Match is completed! Reset to continue.",

        });

        return;

      }



      if (!isMatchActive && status === "scheduled") {

        try {

          await get().toggleMatch();

          await new Promise((r) => setTimeout(r, 120));

        } catch {

          Toast.show({ type: "error", text1: "Error", text2: "Failed to start the match" });

          return;

        }

      } else if (!isMatchActive) {

        Toast.show({ type: "error", text1: "Error", text2: "Start the match first" });

        return;

      }



      const isLeft = player === "side1" || player === "team1";

      const newP1 = isLeft ? leftPoints + increment : leftPoints;

      const newP2 = !isLeft ? rightPoints + increment : rightPoints;

      if (newP1 < 0 || newP2 < 0) return;



      const gameWinnerSide = checkGameWon(newP1, newP2);

      const ids = getScoringIds(match);

      const leftPlayerId = ids?.[0];

      const rightPlayerId = ids?.[1];

      const scoringId = isLeft ? leftPlayerId : rightPlayerId;

      const scoresById: Record<string, number> = {};

      if (leftPlayerId) scoresById[leftPlayerId] = newP1;

      if (rightPlayerId) scoresById[rightPlayerId] = newP2;



      const requestBody: Record<string, unknown> = {

        gameNumber: currentGame,

        scoringId,

        scoresById,

      };



      if (increment > 0) {

        let shotPlayerId: string | undefined;

        if (playerId !== undefined && playerId !== null && playerId !== "") {

          shotPlayerId = typeof playerId === "string" ? playerId : String(playerId);

        }

        if (!shotPlayerId) {

          const teams = match.teams as { players: Participant[] }[] | undefined;

          if (teams && teams.length === 2) {

            shotPlayerId = isLeft

              ? teams[0]?.players?.[0]?._id?.toString()

              : teams[1]?.players?.[0]?._id?.toString();

          } else {

            shotPlayerId = isLeft ? leftPlayerId : rightPlayerId;

          }

        }

        if (shotPlayerId) {

          const serverId = match.currentServerPlayerId ?? null;

          requestBody.shotData = {

            side: scoringId,

            player: shotPlayerId,

            stroke: shotType ?? null,

            serveType: shotLocationData?.serveType ?? null,

            server: serverId,

            originX: shotLocationData?.originX ?? null,

            originY: shotLocationData?.originY ?? null,

            landingX: shotLocationData?.landingX ?? null,

            landingY: shotLocationData?.landingY ?? null,

          };

        }

      }



      set({ isUpdatingScore: true });

      try {

        const { data } = await axiosInstance.post(

          `/matches/individual/${match._id}/score`,

          requestBody

        );



        if (data?.match) {

          const m = data.match as IndividualMatch;

          useMatchStore.getState().setMatch(m);

          if (gameWinnerSide) {
            const [newSide1Sets, newSide2Sets] = getSetScores(m);
            const matchCompleted = m.status === "completed";

            if (!matchCompleted) {

              const nextGameNum = currentGame + 1;

              const nextGame = (m.games || []).find((g) => g.gameNumber === nextGameNum);

              let nextLeft = 0;

              let nextRight = 0;

              if (nextGame) {

                const [a, b] = gamePointsByTeamIndex(

                  nextGame as IndividualGame,

                  leftPlayerId ?? null,

                  rightPlayerId ?? null

                );

                nextLeft = a;

                nextRight = b;

              }



              set({

                match: m,

                currentGame: nextGameNum,

                leftPoints: nextLeft,

                rightPoints: nextRight,

                currentServer: null,

                leftSets: newSide1Sets,

                rightSets: newSide2Sets,

                status: m.status,

                isMatchActive: m.status === "in_progress",

              });

              Toast.show({

                type: "success",

                text1: "Game won",

                text2: `Starting game ${nextGameNum}`,

              });

            } else {

              set({

                match: m,

                status: "completed",

                isMatchActive: false,

                leftSets: newSide1Sets,

                rightSets: newSide2Sets,

              });

            }

          } else {

            set({

              match: m,

              leftPoints: newP1,

              rightPoints: newP2,

              currentServer: (m.currentServerPlayerId ?? null) as ServerKey,

              status: m.status,

              isMatchActive: m.status === "in_progress",

            });

          }

        }

      } catch (err: unknown) {

        console.error("updateScore error", err);

        const msg =

          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||

          "Failed to update score";

        Toast.show({ type: "error", text1: "Error", text2: msg });

      } finally {

        set({ isUpdatingScore: false });

      }

    },



    subtractPoint: async (player) => {

      const match = useMatchStore.getState().match as IndividualMatch | null;

      if (!match) return;



      const { isMatchActive, status, currentGame } = get();



      if (match.status === "completed" || status === "completed") {

        Toast.show({ type: "error", text1: "Error", text2: "Match is completed!" });

        return;

      }



      if (!isMatchActive && status === "scheduled") {

        try {

          await get().toggleMatch();

          await new Promise((r) => setTimeout(r, 120));

        } catch {

          Toast.show({ type: "error", text1: "Error", text2: "Failed to start the match" });

          return;

        }

      } else if (!isMatchActive) {

        Toast.show({ type: "error", text1: "Error", text2: "Start the match first" });

        return;

      }



      set({ isUndoing: true });

      try {

        const ids = getScoringIds(match);

        const scoringId =

          player === "side1" || player === "team1" ? ids?.[0] : ids?.[1];

        const { data } = await axiosInstance.post(`/matches/individual/${match._id}/score`, {

          action: "subtract",

          scoringId,

          gameNumber: currentGame,

        });



        if (data?.match) {
          const m = data.match as IndividualMatch;
          useMatchStore.getState().setMatch(m);
          syncFromMatch(m, currentGame);
        }

      } catch (err) {

        console.error("subtractPoint error", err);

        Toast.show({ type: "error", text1: "Error", text2: "Failed to undo point" });

      } finally {

        set({ isUndoing: false });

      }

    },



    resetGame: async (fullReset = false) => {

      const match = useMatchStore.getState().match as IndividualMatch | null;

      if (!match?._id) {

        Toast.show({ type: "error", text1: "Error", text2: "No match loaded" });

        return;

      }



      const resetType =

        fullReset || match.status === "completed" ? "match" : "game";



      try {

        const { data } = await axiosInstance.post(`/matches/individual/${match._id}/reset`, {

          resetType,

        });



        if (data?.match) {

          get().setInitialMatch(data.match as IndividualMatch);

          Toast.show({

            type: "success",

            text1: "Done",

            text2: resetType === "match" ? "Match restarted" : "Game reset",

          });

        }

      } catch (err: unknown) {

        console.error("resetGame error", err);

        const msg =

          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||

          "Failed to reset";

        Toast.show({ type: "error", text1: "Error", text2: msg });

      }

    },



    toggleMatch: async () => {

      const match = useMatchStore.getState().match as IndividualMatch | null;

      if (!match) return;



      const currentStatus = get().status;

      if (currentStatus === "completed") {

        Toast.show({

          type: "error",

          text1: "Error",

          text2: "Match is completed! Reset to restart.",

        });

        return;

      }



      const nextStatus: MatchStatus =

        currentStatus === "in_progress" ? "scheduled" : "in_progress";



      set({ isStartingMatch: true });

      try {

        const { data } = await axiosInstance.post(`/matches/individual/${match._id}/status`, {

          status: nextStatus,

        });



        if (data?.match) {

          const m = data.match as IndividualMatch;

          useMatchStore.getState().setMatch(m);

          get().setInitialMatch(m);



          if (nextStatus === "in_progress") {

            const cfg = m.serverConfig as

              | { firstServer?: unknown; firstServerPlayerId?: unknown }

              | null

              | undefined;

            if (!(cfg?.firstServer ?? cfg?.firstServerPlayerId)) {

              setTimeout(() => {

                useMatchStore.getState().setServerDialogOpen(true);

              }, 400);

            }

          } else {

            Toast.show({ type: "info", text1: "Match stopped" });

          }

        }

      } catch (err) {

        console.error("toggleMatch error", err);

        Toast.show({ type: "error", text1: "Error", text2: "Failed to update match status" });

      } finally {

        set({ isStartingMatch: false });

      }

    },



    swapSides: async () => {

      const match = useMatchStore.getState().match as IndividualMatch | null;

      if (!match) return;



      set({ isUpdatingScore: true });

      try {

        const { data } = await axiosInstance.post(`/matches/individual/${match._id}/swap`);



        if (data?.match) {

          useMatchStore.getState().setMatch(data.match);

          get().setInitialMatch(data.match as IndividualMatch);

          Toast.show({ type: "success", text1: "Sides swapped" });

        }

      } catch (err: unknown) {

        const msg =

          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||

          "Failed to swap players";

        Toast.show({ type: "error", text1: "Error", text2: msg });

      } finally {

        set({ isUpdatingScore: false });

      }

    },

  };

});

