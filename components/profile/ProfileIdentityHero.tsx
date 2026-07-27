import type { ProfileDisplayUser } from "@/contexts/ProfileContext";
import { calculateAge } from "@/lib/profile/calculateAge";
import type { ProfileOverviewData } from "@/hooks/useProfileOverview";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar, Menu } from "react-native-paper";
import Toast from "react-native-toast-message";

type Props = {
  user: ProfileDisplayUser | null;
  userId: string;
  overview: ProfileOverviewData;
  loading?: boolean;
  isMe?: boolean;
  showBackButton?: boolean;
  onEdit?: () => void;
};

function memberSinceLabel(createdAt?: string) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatStat(value: number, empty = "—") {
  return value > 0 ? String(value) : empty;
}

export function ProfileIdentityHero({
  user,
  userId,
  overview,
  loading,
  isMe,
  showBackButton = false,
  onEdit,
}: Props) {
  const router = useRouter();
  const theme = useThemeColors();
  const [menuVisible, setMenuVisible] = useState(false);

  const initials =
    user?.fullName?.slice(0, 2).toUpperCase() ||
    user?.username?.slice(0, 2).toUpperCase() ||
    "TT";

  const memberSince = memberSinceLabel(user?.createdAt);
  const age = user?.dateOfBirth ? calculateAge(user.dateOfBirth) : null;
  const location = user?.location?.trim();

  const headerStats = [
    {
      key: "current",
      label: "Streak",
      a11y: "Current win streak",
      value: formatStat(overview.currentWinStreak),
      icon: overview.currentWinStreak > 0 ? ("flame" as const) : ("flame-outline" as const),
      emphasize: overview.currentWinStreak > 0,
    },
    {
      key: "best",
      label: "Best",
      a11y: "Best win streak",
      value: formatStat(overview.bestWinStreak),
      icon: overview.bestWinStreak > 0 ? ("trophy" as const) : ("trophy-outline" as const),
      emphasize: overview.bestWinStreak > 0,
    },
  ];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: theme.colors.background.primary,
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[2],
          paddingBottom: theme.spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          gap: theme.spacing[3],
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
        },
        backButton: {
          width: 44,
          height: 44,
          marginLeft: -10,
          justifyContent: "center",
          alignItems: "center",
        },
        avatarRing: {
          width: 56,
          height: 56,
          borderRadius: 28,
          padding: 2,
          backgroundColor: theme.colors.primary[100],
        },
        avatarImage: {
          width: "100%",
          height: "100%",
          borderRadius: 26,
          backgroundColor: theme.colors.gray[200],
        },
        identity: { flex: 1, minWidth: 0, gap: 2 },
        name: {
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          letterSpacing: -0.2,
        },
        username: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          fontWeight: theme.typography.fontWeight.medium,
        },
        metaLine: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          marginTop: 2,
        },
        menuBtn: {
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          marginRight: -6,
        },
        menuContent: {
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.md,
        },
        statsRow: {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: theme.spacing[2],
        },
        pill: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.background.secondary,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border.light,
        },
        pillIcon: {
          marginRight: -1,
        },
        pillLabel: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.tertiary,
          letterSpacing: 0.2,
        },
        pillValue: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          fontVariant: ["tabular-nums"],
          letterSpacing: -0.2,
        },
        pillValueMuted: {
          color: theme.colors.text.tertiary,
          fontWeight: theme.typography.fontWeight.semibold,
        },
      }),
    [theme],
  );

  const handleShare = async () => {
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const name = user?.fullName || user?.username || "TTPro player";
    const handle = user?.username ? `@${user.username}` : "";
    const record =
      overview.totalMatches > 0
        ? `\n${overview.wins}W · ${overview.losses}L · ${Math.round(overview.winRate)}% win rate`
        : "";
    try {
      await Share.share({
        message: `${name} ${handle}${record}\n\nView on TTPro`,
        title: `${name} — TTPro Profile`,
      });
    } catch {
      Toast.show({ type: "error", text1: "Could not share profile" });
    }
  };

  const handleEdit = () => {
    setMenuVisible(false);
    if (!onEdit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit();
  };

  const metaBits = [
    location,
    memberSince ? `Since ${memberSince}` : null,
    age != null ? `${age} yrs` : null,
    user?.handedness
      ? `${user.handedness.charAt(0).toUpperCase()}${user.handedness.slice(1)} hand`
      : null,
  ].filter(Boolean);

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {showBackButton ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
        ) : null}

        <View style={styles.avatarRing}>
          {user?.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Avatar.Text
              size={52}
              label={initials}
              style={{ backgroundColor: theme.colors.primary[200] }}
              labelStyle={{ color: theme.colors.primary[800], fontSize: 18 }}
            />
          )}
        </View>

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {loading && !user
              ? "Loading…"
              : user?.fullName || user?.username || `Player ${userId.slice(0, 6)}`}
          </Text>
          {user?.username ? (
            <Text style={styles.username} numberOfLines={1}>
              @{user.username}
            </Text>
          ) : null}
          {metaBits.length > 0 ? (
            <Text style={styles.metaLine} numberOfLines={1}>
              {metaBits.join(" · ")}
            </Text>
          ) : null}
        </View>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Profile options"
            >
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          }
          contentStyle={styles.menuContent}
        >
          <Menu.Item
            title="Share"
            leadingIcon="share-variant-outline"
            onPress={handleShare}
          />
          {isMe && onEdit ? (
            <Menu.Item
              title="Edit"
              leadingIcon="pencil-outline"
              onPress={handleEdit}
            />
          ) : null}
        </Menu>
      </View>

      <View style={styles.statsRow}>
        {headerStats.map((stat) => {
          const iconColor = stat.emphasize
            ? stat.key === "current"
              ? theme.colors.warning
              : theme.colors.primary[600]
            : theme.colors.text.tertiary;

          return (
            <View
              key={stat.key}
              style={styles.pill}
              accessibilityLabel={`${stat.a11y} ${stat.value}`}
            >
              <Ionicons
                name={stat.icon}
                size={14}
                color={iconColor}
                style={styles.pillIcon}
              />
              <Text style={styles.pillLabel}>{stat.label}</Text>
              <Text
                style={[
                  styles.pillValue,
                  !stat.emphasize && styles.pillValueMuted,
                ]}
              >
                {stat.value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
