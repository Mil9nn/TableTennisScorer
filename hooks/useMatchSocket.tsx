import { useEffect, useRef, useCallback, useState } from "react";
import { useSocket } from "./useSocket";
import { useSocketEvent } from "./useSocketEvent";
import { useMatchStore } from "./useMatchStore";
import {
  ScoreUpdateEvent,
  ShotRecordedEvent,
  ServerChangeEvent,
  GameCompletedEvent,
  MatchCompletedEvent,
} from "@/types/socket.type";
import { gamePointsByTeamIndex, getScoringIds } from "@/lib/match/singlesClient";

function shotAlreadyInGame(existing: any[], incoming: any): boolean {
  const inId = incoming?._id != null ? String(incoming._id) : "";
  const inNum =
    incoming?.shotNumber != null && incoming.shotNumber !== ""
      ? Number(incoming.shotNumber)
      : NaN;
  const inTs = incoming?.timestamp != null ? String(incoming.timestamp) : "";
  return existing.some((s: any) => {
    if (inId && String(s?._id) === inId) return true;
    if (Number.isFinite(inNum) && Number(s?.shotNumber) === inNum) return true;
    if (inTs && String(s?.timestamp) === inTs) return true;
    return false;
  });
}

interface UseMatchSocketOptions {
  matchId: string;
  matchCategory: "individual" | "team";
  role: "scorer" | "viewer";
  enabled?: boolean;
}

interface UseMatchSocketReturn {
  socket: ReturnType<typeof useSocket>["socket"];
  isConnected: boolean;
  isJoined: boolean;
  setIsUpdating: (value: boolean) => void;
}

/**
 * High-level hook for managing socket connection and event handling for matches
 * @param options - Configuration options
 * @returns Socket instance, connection status, join status, and update flag setter
 */
