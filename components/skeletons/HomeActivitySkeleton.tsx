import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { DesignTokens } from "@/constants/designTokens";

const ROW_COUNT = 4;

export default function HomeActivitySkeleton() {
  return (
    <View style={styles.listFrame}>
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <View key={index} style={styles.rowShell}>
          <View style={styles.card}>
            <View style={styles.row}>
              <Skeleton width={32} height={32} borderRadius={DesignTokens.borderRadius.base} />
              <View style={styles.content}>
                <Skeleton width="72%" height={14} borderRadius={DesignTokens.borderRadius.sm} />
                <Skeleton
                  width="48%"
                  height={10}
                  borderRadius={DesignTokens.borderRadius.sm}
                  style={styles.subtitle}
                />
              </View>
              <Skeleton width={36} height={10} borderRadius={DesignTokens.borderRadius.sm} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listFrame: {
    backgroundColor: DesignTokens.colors.background.tertiary,
    paddingHorizontal: DesignTokens.spacing[2],
    paddingBottom: DesignTokens.spacing[2],
  },
  rowShell: {
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
  },
  card: {
    backgroundColor: DesignTokens.colors.background.secondary,
    padding: DesignTokens.spacing[4],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[3],
  },
  content: {
    flex: 1,
    gap: DesignTokens.spacing[2],
  },
  subtitle: {
    marginTop: DesignTokens.spacing[1],
  },
});
