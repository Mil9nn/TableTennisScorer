import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  getGoogleAuthRequestConfig,
  getGoogleAuthSetupHint,
  isGoogleAuthConfigured,
} from "@/constants/googleAuth";

WebBrowser.maybeCompleteAuthSession();

type UseGoogleSignInOptions = {
  onIdToken: (idToken: string) => Promise<void>;
};

/**
 * Opens the Google OAuth UI and forwards the ID token to the caller
 * (typically useAuthStore.loginWithGoogle).
 */
export function useGoogleSignIn({ onIdToken }: UseGoogleSignInOptions) {
  const [loading, setLoading] = useState(false);
  const clientConfig = getGoogleAuthRequestConfig();

  const [request, response, promptAsync] = Google.useAuthRequest(clientConfig);

  useEffect(() => {
    if (response?.type !== "success") return;

    const idToken = response.authentication?.idToken;
    if (!idToken) return;

    void (async () => {
      setLoading(true);
      try {
        await onIdToken(idToken);
      } finally {
        setLoading(false);
      }
    })();
  }, [response, onIdToken]);

  const signIn = async () => {
    if (!isGoogleAuthConfigured()) {
      throw new Error(getGoogleAuthSetupHint());
    }

    if (Platform.OS === "android" && !clientConfig.androidClientId) {
      throw new Error(getGoogleAuthSetupHint());
    }

    if (!request) {
      throw new Error("Google sign-in is not ready yet. Please try again.");
    }

    setLoading(true);
    try {
      const result = await promptAsync();
      if (result?.type !== "success") {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return {
    signIn,
    loading,
    isConfigured: isGoogleAuthConfigured(),
    isReady: Boolean(request),
  };
}