export function useMatchSocket(options: UseMatchSocketOptions): UseMatchSocketReturn {
  const { matchId, matchCategory, role, enabled = true } = options;

  const { socket, isConnected } = useSocket({ enabled });
  const [isJoined, setIsJoined] = useState(false);

  // Track if scorer is currently updating (to prevent processing own updates)
  const isUpdatingRef = useRef(false);

  // Zustand store (subscribe for join-room effect only; handlers must read latest via getState()
  // to avoid stale closures — otherwise e.g. shot:recorded can append shots already applied from the API.)
  const match = useMatchStore((state) => state.match);
  const setMatch = useMatchStore((state) => state.setMatch);
  const fetchMatch = useMatchStore((state) => state.fetchMatch);

  // Join match room when connected
  useEffect(() => {
    if (!socket || !isConnected || !matchId || !enabled) {
      return;
    }

    

    socket.emit("join:match", {
      matchId,
      role,
    });

    setIsJoined(true);

    // If late joiner (no match data yet), fetch current state
    if (!match) {
      
      fetchMatch(matchId, matchCategory).catch((err) => {
        console.error("[MatchSocket] Failed to fetch match state:", err);
      });
    }

    // Leave room on unmount
    return () => {
      if (socket) {
        
        socket.emit("leave:match", { matchId });
        setIsJoined(false);
      }
    };
  }, [socket, isConnected, matchId, matchCategory, role, enabled]);

  // Handler: Score Update
  const handleScoreUpdate = useCallback(
    (data: ScoreUpdateEvent) => {
      

      // Skip if we're the scorer and currently updating
      if (role === "scorer" && isUpdatingRef.current) {
        
        return;
      }

      // Only process updates for this match
      if (data.matchId !== matchId) {
        return;
      }

      const latest = useMatchStore.getState().match;
      if (!latest) {
        // Fetch full match if we don't have it
        fetchMatch(matchId, matchCategory);
        return;
      }

      // Update match state based on score update
      const updatedMatch: any = { ...latest };

      if (matchCategory === "individual" && "games" in updatedMatch) {
        const payload = data as ScoreUpdateEvent & {
          scoresById?: Record<string, number>;
          scoresByTeam?: number[];
          currentServerPlayerId?: string | null;
        };

        updatedMatch.games = (latest.games || []).map((g: any) => ({
          ...g,
          shots: Array.isArray(g.shots) ? [...g.shots] : [],
        }));

        const gameIdx = updatedMatch.games.findIndex(
          (g: any) => g.gameNumber === data.gameNumber
        );
        let currentGame =
          gameIdx >= 0 ? updatedMatch.games[gameIdx] : undefined;

        if (!currentGame) {
          currentGame = {
            gameNumber: data.gameNumber,
            scoresByTeam: [0, 0],
            shots: [],
            winnerSide: null,
            completed: false,
          };
          updatedMatch.games.push(currentGame);
        }

        const scoringIds = getScoringIds(updatedMatch);
        const priorGame = (latest.games || []).find(
          (g: any) => g.gameNumber === data.gameNumber
        );
        let priorTotals: [number, number] | null = null;
        if (priorGame && scoringIds) {
          priorTotals = gamePointsByTeamIndex(
            priorGame,
            scoringIds[0],
            scoringIds[1]
          );
        }

        if (payload.scoresById && typeof payload.scoresById === "object") {
          currentGame.scoresById = { ...payload.scoresById };
          if (scoringIds) {
            const [s1, s2] = gamePointsByTeamIndex(
              currentGame,
              scoringIds[0],
              scoringIds[1]
            );
            currentGame.scoresByTeam = [s1, s2];
            currentGame.team1Score = s1;
            currentGame.team2Score = s2;

            if (priorTotals && (s1 < priorTotals[0] || s2 < priorTotals[1])) {
              const lostLeft = s1 < priorTotals[0];
              const lostRight = s2 < priorTotals[1];
              const shots = [...(currentGame.shots || [])];
              for (let i = shots.length - 1; i >= 0; i--) {
                const shot = shots[i];
                const shotSide =
                  typeof shot?.side === "string" ? shot.side : "";
                const matchesLeft =
                  lostLeft &&
                  (shotSide === scoringIds[0] ||
                    shotSide === "side1" ||
                    shotSide === "team1");
                const matchesRight =
                  lostRight &&
                  (shotSide === scoringIds[1] ||
                    shotSide === "side2" ||
                    shotSide === "team2");
                if (matchesLeft || matchesRight) {
                  shots.splice(i, 1);
                  break;
                }
              }
              currentGame.shots = shots;
            }
          }
        } else if (
          data.side1Score != null &&
          data.side2Score != null
        ) {
          currentGame.scoresByTeam = [data.side1Score, data.side2Score];
          currentGame.team1Score = data.side1Score;
          currentGame.team2Score = data.side2Score;
        } else if (Array.isArray(payload.scoresByTeam)) {
          currentGame.scoresByTeam = [...payload.scoresByTeam];
          currentGame.team1Score = payload.scoresByTeam[0] ?? 0;
          currentGame.team2Score = payload.scoresByTeam[1] ?? 0;
        }

        currentGame.completed = data.gameCompleted ?? false;
        currentGame.winnerSide = data.gameWinner;

        updatedMatch.currentServer =
          data.currentServer ??
          payload.currentServerPlayerId ??
          updatedMatch.currentServer;

        // Update sets
        if (data.finalScore) {
          const scoringIds = getScoringIds(updatedMatch);
          const setsByTeam = [
            Number(data.finalScore.side1Sets ?? 0),
            Number(data.finalScore.side2Sets ?? 0),
          ];
          const setsById =
            scoringIds != null
              ? {
                  [scoringIds[0]]: setsByTeam[0],
                  [scoringIds[1]]: setsByTeam[1],
                }
              : undefined;
          updatedMatch.finalScore = {
            setsByTeam,
            ...(setsById ? { setsById } : {}),
          };
        }
      }

      setMatch(updatedMatch);
    },
    [role, matchId, matchCategory, setMatch, fetchMatch]
  );

  // Handler: Shot Recorded
  const handleShotRecorded = useCallback(
    (data: ShotRecordedEvent) => {
      

      // Skip if we're the scorer and currently updating
      if (role === "scorer" && isUpdatingRef.current) {
        
        return;
      }

      if (data.matchId !== matchId) {
        return;
      }

      const latest = useMatchStore.getState().match as any;
      if (!latest) {
        return;
      }

      if (matchCategory !== "individual" || !Array.isArray(latest.games)) {
        return;
      }

      const gameIdx = latest.games.findIndex(
        (g: any) => g.gameNumber === data.gameNumber
      );
      if (gameIdx < 0) {
        return;
      }

      const existingShots = latest.games[gameIdx].shots || [];
      if (shotAlreadyInGame(existingShots, data.shot as any)) {
        return;
      }

      const incoming = data.shot as any;
      const updatedMatch = {
        ...latest,
        games: latest.games.map((g: any, i: number) =>
          i === gameIdx ? { ...g, shots: [...existingShots, incoming] } : g
        ),
      };

      setMatch(updatedMatch);
    },
    [role, matchId, matchCategory, setMatch]
  );

  // Handler: Server Change
  const handleServerChange = useCallback(
    (data: ServerChangeEvent) => {
      

      // Skip if we're the scorer and currently updating
      if (role === "scorer" && isUpdatingRef.current) {
        
        return;
      }

      if (data.matchId !== matchId) {
        return;
      }

      const latest = useMatchStore.getState().match as any;
      if (!latest) {
        return;
      }

      // Update match state with new server
      const updatedMatch: any = { ...latest };
      updatedMatch.currentServer = data.currentServer;

      setMatch(updatedMatch);
    },
    [role, matchId, setMatch]
  );

  // Handler: Game Completed
  const handleGameCompleted = useCallback(
    (data: GameCompletedEvent) => {
      

      if (data.matchId !== matchId) {
        return;
      }

      // Refetch to get full updated state
      fetchMatch(matchId, matchCategory);
    },
    [matchId, matchCategory, fetchMatch]
  );

  // Handler: Match Completed
  const handleMatchCompleted = useCallback(
    (data: MatchCompletedEvent) => {
      

      if (data.matchId !== matchId) {
        return;
      }

      // Refetch to get full final state
      fetchMatch(matchId, matchCategory);
    },
    [matchId, matchCategory, fetchMatch]
  );

  // Register event listeners
  useSocketEvent(socket, "score:update", handleScoreUpdate);
  useSocketEvent(socket, "shot:recorded", handleShotRecorded);
  useSocketEvent(socket, "server:change", handleServerChange);
  useSocketEvent(socket, "game:completed", handleGameCompleted);
  useSocketEvent(socket, "match:completed", handleMatchCompleted);

  // Function to set updating flag (called by scorer before/after updates)
  const setIsUpdating = useCallback((value: boolean) => {
    isUpdatingRef.current = value;
  }, []);

  return {
    socket,
    isConnected,
    isJoined,
    setIsUpdating,
  };
}

