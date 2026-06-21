import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "./Icon";
import { Colors, Spacing, Typography, BorderRadius, Shadows, CompactSpacing } from "@/constants/theme";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.7;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

const navItems: NavItem[] = [
  {
    id: "create-match",
    label: "Create a Match",
    icon: "connection", // Matches JoinRightIcon from Material UI
    route: "/match/create",
  },
  {
    id: "create-tournament",
    label: "Create a Tournament",
    icon: "trophy", // Matches EmojiEventsIcon from Material UI
    route: "/tournaments/create",
  },
  {
    id: "create-team",
    label: "Create a Team",
    icon: "users", // Matches GroupsIcon from Material UI
    route: "/team/create",
  },
  {
    id: "leaderboards",
    label: "Leaderboards",
    icon: "podium", // Matches LeaderboardIcon from Material UI
    route: "/leaderboard",
  },
];

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateX.value = withSpring(0, {
        damping: 30,
        stiffness: 200,
        overshootClamping: true,
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateX.value = withSpring(-SIDEBAR_WIDTH, {
        damping: 30,
        stiffness: 200,
        overshootClamping: true,
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleNavItemPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    // Small delay to allow sidebar to close before navigation
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Overlay */}
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={styles.overlayPressable} onPress={onClose} />
        </Animated.View>

        {/* Sidebar */}
        <Animated.View style={[styles.sidebar, sidebarStyle]}>
          <SafeAreaView style={styles.sidebarContent} edges={["top", "left", "bottom"]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Navigation</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Icon name="x" library="material" size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Navigation Items */}
            <View style={styles.navItems}>
              {navItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleNavItemPress(item.route)}
                  activeOpacity={0.6}
                  style={styles.navItem}
                >
                  <View style={styles.navItemContent}>
                    <Icon
                      name={item.icon}
                      library="material"
                      size={20}
                      color={Colors.light.primary}
                    />
                    <Text style={styles.navItemLabel}>{item.label}</Text>
                    <Icon
                      name="chevron-right"
                      library="material"
                      size={18}
                      color={Colors.light.textTertiary}
                      style={styles.chevron}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  overlayPressable: {
    flex: 1,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.light.background,
    borderRightWidth: 1,
    borderRightColor: Colors.light.borderLight,
    ...Shadows.lg,
  },
  sidebarContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: CompactSpacing.itemPadding,
    paddingVertical: CompactSpacing.itemPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerTitle: {
    ...Typography.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: Spacing.xs,
    marginRight: -Spacing.xs,
  },
  navItems: {
    paddingVertical: Spacing.xs,
  },
  navItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  navItemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: CompactSpacing.itemPadding,
    paddingVertical: CompactSpacing.itemPadding,
    gap: Spacing.sm,
  },
  navItemLabel: {
    ...Typography.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.light.text,
    flex: 1,
  },
  chevron: {
    marginLeft: "auto",
  },
});

