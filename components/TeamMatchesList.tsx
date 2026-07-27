import { TeamMatchCard } from "@/components/matches/TeamMatchCard";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { TeamMatch } from "@/types/match.type";
import { useThemeColors } from "@/hooks/useThemeColors";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View, type RefreshControlProps } from "react-native";

interface TeamMatchesListProps {
  matches: TeamMatch[];
  onMatchPress: (matchId: string, status: string) => void;
  onEndReached?: () => void;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  onScroll?: (event: any) => void;
  listHeader?: React.ReactNode;
  ListEmptyComponent?: React.ReactElement | null;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  bottomInset?: number;
}

export default function TeamMatchesList({
  matches,
  onMatchPress,
  onEndReached,
  ListFooterComponent,
  onScroll,
  listHeader,
  ListEmptyComponent,
  refreshControl,
  bottomInset = 0,
}: TeamMatchesListProps) {
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
          alignItems: "center",
          paddingVertical: theme.spacing[16],
          paddingHorizontal: theme.spacing[6],
        },
        emptyTitle: {
          fontSize: theme.typography.fontSize["2xl"],
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.secondary,
        },
        emptySubtitle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.normal,
          color: theme.colors.text.tertiary,
          marginTop: theme.spacing[4],
          textAlign: "center",
        },
      }),
    [theme],
  );

  const data = matches ?? [];
  const asId = (raw: any): string => normalizeMatchIdParam(raw);

  const defaultEmpty = (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>No team matches found</Text>
      <Text style={styles.emptySubtitle}>
        Team matches will appear here once they are created.
      </Text>
    </View>
  );

  const renderMatch = ({ item: match }: { item: TeamMatch; index: number }) => {
    const matchId = normalizeMatchIdParam(match?._id ?? (match as { id?: string }).id);

    return (
      <TeamMatchCard
        match={match}
        onPress={() => {
          if (!matchId) return;
          onMatchPress(matchId, match.status);
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
        keyExtractor={(item, index) => `${asId(item?._id) || "team-match"}-${index}`}
        contentContainerStyle={[
          styles.listContent,
          data.length > 0 && styles.listContentWithData,
          data.length === 0 && styles.listContentEmpty,
          bottomInset > 0 && { paddingBottom: bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={headerNode}
        ListEmptyComponent={ListEmptyComponent ?? defaultEmpty}
        ListFooterComponent={ListFooterComponent}
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.list}
      />
    </View>
  );
}
