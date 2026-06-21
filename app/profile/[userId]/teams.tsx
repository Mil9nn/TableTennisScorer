import { fetchTeams, fetchTeamStats } from "@/lib/profile/api";
import type { TeamsResponse } from "@/lib/profile/types";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Card, List, Text } from "react-native-paper";
import { Image } from "expo-image"

export default function ProfileTeamsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const resolvedUserId = String(userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamsRes, setTeamsRes] = useState<TeamsResponse | null>(null);
  const [teamStats, setTeamStats] = useState<any>(null);

  const teams = useMemo(() => {
    const items = teamsRes && teamsRes.success === true ? teamsRes.teams : [];
    return Array.isArray(items) ? items : [];
  }, [teamsRes]);

  const load = useCallback(async () => {
    if (!resolvedUserId) return;
    setError(null);
    const [teamsData, statsData] = await Promise.all([
      fetchTeams(resolvedUserId),
      fetchTeamStats(resolvedUserId),
    ]);

    if (!teamsData || teamsData.success !== true) {
      throw new Error(teamsData?.error || teamsData?.message || "Failed to load teams");
    }
    if (!statsData || statsData.success !== true) {
      throw new Error(statsData?.error || statsData?.message || "Failed to load team stats");
    }

    setTeamsRes(teamsData);
    setTeamStats(statsData.teamStats ?? null);
  }, [resolvedUserId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: any) => setError(e?.message || "Failed to load teams"))
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch((e: any) => setError(e?.message || "Failed to refresh"))
      .finally(() => setRefreshing(false));
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text variant="bodySmall">UserId: {resolvedUserId}</Text>

      {loading ? (
        <Text>Loading…</Text>
      ) : error ? (
        <Text style={{ color: "#b91c1c" }}>{error}</Text>
      ) : (
        <>
          <Card>
            <Card.Content>
              <Text variant="titleMedium">Team stats</Text>
              <Text variant="bodySmall">
                Matches: {String(teamStats?.total ?? 0)} • W: {String(teamStats?.wins ?? 0)} • L:{" "}
                {String(teamStats?.losses ?? 0)}
              </Text>
              <Text variant="bodySmall">
                Sub-matches: {String(teamStats?.subMatchesPlayed ?? 0)} • Won:{" "}
                {String(teamStats?.subMatchesWon ?? 0)}
              </Text>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content>
              <Text variant="titleMedium">Teams ({teams.length})</Text>
            </Card.Content>
            {teams.length === 0 ? (
              <Card.Content>
                <Text variant="bodySmall">No teams found.</Text>
              </Card.Content>
            ) : (
              teams.map((t) => (
                <List.Item
                  key={t._id}
                  style={{ paddingHorizontal: 10 }}
                  title={t.name}
                  description={`${t.role || "member"} • ${t.city || "no city"} • players: ${t.playerCount ?? "—"}`}
                  descriptionStyle={{ fontSize: 12 }}
                  left={(props) => 
                    t.logo &&
                      <Image 
                        source={{ uri: t.logo }} 
                        style={{ width: 40, height: 40, borderRadius: 24 }} 
                      />
                  }
                />
              ))
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

