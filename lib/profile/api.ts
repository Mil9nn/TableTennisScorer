import { axiosInstance } from "@/lib/axiosInstance";
import type { ProfileUserSummary } from "@/types/profile.type";
import type {
  HeadToHeadListResponse,
  HeadToHeadOpponentResponse,
  InsightsResponse,
  PlayerStatsResponse,
  ProfileMatchHistoryResponse,
  ShotsAnalysisResponse,
  TeamsResponse,
  TeamStatsResponse,
  TournamentStatsResponse,
} from "@/lib/profile/types";

export type ProfileUserResponse =
  | { success: true; user: ProfileUserSummary }
  | { success: false; error?: string; message?: string };

export async function fetchProfileUser(
  userId: string,
): Promise<ProfileUserResponse> {
  const { data } = await axiosInstance.get(`profile/${userId}/summary`);
  return data;
}

export async function fetchProfileMatchHistory(
  userId: string,
): Promise<ProfileMatchHistoryResponse> {
  const { data } = await axiosInstance.get(`profile/${userId}/match-history`);
  return data;
}

export async function fetchHeadToHeadList(
  userId: string,
): Promise<HeadToHeadListResponse> {
  const { data } = await axiosInstance.get(`profile/${userId}/head-to-head`);
  return data;
}

export async function fetchHeadToHeadOpponent(
  userId: string,
  opponentId: string,
): Promise<HeadToHeadOpponentResponse> {
  const { data } = await axiosInstance.get(
    `profile/${userId}/head-to-head/${opponentId}`,
  );
  return data;
}

export async function fetchPlayerStats(
  userId: string,
): Promise<PlayerStatsResponse> {
  const { data } = await axiosInstance.get(`profile/${userId}/player-stats`);
  return data;
}

export async function fetchTeams(userId: string): Promise<TeamsResponse> {
  const { data } = await axiosInstance.get(`profile/${userId}/teams`);
  return data;
}

export async function fetchTeamStats(
  userId: string,
): Promise<TeamStatsResponse> {
  const { data } = await axiosInstance.get(`profile/${userId}/team-stats`);
  return data;
}

export async function fetchTournamentStatsForUser(
  userId: string,
): Promise<TournamentStatsResponse> {
  const { data } = await axiosInstance.get(`profile/${userId}/tournament-stats`);
  return data;
}

export async function fetchTournamentStatsForMe(): Promise<TournamentStatsResponse> {
  const { data } = await axiosInstance.get("profile/tournament-stats");
  return data;
}

export async function fetchInsights(userId: string): Promise<InsightsResponse> {
  const { data } = await axiosInstance.get(`profile/${userId}/insights`);
  return data;
}

export async function fetchShotsAnalysis(
  userId: string,
): Promise<ShotsAnalysisResponse> {
  const { data } = await axiosInstance.get("profile/shots-analysis", {
    params: { userId },
  });
  return data;
}

