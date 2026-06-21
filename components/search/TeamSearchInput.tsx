import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
} from "react-native";
import { axiosInstance } from "@/lib/axiosInstance";
import { Avatar } from "@/components/ui/Avatar";
import { getInitial } from "@/lib/utils";
import BlinkingDotsLoader from "../loaders/BlinkingDotsLoader";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

type Team = {
  _id: string;
  name: string;
  logo?: string;
};

interface TeamSearchInputProps {
  placeholder?: string;
  onSelect: (team: Team) => void;
  clearAfterSelect?: boolean;
  defaultValue?: string;
}

export default function TeamSearchInput({
  placeholder = "Search teams...",
  onSelect,
  clearAfterSelect = false,
  defaultValue,
}: TeamSearchInputProps) {
  const [query, setQuery] = useState(defaultValue || "");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setTeams([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/teams/search?query=${query}`);
        if (res.data.success) {
          setTeams(res.data.teams || []);
        }
      } catch (err) {
        console.error("Failed to search teams:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (team: Team) => {
    setSelectedTeam(team);
    onSelect(team);
    if (clearAfterSelect) {
      setQuery("");
    } else {
      setQuery(team.name);
    }
    setTeams([]);
    setFocused(false);
  };

  const handleClear = () => {
    setSelectedTeam(null);
    setQuery("");
  };

  const renderTeam = ({ item: team }: { item: Team }) => (
    <Pressable
      style={({ pressed }) => [
        styles.teamItem,
        pressed && styles.teamItemPressed,
      ]}
      onPress={() => handleSelect(team)}
    >
      <Avatar
        src={team.logo}
        alt={team.name}
        size={32}
      />
      <Text style={styles.teamName}>{team.name}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {selectedTeam ? (
        <View style={styles.selectedContainer}>
          <View style={styles.selectedContent}>
            <Avatar
              src={selectedTeam.logo}
              alt={selectedTeam.name}
              size={32}
            />
            <Text style={styles.selectedName}>{selectedTeam.name}</Text>
          </View>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.light.textTertiary}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
          />
          {loading && (
            <View style={styles.loadingContainer}>
              <BlinkingDotsLoader size={6} color={Colors.light.textSecondary} />
            </View>
          )}
        </View>
      )}

      {/* Dropdown */}
      {focused && query.trim().length >= 2 && !loading && !selectedTeam && (
        <View style={styles.dropdown}>
          {teams.length > 0 ? (
            <FlatList
              data={teams}
              renderItem={renderTeam}
              keyExtractor={(item) => item._id}
              style={styles.teamList}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No teams found. Try a different search term.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    ...Typography.base,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    paddingRight: 40,
  },
  loadingContainer: {
    position: "absolute",
    right: Spacing.base,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  selectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  selectedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  selectedName: {
    ...Typography.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.light.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.base,
    maxHeight: 256,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  teamList: {
    maxHeight: 256,
  },
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  teamItemPressed: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  teamName: {
    ...Typography.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.light.text,
  },
  emptyState: {
    padding: Spacing.base,
    alignItems: "center",
  },
  emptyText: {
    ...Typography.sm,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});

