import { fetchShotsAnalysis } from "@/lib/profile/api";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Card, Text } from "react-native-paper";

export default function ProfileShotsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const resolvedUserId = String(userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    if (!resolvedUserId) return;
    setError(null);
    const res = await fetchShotsAnalysis(resolvedUserId);
    if (!res || res.success !== true) {
      throw new Error(res?.error || res?.message || "Failed to load shot analysis");
    }
    setData(res.data ?? null);
  }, [resolvedUserId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: any) => setError(e?.message || "Failed to load shot analysis"))
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch((e: any) => setError(e?.message || "Failed to refresh"))
      .finally(() => setRefreshing(false));
  }, [load]);

  const shotDistributionCount = Array.isArray(data?.shotDistribution)
    ? data.shotDistribution.length
    : null;
  const allShotsCount = Array.isArray(data?.allShots) ? data.allShots.length : null;

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
        <Text>No shot analysis available.</Text>
      ) : (
        <Card>
          <Card.Content>
            <Text variant="titleMedium">Shots</Text>
            <Text variant="bodySmall">
              Shot types: {shotDistributionCount != null ? shotDistributionCount : "—"}
            </Text>
            <Text variant="bodySmall">
              Total shots: {allShotsCount != null ? allShotsCount : "—"}
            </Text>
            <Text variant="bodySmall">
              Heatmap: {data?.heatmapGrid ? "available" : "—"}
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

