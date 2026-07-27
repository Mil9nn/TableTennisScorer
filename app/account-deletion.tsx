import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput as PaperTextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { DesignTokens } from "@/constants/designTokens";
import { useAuthStore } from "@/hooks/useAuthStore";

const DELETED_ITEMS = [
  "Profile information (name, email, photo)",
  "Login credentials and verification data",
  "Player statistics and subscription records",
  "Team and tournament memberships",
];

const RETAINED_ITEMS = [
  "Match scores may remain in anonymized form",
  "Billing records kept up to 30 days for compliance",
];

export default function AccountDeletionScreen() {
  const router = useRouter();
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canSubmit = confirmation === "DELETE" && !isDeleting;

  const handleDelete = () => {
    if (confirmation !== "DELETE") {
      Toast.show({
        type: "error",
        text1: "Confirmation required",
        text2: 'Type "DELETE" to confirm.',
      });
      return;
    }

    Alert.alert(
      "Delete account permanently?",
      "This action cannot be undone. Your account and personal data will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAccount({ confirmation: "DELETE", password });
              Toast.show({
                type: "success",
                text1: "Account deleted",
                text2: "Your account has been permanently removed.",
              });
              router.replace("/auth/login");
            } catch (error: unknown) {
              const message =
                (error as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ||
                "Failed to delete account. Please try again.";
              Toast.show({
                type: "error",
                text1: "Deletion failed",
                text2: message,
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={DesignTokens.colors.gray[900]}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.warningBox}>
          <Ionicons
            name="warning-outline"
            size={22}
            color={DesignTokens.colors.error}
          />
          <Text style={styles.warningText}>
            Deleting your account is permanent and cannot be undone.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>What will be deleted</Text>
        {DELETED_ITEMS.map((item) => (
          <View key={item} style={styles.listRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
          What may be retained
        </Text>
        {RETAINED_ITEMS.map((item) => (
          <View key={item} style={styles.listRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
          Confirm deletion
        </Text>
        <Text style={styles.fieldHint}>
          Type <Text style={styles.mono}>DELETE</Text> below to confirm.
        </Text>
        <PaperTextInput
          mode="outlined"
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder="DELETE"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
          outlineColor={DesignTokens.colors.gray[300]}
          activeOutlineColor={DesignTokens.colors.error}
        />

        <Text style={[styles.fieldHint, styles.fieldSpacing]}>
          Password (required if you signed up with email)
        </Text>
        <PaperTextInput
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          style={styles.input}
          outlineColor={DesignTokens.colors.gray[300]}
          activeOutlineColor={DesignTokens.colors.primary[600]}
          right={
            <PaperTextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword((v) => !v)}
            />
          }
        />

        <TouchableOpacity
          style={[styles.deleteButton, !canSubmit && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Delete my account"
        >
          <Text style={styles.deleteButtonText}>
            {isDeleting ? "Deleting account…" : "Delete my account"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    backgroundColor: DesignTokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.gray[900],
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignTokens.spacing[6],
    paddingBottom: DesignTokens.spacing[10],
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignTokens.spacing[3],
    backgroundColor: "#fef2f2",
    borderRadius: DesignTokens.borderRadius.sm,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[6],
  },
  warningText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.error,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.gray[900],
    marginBottom: DesignTokens.spacing[2],
  },
  sectionSpacing: {
    marginTop: DesignTokens.spacing[6],
  },
  listRow: {
    flexDirection: "row",
    gap: DesignTokens.spacing[2],
    marginBottom: DesignTokens.spacing[1],
  },
  bullet: {
    color: DesignTokens.colors.text.secondary,
    lineHeight: 20,
  },
  listText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.secondary,
    lineHeight: 20,
  },
  fieldHint: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[2],
  },
  fieldSpacing: {
    marginTop: DesignTokens.spacing[4],
  },
  mono: {
    fontFamily: "monospace",
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.gray[900],
  },
  input: {
    backgroundColor: DesignTokens.colors.background.primary,
  },
  deleteButton: {
    marginTop: DesignTokens.spacing[8],
    backgroundColor: DesignTokens.colors.error,
    borderRadius: DesignTokens.borderRadius.sm,
    paddingVertical: DesignTokens.spacing[4],
    alignItems: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
});
