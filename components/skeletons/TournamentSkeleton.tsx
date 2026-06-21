import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

export function TournamentDetailSkeleton() {
  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={["#2563eb", "#9333ea"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Skeleton width={256} height={28} borderRadius={4} style={styles.skeletonWhite} />
            <Skeleton width={192} height={16} borderRadius={4} style={styles.skeletonWhite} />
          </View>
          <View style={styles.headerRight}>
            <Skeleton width={128} height={32} borderRadius={4} style={styles.skeletonWhite} />
            <Skeleton width={112} height={32} borderRadius={4} style={styles.skeletonWhite} />
            <Skeleton width={96} height={32} borderRadius={4} style={styles.skeletonWhite} />
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Skeleton width={128} height={12} borderRadius={4} style={styles.skeletonWhite} />
            <Skeleton width={80} height={12} borderRadius={4} style={styles.skeletonWhite} />
          </View>
          <Skeleton width="100%" height={6} borderRadius={3} style={styles.skeletonWhite} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Info Cards Grid */}
        <View style={styles.infoGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} style={styles.infoCard}>
              <View style={styles.infoCardContent}>
                <Skeleton width={36} height={36} borderRadius={8} />
                <View style={styles.infoCardText}>
                  <Skeleton width={80} height={12} borderRadius={4} />
                  <Skeleton width={96} height={16} borderRadius={4} />
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Generate Matches CTA */}
        <Card style={styles.ctaCard}>
          <View style={styles.ctaContent}>
            <View style={styles.ctaText}>
              <Skeleton width={192} height={24} borderRadius={4} />
              <Skeleton width={256} height={16} borderRadius={4} />
            </View>
            <Skeleton width={160} height={44} borderRadius={22} />
          </View>
        </Card>

        {/* Tabs Section */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsList}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="25%" height={40} borderRadius={0} />
            ))}
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {/* Groups Overview */}
            <View style={styles.groupsGrid}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} style={styles.groupCard}>
                  <View style={styles.groupCardContent}>
                    <View style={styles.groupCardHeader}>
                      <Skeleton width={80} height={20} borderRadius={4} />
                      <Skeleton width={20} height={20} borderRadius={10} />
                    </View>
                    <View style={styles.groupCardRows}>
                      {Array.from({ length: 3 }).map((_, j) => (
                        <View key={j} style={styles.groupCardRow}>
                          <Skeleton width={64} height={12} borderRadius={4} />
                          <Skeleton width={32} height={20} borderRadius={10} />
                        </View>
                      ))}
                    </View>
                  </View>
                </Card>
              ))}
            </View>

            {/* Standings Table */}
            <Card style={styles.tableCard}>
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} width="16%" height={16} borderRadius={4} />
                  ))}
                </View>
                {/* Table Rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} style={styles.tableRow}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <Skeleton key={j} width="16%" height={16} borderRadius={4} />
                    ))}
                  </View>
                ))}
              </View>
            </Card>

            {/* Schedule Content */}
            <View style={styles.scheduleList}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} style={styles.scheduleCard}>
                  <Skeleton width={128} height={20} borderRadius={4} />
                  <View style={styles.scheduleItems}>
                    {Array.from({ length: 2 }).map((_, j) => (
                      <View key={j} style={styles.scheduleItem}>
                        <Skeleton width={96} height={16} borderRadius={4} />
                        <Skeleton width={64} height={20} borderRadius={10} />
                      </View>
                    ))}
                  </View>
                </Card>
              ))}
            </View>

            {/* Participants Grid */}
            <View style={styles.participantsGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={styles.participantCard}>
                  <Skeleton width={32} height={32} borderRadius={16} />
                  <View style={styles.participantInfo}>
                    <Skeleton width={96} height={12} borderRadius={4} />
                    <Skeleton width={64} height={8} borderRadius={4} />
                  </View>
                  <Skeleton width={48} height={20} borderRadius={10} />
                </View>
              ))}
            </View>

            {/* Info Card */}
            <Card style={styles.infoCard}>
              <Skeleton width={192} height={24} borderRadius={4} />
              <View style={styles.infoRows}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={styles.infoRow}>
                    <Skeleton width={96} height={16} borderRadius={4} />
                    <Skeleton width={128} height={16} borderRadius={4} />
                  </View>
                ))}
              </View>
            </Card>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: Spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  headerLeft: {
    gap: 6,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  skeletonWhite: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  progressSection: {
    marginTop: Spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  content: {
    backgroundColor: Colors.light.background,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  infoCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.sm,
  },
  infoCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoCardText: {
    flex: 1,
    gap: Spacing.xs,
  },
  ctaCard: {
    margin: Spacing.base,
    marginBottom: Spacing.base,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: "#bfdbfe",
  },
  ctaContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.base,
  },
  ctaText: {
    flex: 1,
    gap: Spacing.sm,
  },
  tabsContainer: {
    width: "100%",
  },
  tabsList: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tabContent: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  groupsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.base,
  },
  groupCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.base,
  },
  groupCardContent: {
    gap: Spacing.sm,
  },
  groupCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupCardRows: {
    gap: Spacing.xs,
  },
  groupCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableCard: {
    padding: Spacing.lg,
  },
  table: {
    gap: Spacing.base,
  },
  tableHeader: {
    flexDirection: "row",
    gap: Spacing.base,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tableRow: {
    flexDirection: "row",
    gap: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  scheduleList: {
    gap: Spacing.base,
  },
  scheduleCard: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  scheduleItems: {
    gap: Spacing.xs,
  },
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  participantsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#f8fafc",
    flex: 1,
    minWidth: "45%",
  },
  participantInfo: {
    flex: 1,
    gap: 4,
  },
  infoRows: {
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
});

