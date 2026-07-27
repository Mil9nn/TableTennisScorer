import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/hooks/useThemeColors";
import { HOME_CHALLENGES, type HomeChallenge } from "@/components/home/challenges";
import { HighlightedDescription } from "@/components/home/HighlightedDescription";

function ChallengeListCard({
  challenge,
  onPress,
}: {
  challenge: HomeChallenge;
  onPress: () => void;
}) {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[4],
          padding: theme.spacing[4],
          borderRadius: theme.borderRadius.lg,
          backgroundColor: theme.colors.background.primary,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          ...theme.shadows.sm,
        },
        denotion: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: theme.colors.background.secondary,
          borderWidth: 2,
          borderColor: `${challenge.accent}33`,
          overflow: "hidden",
        },
        denotionImage: {
          width: "100%",
          height: "100%",
        },
        body: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          fontSize: theme.typography.fontSize.base,
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
    [theme, challenge],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={`${challenge.badgeName}. ${challenge.subtitle}.`}
    >
      <View style={styles.denotion}>
        <Image
          source={challenge.badgeImage}
          style={styles.denotionImage}
          contentFit="cover"
        />
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

export default function ChallengesScreen() {
  const theme = useThemeColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 560);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: theme.colors.background.tertiary,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[3],
          backgroundColor: theme.colors.background.primary,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.light,
        },
        backButton: {
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitle: {
          flex: 1,
          textAlign: "center",
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        headerSpacer: {
          width: 44,
        },
        scroll: {
          flex: 1,
        },
        content: {
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[5],
          paddingBottom: theme.spacing[16],
          gap: theme.spacing[4],
          width: contentWidth,
          alignSelf: "center",
        },
        hero: {
          gap: theme.spacing[2],
          marginBottom: theme.spacing[1],
        },
        heroTitle: {
          fontSize: theme.typography.fontSize["2xl"],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        heroSubtitle: {
          fontSize: theme.typography.fontSize.sm,
          lineHeight: 20,
          color: theme.colors.text.tertiary,
        },
        list: {
          gap: theme.spacing[3],
        },
        footnote: {
          marginTop: theme.spacing[2],
          fontSize: theme.typography.fontSize.xs,
          lineHeight: 16,
          color: theme.colors.text.tertiary,
          textAlign: "center",
        },
      }),
    [theme, contentWidth],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Feather name="arrow-left" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Challenges</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Push your game</Text>
          <Text style={styles.heroSubtitle}>
            Complete skill challenges in your matches and unlock exclusive denotion
            badges for your profile.
          </Text>
        </View>

        <View style={styles.list}>
          {HOME_CHALLENGES.map((challenge) => (
            <ChallengeListCard
              key={challenge.id}
              challenge={challenge}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
          ))}
        </View>

        <Text style={styles.footnote}>
          Progress tracks from scored matches on TTPro. Badges appear on your profile
          once unlocked.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
