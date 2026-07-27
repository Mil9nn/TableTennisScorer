import type { ProfileOverviewData } from "@/hooks/useProfileOverview";
import { getProfileCompletion } from "@/lib/profile/completion";
import { profilePath } from "@/lib/profile/navigation";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function useProfileSectionStyles() {
  const theme = useThemeColors();
  return useMemo(
    () =>
      StyleSheet.create({
        section: {
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.light,
          gap: 0,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          minHeight: 44,
        },
        title: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          textAlign: "left",
          flex: 1,
        },
        action: {
          minHeight: 44,
          justifyContent: "center",
          paddingLeft: theme.spacing[2],
        },
        actionText: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.primary[600],
        },
        body: {
          gap: 0,
        },
        empty: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          textAlign: "center",
          paddingVertical: theme.spacing[4],
          paddingHorizontal: theme.spacing[3],
        },
        cell: {
          backgroundColor: theme.colors.background.secondary,
          borderRadius: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[3],
          justifyContent: "center",
          alignItems: "center",
        },
        cellValue: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          fontVariant: ["tabular-nums"],
          textAlign: "center",
        },
        cellLabel: {
          marginTop: 2,
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          fontWeight: theme.typography.fontWeight.medium,
          textAlign: "center",
        },
      }),
    [theme],
  );
}

function SectionShell({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  const styles = useProfileSectionStyles();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {actionLabel && onAction ? (
          <TouchableOpacity
            style={styles.action}
            onPress={onAction}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

export function ProfileMyProfileSection({
  user,
  groups,
  onEdit,
  onComplete,
}: {
  user: {
    fullName?: string | null;
    profileImage?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    handedness?: string | null;
    location?: string | null;
    phoneNumber?: string | null;
    isProfileComplete?: boolean;
  } | null;
  groups: Array<{ title: string; fields: Array<{ label: string; value: string }> }>;
  onEdit: () => void;
  onComplete: () => void;
}) {
  const theme = useThemeColors();
  const { percent, isComplete } = getProfileCompletion(user);
  const hasFields = groups.some((g) => g.fields.length > 0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        progressBlock: {
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
          gap: theme.spacing[3],
          backgroundColor: theme.colors.background.secondary,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
        },
        progressRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
        },
        track: {
          flex: 1,
          height: 8,
          borderRadius: 9999,
          backgroundColor: theme.colors.border.light,
          overflow: "hidden",
        },
        fill: {
          height: "100%",
          borderRadius: 9999,
          backgroundColor: theme.colors.primary[600],
        },
        percent: {
          minWidth: 40,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          fontVariant: ["tabular-nums"],
          textAlign: "right",
        },
        hint: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        },
        completeBtn: {
          minHeight: 44,
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.primary[600],
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: theme.spacing[4],
        },
        completeBtnText: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.inverse,
        },
      }),
    [theme],
  );

  return (
    <SectionShell title="My Profile" actionLabel="Edit" onAction={onEdit}>
      {!isComplete ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressRow}>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityValue={{ now: percent, min: 0, max: 100 }}
              accessibilityLabel={`Profile ${percent}% complete`}
            >
              <View style={[styles.fill, { width: `${percent}%` }]} />
            </View>
            <Text style={styles.percent}>{percent}%</Text>
          </View>
          <Text style={styles.hint}>
            Add a few more details so opponents and tournaments can find you.
          </Text>
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={onComplete}
            accessibilityRole="button"
            accessibilityLabel="Complete profile"
          >
            <Text style={styles.completeBtnText}>Complete profile</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {hasFields ? (
        <ProfileInfoGrouped groups={groups} />
      ) : (
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.tertiary,
            textAlign: "left",
            paddingVertical: theme.spacing[4],
            paddingHorizontal: theme.spacing[4],
          }}
        >
          No personal details yet. Tap Edit or Complete profile to add them.
        </Text>
      )}
    </SectionShell>
  );
}

