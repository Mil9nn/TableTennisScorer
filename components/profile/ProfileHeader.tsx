import { DesignTokens } from "@/constants/designTokens";
import { Icon } from "@/components/ui/Icon";
import type { ProfileDisplayUser } from "@/contexts/ProfileContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const formatHand = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "Not specified";

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: DesignTokens.colors.background.primary,
    padding: DesignTokens.spacing[4],
    borderRadius: DesignTokens.borderRadius.none,
  },
  profileContent: {
    gap: DesignTokens.spacing[4],
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
  subtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.secondary,
    marginTop: DesignTokens.spacing[1],
  },
  userInfoFlex: {
    flexDirection: "row",
    gap: DesignTokens.spacing[12],
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  userInfoValue: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.secondary,
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
    <SafeAreaView edges={["top"]}>
      <View style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
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
            ) : (
              <View style={styles.backButton} />
            )}
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
              <Text style={styles.subtitle}>
                {loading && !user
                  ? "Loading…"
                  : user?.fullName
                    ? user.fullName
                    : `UserId: ${resolvedUserId}`}
              </Text>
              <Text style={styles.subtitle}>
                @{user?.username ? user.username : resolvedUserId}
              </Text>
            </View>
          </View>

          {user?.bio ? <Text style={styles.bioText}>{user.bio}</Text> : null}

          {user?.location ? (
            <View style={styles.userInfoFlex}>
              <View style={styles.userInfoRow}>
                <Icon name="map-pin" size={16} color={DesignTokens.colors.error} />
                <Text style={styles.userInfoValue}>{user.location}</Text>
              </View>

              {user?.handedness ? (
                <View style={styles.userInfoRow}>
                  <Icon name="hand" size={16} color={DesignTokens.colors.info} />
                  <Text style={styles.userInfoValue}>
                    {formatHand(user.handedness)} Handed
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Card.Content>
      </View>
    </SafeAreaView>
  );
}
