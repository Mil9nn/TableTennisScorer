import React, { useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  IconButton,
  List,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import { axiosInstance } from "@/lib/axiosInstance";
import { Avatar as UiAvatar } from "@/components/ui/Avatar";

interface User {
  _id: string;
  username?: string;
  fullName?: string;
  profileImage?: string;
}

interface ManageScorersDialogProps {
  visible: boolean;
  onClose: () => void;
  tournamentId: string;
  organizer?: User;
  scorers: User[];
  onUpdate: (scorers: User[]) => void;
}

export function ManageScorersDialog({
  visible,
  onClose,
  tournamentId,
  organizer,
  scorers,
  onUpdate,
}: ManageScorersDialogProps) {
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [localScorers, setLocalScorers] = useState<User[]>([]);
  const [pendingAdds, setPendingAdds] = useState<User[]>([]);
  const [pendingRemoves, setPendingRemoves] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    const safeScorers = (scorers || []).filter(Boolean);
    setLocalScorers(safeScorers);
    setPendingAdds([]);
    setPendingRemoves([]);
    setQuery("");
    setSuggestions([]);
  }, [visible, scorers]);

  const organizerId = organizer?._id;

  const existingIds = useMemo(
    () =>
      new Set(
        localScorers.map((s) => s._id).concat(pendingAdds.map((s) => s._id)),
      ),
    [localScorers, pendingAdds],
  );

  const searchUsers = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const encoded = encodeURIComponent(value.trim());
      const { data } = await axiosInstance.get(`/users/search?q=${encoded}&limit=10`);
      const users = Array.isArray(data?.users) ? data.users : [];
      const filtered = users.filter((user: User) => !existingIds.has(user._id));
      setSuggestions(filtered.slice(0, 10));
    } catch (error) {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const addScorer = (user: User) => {
    if (!user?._id) return;
    if (pendingRemoves.includes(user._id)) {
      setPendingRemoves((prev) => prev.filter((id) => id !== user._id));
    } else {
      setPendingAdds((prev) => [...prev, user]);
    }
    setLocalScorers((prev) => [...prev, user]);
    setQuery("");
    setSuggestions([]);
  };

  const removeScorer = (user: User) => {
    if (!user?._id) return;
    const isPendingAdd = pendingAdds.some((item) => item._id === user._id);
    if (isPendingAdd) {
      setPendingAdds((prev) => prev.filter((item) => item._id !== user._id));
    } else {
      setPendingRemoves((prev) => [...prev, user._id]);
    }
    setLocalScorers((prev) => prev.filter((item) => item._id !== user._id));
  };

  const handleSave = async () => {
    if (pendingAdds.length === 0 && pendingRemoves.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      for (const scorer of pendingAdds) {
        await axiosInstance.post(`/tournaments/${tournamentId}/scorers`, {
          userId: scorer._id,
        });
      }

      for (const userId of pendingRemoves) {
        await axiosInstance.delete(`/tournaments/${tournamentId}/scorers/${userId}`);
      }

      onUpdate(localScorers);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Scorers updated successfully",
      });
      onClose();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.error || "Failed to update scorers",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderAvatar = (user: User) => {
    const label = user.fullName || user.username || "?";
    return <UiAvatar src={user.profileImage} alt={label} size={36} />;
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>Manage Scorers</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodySmall" style={styles.description}>
            Add trusted users who can score matches for this tournament.
          </Text>

          <View
            style={[
              styles.searchArea,
              query.trim().length >= 2 ? styles.searchAreaWithDropdown : null,
            ]}
          >
            <TextInput
              mode="outlined"
              label="Search users"
              placeholder="Type name or username..."
              value={query}
              onChangeText={searchUsers}
              style={styles.input}
              right={
                searching ? (
                  <TextInput.Icon icon={() => <ActivityIndicator size="small" />} />
                ) : undefined
              }
            />

            {query.trim().length >= 2 && (
              <View style={styles.suggestionsOverlay}>
                {suggestions.length > 0 ? (
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item._id}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    keyboardShouldPersistTaps="handled"
                    style={styles.suggestionsScroll}
                    renderItem={({ item }) => (
                      <List.Item
                        title={item.fullName || item.username}
                        description={`@${item.username || "unknown"}`}
                        left={() => renderAvatar(item)}
                        right={() => <List.Icon icon="plus-circle-outline" />}
                        onPress={() => addScorer(item)}
                        style={styles.listItem}
                      />
                    )}
                  />
                ) : !searching ? (
                  <Text variant="bodySmall" style={styles.noResultsText}>
                    No users found
                  </Text>
                ) : null}
              </View>
            )}
          </View>

          <View style={styles.scorersSection}>
            <Text variant="labelMedium" style={styles.sectionTitle}>
              Scorers ({localScorers.length})
            </Text>
            <ScrollView style={styles.scorersScroll} nestedScrollEnabled>
              {localScorers.length === 0 ? (
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No scorers assigned
                </Text>
              ) : (
                localScorers.map((item) => {
                  const isOrganizer = organizerId && item._id === organizerId;
                  return (
                    <List.Item
                      key={item._id}
                      title={item.fullName || item.username}
                      description={
                        isOrganizer
                          ? "Organizer (always scorer)"
                          : `@${item.username || "unknown"}`
                      }
                      left={() => renderAvatar(item)}
                      right={() =>
                        isOrganizer ? null : (
                          <IconButton
                            icon="close-circle-outline"
                            iconColor="#ef4444"
                            onPress={() => removeScorer(item)}
                          />
                        )
                      }
                      style={styles.listItem}
                    />
                  );
                })
              )}
            </ScrollView>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button style={styles.cancelButton} onPress={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            style={styles.saveButton}
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  content: {
    height: 500,
  },
  description: {
    color: "#64748b",
    marginBottom: 10,
  },
  saveButton: {
    flex: 1,
    borderRadius: 6,
  },
  cancelButton: {
    flex: 1,
  },
  searchArea: {
    position: "relative",
    zIndex: 20,
    overflow: "visible",
  },
  searchAreaWithDropdown: {
    paddingBottom: 290,
  },
  input: {
    backgroundColor: "white",
  },
  suggestionsOverlay: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    zIndex: 40,
    elevation: 8,
    padding: 6,
  },
  suggestionsScroll: {
    height: "100%",
  },
  scorersSection: {
    marginTop: 12,
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 6,
    color: "#334155",
  },
  scorersScroll: {
    flex: 1,
  },
  listItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    paddingVertical: 18,
  },
  noResultsText: {
    textAlign: "center",
    color: "#64748b",
    paddingVertical: 14,
  },
});
