import { useThemeColors } from "@/hooks/useThemeColors";
import { formatFeedRelativeDate } from "@/lib/utils";
import { getWebOrigin } from "@/lib/appOrigin";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type RefreshControlProps,
} from "react-native";

export type TeamListItem = {
  _id: string;
  name: string;
  city?: string;
  logo?: string;
  allowJoinByCode?: boolean;
  createdAt?: string;
  updatedAt?: string;
  captain?: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  /** Member user ids (list API); used for membership badge only */
  playerIds?: string[];
  /** Slim profile-teams / list payload */
  playerCount?: number;
  role?: string;
};

type Membership = "captain" | "member" | null;

interface TeamsListProps {
  teams: TeamListItem[];
  currentUserId?: string;
  onEndReached?: () => void;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  onScroll?: (event: any) => void;
  bottomInset?: number;
}

const resolveLogoUri = (logo?: string) => {
  if (!logo) return "";
  const trimmed = logo.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const base = getWebOrigin();
  return `${base}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

function TeamLogo({
  team,
  size,
  theme,
}: {
  team: Pick<TeamListItem, "name" | "logo">;
  size: number;
  theme: ReturnType<typeof useThemeColors>;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedLogo = resolveLogoUri(team.logo);
  const initial = (team.name?.trim() || "T").charAt(0).toUpperCase();

  if (resolvedLogo && !failed) {
    return (
      <Image
        source={{ uri: resolvedLogo }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.primary[100],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size * 0.4,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary[700],
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

function CaptainAvatar({
  name,
  uri,
  size,
  theme,
}: {
  name?: string;
  uri?: string;
  size: number;
  theme: ReturnType<typeof useThemeColors>;
}) {
  const initial = (name?.trim() || "?").charAt(0).toUpperCase();
  return (
    <View
      style={{
        borderWidth: 2,
        borderColor: theme.colors.background.primary,
        borderRadius: size / 2,
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.colors.gray[100],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: size * 0.38,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.tertiary,
            }}
          >
            {initial}
          </Text>
        </View>
      )}
    </View>
  );
}

function membershipFor(team: TeamListItem, userId?: string): Membership {
  if (!userId) return null;
  if (team.captain?._id === userId || team.role === "captain") return "captain";
  if (team.role === "player" || team.role === "member") return "member";
  if (team.playerIds?.includes(userId)) return "member";
  return null;
}

export default function TeamsList({
  teams,
  currentUserId,
  onEndReached,
  ListFooterComponent,
  ListEmptyComponent,
  refreshControl,
  onScroll,
  bottomInset = 0,
}: TeamsListProps) {
  const theme = useThemeColors();
  const data = teams ?? [];
  const animatedValues = React.useRef<Record<string, Animated.Value>>({}).current;
  const animationRefs = React.useRef<Record<string, Animated.CompositeAnimation>>({}).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        listFrame: { flex: 1, backgroundColor: theme.colors.background.tertiary },
        list: { flex: 1, backgroundColor: theme.colors.background.tertiary },
        listContent: {
          gap: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingHorizontal: theme.spacing[3],
          backgroundColor: theme.colors.background.tertiary,
        },
        listContentEmpty: { flexGrow: 1, paddingHorizontal: 0 },
        card: {
          borderRadius: 0,
          overflow: "hidden",
          backgroundColor: theme.colors.background.primary,
        },
        cardInner: {
          paddingHorizontal: theme.spacing[5],
          paddingVertical: theme.spacing[5],
          gap: theme.spacing[4],
        },
        topRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: theme.spacing[3],
        },
        info: { flex: 1, minWidth: 0, gap: 4 },
        name: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        metaRow: {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
        },
        metaText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          fontWeight: theme.typography.fontWeight.medium,
        },
        badges: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing[2],
          alignItems: "center",
        },
        badge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: theme.borderRadius.full,
          borderWidth: 1,
        },
        badgeOpen: {
          backgroundColor: "rgba(37, 99, 235, 0.08)",
          borderColor: "rgba(37, 99, 235, 0.25)",
        },
        badgeMember: {
          backgroundColor: "rgba(5, 150, 105, 0.08)",
          borderColor: "rgba(5, 150, 105, 0.25)",
        },
        badgeText: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.bold,
        },
        captainBlock: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
        },
        captainTextCol: { flex: 1, minWidth: 0, gap: 2 },
        captainLabel: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.tertiary,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        },
        captainName: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.secondary,
        },
        footerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing[2],
        },
        updated: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        },
        viewLink: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.primary[600],
        },
      }),
    [theme],
  );

  const renderTeam = ({ item: team }: { item: TeamListItem }) => {
    const membership = membershipFor(team, currentUserId);
    const playerCount =
      team.playerCount ?? team.playerIds?.length ?? 0;
    const captainName = team.captain?.fullName || team.captain?.username;
    const updatedLabel = formatFeedRelativeDate(team.updatedAt || team.createdAt);

    if (!animatedValues[team._id]) {
      animatedValues[team._id] = new Animated.Value(1);
    }
    const scaleAnim = animatedValues[team._id];

    return (
      <View style={styles.card}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${team.name}, ${playerCount} players`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/team/${team._id}`);
            }}
            onPressIn={() => {
              if (animationRefs[team._id]) animationRefs[team._id].stop();
              animationRefs[team._id] = Animated.spring(scaleAnim, {
                toValue: 0.97,
                useNativeDriver: true,
                tension: 120,
                friction: 10,
              });
              animationRefs[team._id].start();
            }}
            onPressOut={() => {
              if (animationRefs[team._id]) animationRefs[team._id].stop();
              animationRefs[team._id] = Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 120,
                friction: 10,
              });
              animationRefs[team._id].start();
            }}
          >
            <View style={styles.cardInner}>
              <View style={styles.topRow}>
                <TeamLogo team={team} size={44} theme={theme} />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                    {team.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="people-outline"
                      size={13}
                      color={theme.colors.text.tertiary}
                    />
                    <Text style={styles.metaText}>
                      {playerCount} player{playerCount === 1 ? "" : "s"}
                    </Text>
                    {team.city ? (
                      <>
                        <Text style={styles.metaText}>·</Text>
                        <Ionicons
                          name="location-outline"
                          size={13}
                          color={theme.colors.text.tertiary}
                        />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {team.city}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.badges}>
                {team.allowJoinByCode ? (
                  <View style={[styles.badge, styles.badgeOpen]}>
                    <Text style={[styles.badgeText, { color: theme.colors.status.scheduled }]}>
                      Open
                    </Text>
                  </View>
                ) : null}
                {membership === "member" ? (
                  <View style={[styles.badge, styles.badgeMember]}>
                    <Text style={[styles.badgeText, { color: theme.colors.status.completed }]}>
                      Member
                    </Text>
                  </View>
                ) : null}
              </View>

              {team.captain && captainName ? (
                <View style={styles.captainBlock}>
                  <CaptainAvatar
                    name={captainName}
                    uri={team.captain.profileImage}
                    size={32}
                    theme={theme}
                  />
                  <View style={styles.captainTextCol}>
                    <Text style={styles.captainLabel}>Captain</Text>
                    <Text style={styles.captainName} numberOfLines={1} ellipsizeMode="tail">
                      {captainName}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.footerRow}>
                <Text style={styles.updated}>
                  {updatedLabel ? `Updated ${updatedLabel}` : " "}
                </Text>
                <Text style={styles.viewLink}>View team →</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.listFrame}>
      <FlatList
        data={data}
        renderItem={renderTeam}
        keyExtractor={(item) => item._id}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={ListEmptyComponent ?? undefined}
        ListFooterComponent={ListFooterComponent}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          data.length === 0 && styles.listContentEmpty,
          bottomInset > 0 && { paddingBottom: bottomInset },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.list}
      />
    </View>
  );
}
