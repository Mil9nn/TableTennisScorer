import React, { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatsSectionContainerProps {
  id: string;
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}

export const StatsSectionContainer = forwardRef<View, StatsSectionContainerProps>(
  ({ id, title, description, icon, children }, ref) => {
    return (
      <View ref={ref} style={styles.container}>
        {/* Section Header */}
        {title && (
          <View style={styles.header}>
            <View style={styles.titleRow}>
              {icon && (
                <Ionicons name={icon} size={20} color="#3c6e71" />
              )}
              <Text style={styles.title}>{title}</Text>
            </View>
            {description && (
              <Text style={styles.description}>{description}</Text>
            )}
          </View>
        )}

        {/* Section Content */}
        <View style={styles.content}>{children}</View>
      </View>
    );
  }
);

StatsSectionContainer.displayName = "StatsSectionContainer";

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.35,
  },
  description: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  content: {
    gap: 14,
  },
});
