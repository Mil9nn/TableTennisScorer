import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { AddPointPayload } from "@/types/match.type";
import { getFirstName } from "@/lib/utils";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DesignTokens } from "@/constants/designTokens";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

type PlayerInfo = {
  name: string;
  playerId?: string;
  serverKey?: string;
  profileImage?: string;
};

interface PlayerCardProps {
  players: PlayerInfo[];
  score: number;
  side: "side1" | "side2" | "team1" | "team2";
  onAddPoint: (payload: AddPointPayload) => void;
  setsWon: number;
  /** @deprecated kept for call-site compatibility; styling is neutral. */
  color?: "emerald" | "rose";
  disabled?: boolean;
  currentServer: string | null;
  /** First column in the pair (shows right border as divider). */
  isFirstColumn?: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function PlayerCard({
  players,
  score,
  side,
  onAddPoint,
  setsWon,
  disabled = false,
  currentServer,
  isFirstColumn = false,
}: PlayerCardProps) {
  const scale = useSharedValue(1);
  const scoreScale = useSharedValue(1);

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const isPlayerServing = (player: PlayerInfo) => {
    if (!currentServer || !player.serverKey) return false;
    return String(currentServer) === String(player.serverKey);
  };

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1);
    });
    if (players.length === 1) {
      onAddPoint({ side, playerId: players[0]?.playerId });
    } else {
      onAddPoint({ side });
    }
  };

  const setsLabel =
    setsWon > 0 ? `${setsWon} set${setsWon === 1 ? "" : "s"}` : null;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      disabled={disabled}
      style={[modernStyles.wrap, isFirstColumn && modernStyles.wrapDivider]}
    >
      <Animated.View
        style={[
          modernStyles.cardInner,
          disabled && modernStyles.cardDisabled,
          isFirstColumn ? modernStyles.accentLeft : modernStyles.accentRight,
        ]}
      >
        <View style={modernStyles.topBlock}>
          {players.map((player, idx) => {
            const serving = isPlayerServing(player);
            const displayName = getFirstName(player.name) || player.name;
            return (
              <View key={player.playerId ?? idx} style={modernStyles.playerLine}>
                <View style={modernStyles.avatarWrap}>
                  {player.profileImage ? (
                    <Image
                      source={{ uri: player.profileImage }}
                      style={modernStyles.avatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={modernStyles.avatarPlaceholder}>
                      <Text style={modernStyles.avatarInitials}>{initials(player.name)}</Text>
                    </View>
                  )}
                </View>
                <View style={modernStyles.nameBlock}>
                  <Text style={modernStyles.playerName} numberOfLines={2}>
                    {displayName}
                  </Text>
                  {serving && (
                    <Text style={modernStyles.serveLabel}>Serving</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={modernStyles.scoreBlock}>
          <Animated.Text style={[modernStyles.scoreText, scoreAnimatedStyle]}>
            {score}
          </Animated.Text>
          <Text style={modernStyles.scoreHint}>Tap to add point</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Design tokens
const tokens = DesignTokens;

// Modern styles using design tokens
const modernStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 240,
  },
  wrapDivider: {
    borderRightWidth: 1,
    borderRightColor: tokens.colors.border.light,
  },
  cardInner: {
    flex: 1,
    backgroundColor: tokens.colors.background.tertiary,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[6],
    justifyContent: "space-between",
    position: 'relative',
  },
  accentLeft: {
    borderTopWidth: 4,
    borderTopColor: tokens.colors.primary[600],
  },
  accentRight: {
    borderTopWidth: 4,
    borderTopColor: tokens.colors.error,
  },
  cardDisabled: {
    opacity: 0.4,
  },
  topBlock: {
    gap: tokens.spacing[3],
  },
  playerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: tokens.borderRadius.full,
    borderWidth: 2,
    borderColor: tokens.colors.border.light,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.border.light,
  },
  avatarInitials: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.secondary,
    letterSpacing: -0.3,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    letterSpacing: -0.2,
  },
  serveLabel: {
    marginTop: tokens.spacing[1],
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.warning,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  scoreBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing[2],
    position: 'relative',
  },
  scoreText: {
    fontSize: 64,
    fontWeight: tokens.typography.fontWeight.extrabold,
    color: tokens.colors.text.primary,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  scoreHint: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.tertiary,
    letterSpacing: 0.15,
  },
});
