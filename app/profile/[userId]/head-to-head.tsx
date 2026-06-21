import { fetchHeadToHeadList } from "@/lib/profile/api";
import type { HeadToHeadRow } from "@/lib/profile/types";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { HeadToHeadMatchesModal } from "@/components/profile/HeadToHeadMatchesModal";
import ProfileHeadToHeadList from "@/components/ProfileHeadToHeadList";

export default function ProfileHeadToHeadScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const resolvedUserId = String(userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<HeadToHeadRow[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!resolvedUserId) return;
    setError(null);
    try {
      const res = await fetchHeadToHeadList(resolvedUserId);
      if (!res || res.success !== true) {
        throw new Error(
          res?.error || res?.message || "Failed to load head to head",
        );
      }
      setRows(Array.isArray(res.headToHead) ? res.headToHead : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    }
  }, [resolvedUserId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load head to head"),
      )
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to refresh"),
      )
      .finally(() => setRefreshing(false));
  }, [load]);

  const handleOpponentPress = (opponentId: string, opponentName: string) => {
    setSelectedOpponent({ id: opponentId, name: opponentName });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOpponent(null);
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text>Loading…</Text>
        ) : error ? (
          <Text style={{ color: "#b91c1c" }}>{error}</Text>
        ) : (
          <ProfileHeadToHeadList
            opponents={rows}
            onOpponentPress={handleOpponentPress}
          />
        )}
      </ScrollView>

      <HeadToHeadMatchesModal
        userId={resolvedUserId}
        opponentId={selectedOpponent?.id || ""}
        opponentName={selectedOpponent?.name || ""}
        visible={modalVisible}
        onClose={handleCloseModal}
      />
    </>
  );
}
