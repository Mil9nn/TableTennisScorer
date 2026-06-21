import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  IconButton,
  List,
  Portal,
  Text,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import { axiosInstance } from "@/lib/axiosInstance";

interface UserParticipant {
  _id: string;
  username?: string;
  fullName?: string;
}

interface Pair {
  _id?: string;
  player1?: UserParticipant;
  player2?: UserParticipant;
}

interface ManageDoublesPairsDialogProps {
  visible: boolean;
  onClose: () => void;
  tournamentId: string;
  participants: UserParticipant[];
  existingPairs: Pair[];
  onUpdate: (pairs: Pair[]) => void;
  disabled?: boolean;
}

interface LocalPair {
  _id?: string;
  player1: UserParticipant;
  player2: UserParticipant;
}

export function ManageDoublesPairsDialog({
  visible,
  onClose,
  tournamentId,
  participants,
  existingPairs,
  onUpdate,
  disabled = false,
}: ManageDoublesPairsDialogProps) {
  const [pairs, setPairs] = useState<LocalPair[]>([]);
  const [selected, setSelected] = useState<UserParticipant[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const mappedPairs = (existingPairs || [])
      .filter((pair) => pair.player1 && pair.player2)
      .map((pair) => ({
        _id: pair._id,
        player1: pair.player1 as UserParticipant,
        player2: pair.player2 as UserParticipant,
      }));
    setPairs(mappedPairs);
    setSelected([]);
  }, [visible, existingPairs]);

  const usedPlayerIds = useMemo(
    () =>
      new Set(
        pairs.flatMap((pair) => [pair.player1._id, pair.player2._id]).filter(Boolean),
      ),
    [pairs],
  );

  const availablePlayers = useMemo(
    () => (participants || []).filter((player) => !usedPlayerIds.has(player._id)),
    [participants, usedPlayerIds],
  );

  const toggleSelected = (player: UserParticipant) => {
    if (disabled) return;
    const exists = selected.some((item) => item._id === player._id);
    if (exists) {
      setSelected((prev) => prev.filter((item) => item._id !== player._id));
      return;
    }
    if (selected.length >= 2) return;
    setSelected((prev) => [...prev, player]);
  };

  const createPair = () => {
    if (selected.length !== 2) return;
    setPairs((prev) => [...prev, { player1: selected[0], player2: selected[1] }]);
    setSelected([]);
  };

  const removePair = (index: number) => {
    if (disabled) return;
    setPairs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    const participantCount = (participants || []).length;
    const expectedPairs = Math.floor(participantCount / 2);

    if (pairs.length !== expectedPairs) {
      Toast.show({
        type: "error",
        text1: "Incomplete pairs",
        text2: `Create ${expectedPairs} pairs for all ${participantCount} participants before saving.`,
      });
      return;
    }

    setSaving(true);
    try {
      const { data } = await axiosInstance.post(
        `/tournaments/${tournamentId}/doubles-pairs`,
        {
          pairs: pairs.map((pair) => ({
            _id: pair._id,
            player1: pair.player1._id,
            player2: pair.player2._id,
          })),
        },
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Doubles pairs updated successfully",
      });
      onUpdate(data?.pairs ?? pairs);
      onClose();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.error || "Failed to update doubles pairs",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPlayerName = (player: UserParticipant) =>
    player.fullName || player.username || "Unknown";

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>Manage Doubles Pairs</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodySmall" style={styles.description}>
            Select two available players to create each pair.
          </Text>

          <View style={styles.section}>
            <Text variant="labelMedium">Current Pairs ({pairs.length})</Text>
            <FlatList
              data={pairs}
              keyExtractor={(item, index) =>
                item._id || `${item.player1._id}-${item.player2._id}-${index}`
              }
              style={styles.list}
              renderItem={({ item, index }) => (
                <List.Item
                  title={`${getPlayerName(item.player1)} / ${getPlayerName(item.player2)}`}
                  description={`@${item.player1.username || "unknown"} & @${item.player2.username || "unknown"}`}
                  right={() =>
                    disabled ? null : (
                      <IconButton
                        icon="close-circle-outline"
                        iconColor="#ef4444"
                        onPress={() => removePair(index)}
                      />
                    )
                  }
                  style={styles.listItem}
                />
              )}
              ListEmptyComponent={
                <Text variant="bodySmall" style={styles.noResults}>
                  No pairs created yet
                </Text>
              }
            />
          </View>

          {!disabled && (
            <View style={styles.section}>
              <Text variant="labelMedium">
                Available Players ({availablePlayers.length})
              </Text>
              <FlatList
                data={availablePlayers}
                keyExtractor={(item) => item._id}
                style={styles.list}
                renderItem={({ item }) => {
                  const active = selected.some((s) => s._id === item._id);
                  return (
                    <List.Item
                      title={getPlayerName(item)}
                      description={`@${item.username || "unknown"}`}
                      onPress={() => toggleSelected(item)}
                      left={() => (
                        <List.Icon icon={active ? "check-circle" : "circle-outline"} />
                      )}
                      style={[styles.listItem, active ? styles.activeItem : null]}
                    />
                  );
                }}
                ListEmptyComponent={
                  <Text variant="bodySmall" style={styles.noResults}>
                    No unpaired players available
                  </Text>
                }
              />
              <Button
                mode="outlined"
                onPress={createPair}
                disabled={selected.length !== 2}
              >
                Create Pair ({selected.length}/2 selected)
              </Button>
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose} disabled={saving}>
            Close
          </Button>
          {!disabled && (
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving}>
              Save
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: "#fff",
  },
  content: {
    gap: 12,
    maxHeight: 560,
  },
  description: {
    color: "#64748b",
  },
  section: {
    gap: 8,
  },
  list: {
    maxHeight: 170,
  },
  listItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 6,
  },
  activeItem: {
    backgroundColor: "#e2e8f0",
  },
  noResults: {
    textAlign: "center",
    color: "#64748b",
    paddingVertical: 12,
  },
});
