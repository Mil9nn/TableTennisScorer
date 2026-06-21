/** @type {import('expo/config').ExpoConfig} */
const path = require("path");

function loadEnvFiles() {
  const dotenvPaths = [
    path.join(__dirname, ".env.local"),
    path.join(__dirname, ".env"),
    path.join(__dirname, "..", ".env.local"),
    path.join(__dirname, "..", ".env"),
  ];

  try {
    const dotenv = require(path.join(__dirname, "..", "node_modules", "dotenv"));
    for (const envPath of dotenvPaths) {
      dotenv.config({ path: envPath, override: false });
    }
  } catch {
    // dotenv not available — rely on shell env vars
  }
}

function firstGoogleClientId() {
  const list = process.env.GOOGLE_CLIENT_IDS?.trim();
  if (list) return list.split(",")[0].trim();
  return "";
}

loadEnvFiles();

const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || firstGoogleClientId();

const androidClientId =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || webClientId;

const iosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || webClientId;

module.exports = () => {
  // Re-read on each evaluation so EAS CLI sees updates written to app.json.
  delete require.cache[require.resolve("./app.json")];
  const appJson = require("./app.json");

  return {
    expo: {
      ...appJson.expo,
      extra: {
        ...appJson.expo.extra,
        googleWebClientId: webClientId,
        googleIosClientId: iosClientId,
        googleAndroidClientId: androidClientId,
      },
      plugins: [...(appJson.expo.plugins ?? []), "expo-web-browser"],
    },
  };
};
