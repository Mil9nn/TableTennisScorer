import { useNetworkStore } from "@/hooks/useNetworkStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Feather } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export function OfflineBanner() {
  const theme = useThemeColors();
  const isOffline = useNetworkStore((s) => s.isOffline);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        },
        banner: {
          backgroundColor: theme.colors.warning,
          paddingVertical: theme.spacing[2],
          paddingHorizontal: theme.spacing[4],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing[2],
        },
        text: {
          color: theme.colors.gray[900],
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
        },
      }),
    [theme],
  );

  if (!isOffline) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <View style={styles.banner} accessibilityRole="alert">
      <Feather name="wifi-off" size={14} color={theme.colors.gray[900]} />
      <Text style={styles.text}>You appear to be offline</Text>
    </View>
    </View>
  );
}
