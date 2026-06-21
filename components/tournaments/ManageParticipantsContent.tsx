import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { IconButton, List, Text } from "react-native-paper";
import { axiosInstance } from "@/lib/axiosInstance";
import Toast from "react-native-toast-message";
import { Avatar as UiAvatar } from "@/components/ui/Avatar";
import { FormTextField } from "@/components/ui/FormTextField";
import {
  Participant,
  TeamParticipant,
  UserParticipant,
  isTeamParticipant,
  getParticipantDisplayName,
  getParticipantImage,
} from "@/types/tournament.type";
import { DesignTokens } from "@/constants/designTokens";

interface User {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

interface TeamSearchResult {
  _id: string;
  name: string;
  logo?: string;
  city?: string;
  captain?: {
    _id: string;
    username: string;
    fullName?: string;
  };
  players?: any[];
}

export interface ManageParticipantsContentProps {
  tournamentId: string;
  participants: Participant[];
  category: "individual" | "team";
  onUpdate: (participants: Participant[]) => void;
  onSaveComplete: () => void;
  onSavingChange?: (saving: boolean) => void;
}

export interface ManageParticipantsContentHandle {
  save: () => void;
}

const tokens = DesignTokens;

export const ManageParticipantsContent = forwardRef<
  ManageParticipantsContentHandle,
  ManageParticipantsContentProps
>(function ManageParticipantsContent(
  {
    tournamentId,
    participants,
    category,
    onUpdate,
    onSaveComplete,
    onSavingChange,
  },
  ref
) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<(User | TeamSearchResult)[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localParticipants, setLocalParticipants] = useState<Participant[]>([]);
  const [pendingAdds, setPendingAdds] = useState<(User | TeamSearchResult)[]>([]);
  const [pendingRemoves, setPendingRemoves] = useState<string[]>([]);

  const isTeamTournament = category === "team";

  useEffect(() => {
    onSavingChange?.(saving);
  }, [saving, onSavingChange]);

  useEffect(() => {
    const validParticipants = (participants || []).filter(
      (p) => p !== null && p !== undefined && typeof p === "object" && !Array.isArray(p)
    );
    setLocalParticipants(validParticipants);
    setPendingAdds([]);
    setPendingRemoves([]);
    setQuery("");
    setSuggestions([]);
  }, [participants]);

  const fetchSuggestions = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const encoded = encodeURIComponent(val.trim());
      const endpoint = isTeamTournament
        ? `/teams/search?query=${encoded}&limit=10`
        : `/users/search?q=${encoded}&limit=10`;

      const response = await axiosInstance.get(endpoint);

      const existingIds = new Set([
        ...localParticipants.map((p) => p._id || (p as any).id || String(p)),
        ...pendingAdds.map((item) => item._id || (item as any).id || String(item)),
      ]);

      const data = isTeamTournament
        ? response.data?.teams || []
        : response.data?.users || [];

      const filtered = data.filter((item: any) => !existingIds.has(item._id));
      setSuggestions(filtered.slice(0, 10));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setSearching(false);
    }
  };

  const addParticipant = (item: User | TeamSearchResult) => {
    const itemId = item._id;
    const wasPendingRemove = pendingRemoves.includes(itemId);

    if (wasPendingRemove) {
      setPendingRemoves(pendingRemoves.filter((id) => id !== itemId));
    } else {
      setPendingAdds([...pendingAdds, item]);
    }

    let newParticipant: Participant;

    if (isTeamTournament) {
      const team = item as TeamSearchResult;
      newParticipant = {
        _id: team._id,
        name: team.name,
        logo: team.logo,
        city: team.city,
        captain: team.captain,
        players: team.players,
      } as TeamParticipant;
    } else {
      const user = item as User;
      newParticipant = {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        profileImage: user.profileImage,
      } as UserParticipant;
    }

    setLocalParticipants([...localParticipants, newParticipant]);
    setQuery("");
    setSuggestions([]);
  };

  const removeParticipant = (participant: Participant) => {
    const participantId = (participant as any)._id || (participant as any).id || String(participant);
    const isPendingAdd = pendingAdds.some((item) => (item._id || (item as any).id) === participantId);

    if (isPendingAdd) {
      setPendingAdds(pendingAdds.filter((item) => (item._id || (item as any).id) !== participantId));
    } else {
      setPendingRemoves([...pendingRemoves, participantId]);
    }

    setLocalParticipants(
      localParticipants.filter((p) => {
        const pId = (p as any)._id || (p as any).id || String(p);
        return pId !== participantId;
      })
    );
  };

  const handleSave = async () => {
    if (pendingAdds.length === 0 && pendingRemoves.length === 0) {
      onSaveComplete();
      return;
    }

    setSaving(true);
    try {
      for (const item of pendingAdds) {
        await axiosInstance.post(`/tournaments/${tournamentId}/add-participant`, {
          participantId: item._id,
        });
      }

      for (const participantId of pendingRemoves) {
        await axiosInstance.delete(`/tournaments/${tournamentId}/add-participant`, {
          data: { participantId },
        });
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Participants updated successfully",
      });

      onUpdate(localParticipants);
      onSaveComplete();
    } catch (err: any) {
      console.error("Error updating participants:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Failed to update participants",
      });
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    save: () => {
      void handleSave();
    },
  }));

  const renderAvatar = (imageUri: string | undefined, label: string) => (
    <UiAvatar src={imageUri} alt={label} size={36} />
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="bodySmall" style={styles.description}>
          Add or remove {isTeamTournament ? "teams" : "participants"} from the tournament.
        </Text>

        <View
          style={[
            styles.searchArea,
            query.trim().length >= 2 ? styles.searchAreaWithDropdown : null,
          ]}
        >
          <View style={styles.searchInputRow}>
            <FormTextField
              label={isTeamTournament ? "Search teams" : "Search users"}
              placeholder={
                isTeamTournament ? "Type team name..." : "Type name or username..."
              }
              value={query}
              onChangeText={fetchSuggestions}
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.searchFieldContainer}
            />
            {searching ? (
              <ActivityIndicator
                size="small"
                color={tokens.colors.primary[600]}
                style={styles.searchSpinner}
              />
            ) : null}
          </View>

          {query.trim().length >= 2 && (
            <View style={styles.suggestionsOverlay}>
              {suggestions.length > 0 ? (
                <ScrollView
                  style={styles.suggestionsScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  keyboardShouldPersistTaps="handled"
                >
                  {suggestions.map((item) => {
                    const user = item as User;
                    const team = item as TeamSearchResult;
                    const title = isTeamTournament
                      ? team.name
                      : user.fullName || user.username;
                    const imageUri = isTeamTournament ? team.logo : user.profileImage;
                    const description = isTeamTournament
                      ? team.city || `${team.players?.length || 0} players`
                      : `@${user.username || "unknown"}`;

                    return (
                      <List.Item
                        key={item._id}
                        title={title}
                        titleStyle={styles.listItemTitle}
                        description={description}
                        descriptionStyle={styles.listItemDescription}
                        onPress={() => addParticipant(item)}
                        left={() => renderAvatar(imageUri, title)}
                        style={styles.listItem}
                      />
                    );
                  })}
                </ScrollView>
              ) : !searching ? (
                <Text variant="bodySmall" style={styles.noResultsText}>
                  No results found
                </Text>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.participantsSection}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            {isTeamTournament ? "Teams" : "Participants"} ({localParticipants.length})
          </Text>
          {localParticipants.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No {isTeamTournament ? "teams" : "participants"} yet
            </Text>
          ) : (
            localParticipants.map((participant) => {
              const displayName = getParticipantDisplayName(participant);
              const imageUri = getParticipantImage(participant);
              const desc = isTeamParticipant(participant)
                ? participant.city || `${participant.players?.length || 0} players`
                : `@${(participant as UserParticipant).username || "unknown"}`;

              return (
                <List.Item
                  key={participant._id}
                  title={displayName}
                  titleStyle={styles.listItemTitle}
                  description={desc}
                  descriptionStyle={styles.listItemDescription}
                  left={() => renderAvatar(imageUri, displayName)}
                  right={() => (
                    <IconButton
                      icon="close"
                      iconColor="#ef4444"
                      size={20}
                      onPress={() => removeParticipant(participant)}
                    />
                  )}
                  style={styles.listItem}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing[4],
    paddingBottom: tokens.spacing[8],
  },
  description: {
    color: "#64748b",
    marginBottom: tokens.spacing[4],
    textAlign: "center",
    fontSize: 12,
  },
  searchArea: {
    position: "relative",
    zIndex: 20,
    overflow: "visible",
  },
  searchAreaWithDropdown: {
    paddingBottom: 290,
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: tokens.spacing[2],
  },
  searchFieldContainer: {
    flex: 1,
  },
  searchSpinner: {
    marginBottom: tokens.spacing[3],
  },
  participantsSection: {
    marginTop: 12,
  },
  sectionTitle: {
    marginBottom: 6,
    color: "#334155",
  },
  suggestionsOverlay: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: tokens.colors.background.primary,
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    zIndex: 40,
    elevation: 8,
    padding: tokens.spacing[2],
  },
  suggestionsScroll: {
    height: "100%",
  },
  listItem: {
    backgroundColor: tokens.colors.background.secondary,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[0],
    marginBottom: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
  },
  listItemTitle: {
    fontSize: tokens.typography.fontSize.base,
  },
  listItemDescription: {
    fontSize: tokens.typography.fontSize.sm,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    paddingVertical: 18,
  },
  noResultsText: {
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 14,
  },
});