export function ProfileCareerOverview({
  overview,
  userId,
  onOpenStats,
}: {
  overview: ProfileOverviewData;
  userId: string;
  onOpenStats?: () => void;
}) {
  const theme = useThemeColors();
  const router = useRouter();
  const winRateDisplay =
    overview.totalMatches > 0 ? `${Math.round(overview.winRate)}%` : "—";

  const openStats = () => {
    if (onOpenStats) onOpenStats();
    else router.push(profilePath(userId, "stats") as Href);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: 0,
        },
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
        },
        cell: {
          width: "25%",
          minHeight: 72,
          backgroundColor: theme.colors.background.secondary,
          borderBottomWidth: 1,
          borderRightWidth: 1,
          borderColor: theme.colors.border.light,
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[1],
          justifyContent: "center",
          alignItems: "center",
        },
        cellLastCol: {
          borderRightWidth: 0,
        },
        value: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          fontVariant: ["tabular-nums"],
          textAlign: "center",
        },
        label: {
          marginTop: 2,
          fontSize: 9,
          color: theme.colors.text.tertiary,
          fontWeight: theme.typography.fontWeight.semibold,
          textTransform: "uppercase",
          letterSpacing: 0.3,
          textAlign: "center",
        },
      }),
    [theme],
  );

  const cells: Array<{
    label: string;
    value: string;
    color?: string;
    onPress?: () => void;
  }> = [
    {
      label: "Matches",
      value: String(overview.totalMatches),
      onPress: () =>
        router.push(profilePath(userId, "match-history") as Href),
    },
    {
      label: "Wins",
      value: String(overview.wins),
      color: theme.colors.success,
      onPress: () =>
        router.push(profilePath(userId, "match-history") as Href),
    },
    {
      label: "Losses",
      value: String(overview.losses),
      color: theme.colors.error,
      onPress: () =>
        router.push(profilePath(userId, "match-history") as Href),
    },
    {
      label: "Win Rate",
      value: winRateDisplay,
      onPress: openStats,
    },
    {
      label: "Sets Won",
      value: String(overview.setsWon),
      onPress: openStats,
    },
    {
      label: "Sets Lost",
      value: String(overview.setsLost),
      onPress: openStats,
    },
    {
      label: "Pts Won",
      value: String(overview.totalPointsScored),
      onPress: openStats,
    },
    {
      label: "Pts Lost",
      value: String(overview.totalPointsConceded),
      onPress: openStats,
    },
  ];

  return (
    <SectionShell title="Career Overview">
      <View style={styles.wrap}>
        <View style={styles.grid}>
          {cells.map((cell, index) => {
            const isLastCol = (index + 1) % 4 === 0;
            const content = (
              <>
                <Text
                  style={[
                    styles.value,
                    cell.color ? { color: cell.color } : null,
                  ]}
                >
                  {cell.value}
                </Text>
                <Text style={styles.label}>{cell.label}</Text>
              </>
            );
            return cell.onPress ? (
              <TouchableOpacity
                key={cell.label}
                style={[styles.cell, isLastCol && styles.cellLastCol]}
                onPress={cell.onPress}
                accessibilityRole="button"
                accessibilityLabel={`${cell.label} ${cell.value}`}
              >
                {content}
              </TouchableOpacity>
            ) : (
              <View
                key={cell.label}
                style={[styles.cell, isLastCol && styles.cellLastCol]}
              >
                {content}
              </View>
            );
          })}
        </View>
      </View>
    </SectionShell>
  );
}

/** @deprecated Prefer ProfileCareerOverview */
export function ProfileQuickStats({
  overview,
  userId,
  onOpenStats,
}: {
  overview: ProfileOverviewData;
  userId: string;
  onOpenStats?: () => void;
}) {
  return (
    <ProfileCareerOverview
      overview={overview}
      userId={userId}
      onOpenStats={onOpenStats}
    />
  );
}

export function ProfileRecentForm({
  form,
}: {
  form: Array<"win" | "loss">;
}) {
  const theme = useThemeColors();
  const base = useProfileSectionStyles();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[1],
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
        },
        pill: {
          width: 20,
          height: 20,
          borderRadius: 9999,
          alignItems: "center",
          justifyContent: "center",
        },
        pillText: {
          fontSize: 9,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.inverse,
          textAlign: "center",
        },
      }),
    [theme],
  );

  return (
    <SectionShell title="Recent form">
      {form.length === 0 ? (
        <Text style={[base.empty, { textAlign: "left", paddingHorizontal: theme.spacing[4] }]}>
          No completed matches yet.
        </Text>
      ) : (
        <View style={styles.row}>
          {form.map((result, index) => (
            <View
              key={`${result}-${index}`}
              style={[
                styles.pill,
                {
                  backgroundColor:
                    result === "win"
                      ? theme.colors.success
                      : theme.colors.error,
                },
              ]}
              accessibilityLabel={result === "win" ? "Win" : "Loss"}
            >
              <Text style={styles.pillText}>{result === "win" ? "W" : "L"}</Text>
            </View>
          ))}
        </View>
      )}
    </SectionShell>
  );
}

