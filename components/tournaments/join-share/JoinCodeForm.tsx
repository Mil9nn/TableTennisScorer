import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { useThemeColors } from "@/hooks/useThemeColors";
import { isValidJoinCode } from "@/lib/tournaments/joinLinks";

interface JoinCodeFormProps {
  joinCode: string;
  loading: boolean;
  onChangeCode: (code: string) => void;
  onSubmit: () => void;
  onScanPress: () => void;
  submitLabel?: string;
}

export function JoinCodeForm({
  joinCode,
  loading,
  onChangeCode,
  onSubmit,
  onScanPress,
  submitLabel = "Join",
}: JoinCodeFormProps) {
  const theme = useThemeColors();
  const canSubmit = isValidJoinCode(joinCode) && !loading;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        inputContainer: {
          marginBottom: theme.spacing[4],
        },
        inputLabel: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[2],
        },
        input: {
          fontSize: theme.typography.fontSize["2xl"],
          fontFamily: "monospace",
          letterSpacing: 8,
          textAlign: "center",
          textTransform: "uppercase",
          backgroundColor: theme.colors.background.secondary,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[4],
          color: theme.colors.text.primary,
        },
        joinButton: {
          marginBottom: theme.spacing[2],
        },
        scanButton: {
          marginBottom: theme.spacing[2],
        },
        buttonText: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.inverse,
          marginLeft: theme.spacing[1],
        },
        scanButtonText: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.primary[600],
        },
      }),
    [theme],
  );

  return (
    <View>
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
          placeholderTextColor={theme.colors.text.tertiary}
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
            <ActivityIndicator size="small" color={theme.colors.text.inverse} />
            <Text style={styles.buttonText}>Joining…</Text>
          </>
        ) : (
          <Text style={styles.buttonText}>{submitLabel}</Text>
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
