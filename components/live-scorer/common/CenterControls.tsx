import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { useMatchStore } from "@/hooks/useMatchStore";
import { isIndividualMatch } from "@/types/match.type";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { DesignTokens } from "@/constants/designTokens";

function tapHaptic() {
  if (Platform.OS !== "web") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** Matches web `CenterControls`: Undo, Swap, Reset only (no start/pause UI). */
interface CenterControlsProps {
  onReset: () => void | Promise<void>;
  onUndo: () => void | Promise<void>;
  canUndo: boolean;
  onSwap: () => void | Promise<void>;
  canSwap: boolean;
}

const tokens = DesignTokens;

export default function CenterControls({
  onReset,
  onUndo,
  canUndo,
  onSwap,
  canSwap,
}: CenterControlsProps) {
  const [pendingAction, setPendingAction] = useState<"undo" | "swap" | "reset" | null>(
    null
  );
  const match = useMatchStore((s) => s.match);
  const isIndividual = match && isIndividualMatch(match);

  const isStartingMatch = useIndividualMatch((s) => s.isStartingMatch);
  const individualStatus = useIndividualMatch((s) => s.status);
  const isUpdatingScore = useIndividualMatch((s) => s.isUpdatingScore);
  const isUndoingIndividual = useIndividualMatch((s) => s.isUndoing);

  const isStartingSubMatch = useTeamMatch((s) => s.isStartingSubMatch);
  const teamStatus = useTeamMatch((s) => s.status);
  const isUpdatingTeamScore = useTeamMatch((s) => s.isUpdatingTeamScore);
  const isUndoingTeam = useTeamMatch((s) => s.isUndoing);

  const status = isIndividual ? individualStatus : teamStatus;
  const isStarting = isIndividual ? isStartingMatch : isStartingSubMatch;
  const isUpdating = isIndividual ? isUpdatingScore : isUpdatingTeamScore;
  const isUndoing = isIndividual ? isUndoingIndividual : isUndoingTeam;

  const isAnyOperationInProgress =
    isStarting || isUpdating || isUndoing || pendingAction !== null;

  const runAction = async (
    action: "undo" | "swap" | "reset",
    fn: () => void | Promise<void>
  ) => {
    if (isAnyOperationInProgress) return;
    tapHaptic();
    setPendingAction(action);
    try {
      await Promise.resolve(fn());
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlsRow}>
        <Button
        style={[styles.actionButton, styles.undoButton]}
          mode="outlined"
          onPress={() => void runAction("undo", onUndo)}
          disabled={!canUndo || status === "completed" || isAnyOperationInProgress}
          loading={pendingAction === "undo"}
          textColor="#0F766E"
          buttonColor="#fff"
        >
          <View style={styles.buttonContent}>
            <Ionicons name="arrow-undo-outline" size={14} color="#0F766E" />
            <Text style={[styles.buttonText, styles.buttonTextSpacing]}>Undo</Text>
          </View>
        </Button>

        <Button
        style={[styles.actionButton, styles.swapButton]}
          mode="outlined"
          onPress={() => void runAction("swap", onSwap)}
          disabled={!canSwap || isAnyOperationInProgress}
          loading={pendingAction === "swap"}
          textColor="#475569"
          buttonColor="#fff"
        >
          <View style={styles.buttonContent}>
            <Ionicons name="swap-horizontal-outline" size={14} color="#475569" />
            <Text style={[styles.buttonText, styles.buttonTextSpacing]}>Swap</Text>
          </View>
        </Button>

        <Button
        style={[styles.actionButton, styles.resetButton]}
          mode="outlined"
          onPress={() => void runAction("reset", onReset)}
          disabled={isAnyOperationInProgress}
          loading={pendingAction === "reset"}
          textColor="#B91C1C"
          buttonColor="#fff"
        >
          <View style={styles.buttonContent}>
            <Ionicons name="refresh-outline" size={14} color="#B91C1C" />
            <Text style={[styles.buttonText, styles.buttonTextSpacing]}>Reset</Text>
          </View>
        </Button>
      </View>

      {status === "completed" && (
        <Text style={styles.hint}>Match completed. Use Reset to start over.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  controlsRow: {
    gap: tokens.spacing[4],
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  actionButton: {
    borderWidth: 0,
    borderRadius: tokens.borderRadius.full,
    ...tokens.shadows.sm,
  },
  buttonText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
  },
  buttonTextSpacing: {
    marginLeft: tokens.spacing[2],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  undoButton: {
    backgroundColor: tokens.colors.success + '50',
  },
  swapButton: {
    backgroundColor: tokens.colors.background.secondary,
  },
  resetButton: {
    backgroundColor: tokens.colors.error + '50',
  },
  hint: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: tokens.spacing[4],
    marginTop: tokens.spacing[4],
  },
});
