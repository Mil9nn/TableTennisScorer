import { IndividualMatchCard } from "@/components/matches/IndividualMatchCard";
import { asMatchId } from "@/lib/match/matchCardUtils";
import { getMatchOpenHref } from "@/lib/matchNavigation";
import { useThemeColors } from "@/hooks/useThemeColors";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type RefreshControlProps,
} from "react-native";

export default function MatchesList({
  matches,
  onEndReached,
  ListFooterComponent,
  onScroll,
  listHeader,
  ListEmptyComponent,
  refreshControl,
  bottomInset = 0,
}: {
  matches: any[];
  onEndReached?: () => void;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  onScroll?: (event: any) => void;
  listHeader?: React.ReactNode;
  ListEmptyComponent?: React.ReactElement | null;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  bottomInset?: number;
}) {
  const theme = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          flex: 1,
          backgroundColor: theme.colors.background.tertiary,
        },
        listContent: {
          backgroundColor: theme.colors.background.tertiary,
        },
        listContentWithData: {
          paddingBottom: 16,
        },
        listContentEmpty: {
          flexGrow: 1,
          paddingHorizontal: 0,
        },
        listHeaderBleed: {
          marginBottom: theme.spacing[1],
        },
        listFrame: {
          flex: 1,
          backgroundColor: theme.colors.background.tertiary,
        },
        emptyWrap: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing[16],
          paddingHorizontal: theme.spacing[6],
        },
        emptyTitle: {
          fontSize: theme.typography.fontSize["3xl"],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing[2],
          textAlign: "center",
        },
        emptySubtitle: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.normal,
          color: theme.colors.text.tertiary,
          textAlign: "center",
        },
      }),
    [theme],
  );

  const defaultEmpty = (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>No Individual matches found</Text>
      <Text style={styles.emptySubtitle}>
        Individual matches will appear here once they are created.
      </Text>
    </View>
  );

  const data = matches ?? [];

  const renderMatch = ({ item: match }: { item: any; index: number }) => {
    const matchId = asMatchId(match?._id ?? match?.id);

    return (
      <IndividualMatchCard
        match={match}
        onPress={() => {
          if (!matchId) return;
          router.push(getMatchOpenHref(matchId, match.status, "individual"));
        }}
      />
    );
  };

  const headerNode = listHeader ? (
    <View style={styles.listHeaderBleed}>{listHeader}</View>
  ) : null;

  return (
    <View style={styles.listFrame}>
      <FlatList
        data={data}
        renderItem={renderMatch}
        keyExtractor={(item, index) => {
          const normalizedId = asMatchId(item?._id);
          return `${normalizedId || "match"}-${index}`;
        }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={headerNode}
        ListEmptyComponent={ListEmptyComponent ?? defaultEmpty}
        ListFooterComponent={ListFooterComponent}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        contentContainerStyle={[
          styles.listContent,
          data.length > 0 && styles.listContentWithData,
          data.length === 0 && styles.listContentEmpty,
          bottomInset > 0 && { paddingBottom: bottomInset },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.list}
      />
    </View>
  );
}
