import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { axiosInstance } from "@/lib/axiosInstance";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { KnockoutBracket } from "@/types/tournamentDraw";
import { getDisplayName } from "@/lib/utils";

interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

interface CustomMatchup {
  matchNumber: number;
  participant1: string | null;
  participant2: string | null;
}

interface CustomKnockoutMatcherProps {
  tournamentId: string;
  bracket: KnockoutBracket;
  participants: Participant[];
  currentRound: number;
  onSuccess?: () => void;
}

export default function CustomKnockoutMatcher({
  tournamentId,
  bracket,
  participants,
  currentRound,
  onSuccess,
}: CustomKnockoutMatcherProps) {
  const [matchups, setMatchups] = useState<CustomMatchup[]>([]);
  const [saving, setSaving] = useState(false);

  const getEliminatedParticipants = (upToRound: number): Set<string> => {
    const eliminated = new Set<string>();

    for (const round of bracket.rounds) {
      if (round.roundNumber >= upToRound) break;

      for (const match of round.matches) {
        if (match.completed && match.winner) {
          const loser =
            match.participant1 === match.winner
              ? match.participant2
              : match.participant1;

          if (loser) {
            eliminated.add(loser.toString());
          }
        }
      }
    }

    return eliminated;
  };

  const getEligibleParticipants = (): Set<string> => {
    if (currentRound === 1) {
      return new Set(participants.map((p) => p._id));
    }

    const eliminated = getEliminatedParticipants(currentRound);
    const eligible = new Set<string>();

    for (const participant of participants) {
      if (!eliminated.has(participant._id)) {
        eligible.add(participant._id);
      }
    }

    return eligible;
  };

  const eligibleParticipantIds = getEligibleParticipants();

  useEffect(() => {
    const currentRoundData = bracket.rounds.find((r) => r.roundNumber === currentRound);
    if (currentRoundData) {
      const initialMatchups: CustomMatchup[] = currentRoundData.matches.map((match, idx) => ({
        matchNumber: idx + 1,
        participant1:
          match.participant1 && typeof match.participant1 === "string"
            ? match.participant1
            : null,
        participant2:
          match.participant2 && typeof match.participant2 === "string"
            ? match.participant2
            : null,
      }));
      setMatchups(initialMatchups);
    }
  }, [bracket, currentRound]);

  const updateMatchup = (
    matchNumber: number,
    slot: "participant1" | "participant2",
    participantId: string | null
  ) => {
    setMatchups((prev) =>
      prev.map((matchup) =>
        matchup.matchNumber === matchNumber
          ? { ...matchup, [slot]: participantId }
          : matchup
      )
    );
  };

  const getAvailableParticipants = (excludeMatchNumber?: number): Participant[] => {
    const used = new Set<string>();
    matchups.forEach((matchup) => {
      if (matchup.matchNumber === excludeMatchNumber) return;
      if (matchup.participant1) used.add(matchup.participant1);
      if (matchup.participant2) used.add(matchup.participant2);
    });

    return participants.filter(
      (p) => eligibleParticipantIds.has(p._id) && !used.has(p._id)
    );
  };

  const handleSave = async () => {
    const isValid = matchups.every(
      (m) => m.participant1 !== null && m.participant2 !== null
    );

    if (!isValid) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "All matchups must have both participants assigned",
      });
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post(`/tournaments/${tournamentId}/knockout-matches`, {
        round: currentRound,
        matchups: matchups.map((m) => ({
          matchNumber: m.matchNumber,
          participant1: m.participant1,
          participant2: m.participant2,
        })),
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Matches created successfully",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Error creating matches:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Failed to create matches",
      });
    } finally {
      setSaving(false);
    }
  };

  const getParticipantById = (id: string | null): Participant | undefined => {
    if (!id) return undefined;
    return participants.find((p) => p._id === id);
  };

  return (
    <View className="gap-4">
      <Card>
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            Custom Match Setup - Round {currentRound}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Assign participants to matches for this round
          </Text>
        </View>

        <ScrollView className="p-4 max-h-96">
          {matchups.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-sm text-gray-500">No matches in this round</Text>
            </View>
          ) : (
            matchups.map((matchup) => {
              const available = getAvailableParticipants(matchup.matchNumber);
              const p1 = getParticipantById(matchup.participant1);
              const p2 = getParticipantById(matchup.participant2);

              return (
                <View
                  key={matchup.matchNumber}
                  className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <View className="mb-3">
                    <Text className="text-sm font-semibold text-gray-700">
                      Match {matchup.matchNumber}
                    </Text>
                  </View>

                  <View className="gap-3">
                    {/* Participant 1 */}
                    <View className="gap-2">
                      <Text className="text-xs font-medium text-gray-600">Participant 1</Text>
                      {p1 ? (
                        <View className="flex-row items-center gap-2 p-2 bg-white rounded-lg">
                          <Avatar src={p1.profileImage} alt={getDisplayName(p1)} size={32} />
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-900">
                              {getDisplayName(p1)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => updateMatchup(matchup.matchNumber, "participant1", null)}
                            className="p-1"
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close" size={16} color="#6b7280" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Select
                          value=""
                          onValueChange={(value) =>
                            updateMatchup(matchup.matchNumber, "participant1", value)
                          }
                          placeholder="Select participant"
                          items={available.map((p) => ({
                            label: getDisplayName(p),
                            value: p._id,
                          }))}
                        />
                      )}
                    </View>

                    {/* VS */}
                    <View className="items-center">
                      <Text className="text-xs text-gray-400 font-semibold">vs</Text>
                    </View>

                    {/* Participant 2 */}
                    <View className="gap-2">
                      <Text className="text-xs font-medium text-gray-600">Participant 2</Text>
                      {p2 ? (
                        <View className="flex-row items-center gap-2 p-2 bg-white rounded-lg">
                          <Avatar src={p2.profileImage} alt={getDisplayName(p2)} size={32} />
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-900">
                              {getDisplayName(p2)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => updateMatchup(matchup.matchNumber, "participant2", null)}
                            className="p-1"
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close" size={16} color="#6b7280" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Select
                          value=""
                          onValueChange={(value) =>
                            updateMatchup(matchup.matchNumber, "participant2", value)
                          }
                          placeholder="Select participant"
                          items={available.map((p) => ({
                            label: getDisplayName(p),
                            value: p._id,
                          }))}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View className="p-4 border-t border-gray-200">
          <Button
            onPress={handleSave}
            disabled={saving || !matchups.every((m) => m.participant1 && m.participant2)}
            loading={saving}
            fullWidth
          >
            Save Matches
          </Button>
        </View>
      </Card>
    </View>
  );
}

