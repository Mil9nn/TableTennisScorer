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
    // dotenv not available — rely on shell / EAS env vars
  }
}

loadEnvFiles();

module.exports = () => {
  delete require.cache[require.resolve("./app.json")];
  const appJson = require("./app.json");
  const existingExtra = appJson.expo.extra ?? {};

  const {
    googleWebClientId: _w,
    googleIosClientId: _i,
    googleAndroidClientId: _a,
    ...restExtra
  } = existingExtra;

  return {
    expo: {
      ...appJson.expo,
      extra: restExtra,
      plugins: [...(appJson.expo.plugins ?? []), "expo-web-browser"],
    },
  };
};
