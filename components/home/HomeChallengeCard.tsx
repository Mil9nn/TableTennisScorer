import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { HomeChallenge } from "@/components/home/challenges";
import { HighlightedDescription } from "@/components/home/HighlightedDescription";

type HomeChallengeCardProps = {
  challenge: HomeChallenge;
  width: number;
  onPress?: () => void;
};

export function HomeChallengeCard({ challenge, width, onPress }: HomeChallengeCardProps) {
  const theme = useThemeColors();
  const badgeSize = Math.min(64, Math.round(width * 0.4));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width,
          minHeight: 168,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: theme.colors.background.primary,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[4],
          justifyContent: "space-between",
          overflow: "hidden",
          ...theme.shadows.sm,
        },
        topRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "flex-end",
        },
        denotion: {
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          backgroundColor: theme.colors.background.secondary,
          borderWidth: 2,
          borderColor: `${challenge.accent}33`,
          overflow: "hidden",
          ...theme.shadows.sm,
        },
        denotionImage: {
          width: "100%",
          height: "100%",
        },
        body: {
          marginTop: theme.spacing[2],
          paddingRight: badgeSize * 0.1,
        },
        title: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        subtitle: {
          marginTop: 6,
          fontSize: theme.typography.fontSize.sm,
          lineHeight: 20,
          color: theme.colors.text.secondary,
        },
        highlight: {
          fontWeight: theme.typography.fontWeight.bold,
          color: challenge.accent,
        },
      }),
    [theme, challenge, width, badgeSize],
  );

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${challenge.badgeName}. ${challenge.subtitle}.`}
    >
      <View style={styles.topRow}>
        <View style={styles.denotion}>
          <Image
            source={challenge.badgeImage}
            style={styles.denotionImage}
            contentFit="cover"
            accessibilityLabel={`${challenge.badgeName} badge`}
          />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{challenge.badgeName}</Text>
        <HighlightedDescription
          text={challenge.subtitle}
          highlight={challenge.count}
          baseStyle={styles.subtitle}
          highlightStyle={styles.highlight}
          numberOfLines={3}
        />
      </View>
    </Pressable>
  );
}
