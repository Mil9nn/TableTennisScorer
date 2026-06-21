import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Colors, Spacing, Typography, Gradients } from "@/constants/theme";
import { JoinCodeForm } from "@/components/tournaments/join-share/JoinCodeForm";
import { JoinQrScannerModal } from "@/components/tournaments/join-share";
import { useTournamentJoin } from "@/hooks/useTournamentJoin";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isValidJoinCode, parseJoinCodeFromUrl } from "@/lib/tournaments/joinLinks";

export default function JoinTournamentPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const user = useAuthStore((state) => state.user);
  const { joinWithCode, loading } = useTournamentJoin();

  const [joinCode, setJoinCode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const autoJoinAttemptedRef = useRef(false);

  const codeFromLink = (() => {
    const raw = params.code;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value ? parseJoinCodeFromUrl(value) ?? (isValidJoinCode(value) ? value.toUpperCase() : null) : null;
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
          text2: data.message || "Successfully joined tournament!",
        });
        router.replace(`/tournaments/${data.tournament._id}`);
      } catch (err: any) {
        console.error("Error joining tournament:", err);
        if (err.response?.status === 401) {
          Toast.show({
            type: "info",
            text1: "Sign in required",
            text2: "Log in to join this tournament",
          });
          router.replace("/auth/login");
          return;
        }
        Toast.show({
          type: "error",
          text1: "Error",
          text2: err.response?.data?.error || err.message || "Failed to join tournament",
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={Gradients.tournaments as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Icon name="arrow-left" library="material" size={20} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Join tournament</Text>
          <Text style={styles.headerSubtitle}>
            Open an invite link, scan a QR code, or enter a code
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card variant="elevated" style={styles.card}>
          {!user && codeFromLink ? (
            <Text style={styles.signInHint}>
              Sign in to join with code {codeFromLink}
            </Text>
          ) : null}
          <JoinCodeForm
            joinCode={joinCode}
            loading={loading}
            onChangeCode={setJoinCode}
            onSubmit={handleJoin}
            onScanPress={() => setScannerOpen(true)}
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
        </Card>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/tournaments");
          }}
          style={styles.backLink}
        >
          <Icon name="arrow-left" library="material" size={16} color={Colors.light.primary} />
          <Text style={styles.backLinkText}>Back to tournaments</Text>
        </Pressable>
      </View>

      <JoinQrScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCodeScanned={handleScannedCode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    marginBottom: Spacing.sm,
  },
  headerContent: {
    marginTop: Spacing.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  card: {
    padding: Spacing.lg,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backLinkText: {
    ...Typography.sm,
    color: Colors.light.primary,
    fontWeight: Typography.weights.medium,
  },
  signInHint: {
    ...Typography.sm,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  signInButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  signInButtonText: {
    ...Typography.sm,
    color: Colors.light.primary,
    fontWeight: Typography.weights.semibold,
  },
});
