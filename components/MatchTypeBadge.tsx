import { FontAwesome5 } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Spacing } from "@/constants/theme";

export type MatchType = "singles" | "doubles" | "mixed_doubles";

interface MatchTypeBadgeProps {
  type: MatchType;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const TYPE_CONFIG: Record<MatchType, { label: string; icon: string; variant: "default" | "primary" | "success" | "warning" | "error" | "info" }> = {
  singles: {
    label: "Singles",
    icon: "user",
    variant: "primary",
  },
  doubles: {
    label: "Doubles",
    icon: "users",
    variant: "info",
  },
  mixed_doubles: {
    label: "Mixed Doubles",
    icon: "heart",
    variant: "default",
  },
};

export default function MatchTypeBadge({ type, size = "sm", showIcon = false }: MatchTypeBadgeProps) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return null;

  return (
    <View style={styles.container}>
      {showIcon && (
        <FontAwesome5
          name={cfg.icon as any}
          size={12}
          color="#6b7280"
          style={styles.icon}
        />
      )}
      <Badge variant={cfg.variant} size={size}>
        {cfg.label}
      </Badge>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  icon: {
    marginRight: 2,
  },
});
