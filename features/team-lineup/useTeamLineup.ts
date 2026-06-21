import { useCallback, useEffect, useMemo, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  buildRubberPreview,
  formatRequiresLineup,
  slotsToPlayerAssignments,
  validateLineupForFormat,
  type PlayerAssignments,
  type RubberPreview,
} from "@/shared/match/teamLineup";
import {
  FORMAT_REQUIREMENTS,
  type TeamMatchFormat,
} from "@/shared/match/teamMatchTypes.core";
import type { LineupPlayer, PositionSlots, TeamRoster } from "./types";

function emptySlots(positions: string[]): PositionSlots {
  return Object.fromEntries(positions.map((p) => [p, null]));
}

function mapTeamResponse(team: any): TeamRoster {
  const players: LineupPlayer[] = (team.players ?? []).map((p: any) => {
    const user = p.user ?? {};
    return {
      id: user._id?.toString?.() ?? String(user._id),
      name: user.fullName || user.username || "Player",
      username: user.username,
      profileImage: user.profileImage,
    };
  });

  return {
    id: team._id?.toString?.() ?? String(team._id),
    name: team.name,
    players,
  };
}

export function useTeamLineup(
  team1Id: string,
  team2Id: string,
  matchFormat: TeamMatchFormat
) {
  const [team1, setTeam1] = useState<TeamRoster | null>(null);
  const [team2, setTeam2] = useState<TeamRoster | null>(null);
  const [team1Slots, setTeam1Slots] = useState<PositionSlots>({});
  const [team2Slots, setTeam2Slots] = useState<PositionSlots>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsLineup = formatRequiresLineup(matchFormat);
  const team1Positions = FORMAT_REQUIREMENTS[matchFormat].team1;
  const team2Positions = FORMAT_REQUIREMENTS[matchFormat].team2;

  const loadTeams = useCallback(async () => {
    if (!team1Id || !team2Id || team1Id === team2Id) {
      setTeam1(null);
      setTeam2(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [res1, res2] = await Promise.all([
        axiosInstance.get(`/teams/${team1Id}`),
        axiosInstance.get(`/teams/${team2Id}`),
      ]);
      setTeam1(mapTeamResponse(res1.data.team));
      setTeam2(mapTeamResponse(res2.data.team));
    } catch {
      setError("Failed to load team rosters");
      setTeam1(null);
      setTeam2(null);
    } finally {
      setLoading(false);
    }
  }, [team1Id, team2Id]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    setTeam1Slots(emptySlots(team1Positions));
    setTeam2Slots(emptySlots(team2Positions));
  }, [matchFormat, team1Id, team2Id, team1Positions.join(","), team2Positions.join(",")]);

  const setSlot = useCallback(
    (side: "team1" | "team2", position: string, playerId: string | null) => {
      const setter = side === "team1" ? setTeam1Slots : setTeam2Slots;
      setter((prev) => {
        const next = { ...prev, [position]: playerId };
        if (playerId) {
          for (const [pos, id] of Object.entries(next)) {
            if (pos !== position && id === playerId) next[pos] = null;
          }
        }
        return next;
      });
    },
    []
  );

  const team1Assignments: PlayerAssignments = useMemo(
    () => slotsToPlayerAssignments(team1Slots),
    [team1Slots]
  );

  const team2Assignments: PlayerAssignments = useMemo(
    () => slotsToPlayerAssignments(team2Slots),
    [team2Slots]
  );

  const playerNameResolver = useCallback(
    (playerId: string, side: "team1" | "team2") => {
      const roster = side === "team1" ? team1 : team2;
      return roster?.players.find((p) => p.id === playerId)?.name;
    },
    [team1, team2]
  );

  const rubberPreview: RubberPreview[] = useMemo(() => {
    if (!needsLineup) return [];
    return buildRubberPreview(
      matchFormat,
      team1Assignments,
      team2Assignments,
      playerNameResolver
    );
  }, [
    needsLineup,
    matchFormat,
    team1Assignments,
    team2Assignments,
    playerNameResolver,
  ]);

  const validation = useMemo(() => {
    if (!needsLineup) return { valid: true, errors: [] as string[] };
    return validateLineupForFormat(
      matchFormat,
      team1Assignments,
      team2Assignments,
      team1?.name ?? "Team 1",
      team2?.name ?? "Team 2"
    );
  }, [
    needsLineup,
    matchFormat,
    team1Assignments,
    team2Assignments,
    team1?.name,
    team2?.name,
  ]);

  const getAssignmentPayload = useCallback(() => {
    return {
      team1Assignments,
      team2Assignments,
    };
  }, [team1Assignments, team2Assignments]);

  return {
    needsLineup,
    team1,
    team2,
    team1Slots,
    team2Slots,
    team1Positions,
    team2Positions,
    setSlot,
    rubberPreview,
    validation,
    loading,
    error,
    getAssignmentPayload,
    reload: loadTeams,
  };
}
