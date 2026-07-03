import { formatApiDateShort } from "@/lib/utils";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { TeamMatch } from "@/types/match.type";
import React from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { MatchCardMetaRow } from "@/components/matches/MatchCardMetaRow";
import { DesignTokens } from "@/constants/designTokens";

const AVATAR_SIZE = DesignTokens.spacing[14];

function TeamAvatar({
  name,
  logo,
  size = AVATAR_SIZE,
}: {
  name?: string;
  logo?: string;
  size?: number;
}) {
  const fallbackInitial = name?.charAt(0)?.toUpperCase() || "T";

  return logo ? (
    <Image
      source={{ uri: logo }}
      contentFit="cover"
      style={[styles.teamAvatarImg, { width: size, height: size, borderRadius: size / 2 }]}
    />
  ) : (
    <View
      style={[styles.teamAvatarFallback, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.teamAvatarInitial, { fontSize: size * 0.45 }]}>{fallbackInitial}</Text>
    </View>
  );
}

function formatLabelForMeta(match: TeamMatch): string {
  if (match.matchFormat === "five_singles") return "Swaythling";
  if (match.matchFormat === "single_double_single") return "S-D-S";
  if (match.matchFormat === "custom") return "Custom";
  return String(match.matchFormat);
}

interface TeamMatchesListProps {
  matches: TeamMatch[];
  onMatchPress: (matchId: string) => void;
  onEndReached?: () => void;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  onScroll?: (event: any) => void;
  listHeader?: React.ReactNode;
  ListEmptyComponent?: React.ReactElement | null;
}

export default function TeamMatchesList({
  matches,
  onMatchPress,
  onEndReached,
  ListFooterComponent,
  onScroll,
  listHeader,
  ListEmptyComponent,
}: TeamMatchesListProps) {
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

  const renderMatch = ({ item: match, index }: { item: TeamMatch; index: number }) => {
    const isCompleted = match.status === "completed";
    const team1Won = match.winnerTeam === "team1";
    const team2Won = match.winnerTeam === "team2";

    const metaTailParts = [formatApiDateShort(match.createdAt) || "—"];
    const location = match.city || match.venue;
    if (location) metaTailParts.push(location);
    if (match.tournament?.name) metaTailParts.push(match.tournament.name);

    return (
      <View style={index < data.length - 1 ? styles.cardMargin : undefined}>
        <Pressable
          onPress={() => {
            const matchId = normalizeMatchIdParam(match?._id ?? (match as { id?: string }).id);
            if (!matchId) return;
            onMatchPress(matchId);
          }}
          android_ripple={{ color: DesignTokens.colors.gray[200] }}
        >
          {({ pressed }) => (
            <View style={styles.rowShell}>
              <View style={[styles.card, index === 0 && styles.cardFirst, pressed && styles.cardPressed]}>
                <View style={styles.rowTop}>
                  <View style={styles.sideBlock}>
                    <TeamAvatar name={match.team1?.name} logo={match.team1?.logo} />
                    <Text
                      style={[styles.teamName, team1Won && styles.teamNameWinner]}
                      numberOfLines={2}
                    >
                      {match.team1?.name || "Team 1"}
                    </Text>
                  </View>

                  {isCompleted ? (
                    <Text style={styles.scoreText}>
                      {match.finalScore?.team1Matches || 0} — {match.finalScore?.team2Matches || 0}
                    </Text>
                  ) : (
                    <Text style={styles.vsText}>Vs</Text>
                  )}

                  <View style={[styles.sideBlock, styles.sideRight]}>
                    <Text
                      style={[styles.teamName, styles.teamNameRight, team2Won && styles.teamNameWinner]}
                      numberOfLines={2}
                    >
                      {match.team2?.name || "Team 2"}
                    </Text>
                    <TeamAvatar name={match.team2?.name} logo={match.team2?.logo} />
                  </View>
                </View>

                <View style={styles.metaRowWrap}>
                  <MatchCardMetaRow
                    leadLabel={formatLabelForMeta(match)}
                    status={match.status}
                    matchDuration={match.matchDuration}
                    tailParts={metaTailParts}
                  />
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  const headerNode = listHeader ? (
    <View style={styles.listHeaderBleed}>{listHeader}</View>
  ) : null;

  return (
    <View style={styles.listFrame}>
      <Animated.FlatList
        data={data}
        renderItem={renderMatch}
        keyExtractor={(item, index) => `${asId(item?._id) || "team-match"}-${index}`}
        contentContainerStyle={[
          styles.listContent,
          data.length > 0 && styles.listContentWithData,
          data.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={headerNode}
        ListEmptyComponent={ListEmptyComponent ?? defaultEmpty}
        ListFooterComponent={ListFooterComponent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background.tertiary,
  },
  listContent: {
    paddingBottom: DesignTokens.spacing[7],
  },
  listContentWithData: {
    paddingBottom: DesignTokens.spacing[7],
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listHeaderBleed: {
    marginHorizontal: -DesignTokens.spacing[2],
    marginBottom: DesignTokens.spacing[2],
  },
  listFrame: {
    flex: 1,
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
    borderColor: DesignTokens.colors.border.light,
    padding: DesignTokens.spacing[4],
    overflow: "hidden",
  },
  cardFirst: {
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.border.light,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardMargin: {
    marginBottom: 0,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: DesignTokens.spacing[2],
    gap: DesignTokens.spacing[10],
  },
  headerFormat: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.normal,
    color: DesignTokens.colors.text.tertiary,
    textTransform: "capitalize",
  },
  headerStatusWrap: {
    flexShrink: 0,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[5],
  },
  sideBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[4],
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  teamName: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text.secondary,
    minWidth: 0,
  },
  teamNameRight: {
    textAlign: "right",
  },
  teamNameWinner: {
    color: DesignTokens.colors.success,
  },
  scoreText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
    flexShrink: 0,
  },
  vsText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text.tertiary,
    flexShrink: 0,
  },
  metaRowWrap: {
    marginTop: DesignTokens.spacing[4],
  },
  teamAvatarImg: {
    borderWidth: DesignTokens.components.avatar.borderWidth,
    borderColor: DesignTokens.colors.border.light,
  },
  teamAvatarFallback: {
    backgroundColor: DesignTokens.colors.gray[100],
    borderWidth: DesignTokens.components.avatar.borderWidth,
    borderColor: DesignTokens.components.avatar.borderColor,
    alignItems: "center",
    justifyContent: "center",
  },
  teamAvatarInitial: {
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: DesignTokens.spacing[16],
    paddingHorizontal: DesignTokens.spacing[6],
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSize["2xl"],
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
  emptySubtitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.normal,
    color: DesignTokens.colors.text.tertiary,
    marginTop: DesignTokens.spacing[4],
    textAlign: "center",
  },
});
