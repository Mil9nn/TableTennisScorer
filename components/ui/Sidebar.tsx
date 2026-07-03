import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  Dimensions,
  ScrollView,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { DesignTokens } from "@/constants/designTokens";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);
const tokens = DesignTokens;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateX.value = withSpring(0, {
        damping: 28,
        stiffness: 260,
        overshootClamping: true,
      });
      opacity.value = withTiming(1, { duration: 220 });
    } else {
      translateX.value = withSpring(-SIDEBAR_WIDTH, {
        damping: 28,
        stiffness: 260,
        overshootClamping: true,
      });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 280);
  };

  const quickActions: QuickAction[] = [
    {
      id: "tournament",
      title: "Tournament",
      subtitle: "Organize leagues",
      route: "/tournaments/create",
      iconBg: "#EEF2FF",
      iconColor: "#4F46E5",
      icon: <Feather name="award" size={14} color="#4F46E5" />,
    },
    {
      id: "match",
      title: "Quick Match",
      subtitle: "1v1 or Doubles",
      route: "/match/create",
      iconBg: "#ECFDF5",
      iconColor: "#10B981",
      icon: <Feather name="play" size={14} color="#10B981" />,
    },
    {
      id: "team",
      title: "Create a Team",
      subtitle: "Manage players & team stats",
      route: "/team/create",
      iconBg: "#FFF7ED",
      iconColor: "#F97316",
      icon: <FontAwesome5 name="users" size={14} color="#F97316" />,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={styles.overlayPressable} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sidebar, sidebarStyle]}>
          <SafeAreaView style={styles.sidebarContent} edges={["top", "left", "bottom"]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <View style={styles.logoWrap}>
                  <Image
                    source={require("@/assets/images/logo.png")}
                    style={{ width: 36, height: 36 }}
                    contentFit="contain"
                  />
                </View>
                <View>
                  <Text style={styles.brandTitle}>TTPro</Text>
                  <Text style={styles.brandTagline}>The Home of Table Tennis Players</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.sectionLabel}>Quick Actions</Text>

              <View style={styles.actionsList}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    activeOpacity={0.7}
                    style={styles.actionCard}
                    onPress={() => handlePress(action.route)}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: action.iconBg }]}>
                      {action.icon}
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Leaderboards */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.leaderboardCard}
                onPress={() => handlePress("/leaderboard")}
              >
                <View style={styles.leaderboardContent}>
                  <Text style={styles.leaderboardEyebrow}>Global Rankings</Text>
                  <Text style={styles.leaderboardTitle}>Explore the Leaderboards</Text>
                  <Text style={styles.leaderboardDescription}>
                    See who's dominating the tables in your city and worldwide.
                  </Text>
                </View>
                <View style={styles.leaderboardIconWrap}>
                  <Feather name="bar-chart-2" size={18} color="white" />
                </View>
              </TouchableOpacity>
            </ScrollView>
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
    backgroundColor: "rgba(15, 23, 42, 0.45)",
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
    backgroundColor: "#F8FAFC",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E2E8F0",
    ...tokens.shadows.lg,
  },
  sidebarContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: tokens.spacing[3],
  },
  brandTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: "#2563EB",
    letterSpacing: tokens.typography.letterSpacing.tight,
  },
  brandTagline: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: "#2563EB",
    letterSpacing: 0.8,
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing[6],
    paddingTop: tokens.spacing[6],
    paddingBottom: tokens.spacing[10],
  },
  sectionLabel: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: tokens.spacing[4],
    marginLeft: tokens.spacing[1],
  },
  actionsList: {
    gap: tokens.spacing[3],
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    ...tokens.shadows.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: tokens.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: tokens.spacing[4],
  },
  actionText: {
    flex: 1,
    paddingRight: tokens.spacing[2],
  },
  actionTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: "#1E293B",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: "#64748B",
  },
  leaderboardCard: {
    marginTop: tokens.spacing[6],
    backgroundColor: "#000000",
    borderRadius: tokens.borderRadius.sm,
    padding: tokens.spacing[6],
    flexDirection: "row",
    alignItems: "center",
  },
  leaderboardContent: {
    flex: 1,
  },
  leaderboardEyebrow: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: "#3B82F6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  leaderboardTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  leaderboardDescription: {
    fontSize: tokens.typography.fontSize.sm,
    color: "#94A3B8",
    paddingRight: tokens.spacing[6],
  },
  leaderboardIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
