import { fetchInsights } from "@/lib/profile/api";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Card, Text } from "react-native-paper";

export default function ProfileInsightsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const resolvedUserId = String(userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    if (!resolvedUserId) return;
    setError(null);
    const res = await fetchInsights(resolvedUserId);
    if (!res || res.success !== true) {
      throw new Error(res?.error || res?.message || "Failed to load insights");
    }
    setData(res.data ?? null);
  }, [resolvedUserId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: any) => setError(e?.message || "Failed to load insights"))
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch((e: any) => setError(e?.message || "Failed to refresh"))
      .finally(() => setRefreshing(false));
  }, [load]);

  const stats = data?.stats;

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
      ) : !data ? (
        <Text>No insights available.</Text>
      ) : (
        <Card>
          <Card.Content>
            <Text variant="titleMedium">Highlights</Text>
            <Text variant="bodySmall">
              Overall win rate: {stats?.overallWinRate != null ? `${Math.round(stats.overallWinRate)}%` : "—"}
            </Text>
            <Text variant="bodySmall">
              Singles win rate: {stats?.singlesWinRate != null ? `${Math.round(stats.singlesWinRate)}%` : "—"}
            </Text>
            <Text variant="bodySmall">
              Doubles win rate: {stats?.doublesWinRate != null ? `${Math.round(stats.doublesWinRate)}%` : "—"}
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

