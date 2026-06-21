import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { axiosInstance } from "@/lib/axiosInstance";
import Toast from "react-native-toast-message";
import { Avatar } from "@/components/ui/Avatar";
import { Ionicons } from "@expo/vector-icons";
import {
  Participant as TournamentParticipant,
  Seeding as TournamentSeeding,
  isTeamParticipant,
  getParticipantDisplayName,
  getParticipantImage as getParticipantImageUtil,
} from "@/types/tournament.type";

interface SeedingManagerProps {
  visible: boolean;
  onClose: () => void;
  tournamentId: string;
  participants: TournamentParticipant[];
  currentSeeding: TournamentSeeding[];
  onUpdate: () => void;
  category?: "individual" | "team";
}

interface LocalSeeding {
  participant: TournamentParticipant | string;
  seedNumber: number;
  seedingRank?: number;
  seedingPoints?: number;
}

export function SeedingManager({
  visible,
  onClose,
  tournamentId,
  participants,
  currentSeeding,
  onUpdate,
  category = "individual",
}: SeedingManagerProps) {
  const [seeding, setSeeding] = useState<LocalSeeding[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      if (currentSeeding && currentSeeding.length > 0) {
        const converted: LocalSeeding[] = currentSeeding.map((s) => ({
          participant: s.participant,
          seedNumber: s.seedNumber,
          seedingRank: s.seedingRank,
          seedingPoints: s.seedingPoints,
        }));
        setSeeding(converted);
      } else {
        const initialSeeding: LocalSeeding[] = participants.map((p, index) => ({
          participant: p,
          seedNumber: index + 1,
        }));
        setSeeding(initialSeeding);
      }
      setLoading(false);
    }
  }, [visible, participants, currentSeeding]);

  const moveParticipant = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === seeding.length - 1) return;

    const items = Array.from(seeding);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    const updatedSeeding = items.map((item, idx) => ({
      ...item,
      seedNumber: idx + 1,
    }));

    setSeeding(updatedSeeding);
  };

  const handleShuffle = () => {
    const shuffled = [...seeding].sort(() => Math.random() - 0.5);
    const updatedSeeding = shuffled.map((item, index) => ({
      ...item,
      seedNumber: index + 1,
    }));
    setSeeding(updatedSeeding);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const seedingData = seeding.map((s) => ({
        participant: typeof s.participant === "string" ? s.participant : s.participant._id,
        seedNumber: s.seedNumber,
        seedingRank: s.seedingRank,
        seedingPoints: s.seedingPoints,
      }));

      await axiosInstance.put(`/tournaments/${tournamentId}/seeding`, {
        seeding: seedingData,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Seeding updated successfully",
      });

      onUpdate();
      onClose();
    } catch (err: any) {
      console.error("Error updating seeding:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Failed to update seeding",
      });
    } finally {
      setSaving(false);
    }
  };

  const getParticipantName = (participant: TournamentParticipant | string): string => {
    if (typeof participant === "string") return "Unknown";
    return getParticipantDisplayName(participant);
  };

  const getParticipantImage = (participant: TournamentParticipant | string): string | undefined => {
    if (typeof participant === "string") return undefined;
    return getParticipantImageUtil(participant);
  };

  const getParticipantSubtext = (participant: TournamentParticipant | string): string | undefined => {
    if (typeof participant === "string") return undefined;
    if (isTeamParticipant(participant)) {
      return participant.city || `${participant.players?.length || 0} players`;
    }
    return `@${participant.username || "unknown"}`;
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <DialogTitle>Manage Seeding</DialogTitle>
              <DialogDescription>
                Arrange participants in seeding order
              </DialogDescription>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </DialogHeader>

        <View className="p-4 gap-4">
          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : (
            <>
              {/* Shuffle Button */}
              <TouchableOpacity
                onPress={handleShuffle}
                className="flex-row items-center justify-center gap-2 py-3 px-4 bg-gray-100 rounded-lg"
                activeOpacity={0.7}
              >
                <Ionicons name="shuffle" size={20} color="#374151" />
                <Text className="text-gray-700 font-semibold">Shuffle</Text>
              </TouchableOpacity>

              {/* Seeding List */}
              <ScrollView className="max-h-96">
                {seeding.map((item, index) => (
                  <View
                    key={index}
                    className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2"
                  >
                    {/* Seed Number */}
                    <View className="w-8 items-center">
                      <Text className="text-sm font-semibold text-gray-600">
                        {item.seedNumber}
                      </Text>
                    </View>

                    {/* Participant Info */}
                    <Avatar
                      src={getParticipantImage(item.participant)}
                      alt={getParticipantName(item.participant)}
                      size={40}
                    />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-900">
                        {getParticipantName(item.participant)}
                      </Text>
                      {getParticipantSubtext(item.participant) && (
                        <Text className="text-xs text-gray-500">
                          {getParticipantSubtext(item.participant)}
                        </Text>
                      )}
                    </View>

                    {/* Move Buttons */}
                    <View className="flex-row gap-1">
                      <TouchableOpacity
                        onPress={() => moveParticipant(index, "up")}
                        disabled={index === 0}
                        className="p-2"
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={20}
                          color={index === 0 ? "#d1d5db" : "#374151"}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => moveParticipant(index, "down")}
                        disabled={index === seeding.length - 1}
                        className="p-2"
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={index === seeding.length - 1 ? "#d1d5db" : "#374151"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        <DialogFooter>
          <Button variant="outline" onPress={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onPress={handleSave} disabled={saving} loading={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

