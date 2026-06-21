import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { isValidJoinCode } from "@/lib/tournaments/joinLinks";

interface JoinCodeFormProps {
  joinCode: string;
  loading: boolean;
  onChangeCode: (code: string) => void;
  onSubmit: () => void;
  onScanPress: () => void;
}

export function JoinCodeForm({
  joinCode,
  loading,
  onChangeCode,
  onSubmit,
  onScanPress,
}: JoinCodeFormProps) {
  const canSubmit = isValidJoinCode(joinCode) && !loading;

  return (
    <View>
      <Text style={styles.cardTitle}>Enter join code</Text>
      <Text style={styles.cardDescription}>
        Use the code from your organizer, or scan their QR code
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Join code</Text>
        <TextInput
          style={styles.input}
          placeholder="ABC123"
          value={joinCode}
          onChangeText={(text) => onChangeCode(text.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
          placeholderTextColor={Colors.light.textTertiary}
        />
      </View>

      <Button
        onPress={onSubmit}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canSubmit}
        style={styles.joinButton}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.buttonText}>Joining…</Text>
          </>
        ) : (
          <Text style={styles.buttonText}>Join tournament</Text>
        )}
      </Button>

      <Button
        onPress={onScanPress}
        variant="outline"
        size="lg"
        fullWidth
        disabled={loading}
        style={styles.scanButton}
      >
        <Text style={styles.scanButtonText}>Scan QR code</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    ...Typography.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    ...Typography.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography["2xl"],
    fontFamily: "monospace",
    letterSpacing: 8,
    textAlign: "center",
    textTransform: "uppercase",
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    color: Colors.light.text,
  },
  joinButton: {
    marginBottom: Spacing.sm,
  },
  scanButton: {
    marginBottom: Spacing.lg,
  },
  buttonText: {
    ...Typography.base,
    fontWeight: Typography.weights.semibold,
    color: "#fff",
    marginLeft: Spacing.xs,
  },
  scanButtonText: {
    ...Typography.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.primary,
  },
});
