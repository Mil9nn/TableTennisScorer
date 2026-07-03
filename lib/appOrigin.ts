import Constants from "expo-constants";

/** Canonical production origin for API, legal pages, and relative asset URLs. */
export const PRODUCTION_ORIGIN = "https://ttproapp.com";

export function getWebOrigin(): string {
  const fromConfig = Constants.expoConfig?.extra?.webUrl as string | undefined;
  const raw = (fromConfig ?? PRODUCTION_ORIGIN).trim();
  return raw.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  if (__DEV__) {
    const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
    const host = metroHost || "localhost";
    return `http://${host}:3000/api/`;
  }

  const fromConfig = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  const origin = (fromConfig ?? getWebOrigin()).trim().replace(/\/+$/, "");
  return origin.endsWith("/api") ? `${origin}/` : `${origin}/api/`;
}
