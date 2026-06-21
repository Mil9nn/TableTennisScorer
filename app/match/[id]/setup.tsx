import CustomFormatConfig from "@/app/match/components/CustomFormatConfig";
import { DesignTokens } from "@/constants/designTokens";
import { useMatchStore } from "@/hooks/useMatchStore";
import { axiosInstance } from "@/lib/axiosInstance";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { TeamMatch } from "@/types/match.type";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NestableScrollContainer } from "react-native-draggable-flatlist";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type MatchConfig = {
  type: "singles" | "doubles";
  team1Players: string[];
  team2Players: string[];
};

export default function TeamMatchSetupPage() {
  const router = useRouter();
  const { id: matchIdParam, category: categoryParam } = useLocalSearchParams();
  const matchId = normalizeMatchIdParam(matchIdParam);
  const category = categoryParam === "team" ? "team" : "team";

  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const fetchingMatch = useMatchStore((s) => s.fetchingMatch);
  const match = useMatchStore((s) => s.match);
  const [customConfig, setCustomConfig] = useState<{ matches: MatchConfig[] } | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    fetchMatch(matchId, category);
  }, [matchId, category, fetchMatch]);

  const validateConfig = useCallback((config: { matches: MatchConfig[] }) => {
    if (!config.matches.length) {
      return "Add at least one rubber";
    }
    const invalidIndex = config.matches.findIndex((m) => {
      const required = m.type === "singles" ? 1 : 2;
      return (
        m.team1Players.length !== required ||
        m.team2Players.length !== required ||
        m.team1Players.some((p) => !p) ||
        m.team2Players.some((p) => !p)
      );
    });
    if (invalidIndex !== -1) {
      return `Rubber ${invalidIndex + 1} has incomplete player selection`;
    }
    return null;
  }, []);

  const handleSave = async () => {
    if (!matchId || !customConfig) {
      Alert.alert("Error", "Configure at least one rubber before saving");
      return;
    }
    const err = validateConfig(customConfig);
    if (err) {
      Alert.alert("Error", err);
      return;
    }

    setIsSaving(true);
    try {
      await axiosInstance.post(`/matches/team/${matchId}/submatches`, {
        customConfig,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchMatch(matchId, category);
      router.replace(`/match/${matchId}?category=team` as any);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e.response?.data?.error || "Failed to save rubbers"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!matchId) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Text style={styles.errorText}>Invalid match link</Text>
      </SafeAreaView>
    );
  }

  const loadedId = match?._id ? normalizeMatchIdParam(match._id) : null;
  const isStale = !!loadedId && !!matchId && loadedId !== matchId;

  if (fetchingMatch || isStale) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={["top"]}>
        <ActivityIndicator size="large" color={DesignTokens.colors.primary[600]} />
      </SafeAreaView>
    );
  }

  const teamMatch =
    match?.matchCategory === "team" ? (match as TeamMatch) : null;

  if (!teamMatch) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={["top"]}>
        <Text style={styles.errorText}>Team match not found</Text>
        <Button onPress={() => router.back()}>Go back</Button>
      </SafeAreaView>
    );
  }

  if (teamMatch.matchFormat !== "custom") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Text style={styles.errorText}>Rubber setup is only for custom team ties</Text>
        <Button onPress={() => router.back()}>Go back</Button>
      </SafeAreaView>
    );
  }

  const team1Players = teamMatch.team1?.players || [];
  const team2Players = teamMatch.team2?.players || [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={DesignTokens.colors.text.primary}
          />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Configure rubbers</Text>
          <Text style={styles.subtitle}>
            {teamMatch.team1?.name} vs {teamMatch.team2?.name}
          </Text>
        </View>
      </View>

      <NestableScrollContainer
        style={styles.scrollContainer}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          Add each rubber in order: pick singles or doubles, then choose players for each team.
        </Text>

        <CustomFormatConfig
          team1Players={team1Players}
          team2Players={team2Players}
          team1Name={teamMatch.team1?.name || "Team A"}
          team2Name={teamMatch.team2?.name || "Team B"}
          team1Logo={teamMatch.team1?.logo}
          team2Logo={teamMatch.team2?.logo}
          onChange={setCustomConfig}
        />
      </NestableScrollContainer>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveBtn}
          labelStyle={styles.saveLabel}
        >
          Save rubbers
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.primary,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
  },
  backBtn: {
    padding: DesignTokens.spacing[2],
    borderRadius: DesignTokens.borderRadius.base,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  headerText: {
    flex: 1,
    marginLeft: DesignTokens.spacing[3],
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.secondary,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scroll: {
    padding: DesignTokens.spacing[4],
    paddingBottom: DesignTokens.spacing[8],
  },
  hint: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    marginBottom: DesignTokens.spacing[5],
  },
  footer: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingBottom: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.border.light,
  },
  saveBtn: {
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: DesignTokens.colors.text.primary,
  },
  saveLabel: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
  errorText: {
    textAlign: "center",
    margin: DesignTokens.spacing[6],
    color: DesignTokens.colors.text.secondary,
  },
});
