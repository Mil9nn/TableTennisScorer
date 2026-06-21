import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import Svg, { Path } from "react-native-svg";
import { DesignTokens } from "@/constants/designTokens";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { useAuthStore } from "@/hooks/useAuthStore";

function GoogleLogoIcon({ width = 20, height = 24 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 40 48" aria-hidden>
      <Path
        fill="#4285F4"
        d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
      />
      <Path
        fill="#34A853"
        d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
      />
      <Path
        fill="#FABB05"
        d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
      />
      <Path
        fill="#E94235"
        d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
      />
    </Svg>
  );
}

type GoogleSignInButtonProps = {
  label?: string;
};

export function GoogleSignInButton({ label = "Continue with Google" }: GoogleSignInButtonProps) {
  const tokens = DesignTokens;
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const { signIn, loading, isConfigured } = useGoogleSignIn({
    onIdToken: loginWithGoogle,
  });

  const handlePress = async () => {
    try {
      await signIn();
    } catch (error: any) {
      Alert.alert("Google sign-in", error?.message || "Could not start Google sign-in.");
    }
  };

  const styles = StyleSheet.create({
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: tokens.spacing[4],
      paddingVertical: tokens.spacing[6],
      borderRadius: tokens.borderRadius.sm,
      borderWidth: 1,
      borderColor: tokens.colors.gray[200],
      backgroundColor: tokens.colors.white,
    },
    disabledButton: {
      opacity: 0.7,
    },
    label: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.gray[900],
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: tokens.spacing[8],
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: tokens.colors.gray[200],
    },
    dividerText: {
      marginHorizontal: tokens.spacing[4],
      fontSize: tokens.typography.fontSize.xs,
      color: tokens.colors.gray[400],
      textTransform: "uppercase",
    },
  });

  if (!isConfigured) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.disabledButton]}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tokens.colors.gray[500]} />
      ) : (
        <>
          <GoogleLogoIcon width={20} height={24} />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function AuthDivider() {
  const tokens = DesignTokens;
  const styles = StyleSheet.create({
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: tokens.spacing[8],
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: tokens.colors.gray[200],
    },
    dividerText: {
      marginHorizontal: tokens.spacing[4],
      fontSize: tokens.typography.fontSize.xs,
      color: tokens.colors.gray[400],
      textTransform: "uppercase",
    },
  });

  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}
