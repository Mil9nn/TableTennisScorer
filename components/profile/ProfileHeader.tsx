import { DesignTokens } from "@/constants/designTokens";
import type { ProfileDisplayUser } from "@/contexts/ProfileContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Text } from "react-native-paper";

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: DesignTokens.colors.background.primary,
    padding: DesignTokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
  },
  profileContent: {
    gap: DesignTokens.spacing[3],
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[4],
  },
  avatarContainer: {
    width: DesignTokens.components.avatar.size.lg,
    height: DesignTokens.components.avatar.size.lg,
    borderRadius: DesignTokens.borderRadius.full,
    overflow: "hidden",
  },
  profileImage: {
    width: DesignTokens.components.avatar.size.lg,
    height: DesignTokens.components.avatar.size.lg,
    borderRadius: DesignTokens.borderRadius.full,
    backgroundColor: DesignTokens.colors.gray[200],
    borderColor: DesignTokens.colors.border.light,
    borderWidth: DesignTokens.components.avatar.borderWidth,
  },
  avatar: {
    backgroundColor: DesignTokens.colors.gray[200],
    borderColor: DesignTokens.colors.border.light,
    borderWidth: DesignTokens.components.avatar.borderWidth,
  },
  backButton: {
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: DesignTokens.typography.fontSize["2xl"],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
  },
  username: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    marginTop: DesignTokens.spacing[1],
  },
  bioText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.secondary,
    lineHeight: DesignTokens.typography.fontSize.base * 1.5,
  },
});

export interface ProfileHeaderProps {
  userId: string;
  user: ProfileDisplayUser | null;
  loading?: boolean;
  showBackButton?: boolean;
}

export function ProfileHeader({
  userId,
  user,
  loading,
  showBackButton = true,
}: ProfileHeaderProps) {
  const router = useRouter();
  const resolvedUserId = String(userId ?? "");
  const initials =
    user?.fullName?.slice(0, 2).toUpperCase() ||
    (resolvedUserId.length > 0 ? resolvedUserId.slice(0, 2).toUpperCase() : "U");

  return (
    <View style={styles.profileCard}>
      <View style={styles.profileContent}>
        <View style={styles.profileHeader}>
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
                color={DesignTokens.colors.text.secondary}
              />
            </TouchableOpacity>
          ) : null}
          <View style={styles.avatarContainer}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.profileImage}
                contentFit="cover"
                placeholder={initials}
                placeholderContentFit="contain"
              />
            ) : (
              <Avatar.Text
                size={DesignTokens.components.avatar.size.lg}
                label={initials}
                style={styles.avatar}
              />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>
              {loading && !user
                ? "Loading…"
                : user?.fullName
                  ? user.fullName
                  : `User ${resolvedUserId.slice(0, 8)}`}
            </Text>
            {user?.username ? (
              <Text style={styles.username}>@{user.username}</Text>
            ) : null}
          </View>
        </View>

        {user?.bio ? <Text style={styles.bioText}>{user.bio}</Text> : null}
      </View>
    </View>
  );
}
