import Constants from "expo-constants";
import { Platform } from "react-native";

type GoogleAuthExtra = {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

const extra = Constants.expoConfig?.extra as GoogleAuthExtra | undefined;

function trim(value?: string): string {
  return value?.trim() ?? "";
}

const webClientId =
  trim(extra?.googleWebClientId) ||
  trim(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);

const androidClientId =
  trim(extra?.googleAndroidClientId) ||
  trim(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) ||
  webClientId;

const iosClientId =
  trim(extra?.googleIosClientId) ||
  trim(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) ||
  webClientId;

export const GOOGLE_AUTH = {
  webClientId,
  androidClientId,
  iosClientId,
};

/** Client IDs passed to expo-auth-session (platform-specific). */
export function getGoogleAuthRequestConfig() {
  return {
    webClientId: webClientId || undefined,
    androidClientId: androidClientId || undefined,
    iosClientId: iosClientId || undefined,
  };
}

export function isGoogleAuthConfigured(): boolean {
  if (Platform.OS === "android") {
    return Boolean(GOOGLE_AUTH.androidClientId);
  }
  if (Platform.OS === "ios") {
    return Boolean(GOOGLE_AUTH.iosClientId || GOOGLE_AUTH.webClientId);
  }
  return Boolean(GOOGLE_AUTH.webClientId);
}

export function getGoogleAuthSetupHint(): string {
  if (Platform.OS === "android") {
    return (
      "On Android, create an OAuth client of type Android in Google Cloud Console, " +
      "then set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env and restart Expo (npx expo start -c)."
    );
  }
  return "Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env and restart Expo (npx expo start -c).";
}
