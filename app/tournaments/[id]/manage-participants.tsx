import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { axiosInstance } from "@/lib/axiosInstance";
import { DesignTokens } from "@/constants/designTokens";
import {
  ManageParticipantsContent,
  ManageParticipantsContentHandle,
} from "@/components/tournaments/ManageParticipantsContent";
import { Participant } from "@/types/tournament.type";

const tokens = DesignTokens;

type TournamentPayload = {
  _id: string;
  name: string;
  category: "individual" | "team";
  participants: Participant[];
};

export default function ManageParticipantsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const contentRef = useRef<ManageParticipantsContentHandle>(null);
  const [tournament, setTournament] = useState<TournamentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTournament = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/tournaments/${id}`);
      setTournament(data.tournament);
    } catch (err) {
      console.error("Error fetching tournament:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load tournament",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const isTeamTournament = tournament?.category === "team";
  const title = isTeamTournament ? "Manage Teams" : "Manage Participants";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Tournament not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.chevronButton}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.compactHeader}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.chevronButton}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.smallTitle}>{title}</Text>
        </View>
        <Appbar.Action
          icon="check"
          onPress={() => contentRef.current?.save()}
          disabled={saving}
          loading={saving}
          iconColor="#2563eb"
        />
      </Appbar.Header>

      <ManageParticipantsContent
        ref={contentRef}
        tournamentId={tournament._id}
        participants={tournament.participants || []}
        category={tournament.category}
        onUpdate={(participants) =>
          setTournament((prev) => (prev ? { ...prev, participants } : null))
        }
        onSaveComplete={() => router.back()}
        onSavingChange={setSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: tokens.colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    color: "#64748b",
  },
  backLink: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.primary[600],
    marginTop: tokens.spacing[4],
  },
  compactHeader: {
    height: 48,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  chevronButton: {
    marginRight: 8,
  },
  smallTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});