export function ProfileAchievementMetrics({
  overview,
  userId,
}: {
  overview: ProfileOverviewData;
  userId: string;
}) {
  const theme = useThemeColors();
  const router = useRouter();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
        },
        cell: {
          flex: 1,
          minHeight: 72,
          backgroundColor: theme.colors.background.secondary,
          borderRightWidth: 1,
          borderRightColor: theme.colors.border.light,
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[2],
          justifyContent: "center",
          alignItems: "center",
        },
        cellLast: {
          borderRightWidth: 0,
        },
        value: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          fontVariant: ["tabular-nums"],
          textAlign: "center",
        },
        label: {
          marginTop: 4,
          fontSize: 10,
          color: theme.colors.text.tertiary,
          fontWeight: theme.typography.fontWeight.semibold,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          textAlign: "center",
        },
      }),
    [theme],
  );

  const metrics = [
    {
      label: "Tourney wins",
      value: String(overview.tournamentsWon),
      onPress: () => router.push(profilePath(userId, "tournaments") as Href),
    },
    {
      label: "Runner-ups",
      value: String(overview.runnerUpCount),
      onPress: () => router.push(profilePath(userId, "tournaments") as Href),
    },
    {
      label: "Tournaments",
      value: String(overview.tournamentsPlayed),
      onPress: () => router.push(profilePath(userId, "tournaments") as Href),
    },
  ];

  return (
    <SectionShell title="Achievements">
      <View style={styles.row}>
        {metrics.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.cell,
              index === metrics.length - 1 && styles.cellLast,
            ]}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${item.label} ${item.value}`}
          >
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SectionShell>
  );
}

export function ProfileCareerHighlights({
  overview,
  onPress,
}: {
  overview: ProfileOverviewData;
  onPress?: () => void;
}) {
  const theme = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          gap: 0,
        },
        card: {
          flex: 1,
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[2],
          borderRadius: 0,
          backgroundColor: theme.colors.background.secondary,
          borderRightWidth: 1,
          borderRightColor: theme.colors.border.light,
          minHeight: 72,
          justifyContent: "center",
          alignItems: "center",
        },
        cardLast: {
          borderRightWidth: 0,
        },
        value: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          textAlign: "center",
        },
        label: {
          marginTop: 4,
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          fontWeight: theme.typography.fontWeight.medium,
          textAlign: "center",
        },
      }),
    [theme],
  );

  const highlights = [
    {
      label: "Current streak",
      value:
        overview.currentWinStreak > 0
          ? String(overview.currentWinStreak)
          : "—",
    },
    {
      label: "Best streak",
      value: overview.bestWinStreak > 0 ? String(overview.bestWinStreak) : "—",
    },
    {
      label: "Serve accuracy",
      value:
        overview.totalMatches > 0
          ? `${Math.round(overview.serveAccuracy)}%`
          : "—",
    },
  ];

  const content = (
    <View style={styles.row}>
      {highlights.map((item, index) => (
        <View
          key={item.label}
          style={[
            styles.card,
            index === highlights.length - 1 && styles.cardLast,
          ]}
        >
          <Text style={styles.value} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SectionShell
      title="Career"
      actionLabel={onPress ? "Stats" : undefined}
      onAction={onPress}
    >
      {onPress ? (
        <TouchableOpacity
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Open stats"
          activeOpacity={0.85}
        >
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
    </SectionShell>
  );
}

export function ProfileTeamsPreview({
  teams,
  userId,
}: {
  teams: Array<{
    _id: string;
    name: string;
    logo?: string;
    city?: string;
    role?: string;
  }>;
  userId: string;
}) {
  const theme = useThemeColors();
  const router = useRouter();
  const base = useProfileSectionStyles();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          backgroundColor: theme.colors.background.secondary,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          minHeight: 56,
        },
        rowLast: {
          borderBottomWidth: 0,
        },
        logo: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.primary[100],
        },
        logoFallback: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.primary[100],
          alignItems: "center",
          justifyContent: "center",
        },
        logoInitial: {
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary[700],
        },
        textCol: {
          flex: 1,
          minWidth: 0,
        },
        name: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        meta: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          marginTop: 2,
        },
      }),
    [theme],
  );

  const preview = teams.slice(0, 3);

  return (
    <SectionShell
      title="Current teams"
      actionLabel="All"
      onAction={() => router.push(profilePath(userId, "teams") as Href)}
    >
      {teams.length === 0 ? (
        <Text style={[base.empty, { textAlign: "left", paddingHorizontal: theme.spacing[4] }]}>
          Not on a team yet.
        </Text>
      ) : (
        preview.map((team, index) => (
          <TouchableOpacity
            key={team._id}
            style={[
              styles.row,
              index === preview.length - 1 && styles.rowLast,
            ]}
            onPress={() => router.push(profilePath(userId, "teams") as Href)}
            accessibilityRole="button"
          >
            {team.logo ? (
              <Image
                source={{ uri: team.logo }}
                style={styles.logo}
                contentFit="cover"
              />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoInitial}>
                  {team.name?.charAt(0)?.toUpperCase() || "T"}
                </Text>
              </View>
            )}
            <View style={styles.textCol}>
              <Text style={styles.name} numberOfLines={1}>
                {team.name}
              </Text>
              {team.city || team.role ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {[team.role, team.city].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        ))
      )}
    </SectionShell>
  );
}

export function ProfileMoreMenu({
  userId,
  showShots,
}: {
  userId: string;
  showShots: boolean;
}) {
  const theme = useThemeColors();
  const router = useRouter();
  const base = useProfileSectionStyles();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          backgroundColor: theme.colors.background.secondary,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          minHeight: 56,
        },
        rowLast: {
          borderBottomWidth: 0,
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.primary[100],
        },
        textCol: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        description: {
          marginTop: 2,
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        },
      }),
    [theme],
  );

  const items: Array<{
    key: string;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    href: Href;
  }> = [
    {
      key: "matches",
      title: "Matches",
      description: "Full match history and results",
      icon: "tennisball-outline",
      href: profilePath(userId, "match-history"),
    },
    {
      key: "h2h",
      title: "Head to head",
      description: "Record vs every opponent",
      icon: "swap-horizontal-outline",
      href: profilePath(userId, "head-to-head"),
    },
    {
      key: "teams",
      title: "Teams",
      description: "Roster membership and team stats",
      icon: "people-outline",
      href: profilePath(userId, "teams"),
    },
    {
      key: "tournaments",
      title: "Tournaments",
      description: "Placements and titles",
      icon: "trophy-outline",
      href: profilePath(userId, "tournaments"),
    },
  ];

  if (showShots) {
    items.push({
      key: "shots",
      title: "Shots",
      description: "Shot distribution and heatmap",
      icon: "locate-outline",
      href: profilePath(userId, "shots"),
    });
  }

  return (
    <View style={[base.section, { borderTopWidth: 0 }]}>
      <View style={base.header}>
        <Text style={base.title}>Explore</Text>
      </View>
      {items.map((item, index) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.row,
            index === items.length - 1 && styles.rowLast,
          ]}
          onPress={() => router.push(item.href)}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          <View style={styles.iconWrap}>
            <Ionicons
              name={item.icon}
              size={20}
              color={theme.colors.primary[700]}
            />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.text.tertiary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ProfileDetailsSection({
  title = "Details",
}: {
  title?: string;
}) {
  const styles = useProfileSectionStyles();

  return (
    <View style={styles.section}>
      <View style={[styles.header, { borderBottomWidth: 0 }]}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

export function ProfileInfoGrouped({
  groups,
}: {
  groups: Array<{ title: string; fields: Array<{ label: string; value: string }> }>;
}) {
  const theme = useThemeColors();
  const base = useProfileSectionStyles();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        groupTitle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.tertiary,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.secondary,
        },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: theme.spacing[3],
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.secondary,
          minHeight: 48,
        },
        label: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          fontWeight: theme.typography.fontWeight.medium,
          flexShrink: 0,
        },
        value: {
          flex: 1,
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.primary,
          fontWeight: theme.typography.fontWeight.semibold,
          textAlign: "right",
        },
      }),
    [theme],
  );

  if (groups.every((g) => g.fields.length === 0)) {
    return (
      <View style={base.section}>
        <Text style={[base.empty, { textAlign: "left", paddingHorizontal: theme.spacing[4] }]}>
          No personal details yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 0 }}>
      {groups.map((group) =>
        group.fields.length === 0 ? null : (
          <View key={group.title}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.fields.map((field, index) => (
              <View
                key={field.label}
                style={[
                  styles.row,
                  index === group.fields.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={styles.label}>{field.label}</Text>
                <Text style={styles.value} numberOfLines={2}>
                  {field.value}
                </Text>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}
