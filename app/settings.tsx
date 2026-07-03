import { LEGAL_URLS } from "@/lib/legalUrls";
import { DesignTokens } from "@/constants/designTokens";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/hooks/useAuthStore";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, List } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const appVersion = Constants.expoConfig?.version ?? "1.0.0";

async function openUrl(url: string) {
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
  });
}

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(() => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
            router.replace("/auth/login");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }, [logout, router]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Icon name="chevron-left" size={22} color={DesignTokens.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>About</Text>
        <Card mode="contained" style={styles.card}>
          <List.Item
            title="App version"
            description={`TTPro ${appVersion}`}
            left={(props) => <List.Icon {...props} icon="information-outline" />}
          />
        </Card>

        <Text style={styles.sectionLabel}>Legal</Text>
        <Card mode="contained" style={styles.card}>
          <List.Item
            title="Privacy Policy"
            description="How we collect and use your data"
            left={(props) => <List.Icon {...props} icon="shield-account-outline" />}
            onPress={() => openUrl(LEGAL_URLS.privacyPolicy)}
          />
          <List.Item
            title="Terms of Service"
            description="Rules for using TTPro"
            left={(props) => <List.Icon {...props} icon="file-document-outline" />}
            onPress={() => openUrl(LEGAL_URLS.termsOfService)}
          />
        </Card>

        <Text style={styles.sectionLabel}>Support</Text>
        <Card mode="contained" style={styles.card}>
          <List.Item
            title="Contact us"
            description="Questions, feedback, or account help"
            left={(props) => <List.Icon {...props} icon="email-outline" />}
            onPress={() => openUrl(LEGAL_URLS.contact)}
          />
        </Card>

        <Text style={styles.sectionLabel}>Account</Text>
        <Card mode="contained" style={styles.card}>
          <List.Item
            title={loggingOut ? "Logging out…" : "Log out"}
            description="Sign out of your account on this device"
            left={(props) => <List.Icon {...props} icon="logout" />}
            onPress={handleLogout}
            disabled={loggingOut}
          />
          <List.Item
            title="Delete account"
            description="Permanently remove your account and data"
            left={(props) => (
              <List.Icon
                {...props}
                icon="account-remove-outline"
                color={DesignTokens.colors.error}
              />
            )}
            titleStyle={styles.destructiveTitle}
            onPress={() => router.push("/account-deletion")}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    backgroundColor: DesignTokens.colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
  },
  headerSpacer: { width: 40 },
  content: {
    padding: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[2],
    paddingBottom: DesignTokens.spacing[8],
  },
  sectionLabel: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[1],
    marginLeft: DesignTokens.spacing[1],
  },
  card: {
    backgroundColor: DesignTokens.colors.background.primary,
    borderRadius: DesignTokens.borderRadius.md,
  },
  destructiveTitle: {
    color: DesignTokens.colors.error,
  },
});
