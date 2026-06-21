import { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useMatchStore } from "@/hooks/useMatchStore";
import { axiosInstance } from "@/lib/axiosInstance";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { isTeamMatch, TeamMatch } from "@/types/match.type";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import {
  buildDoublesRotation,
  buildDoublesRotationForTeamMatch,
} from "@/lib/helpers";
import type { DoublesPlayerKey } from "@/types/match.type";
import { DesignTokens } from "@/constants/designTokens";

const INDIVIDUAL_DOUBLES_KEY_TO_INDEX: Record<string, number> = {
  side1_main: 0,
  side1_partner: 1,
  side2_main: 2,
  side2_partner: 3,
};

function normalizeEntityId(value: any): string | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") {
    const id = String(value);
    return id && id !== "[object Object]" ? id : null;
  }
  if (typeof value === "object") {
    const fromUnderscore =
      value._id != null ? normalizeEntityId(value._id) : null;
    if (fromUnderscore) return fromUnderscore;
    const fromId = value.id != null ? normalizeEntityId(value.id) : null;
    if (fromId) return fromId;
    if (typeof value.toHexString === "function") {
      try {
        const hex = value.toHexString();
        if (typeof hex === "string" && hex.length > 0) return hex;
      } catch {
        // ignore and continue
      }
    }
    const bufferData = value?.buffer?.data;
    if (Array.isArray(bufferData) && bufferData.length === 12) {
      try {
        return bufferData
          .map((b: number) => Number(b).toString(16).padStart(2, "0"))
          .join("");
      } catch {
        // ignore and continue
      }
    }
    if (typeof value.toString === "function") {
      const str = value.toString();
      return str && str !== "[object Object]" ? str : null;
    }
  }
  return null;
}

function participantIdAt(participants: any[], index: number): string | null {
  const p = participants?.[index];
  if (!p) return null;
  const id =
    normalizeEntityId(p) ??
    normalizeEntityId(p._id) ??
    normalizeEntityId(p.id) ??
    (typeof p.user === "object" && p.user
      ? normalizeEntityId(p.user._id) ?? normalizeEntityId(p.user.id)
      : normalizeEntityId(p.user)) ??
    null;
  return id;
}

function individualSinglesPlayerIdAt(
  participants: any[],
  match: any,
  index: number
): string | null {
  const fromParticipants = participantIdAt(participants, index);
  if (fromParticipants) return fromParticipants;

  const fromMatchParticipants = participantIdAt(match?.participants || [], index);
  if (fromMatchParticipants) return fromMatchParticipants;

  const teamAnchor =
    match?.teams?.[index]?.players?.[0] ??
    match?.teams?.[index]?.players?.[0]?._id;
  const fromTeams = normalizeEntityId(teamAnchor);
  return fromTeams;
}

/** Map doubles UI keys (side*_main, …) to participant user ids for the individual-match API. */
function individualKeyToParticipantId(
  key: string,
  participants: any[]
): string | null {
  const idx = INDIVIDUAL_DOUBLES_KEY_TO_INDEX[key];
  if (idx !== undefined) return participantIdAt(participants, idx);
  return null;
}

interface InitialServerDialogProps {
  matchType: string;
  participants: any[];
  isTeamMatch?: boolean;
  subMatchId?: string;
}

