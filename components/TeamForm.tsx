import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Ionicons } from "@expo/vector-icons";
import { Spacing, BorderRadius, Colors, Typography } from "@/constants/theme";
import UserSearchInput from "@/app/match/components/UserSearchInput";

// Schema
const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  captain: z.string().min(1, "Captain is required"),
  city: z.string().optional(),
  players: z.array(z.string().min(1, "Player ID cannot be empty")).min(1, "At least the captain is required"),
});

export type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamFormProps {
  onSubmit: (data: TeamFormValues) => void | Promise<void>;
  defaultValues?: Partial<TeamFormValues>;
  submitLabel?: string;
  isLoading?: boolean;
}

interface Player {
  _id: string;
  fullName?: string;
  username: string;
  profileImage?: string;
}

export default function TeamForm({
  onSubmit,
  defaultValues,
  submitLabel = "Save Team",
  isLoading = false,
}: TeamFormProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [captain, setCaptain] = useState<Player | null>(null);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      captain: defaultValues?.captain || "",
      city: defaultValues?.city || "",
      players: defaultValues?.players || [],
    },
  });

  const addPlayer = (user: Player) => {
    const exists = players.some((p) => p._id === user._id);
    if (!exists) {
      const updated = [...players, user];
      setPlayers(updated);
      form.setValue(
        "players",
        updated.map((p) => p._id)
      );
    }
  };

  const removePlayer = (id: string) => {
    const updated = players.filter((p) => p._id !== id);
    setPlayers(updated);
    form.setValue(
      "players",
      updated.map((p) => p._id)
    );
    // If removed player was captain, clear captain
    if (captain?._id === id) {
      setCaptain(null);
      form.setValue("captain", "");
    }
  };

  const handleCaptainSelect = (user: Player) => {
    setCaptain(user);
    form.setValue("captain", user._id);
    // Also add to players if not already there
    if (!players.some((p) => p._id === user._id)) {
      addPlayer(user);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (players.length < 1) {
      Alert.alert("Error", "Please add at least the team captain");
      return;
    }
    if (!captain) {
      Alert.alert("Error", "Please select a team captain");
      return;
    }
    await onSubmit(data);
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        {/* Team Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Team Name</Text>
          <Controller
            control={form.control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Enter team name"
                value={value}
                onChangeText={onChange}
                error={form.formState.errors.name?.message}
              />
            )}
          />
          {form.formState.errors.name && (
            <Text style={styles.errorText}>
              {form.formState.errors.name.message}
            </Text>
          )}
        </View>

        {/* City (Optional) */}
        <View style={styles.field}>
          <Text style={styles.label}>City (Optional)</Text>
          <Controller
            control={form.control}
            name="city"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Enter city"
                value={value || ""}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        {/* Captain */}
        <View style={styles.field}>
          <Text style={styles.label}>Team Captain</Text>
          <UserSearchInput
            placeholder="Search for captain..."
            onSelect={handleCaptainSelect}
            clearAfterSelect={false}
          />
          {captain && (
            <View style={styles.selectedCaptain}>
              <Text style={styles.selectedCaptainText}>
                Captain: {captain.fullName || captain.username}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCaptain(null);
                  form.setValue("captain", "");
                }}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          {form.formState.errors.captain && (
            <Text style={styles.errorText}>
              {form.formState.errors.captain.message}
            </Text>
          )}
        </View>

        {/* Players */}
        <View style={styles.field}>
          <Text style={styles.label}>Players (min 2 required)</Text>
          <UserSearchInput
            placeholder="Search for players..."
            onSelect={addPlayer}
            clearAfterSelect={true}
          />

          {/* Player badges */}
          {players.length > 0 && (
            <View style={styles.playersList}>
              {players.map((player) => (
                <View key={player._id} style={styles.playerBadge}>
                  <Badge variant="default" size="md">
                    {player.fullName || player.username}
                  </Badge>
                  <TouchableOpacity
                    onPress={() => removePlayer(player._id)}
                    style={styles.removePlayerButton}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.light.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {players.length < 2 && (
            <Text style={styles.helperText}>
              Add at least {2 - players.length} more player
              {2 - players.length === 1 ? "" : "s"}
            </Text>
          )}
          {form.formState.errors.players && (
            <Text style={styles.errorText}>
              {form.formState.errors.players.message}
            </Text>
          )}
        </View>

        {/* Submit */}
        <View style={styles.submitContainer}>
          <Button
            onPress={handleSubmit}
            disabled={players.length < 2 || !captain || isLoading}
            variant="primary"
            size="lg"
          >
            {isLoading ? "Saving..." : submitLabel}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.base,
  },
  form: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
  },
  errorText: {
    ...Typography.sm,
    color: "#ef4444",
    marginTop: 4,
  },
  helperText: {
    ...Typography.sm,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  selectedCaptain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.sm,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.base,
    marginTop: Spacing.xs,
  },
  selectedCaptainText: {
    ...Typography.sm,
    color: Colors.light.text,
    fontWeight: Typography.weights.medium,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  playersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  playerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  removePlayerButton: {
    padding: Spacing.xs,
  },
  submitContainer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.base,
  },
});

