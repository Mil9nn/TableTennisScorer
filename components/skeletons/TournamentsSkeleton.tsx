import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { DesignTokens } from "@/constants/designTokens";

const ROW_COUNT = 10;

/** Title bar widths (% of row) — slight variation reads more natural than identical rows */
const TITLE_WIDTH_PCTS = ["76%", "68%", "82%", "71%", "74%", "66%", "79%", "72%"];

/** Barely-there row separation (not “card chrome”) */
const ROW_SEP = "rgba(15, 23, 42, 0.055)";

function TournamentRowSkeleton({
  index,
  isLast,
}: {
  index: number;
  isLast: boolean;
}) {
  const stagger = index * 55;
  const titleW = TITLE_WIDTH_PCTS[index % TITLE_WIDTH_PCTS.length];

  return (
    <View
      style={styles.cardShell}
    >
      <View style={styles.cardInner}>
        <View style={styles.rowBetween}>
          <View style={styles.titleWrap}>
            <Skeleton
              width={titleW}
              height={15}
              borderRadius={3}
              delayMs={stagger}
            />
          </View>
          <Skeleton
            width={48}
            height={15}
            borderRadius={3}
            delayMs={stagger + 40}
          />
        </View>

        <View style={styles.rowMeta}>
          <Skeleton width={44} height={11} borderRadius={3} delayMs={stagger + 70} />
          <Skeleton width={86} height={11} borderRadius={3} delayMs={stagger + 85} />
          <Skeleton width={72} height={11} borderRadius={3} delayMs={stagger + 100} />
        </View>

        <View style={styles.rowMetaTight}>
          <Skeleton width={76} height={10} borderRadius={3} delayMs={stagger + 120} />
          <Skeleton width={64} height={10} borderRadius={3} delayMs={stagger + 135} />
          <Skeleton
            width="32%"
            height={10}
            borderRadius={3}
            delayMs={stagger + 150}
            style={styles.venueBone}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * Loading placeholder: same rhythm as tournament rows, minimal chrome so it reads as “content loading”, not a mock UI.
 */
export default function TournamentsSkeleton() {
  return (
    <View style={styles.root}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <TournamentRowSkeleton
          key={i}
          index={i}
          isLast={i === ROW_COUNT - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    paddingBottom: 12,
  },
  cardShell: {
    backgroundColor: DesignTokens.colors.background.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  cardInner: {
    padding: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[3],
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DesignTokens.spacing[3],
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: DesignTokens.spacing[1],
  },
  rowMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: DesignTokens.spacing[3],
    marginTop: DesignTokens.spacing[3],
  },
  rowMetaTight: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: DesignTokens.spacing[3],
    marginTop: DesignTokens.spacing[2],
  },
  venueBone: {
    minWidth: 72,
  },
});
