import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Icon } from "@/components/ui/Icon";
import { JoinCodeForm } from "@/components/tournaments/join-share/JoinCodeForm";
import { JoinQrScannerModal } from "@/components/tournaments/join-share";
import { useTeamJoin } from "@/hooks/useTeamJoin";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import { isValidJoinCode, parseJoinCodeFromUrl } from "@/lib/teams/joinLinks";

export default function JoinTeamPage() {
  const router = useRouter();
  const theme = useThemeColors();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const user = useAuthStore((state) => state.user);
  const { joinWithCode, loading } = useTeamJoin();

  const [joinCode, setJoinCode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const autoJoinAttemptedRef = useRef(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        },
        header: {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.primary,
        },
        headerContent: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[6],
          paddingHorizontal: theme.spacing[7],
          height: 56,
        },
        backButton: {
          padding: theme.spacing[3],
          borderRadius: theme.borderRadius.sm,
        },
        headerTitle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        scrollContainer: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          paddingBottom: theme.spacing[8],
        },
        section: {
          paddingHorizontal: theme.spacing[7],
          paddingTop: theme.spacing[5],
        },
        sectionTitle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[2],
        },
        sectionSubtitle: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          marginBottom: theme.spacing[5],
          lineHeight: theme.typography.fontSize.sm * 1.5,
        },
        signInHint: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          textAlign: "center",
          marginBottom: theme.spacing[4],
        },
        signInButton: {
          marginTop: theme.spacing[2],
          paddingVertical: theme.spacing[3],
          alignItems: "center",
        },
        signInButtonText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.primary[600],
          fontWeight: theme.typography.fontWeight.semibold,
        },
        backLink: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing[2],
          marginTop: theme.spacing[6],
          paddingVertical: theme.spacing[3],
        },
        backLinkText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.primary[600],
          fontWeight: theme.typography.fontWeight.medium,
        },
      }),
    [theme],
  );

  const codeFromLink = (() => {
    const raw = params.code;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value
      ? parseJoinCodeFromUrl(value) ?? (isValidJoinCode(value) ? value.toUpperCase() : null)
      : null;
  })();

  useEffect(() => {
    if (codeFromLink) {
      setJoinCode(codeFromLink);
    }
  }, [codeFromLink]);

  const performJoin = useCallback(
    async (code: string) => {
      try {
        const data = await joinWithCode(code);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: data.message || "Successfully joined team!",
        });
        router.replace(`/team/${data.team._id}`);
      } catch (err: unknown) {
        console.error("Error joining team:", err);
        const status =
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "status" in err.response
            ? (err.response as { status?: number }).status
            : undefined;
        if (status === 401) {
          Toast.show({
            type: "info",
            text1: "Sign in required",
            text2: "Log in to join this team",
          });
          router.replace("/auth/login");
          return;
        }
        const apiError =
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "data" in err.response &&
          err.response.data &&
          typeof err.response.data === "object"
            ? (err.response.data as { error?: string }).error
            : undefined;
        const message =
          apiError ||
          (err instanceof Error ? err.message : undefined) ||
          "Failed to join team";
        Toast.show({
          type: "error",
          text1: "Error",
          text2: message,
        });
      }
    },
    [joinWithCode, router],
  );

  useEffect(() => {
    if (!codeFromLink || autoJoinAttemptedRef.current || !user) return;
    autoJoinAttemptedRef.current = true;
    void performJoin(codeFromLink);
  }, [codeFromLink, performJoin, user]);

  const handleJoin = () => {
    if (!isValidJoinCode(joinCode)) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Join code must be 6 characters",
      });
      return;
    }
    void performJoin(joinCode);
  };

  const handleScannedCode = (code: string) => {
    setJoinCode(code);
    void performJoin(code);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backButton}
          >
            <Icon name="chevron-left" size={20} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Join team</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter join code</Text>
          <Text style={styles.sectionSubtitle}>
            Open an invite link, scan a QR code, or enter the code from your team captain.
          </Text>

          {!user && codeFromLink ? (
            <Text style={styles.signInHint}>Sign in to join with code {codeFromLink}</Text>
          ) : null}

          <JoinCodeForm
            joinCode={joinCode}
            loading={loading}
            onChangeCode={setJoinCode}
            onSubmit={handleJoin}
            onScanPress={() => setScannerOpen(true)}
            submitLabel="Join team"
          />

          {!user ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/auth/login");
              }}
              style={styles.signInButton}
            >
              <Text style={styles.signInButtonText}>Sign in to join</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/teams");
            }}
            style={styles.backLink}
          >
            <Icon name="chevron-left" size={16} color={theme.colors.primary[600]} />
            <Text style={styles.backLinkText}>Back to teams</Text>
          </Pressable>
        </View>
      </ScrollView>

      <JoinQrScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCodeScanned={handleScannedCode}
      />
    </SafeAreaView>
  );
}
