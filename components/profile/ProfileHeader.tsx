import type { ProfileDisplayUser } from "@/contexts/ProfileContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Text } from "react-native-paper";

export interface ProfileHeaderProps {
  userId: string;
  user: ProfileDisplayUser | null;
  loading?: boolean;
  showBackButton?: boolean;
  /** Compact bar for nested profile screens (matches, stats, …). */
  compact?: boolean;
}

export function ProfileHeader({
  userId,
  user,
  loading,
  showBackButton = true,
  compact = true,
}: ProfileHeaderProps) {
  const router = useRouter();
  const theme = useThemeColors();
  const resolvedUserId = String(userId ?? "");
  const initials =
    user?.fullName?.slice(0, 2).toUpperCase() ||
    (resolvedUserId.length > 0 ? resolvedUserId.slice(0, 2).toUpperCase() : "U");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          backgroundColor: theme.colors.background.primary,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[2],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
          minHeight: 56,
        },
        backButton: {
          width: 44,
          height: 44,
          justifyContent: "center",
          alignItems: "center",
        },
        avatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.gray[200],
          borderColor: theme.colors.border.light,
          borderWidth: theme.components.avatar.borderWidth,
        },
        textCol: { flex: 1, minWidth: 0 },
        name: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        username: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        },
      }),
    [theme],
  );

  // Legacy non-compact path kept for safety — always compact in practice.
  void compact;

  return (
    <View style={styles.bar}>
      {showBackButton ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FontAwesome5
            name="chevron-left"
            size={16}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
      ) : null}
      {user?.profileImage ? (
        <Image
          source={{ uri: user.profileImage }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <Avatar.Text size={36} label={initials} style={styles.avatar} />
      )}
      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1}>
          {loading && !user
            ? "Loading…"
            : user?.fullName
              ? user.fullName
              : `User ${resolvedUserId.slice(0, 8)}`}
        </Text>
        {user?.username ? (
          <Text style={styles.username} numberOfLines={1}>
            @{user.username}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
