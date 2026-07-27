import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { useThemeColors } from "@/hooks/useThemeColors";

const MATCH_CARD_COUNT = 2;
const CHALLENGE_COUNT = 4;
const FEED_COUNT = 3;
const AVATAR_SIZE = 40;

function SectionHeaderSkeleton({
  withSubtitle = false,
  showLink = false,
}: {
  withSubtitle?: boolean;
  showLink?: boolean;
}) {
  const theme = useThemeColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing[4],
        gap: theme.spacing[3],
      }}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton muted width={140} height={16} borderRadius={theme.borderRadius.sm} delayMs={0} />
        {withSubtitle ? (
          <Skeleton muted width="88%" height={10} borderRadius={theme.borderRadius.sm} delayMs={30} />
        ) : null}
      </View>
      {showLink ? (
        <Skeleton muted width={48} height={12} borderRadius={theme.borderRadius.sm} delayMs={40} />
      ) : null}
    </View>
  );
}

function MatchCardSkeleton({ width, delayMs }: { width: number; delayMs: number }) {
  const theme = useThemeColors();

  return (
    <View
      style={{
        width,
        borderRadius: theme.borderRadius.base,
        backgroundColor: theme.colors.background.primary,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        paddingHorizontal: theme.spacing[5],
        paddingVertical: theme.spacing[5],
        gap: theme.spacing[4],
        ...theme.shadows.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing[3] }}>
        <Skeleton muted width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} delayMs={delayMs} />
        <Skeleton muted width={72} height={12} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 20} />
        <View style={{ flex: 1 }} />
        <Skeleton muted width={44} height={20} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 40} />
        <View style={{ flex: 1 }} />
        <Skeleton muted width={72} height={12} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 20} />
        <Skeleton muted width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} delayMs={delayMs} />
      </View>
      <Skeleton muted width="58%" height={10} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 70} />
    </View>
  );
}

function ChallengeCardSkeleton({ width, delayMs }: { width: number; delayMs: number }) {
  const theme = useThemeColors();

  return (
    <View
      style={{
        width,
        minHeight: 188,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background.primary,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        padding: theme.spacing[4],
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Skeleton muted width={72} height={18} borderRadius={theme.borderRadius.full} delayMs={delayMs} />
        <Skeleton muted width={56} height={56} borderRadius={28} delayMs={delayMs + 10} />
      </View>
      <View style={{ gap: 6 }}>
        <Skeleton muted width={40} height={28} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 30} />
        <Skeleton muted width="80%" height={14} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 50} />
        <Skeleton muted width="92%" height={10} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 70} />
      </View>
    </View>
  );
}

function FeedPostSkeleton({ delayMs }: { delayMs: number }) {
  const theme = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[4],
        gap: theme.spacing[3],
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing[3] }}>
        <Skeleton muted width={40} height={40} borderRadius={20} delayMs={delayMs} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton muted width="46%" height={12} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 20} />
          <Skeleton muted width="34%" height={10} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 40} />
        </View>
      </View>
      <Skeleton muted width="92%" height={14} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 60} />
      <Skeleton muted width="78%" height={14} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 80} />
      <View style={{ flexDirection: "row", gap: theme.spacing[3], paddingTop: theme.spacing[2] }}>
        <Skeleton muted width="28%" height={14} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 100} />
        <Skeleton muted width="28%" height={14} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 110} />
        <Skeleton muted width="28%" height={14} borderRadius={theme.borderRadius.sm} delayMs={delayMs + 120} />
      </View>
    </View>
  );
}

export default function HomeScreenSkeleton() {
  const theme = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const matchCardWidth = Math.min(windowWidth * 0.82, windowWidth - theme.spacing[8]);
  const challengeCardWidth = Math.min(160, windowWidth * 0.42);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { gap: theme.spacing[7] },
        section: { gap: theme.spacing[3] },
        horizontalScroll: {
          paddingHorizontal: theme.spacing[4],
          gap: theme.spacing[3],
          alignItems: "flex-start",
        },
        feedStack: {
          paddingHorizontal: theme.spacing[4],
          gap: theme.spacing[3],
        },
      }),
    [theme],
  );

  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <SectionHeaderSkeleton showLink />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {Array.from({ length: MATCH_CARD_COUNT }).map((_, index) => (
            <MatchCardSkeleton key={index} width={matchCardWidth} delayMs={index * 80} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeaderSkeleton withSubtitle showLink />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {Array.from({ length: CHALLENGE_COUNT }).map((_, index) => (
            <ChallengeCardSkeleton key={index} width={challengeCardWidth} delayMs={index * 60} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeaderSkeleton withSubtitle />
        <View style={styles.feedStack}>
          {Array.from({ length: FEED_COUNT }).map((_, index) => (
            <FeedPostSkeleton key={index} delayMs={index * 70} />
          ))}
        </View>
      </View>
    </View>
  );
}
