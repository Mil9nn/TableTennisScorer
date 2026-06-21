import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Ionicons } from "@expo/vector-icons";
import { getDisplayName } from "@/lib/utils";

interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
  rank?: number;
  points?: number;
  groupId?: string;
}

interface CustomMatch {
  participant1: Participant | string | null;
  participant2: Participant | string | null;
}

interface CustomBracketMatcherProps {
  participants: Participant[];
  matches: CustomMatch[];
  onMatchesChange: (matches: CustomMatch[]) => void;
  onSave?: () => void;
  saving?: boolean;
  showGroupInfo?: boolean;
}

export default function CustomBracketMatcher({
  participants,
  matches,
  onMatchesChange,
  onSave,
  saving = false,
  showGroupInfo = false,
}: CustomBracketMatcherProps) {
  const getUsedParticipantIds = (): Set<string> => {
    const used = new Set<string>();
    matches.forEach((match) => {
      const p1Id =
        typeof match.participant1 === "string"
          ? match.participant1
          : match.participant1?._id;
      const p2Id =
        typeof match.participant2 === "string"
          ? match.participant2
          : match.participant2?._id;
      if (p1Id) used.add(p1Id);
      if (p2Id) used.add(p2Id);
    });
    return used;
  };

  const getAvailableParticipants = (excludeIndex?: number): Participant[] => {
    const used = new Set<string>();
    matches.forEach((match, idx) => {
      if (idx === excludeIndex) return;
      const p1Id =
        typeof match.participant1 === "string"
          ? match.participant1
          : match.participant1?._id;
      const p2Id =
        typeof match.participant2 === "string"
          ? match.participant2
          : match.participant2?._id;
      if (p1Id) used.add(p1Id);
      if (p2Id) used.add(p2Id);
    });
    return participants.filter((p) => !used.has(p._id));
  };

  const getParticipantById = (id: string): Participant | undefined => {
    return participants.find((p) => p._id === id);
  };

  const addMatch = () => {
    const available = getAvailableParticipants();
    if (available.length < 2) {
      return;
    }
    onMatchesChange([...matches, { participant1: null, participant2: null }]);
  };

  const removeMatch = (index: number) => {
    onMatchesChange(matches.filter((_, i) => i !== index));
  };

  const updateMatchParticipant = (
    matchIndex: number,
    slot: "participant1" | "participant2",
    participantId: string | null
  ) => {
    const newMatches = [...matches];
    newMatches[matchIndex] = {
      ...newMatches[matchIndex],
      [slot]: participantId,
    };
    onMatchesChange(newMatches);
  };

  const autoGenerateMatches = () => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const newMatches: CustomMatch[] = [];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      newMatches.push({
        participant1: shuffled[i]._id,
        participant2: shuffled[i + 1]._id,
      });
    }

    onMatchesChange(newMatches);
  };

  const clearAllMatches = () => {
    onMatchesChange([]);
  };

  const usedParticipants = getUsedParticipantIds();
  const unmatchedParticipants = participants.filter(
    (p) => !usedParticipants.has(p._id)
  );

  const isValid = matches.every((match) => {
    const p1Id =
      typeof match.participant1 === "string"
        ? match.participant1
        : match.participant1?._id;
    const p2Id =
      typeof match.participant2 === "string"
        ? match.participant2
        : match.participant2?._id;
    return p1Id && p2Id;
  });

  const requiredMatches = Math.floor(participants.length / 2);
  const hasEnoughMatches = matches.length >= requiredMatches;

  return (
    <View className="gap-4">
      {/* Header Actions */}
      <View className="gap-2">
        <View>
          <Text className="text-lg font-semibold text-gray-900">
            Bracket Matches
          </Text>
          <Text className="text-sm mt-1 text-gray-500">
            {matches.length} match{matches.length !== 1 ? "es" : ""} created
            {requiredMatches > 0 && ` • ${requiredMatches} required`}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Button variant="outline" onPress={autoGenerateMatches} disabled={participants.length < 2}>
            <Ionicons name="shuffle" size={16} color="#374151" />
            <Text className="ml-2">Randomize</Text>
          </Button>
          <Button variant="outline" onPress={clearAllMatches} disabled={matches.length === 0}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text className="ml-2 text-red-600">Clear</Text>
          </Button>
          <Button variant="outline" onPress={addMatch} disabled={getAvailableParticipants().length < 2}>
            <Ionicons name="add" size={16} color="#374151" />
            <Text className="ml-2">Add Match</Text>
          </Button>
        </View>
      </View>

      {/* Matches List */}
      <ScrollView className="max-h-96">
        {matches.length === 0 ? (
          <View className="py-8 items-center">
            <Text className="text-sm text-gray-500">No matches created yet</Text>
          </View>
        ) : (
          matches.map((match, index) => {
            const available = getAvailableParticipants(index);
            const p1 = typeof match.participant1 === "string"
              ? getParticipantById(match.participant1)
              : match.participant1;
            const p2 = typeof match.participant2 === "string"
              ? getParticipantById(match.participant2)
              : match.participant2;

            return (
              <View key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm font-semibold text-gray-700">
                    Match {index + 1}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeMatch(index)}
                    className="p-1"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
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
                          onPress={() => updateMatchParticipant(index, "participant1", null)}
                          className="p-1"
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={16} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Select
                        value=""
                        onValueChange={(value) => updateMatchParticipant(index, "participant1", value)}
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
                          onPress={() => updateMatchParticipant(index, "participant2", null)}
                          className="p-1"
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={16} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Select
                        value=""
                        onValueChange={(value) => updateMatchParticipant(index, "participant2", value)}
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

      {/* Unmatched Participants */}
      {unmatchedParticipants.length > 0 && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-gray-700">
            Unmatched Participants ({unmatchedParticipants.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {unmatchedParticipants.map((participant) => (
                <View
                  key={participant._id}
                  className="flex-row items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                >
                  <Avatar src={participant.profileImage} alt={getDisplayName(participant)} size={24} />
                  <Text className="text-xs font-medium text-gray-700">
                    {getDisplayName(participant)}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Save Button */}
      {onSave && (
        <Button
          onPress={onSave}
          disabled={!isValid || !hasEnoughMatches || saving}
          loading={saving}
          fullWidth
        >
          Save Matches
        </Button>
      )}
    </View>
  );
}

