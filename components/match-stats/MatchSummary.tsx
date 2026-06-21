import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import { DesignTokens } from "@/constants/designTokens";

interface MatchSummaryProps {
  side1Name: string;
  side2Name: string;
  side1Sets: number;
  side2Sets: number;
  side1AvatarUri?: string;
  side2AvatarUri?: string;
}

const tokens = DesignTokens;

const DICEBEAR_BG_PALETTE = [
  "d1d4f9",
  "fcd5ce",
  "cdeac0",
  "fde68a",
  "bfdbfe",
  "fecdd3",
  "ddd6fe",
  "a7f3d0",
];

function getDeterministicDicebearColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return DICEBEAR_BG_PALETTE[hash % DICEBEAR_BG_PALETTE.length];
}

function applyDicebearBackgroundColor(uri: string, seed: string): string {
  try {
    const parsed = new URL(uri);
    if (!parsed.hostname.includes("api.dicebear.com")) return uri;
    if (parsed.searchParams.has("backgroundColor")) return uri;
    parsed.searchParams.set("backgroundColor", getDeterministicDicebearColor(seed));
    return parsed.toString();
  } catch {
    return uri;
  }
}

function getDicebearAvatarUri(name: string): string {
  const seed = (name || "Player").trim();
  const uri = `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;
  return applyDicebearBackgroundColor(uri, seed);
}

export function MatchSummary({
  side1Name,
  side2Name,
  side1Sets,
  side2Sets,
  side1AvatarUri,
  side2AvatarUri,
}: MatchSummaryProps) {
  const isSide1Winner = side1Sets > side2Sets;
  const isSide2Winner = side2Sets > side1Sets;
  const avatar1 = side1AvatarUri?.trim()
    ? applyDicebearBackgroundColor(side1AvatarUri.trim(), side1Name || "Player")
    : getDicebearAvatarUri(side1Name);
  const avatar2 = side2AvatarUri?.trim()
    ? applyDicebearBackgroundColor(side2AvatarUri.trim(), side2Name || "Player")
    : getDicebearAvatarUri(side2Name);

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.container}>
      {/* SIDE 1 */}
      <View style={styles.row}>
        <View style={styles.playerInfo}>
          <View style={styles.avatar}>
            <Image
              source={{ uri: avatar1 }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          </View>
          <Text
            style={[
              styles.playerName,
              isSide1Winner && styles.winnerName,
            ]}
            numberOfLines={1}
          >
            {side1Name}
          </Text>
        </View>
        <Text
          style={[
            styles.score,
            isSide1Winner && styles.winnerScore,
          ]}
        >
          {side1Sets}
        </Text>
      </View>

      {/* SIDE 2 */}
      <View style={styles.row}>
        <View style={styles.playerInfo}>
          <View style={styles.avatar}>
            <Image
              source={{ uri: avatar2 }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          </View>
          <Text
            style={[
              styles.playerName,
              isSide2Winner && styles.winnerName,
            ]}
            numberOfLines={1}
          >
            {side2Name}
          </Text>
        </View>
        <Text
          style={[
            styles.score,
            isSide2Winner && styles.winnerScore,
          ]}
        >
          {side2Sets}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing[4],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[4],
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: tokens.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  playerName: {
    flex: 1,
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  winnerName: {
    color: tokens.colors.success,
  },
  score: {
    fontSize: tokens.typography.fontSize["2xl"],
    fontWeight: tokens.typography.fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  winnerScore: {
    color: tokens.colors.info,
  },
});