export default function InitialServerDialog({
  matchType,
  participants,
  isTeamMatch: isTeamMatchProp,
  subMatchId,
}: InitialServerDialogProps) {
  const isOpen = useMatchStore((s) => s.serverDialogOpen);
  const setOpen = useMatchStore((s) => s.setServerDialogOpen);
  const match = useMatchStore((s) => s.match);
  const setMatch = useMatchStore((s) => s.setMatch);

  const [selectedFirstServer, setSelectedFirstServer] = useState<string | null>(
    null
  );
  const [selectedFirstReceiver, setSelectedFirstReceiver] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);

  const isSingles = matchType === "singles";
  const isDoubles = matchType === "doubles" || matchType === "mixed_doubles";
  const isTeamMatchType = isTeamMatchProp || (match && isTeamMatch(match));

  const handleSave = async (
    serverOverride?: string | null,
    receiverOverride?: string | null
  ) => {
    const firstServer = serverOverride ?? selectedFirstServer;
    const firstReceiver = receiverOverride ?? selectedFirstReceiver;

    if (!firstServer || !match) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a first server",
      });
      return;
    }

    if (isDoubles && !firstReceiver) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a first receiver",
      });
      return;
    }

    setLoading(true);
    try {
      let serverOrder: string[] | undefined = undefined;

      if (isDoubles && firstServer && firstReceiver) {
        if (isTeamMatchType) {
          serverOrder = buildDoublesRotationForTeamMatch(
            firstServer,
            firstReceiver
          );
        } else {
          serverOrder = buildDoublesRotation(
            firstServer as DoublesPlayerKey,
            firstReceiver as DoublesPlayerKey
          );
        }

        if (!serverOrder || serverOrder.length !== 4) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to build server rotation",
          });
          setLoading(false);
          return;
        }
      }

      let endpoint: string;
      let serverConfig: Record<string, unknown>;

      if (isTeamMatchType && subMatchId) {
        endpoint = `/matches/team/${match._id}/submatch/${subMatchId}/server-config`;
        serverConfig = {
          firstServer,
          firstReceiver: isDoubles ? firstReceiver : null,
          serverOrder: isDoubles ? serverOrder : undefined,
        };
      } else {
        endpoint = `/matches/individual/${match._id}/server-config`;
        const firstServerPlayerId = isSingles
          ? normalizeEntityId(firstServer)
          : individualKeyToParticipantId(firstServer, participants);
        if (!firstServerPlayerId) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Could not resolve first server player",
          });
          setLoading(false);
          return;
        }

        if (isDoubles && serverOrder) {
          const firstReceiverPlayerId = individualKeyToParticipantId(
            firstReceiver!,
            participants
          );
          const serverOrderPlayerIds = serverOrder
            .map((k) => individualKeyToParticipantId(k, participants))
            .filter((id): id is string => Boolean(id));

          if (
            !firstReceiverPlayerId ||
            serverOrderPlayerIds.length !== 4
          ) {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Could not resolve doubles server rotation",
            });
            setLoading(false);
            return;
          }

          serverConfig = {
            firstServerPlayerId,
            firstReceiverPlayerId,
            serverOrderPlayerIds,
          };
        } else {
          serverConfig = { firstServerPlayerId };
        }
      }

      const { data } = await axiosInstance.post(endpoint, serverConfig);

      if (data?.match) {
        if (!isTeamMatchType) {
          setMatch(data.match);
          useIndividualMatch.getState().setInitialMatch(data.match);
        } else {
          const updatedMatch = data.match as TeamMatch;
          const localIndex = useTeamMatch.getState().currentSubMatchIndex;
          const bySubMatchId =
            subMatchId != null
              ? updatedMatch.subMatches.findIndex(
                  (sm) => String(sm._id) === String(subMatchId)
                )
              : -1;
          const resolvedIndex = bySubMatchId >= 0 ? bySubMatchId : localIndex;
          const withIndex = {
            ...updatedMatch,
            currentSubMatch: resolvedIndex + 1,
          };
          setMatch(withIndex);
          useTeamMatch
            .getState()
            .setInitialTeamMatch(withIndex, { preserveSubMatchIndex: true });
        }

        setOpen(false);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Unexpected response while saving server configuration",
        });
      }
    } catch (err) {
      console.error("Failed to save server config:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save server configuration",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (index: number) => {
    const participant = participants?.[index];
    return (
      participant?.fullName || participant?.username || `Player ${index + 1}`
    );
  };

  const getServerOptions = () => {
    if (isSingles) {
      if (isTeamMatchType) {
        return [
          { value: "team1", label: getPlayerName(0) },
          { value: "team2", label: getPlayerName(1) },
        ];
      } else {
        const side1Id = individualSinglesPlayerIdAt(participants, match, 0);
        const side2Id = individualSinglesPlayerIdAt(participants, match, 1);
        return [
          { value: side1Id, label: getPlayerName(0) },
          { value: side2Id, label: getPlayerName(1) },
        ].filter((option): option is { value: string; label: string } =>
          Boolean(option.value)
        );
      }
    }

    if (isTeamMatchType) {
      return [
        { value: "team1_main", label: `${getPlayerName(0)} (Team 1 Main)` },
        {
          value: "team1_partner",
          label: `${getPlayerName(1)} (Team 1 Partner)`,
        },
        { value: "team2_main", label: `${getPlayerName(2)} (Team 2 Main)` },
        {
          value: "team2_partner",
          label: `${getPlayerName(3)} (Team 2 Partner)`,
        },
      ];
    } else {
      return [
        { value: "side1_main", label: `${getPlayerName(0)} (Side 1 Main)` },
        {
          value: "side1_partner",
          label: `${getPlayerName(1)} (Side 1 Partner)`,
        },
        { value: "side2_main", label: `${getPlayerName(2)} (Side 2 Main)` },
        {
          value: "side2_partner",
          label: `${getPlayerName(3)} (Side 2 Partner)`,
        },
      ];
    }
  };

  const getReceiverOptions = () => {
    if (!selectedFirstServer) return [];

    let isServerTeam1 = false;

    if (isTeamMatchType) {
      isServerTeam1 =
        selectedFirstServer === "team1" ||
        selectedFirstServer === "team1_main" ||
        selectedFirstServer === "team1_partner";
    } else {
      isServerTeam1 =
        selectedFirstServer === "side1" ||
        selectedFirstServer === "side1_main" ||
        selectedFirstServer === "side1_partner";
    }

    if (isTeamMatchType) {
      return [
        {
          value: isServerTeam1 ? "team2_main" : "team1_main",
          label: `${getPlayerName(isServerTeam1 ? 2 : 0)} (Main)`,
        },
        {
          value: isServerTeam1 ? "team2_partner" : "team1_partner",
          label: `${getPlayerName(isServerTeam1 ? 3 : 1)} (Partner)`,
        },
      ];
    } else {
      return [
        {
          value: isServerTeam1 ? "side2_main" : "side1_main",
          label: `${getPlayerName(isServerTeam1 ? 2 : 0)} (Main)`,
        },
        {
          value: isServerTeam1 ? "side2_partner" : "side1_partner",
          label: `${getPlayerName(isServerTeam1 ? 3 : 1)} (Partner)`,
        },
      ];
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Who serves first?</Text>
              <View style={styles.optionsContainer}>
                {getServerOptions().map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      selectedFirstServer === option.value &&
                        styles.optionButtonSelected,
                    ]}
                    onPress={() => {
                      if (loading) return;
                      setSelectedFirstServer(option.value);
                      setSelectedFirstReceiver(null);
                      if (isSingles) {
                        void handleSave(option.value, null);
                      }
                    }}
                    disabled={loading}
                  >
                    <View style={styles.optionContent}>
                      <Text
                        style={[
                          styles.optionText,
                          selectedFirstServer === option.value &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {loading && selectedFirstServer === option.value && (
                        <ActivityIndicator 
                          size="small" 
                          color="#2563eb" 
                          style={styles.loadingIndicator}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {isDoubles && selectedFirstServer && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Who receives first?</Text>
                <View style={styles.optionsContainer}>
                  {getReceiverOptions().map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        selectedFirstReceiver === option.value &&
                          styles.optionButtonSelected,
                      ]}
                      onPress={() => {
                        if (loading || !selectedFirstServer) return;
                        setSelectedFirstReceiver(option.value);
                        void handleSave(selectedFirstServer, option.value);
                      }}
                      disabled={loading}
                    >
                      <View style={styles.optionContent}>
                        <Text
                          style={[
                            styles.optionText,
                            selectedFirstReceiver === option.value &&
                              styles.optionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {loading && selectedFirstReceiver === option.value && (
                          <ActivityIndicator 
                            size="small" 
                            color="#2563eb" 
                            style={styles.loadingIndicator}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {isDoubles && selectedFirstServer && (
              <Text style={styles.helperText}>
                {loading
                  ? "Saving server order..."
                  : "Pick receiver to start immediately"}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: DesignTokens.borderRadius.sm,
    width: "95%",
    maxWidth: 400,
    maxHeight: "80%",
    padding: DesignTokens.spacing[4],
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: "#1f2937",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize["2xl"],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: "#374151",
  },
  optionsContainer: {
    gap: DesignTokens.spacing[4],
  },
  optionButton: {
    padding: DesignTokens.spacing[6],
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: "#f3f4f6",
  },
  optionButtonSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  optionTextSelected: {
    color: "#2563eb",
  },
  helperText: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    zIndex: 10,
    borderRadius: DesignTokens.borderRadius.sm,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
});

