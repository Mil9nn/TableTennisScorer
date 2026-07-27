import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  Dimensions,
  ScrollView,
  BackHandler,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Portal } from "react-native-paper";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuthStore } from "@/hooks/useAuthStore";
import { profilePath } from "@/lib/profile/navigation";
import type { User } from "@/types/user.type";
import * as Haptics from "expo-haptics";
import { getFirstName } from "@/lib/utils";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);
const PROFILE_SECTION_HEIGHT = Math.round(SCREEN_HEIGHT * 0.18);
const OPEN_MS = 220;
const CLOSE_MS = 180;
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  route: string;
  icon: React.ReactNode;
  tintBg: string;
}

/** Owns open state so HomeScreen content does not re-render on open/close. */
export function SidebarMenuButton({
  style,
  iconColor,
}: {
  style?: StyleProp<ViewStyle>;
  iconColor: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          setOpen(true);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
        style={style}
        accessibilityRole="button"
        accessibilityLabel="Open sidebar"
      >
        <Feather name="menu" size={22} color={iconColor} />
      </TouchableOpacity>
      <Sidebar visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function formatHandedness(value?: string): string | null {
  if (!value) return null;
  if (value === "left") return "Left-handed";
  if (value === "right") return "Right-handed";
  if (value === "ambidextrous") return "Ambidextrous";
  return null;
}

function getProfileCompletionPercent(user: User | null | undefined): number {
  if (!user) return 0;
  if (user.isProfileComplete) return 100;

  const checks = [
    Boolean(user.fullName?.trim()),
    Boolean(user.username?.trim()),
    Boolean(user.profileImage?.trim()),
    Boolean(user.dateOfBirth?.trim()),
    Boolean(user.gender),
    Boolean(user.handedness),
    Boolean(user.location?.trim()),
    Boolean(user.phoneNumber?.trim()),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const theme = useThemeColors();
  const user = useAuthStore((state) => state.user);
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const opacity = useSharedValue(0);

  const displayName = user?.fullName?.trim() || user?.username?.trim() || "Player";
  const firstName = getFirstName(displayName, "Player");
  const locationLabel = user?.location?.trim() || "Set your city";
  const handednessLabel = formatHandedness(user?.handedness);
  const usernameLabel = user?.username?.trim() ? `@${user.username.trim()}` : null;
  const completionPercent = getProfileCompletionPercent(user);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          ...StyleSheet.absoluteFillObject,
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          zIndex: 1000,
        },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
        },
        overlayPressable: { flex: 1 },
        sidebar: {
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          backgroundColor: theme.colors.background.primary,
          borderRightWidth: StyleSheet.hairlineWidth,
          borderRightColor: theme.colors.border.light,
          elevation: 8,
        },
        sidebarContent: { flex: 1 },
        profileHeader: {
          minHeight: PROFILE_SECTION_HEIGHT,
          paddingHorizontal: theme.spacing[5],
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[4],
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.secondary,
          justifyContent: "center",
        },
        profilePressable: {
          flex: 1,
          justifyContent: "center",
          gap: theme.spacing[4],
        },
        profileIdentity: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
        },
        avatar: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.primary[100],
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        avatarImage: {
          width: 56,
          height: 56,
        },
        avatarInitial: {
          fontSize: 22,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary[700],
        },
        profileText: {
          flex: 1,
          minWidth: 0,
        },
        profileName: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        profileMeta: {
          marginTop: 2,
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
        },
        profileHandle: {
          marginTop: 2,
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.primary[600],
          fontWeight: theme.typography.fontWeight.medium,
        },
        completionBlock: {
          gap: theme.spacing[2],
        },
        completionHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing[3],
        },
        completionLabel: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
        },
        completionPercent: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary[600],
        },
        progressTrack: {
          height: 6,
          borderRadius: 999,
          backgroundColor: theme.colors.border.light,
          overflow: "hidden",
        },
        progressFill: {
          height: "100%",
          borderRadius: 999,
          backgroundColor: theme.colors.primary[600],
        },
        scrollContent: {
          paddingHorizontal: theme.spacing[3],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[10],
        },
        navList: { gap: 2 },
        navRow: {
          flexDirection: "row",
          alignItems: "center",
          minHeight: 48,
          paddingVertical: theme.spacing[2],
          paddingHorizontal: theme.spacing[2],
          gap: theme.spacing[3],
          borderRadius: theme.borderRadius.md,
        },
        iconWell: {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        },
        navLabel: {
          flex: 1,
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.border.light,
          marginVertical: theme.spacing[3],
          marginHorizontal: theme.spacing[2],
        },
      }),
    [theme],
  );

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, { duration: OPEN_MS, easing: EASE_OUT });
      opacity.value = withTiming(1, { duration: OPEN_MS, easing: EASE_OUT });
      return;
    }

    translateX.value = withTiming(-SIDEBAR_WIDTH, {
      duration: CLOSE_MS,
      easing: EASE_IN,
    });
    opacity.value = withTiming(0, { duration: CLOSE_MS, easing: EASE_IN });
  }, [visible, translateX, opacity]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePress = (route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push(route as never);
  };

  const openProfile = () => {
    if (!user?._id) return;
    handlePress(String(profilePath(user._id)));
  };

  const primaryActions: NavItem[] = [
    {
      id: "match",
      label: "Start a Match",
      route: "/match/create",
      tintBg: "rgba(16, 185, 129, 0.12)",
      icon: <FontAwesome5 name="table-tennis" size={14} color={theme.colors.success} />,
    },
    {
      id: "tournament",
      label: "Add a Tournament",
      route: "/tournaments/create",
      tintBg: theme.colors.primary[50],
      icon: <Feather name="award" size={16} color={theme.colors.primary[600]} />,
    },
    {
      id: "team",
      label: "Create a Team",
      route: "/team/create",
      tintBg: "rgba(249, 115, 22, 0.12)",
      icon: <FontAwesome5 name="users" size={14} color="#F97316" />,
    },
  ];

  const secondaryActions: NavItem[] = [
    {
      id: "join-tournament",
      label: "Join a Tournament",
      route: "/tournaments/join",
      tintBg: theme.colors.primary[50],
      icon: <FontAwesome5 name="qrcode" size={14} color={theme.colors.primary[600]} />,
    },
    {
      id: "join-team",
      label: "Join a Team",
      route: "/team/join",
      tintBg: "rgba(99, 102, 241, 0.12)",
      icon: <FontAwesome5 name="user-plus" size={14} color="#6366F1" />,
    },
    {
      id: "settings",
      label: "Settings",
      route: "/settings",
      tintBg: theme.colors.background.secondary,
      icon: <Feather name="settings" size={16} color={theme.colors.text.secondary} />,
    },
  ];

  const renderNavRow = (item: NavItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.navRow}
      onPress={() => handlePress(item.route)}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWell, { backgroundColor: item.tintBg }]}>
        {item.icon}
      </View>
      <Text style={styles.navLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <Portal>
      <View
        style={styles.root}
        pointerEvents={visible ? "auto" : "none"}
        accessibilityViewIsModal={visible}
      >
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={styles.overlayPressable} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sidebar, sidebarStyle]}>
          <SafeAreaView style={styles.sidebarContent} edges={["top", "left", "bottom"]}>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={styles.profilePressable}
                onPress={openProfile}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Open profile for ${firstName}`}
              >
                <View style={styles.profileIdentity}>
                  <View style={styles.avatar}>
                    {user?.profileImage ? (
                      <Image
                        source={{ uri: user.profileImage }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.avatarInitial}>
                        {firstName.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.profileText}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    {usernameLabel ? (
                      <Text style={styles.profileHandle} numberOfLines={1}>
                        {usernameLabel}
                      </Text>
                    ) : null}
                    <Text style={styles.profileMeta} numberOfLines={1}>
                      {[locationLabel, handednessLabel].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={theme.colors.border.medium}
                  />
                </View>

                <View style={styles.completionBlock}>
                  <View style={styles.completionHeader}>
                    <Text style={styles.completionLabel}>Profile completion</Text>
                    <Text style={styles.completionPercent}>{completionPercent}%</Text>
                  </View>
                  <View
                    style={styles.progressTrack}
                    accessibilityRole="progressbar"
                    accessibilityValue={{
                      min: 0,
                      max: 100,
                      now: completionPercent,
                    }}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${completionPercent}%` },
                      ]}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.navList}>
                {primaryActions.map(renderNavRow)}
              </View>

              <View style={styles.divider} />

              <View style={styles.navList}>
                {secondaryActions.map(renderNavRow)}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Portal>
  );
}
