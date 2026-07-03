import { Image } from "expo-image";
import { router } from "expo-router";
import { MatchCardMetaRow } from "@/components/matches/MatchCardMetaRow";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { formatApiDateShort } from "@/lib/utils";
import { DesignTokens } from "@/constants/designTokens";
import React from "react";
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function PlayerAvatar({
  name,
  profileImage,
  size = 32,
}: {
  name?: string;
  profileImage?: string;
  size?: number;
}) {
  const fallbackInitial = name?.charAt(0).toUpperCase() || "?";

  return profileImage ? (
    <Image
      source={{ uri: profileImage }}
      contentFit="cover"
      style={styles.avatarImg}
    />
  ) : (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: DesignTokens.colors.primary[100],
          borderWidth: 2,
          borderColor: DesignTokens.colors.primary[200],
        },
      ]}
    >
      <Text
        style={[
          styles.avatarInitial,
          {
            fontSize: size * 0.4,
            color: DesignTokens.colors.primary[700],
            fontWeight: DesignTokens.typography.fontWeight.semibold,
          },
        ]}
      >
        {fallbackInitial}
      </Text>
    </View>
  );
}

export default function MatchesList({
  matches,
  onEndReached,
  ListFooterComponent,
  onScroll,
  listHeader,
  ListEmptyComponent,
}: {
  matches: any[];
  onEndReached?: () => void;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  onScroll?: (event: any) => void;
  /** Renders above match rows; scrolls away with the list. */
  listHeader?: React.ReactNode;
  /** Shown when `matches` is empty (loading skeleton, no-results, etc.). */
  ListEmptyComponent?: React.ReactElement | null;
}) {
  const animatedValues = React.useRef<Record<string, Animated.Value>>({}).current;
  const animationRefs = React.useRef<Record<string, Animated.CompositeAnimation>>({}).current;
  const asId = (raw: any): string => normalizeMatchIdParam(raw);

  const formatMatchTypeLabel = (matchType?: string) => {
    const raw = matchType?.replace(/_/g, " ") || "match";
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  };

  const getSetScore = (match: any) => {
    if (Array.isArray(match?.finalScore?.setsByTeam) && match.finalScore.setsByTeam.length >= 2) {
      return {
        side1: Number(match.finalScore.setsByTeam[0] ?? 0),
        side2: Number(match.finalScore.setsByTeam[1] ?? 0),
      };
    }

    const participants = Array.isArray(match?.participants) ? match.participants : [];
    const isDoubles = match?.matchType !== "singles";
    const idOf = (p: any) => asId(typeof p === "string" ? p : p?._id);

    const side1Ids = isDoubles
      ? [idOf(participants?.[0]), idOf(participants?.[1])]
      : [idOf(participants?.[0])];
    const side2Ids = isDoubles
      ? [idOf(participants?.[2]), idOf(participants?.[3])]
      : [idOf(participants?.[1])];

    const setsById = match?.finalScore?.setsByPlayerId || match?.finalScore?.setsById || {};
    const readSideSets = (ids: (string | undefined)[]) => {
      for (const id of ids) {
        if (!id) continue;
        const value = setsById?.[id];
        if (typeof value === "number") return value;
      }
      return 0;
    };

    return {
      side1: readSideSets(side1Ids),
      side2: readSideSets(side2Ids),
    };
  };

  const getWinnerFlags = (match: any) => {
    const participants = Array.isArray(match?.participants) ? match.participants : [];
    const isDoubles = match?.matchType !== "singles";
    const idOf = (p: any) => asId(typeof p === "string" ? p : p?._id);
    const winnerId = asId(match?.winnerId || match?.winnerPlayerId || match?.winner || "");

    const side1Ids = isDoubles
      ? [idOf(participants?.[0]), idOf(participants?.[1])]
      : [idOf(participants?.[0])];
    const side2Ids = isDoubles
      ? [idOf(participants?.[2]), idOf(participants?.[3])]
      : [idOf(participants?.[1])];

    return {
      side1Won: side1Ids.filter(Boolean).map(String).includes(winnerId),
      side2Won: side2Ids.filter(Boolean).map(String).includes(winnerId),
    };
  };

  const defaultEmpty = (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>No Individual matches found</Text>
      <Text style={styles.emptySubtitle}>
        Individual matches will appear here once they are created.
      </Text>
    </View>
  );

  const data = matches ?? [];

  const renderMatch = ({ item: match, index }: { item: any; index: number }) => {
    const isCompleted = match.status === "completed";
    const isDoubles = match.matchType !== "singles";
    const { side1Won, side2Won } = getWinnerFlags(match);
    const score = getSetScore(match);
    const matchId = asId(match?._id ?? match?.id);
    // Initialize animated value for this match if not exists
    if (!animatedValues[matchId]) {
      animatedValues[matchId] = new Animated.Value(1);
    }
    const scaleAnim = animatedValues[matchId];

    const displayName = (p: { username?: string; fullName?: string } | undefined, fallback: string) =>
      p?.username || p?.fullName || fallback;

    const side1Name = isDoubles
      ? `${displayName(match.participants?.[0], "Player 1")} & ${displayName(match.participants?.[1], "Player 2")}`
      : displayName(match.participants?.[0], "Player 1");

    const side2Name = isDoubles
      ? `${displayName(match.participants?.[2], "Player 3")} & ${displayName(match.participants?.[3], "Player 4")}`
      : displayName(match.participants?.[1], "Player 2");

    const metaTailParts = [formatApiDateShort(match.createdAt) || "—"];
    if (match.city || match.venue) metaTailParts.push(match.city || match.venue);
    if (match.tournament?.name) metaTailParts.push(match.tournament.name);

    return (
      <View style={styles.rowShell}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={() => {
            if (!matchId) return;
            router.push({ pathname: "/match/[id]", params: { id: matchId } });
          }}
          style={styles.card}
          activeOpacity={0.8}
          onPressIn={() => {
            // Stop any existing animation for this match
            if (animationRefs[matchId]) {
              animationRefs[matchId].stop();
            }
            
            animationRefs[matchId] = Animated.spring(scaleAnim, {
              toValue: 0.85,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            });
            animationRefs[matchId].start();
          }}
          onPressOut={() => {
            // Stop any existing animation for this match
            if (animationRefs[matchId]) {
              animationRefs[matchId].stop();
            }
            
            animationRefs[matchId] = Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            });
            animationRefs[matchId].start();
          }}
        >
          <View style={styles.matchContent}>
            <View style={styles.playerSection}>
              <View
                style={[
                  styles.playerInfo,
                  isDoubles && styles.playerInfoDoubles,
                ]}
              >
                <View style={styles.avatarContainer}>
                  <PlayerAvatar
                    name={displayName(match.participants?.[0], "Player 1")}
                    profileImage={match.participants?.[0]?.profileImage}
                    size={32}
                  />
                  {isDoubles && (
                    <View style={styles.avatarOverlap}>
                      <PlayerAvatar
                        name={displayName(match.participants?.[1], "Player 2")}
                        profileImage={match.participants?.[1]?.profileImage}
                        size={32}
                      />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.playerName,
                    isDoubles && styles.playerNameDoubles,
                    side1Won && styles.playerNameWinner,
                  ]}
                  numberOfLines={2}
                >
                  {side1Name}
                </Text>
              </View>
            </View>

            <View style={styles.scoreContainer}>
              {isCompleted && match.finalScore ? (
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreText}>
                    {score.side1}
                  </Text>
                  <Text style={styles.scoreSeparator}>—</Text>
                  <Text style={styles.scoreText}>
                    {score.side2}
                  </Text>
                </View>
              ) : (
                  <Text style={styles.vsText}>VS</Text>
              )}
            </View>

            <View style={[styles.playerSection, styles.playerSectionRight]}>
              <View
                style={[
                  styles.playerInfo,
                  styles.playerInfoRight,
                  isDoubles && styles.playerInfoDoublesRight,
                ]}
              >
                <Text
                  style={[
                    styles.playerName,
                    styles.playerNameRight,
                    isDoubles && styles.playerNameDoubles,
                    side2Won && styles.playerNameWinner,
                  ]}
                  numberOfLines={2}
                >
                  {side2Name}
                </Text>
                <View style={styles.avatarContainer}>
                  {isDoubles ? (
                    <>
                      <PlayerAvatar
                        name={displayName(match.participants?.[2], "Player 3")}
                        profileImage={match.participants?.[2]?.profileImage}
                        size={32}
                      />
                      <View style={styles.avatarOverlapRight}>
                        <PlayerAvatar
                          name={displayName(match.participants?.[3], "Player 4")}
                          profileImage={match.participants?.[3]?.profileImage}
                          size={32}
                        />
                      </View>
                    </>
                  ) : (
                    <PlayerAvatar
                      name={displayName(match.participants?.[1], "Player 2")}
                      profileImage={match.participants?.[1]?.profileImage}
                      size={32}
                    />
                  )}
                </View>
              </View>
            </View>
          </View>

          <MatchCardMetaRow
            leadLabel={formatMatchTypeLabel(match.matchType)}
            status={match.status}
            matchDuration={match.matchDuration}
            tailParts={metaTailParts}
          />
        </TouchableOpacity>
        </Animated.View>
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
        keyExtractor={(item, index) => {
          const normalizedId = asId(item?._id);
          return `${normalizedId || "match"}-${index}`;
        }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={headerNode}
        ListEmptyComponent={ListEmptyComponent ?? defaultEmpty}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          data.length > 0 && styles.listContentWithData,
          data.length === 0 && styles.listContentEmpty,
        ]}
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
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: DesignTokens.spacing[2],
  },
  matchTypeContainer: {
    flex: 1,
    marginRight: DesignTokens.spacing[3],
  },
  matchTypeText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text.tertiary,
    textTransform: "capitalize",
    letterSpacing: DesignTokens.typography.letterSpacing.normal,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
    gap: DesignTokens.spacing[4],
  },
  playerSection: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
  },
  playerSectionRight: {
    alignItems: "flex-end",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    flexShrink: 1,
    maxWidth: "100%",
  },
  playerInfoRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  playerInfoDoubles: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  playerInfoDoublesRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  playerNameDoubles: {
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarOverlap: {
    marginLeft: -DesignTokens.spacing[2],
  },
  avatarOverlapRight: {
    marginRight: -DesignTokens.spacing[2],
  },
  playerName: {
    flexShrink: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
    maxWidth: 100,
  },
  playerNameRight: {
    textAlign: "right",
  },
  playerNameWinner: {
    color: DesignTokens.colors.success,
  },
  scoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[1],
  },
  scoreText: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.primary,
  },
  scoreSeparator: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text.tertiary,
  },
  vsText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.tertiary,
    letterSpacing: DesignTokens.typography.letterSpacing.wide,
  },
  avatarImg: {
    width: DesignTokens.spacing[14],
    height: DesignTokens.spacing[14],
    borderRadius: DesignTokens.spacing[14] / 2,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border.light,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    textTransform: "uppercase",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DesignTokens.spacing[16],
    paddingHorizontal: DesignTokens.spacing[6],
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSize["3xl"],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[2],
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.normal,
    color: DesignTokens.colors.text.tertiary,
    textAlign: "center",
  },
});
