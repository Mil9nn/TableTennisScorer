import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  LayoutAnimation,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { KnockoutBracket, BracketMatch } from "@/types/tournamentDraw";
import {
  Participant as TournamentParticipant,
  isTeamParticipant,
  isUserParticipant,
  getParticipantDisplayName,
  getParticipantImage,
} from "@/types/tournament.type";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DesignTokens } from "@/constants/designTokens";
import { getSetScores } from "@/lib/match/singlesClient";
import * as Haptics from 'expo-haptics';

interface Participant {
  _id: string;
  username?: string;
  fullName?: string;
  profileImage?: string;
  name?: string;
  logo?: string;
}

interface MatchDetails {
  _id: string;
  participants: Participant[];
  teams?: { players?: { _id?: string }[] }[];
  matchType?: "singles" | "doubles";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  finalScore?: {
    setsByTeam?: number[];
    setsById?: Record<string, number>;
    side1Sets?: number;
    side2Sets?: number;
    team1Matches?: number;
    team2Matches?: number;
    matchesByTeamId?: Record<string, number>;
  };
  games?: unknown[];
  winnerSide?: "side1" | "side2";
  team1?: { _id?: string; id?: string };
  team2?: { _id?: string; id?: string };
  date?: string;
  time?: string;
  bracketPosition?: {
    round: number;
    matchNumber: number;
  };
}

interface PersistedDoublesPair {
  _id: string;
  player1: TournamentParticipant;
  player2: TournamentParticipant;
}

interface KnockoutBracketViewProps {
  bracket: KnockoutBracket;
  participants: TournamentParticipant[];
  matches: MatchDetails[];
  onMatchClick?: (matchId: string) => void;
  showThirdPlace?: boolean;
  category?: "individual" | "team";
  matchType?: "singles" | "doubles";
  doublesPairs?: PersistedDoublesPair[];
}

interface DoublesPair {
  id: string;
  players: TournamentParticipant[];
}

interface EnhancedMatchData {
  bracketMatch: BracketMatch;
  participant1: Participant | null;
  participant2: Participant | null;
  matchDoc: MatchDetails | null;
  displayState: "bye" | "tbd" | "ready" | "scheduled" | "live" | "completed";
  canClick: boolean;
  showScore: boolean;
  displayScore: string | null;
}

// Responsive design utilities
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const tokens = DesignTokens;

const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 768;
const isLargeScreen = screenWidth >= 768;

// Responsive spacing and sizing
const responsiveSpacing = {
  container: {
    horizontal: isSmallScreen ? tokens.spacing[4] : tokens.spacing[6],
    vertical: isSmallScreen ? tokens.spacing[4] : tokens.spacing[6],
  },
  matchCard: {
    padding: isSmallScreen ? tokens.spacing[4] : tokens.spacing[5],
    gap: isSmallScreen ? tokens.spacing[3] : tokens.spacing[4],
  },
  avatar: {
    size: isSmallScreen ? 28 : 32,
  },
};

// Animation hooks - moved to top level to avoid hooks violation
const useFadeIn = (duration = tokens.animation.duration.normal) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  };
  return { fadeAnim, fadeIn };
};

const useScaleIn = () => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const scaleIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };
  return { scaleAnim, scaleIn };
};

// Create a hook to manage multiple slide animations
const useSlideAnimations = (count: number, baseDelay: number = 50) => {
  const animations = useRef(
    Array.from({ length: count }, () => new Animated.Value(20))
  ).current;
  
  const startAnimations = () => {
    animations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: tokens.animation.duration.normal,
        delay: baseDelay * index,
        useNativeDriver: true,
      }).start();
    });
  };
  
  return { animations, startAnimations };
};

const getLocalParticipantName = (p: Participant | null): string => {
  if (!p) return "TBD";
  return getParticipantDisplayName(p);
};

const getLocalParticipantImage = (
  p: Participant | null
): string | undefined => {
  if (!p) return undefined;
  return getParticipantImage(p);
};

const getLocalParticipantInitials = (p: Participant | null): string => {
  if (!p) return "?";
  const name = getLocalParticipantName(p);
  return name.substring(0, 2).toUpperCase();
};

const resolveEntityId = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number") {
    const id = String(value);
    return id && id !== "[object Object]" ? id : undefined;
  }
  if (typeof value === "object") {
    const obj = value as { _id?: unknown; id?: unknown; $oid?: unknown };
    if (obj.$oid != null) return String(obj.$oid);
    const fromId = resolveEntityId(obj._id);
    if (fromId) return fromId;
    const fromAlt = resolveEntityId(obj.id);
    if (fromAlt) return fromAlt;
  }
  return undefined;
};

const readMappedScore = (
  value?: Record<string, number>,
  key?: string,
): number | undefined => {
  if (!value || !key) return undefined;
  const raw = value[key];
  if (raw == null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

const getTeamRubberScore = (match: MatchDetails): string | null => {
  const team1Id = resolveEntityId(match.team1);
  const team2Id = resolveEntityId(match.team2);
  const byId = match.finalScore?.matchesByTeamId;
  const team1Score =
    readMappedScore(byId, team1Id) ??
    (match.finalScore?.team1Matches != null
      ? Number(match.finalScore.team1Matches)
      : undefined);
  const team2Score =
    readMappedScore(byId, team2Id) ??
    (match.finalScore?.team2Matches != null
      ? Number(match.finalScore.team2Matches)
      : undefined);
  if (team1Score == null || team2Score == null) return null;
  return `${team1Score}-${team2Score}`;
};

const getIndividualSetScore = (
  match: MatchDetails,
  bracketParticipant1Id: string | null,
  bracketParticipant2Id: string | null,
): string | null => {
  const fs = match.finalScore;
  if (fs?.setsById && (bracketParticipant1Id || bracketParticipant2Id)) {
    const byId = fs.setsById;
    const hasBracketKeys =
      (bracketParticipant1Id &&
        Object.prototype.hasOwnProperty.call(byId, bracketParticipant1Id)) ||
      (bracketParticipant2Id &&
        Object.prototype.hasOwnProperty.call(byId, bracketParticipant2Id));
    if (hasBracketKeys) {
      return `${Number(byId[bracketParticipant1Id ?? ""] ?? 0)}-${Number(
        byId[bracketParticipant2Id ?? ""] ?? 0,
      )}`;
    }
  }

  const [side1Score, side2Score] = getSetScores(match as any);
  if (match.status === "completed" || (side1Score > 0 || side2Score > 0)) {
    return `${side1Score}-${side2Score}`;
  }
  return null;
};

const getMatchDisplayScore = (
  match: MatchDetails | null,
  category: "individual" | "team",
  bracketParticipant1Id: string | null,
  bracketParticipant2Id: string | null,
): string | null => {
  if (!match) return null;
  if (category === "team" || match.team1 || match.team2) {
    return getTeamRubberScore(match);
  }
  return getIndividualSetScore(
    match,
    bracketParticipant1Id,
    bracketParticipant2Id,
  );
};

export default function KnockoutBracketView({
  bracket,
  participants,
  matches,
  onMatchClick,
  showThirdPlace = false,
  category = "individual",
  matchType = "singles",
  doublesPairs = [],
}: KnockoutBracketViewProps) {
  const router = useRouter();
  const isDoubles = matchType === "doubles";
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  
  // Animation hooks - all hooks called at top level
  const { fadeAnim, fadeIn } = useFadeIn();
  const { scaleAnim, scaleIn } = useScaleIn();
  
  // Calculate total possible animations needed
  const totalMatches = useMemo(() => {
    if (!bracket?.rounds) return 0;
    return bracket.rounds.reduce((total, round) => total + round.matches.length, 0) + 
           (showThirdPlace && bracket.thirdPlaceMatch ? 1 : 0);
  }, [bracket, showThirdPlace]);
  
  const totalRounds = useMemo(() => {
    return bracket?.rounds?.length || 0;
  }, [bracket]);
  
  // Create slide animations for matches and rounds
  const { animations: matchAnimations, startAnimations: startMatchAnimations } = useSlideAnimations(totalMatches, 50);
  const { animations: roundAnimations, startAnimations: startRoundAnimations } = useSlideAnimations(totalRounds, 100);
  
  // Trigger animations on mount
  React.useEffect(() => {
    fadeIn();
    scaleIn();
    startMatchAnimations();
    startRoundAnimations();
  }, [fadeIn, scaleIn, startMatchAnimations, startRoundAnimations]);
  
  // Helper to get animation for specific match
  const getMatchAnimation = (roundIndex: number, matchIndex: number) => {
    const matchGlobalIndex = bracket?.rounds?.slice(0, roundIndex)
      .reduce((total, round) => total + round.matches.length, 0) + matchIndex || 0;
    return matchAnimations[matchGlobalIndex] || new Animated.Value(0);
  };
  
  // Helper to get animation for specific round
  const getRoundAnimation = (roundIndex: number) => {
    return roundAnimations[roundIndex] || new Animated.Value(0);
  };

  const pairsMap = useMemo(() => {
    const map = new Map<string, DoublesPair>();
    if (!isDoubles) return map;

    if (doublesPairs && doublesPairs.length > 0) {
      for (const pair of doublesPairs) {
        map.set(pair._id, {
          id: pair._id,
          players: [pair.player1, pair.player2],
        });
      }
      return map;
    }

    const userParticipants = participants.filter(isUserParticipant);
    for (let i = 0; i < userParticipants.length; i += 2) {
      const player1 = userParticipants[i];
      const player2 = userParticipants[i + 1];
      if (player1 && player2) {
        map.set(player1._id, {
          id: player1._id,
          players: [player1, player2],
        });
      }
    }
    return map;
  }, [participants, isDoubles, doublesPairs]);

  const participantMap = useMemo(() => {
    const map = new Map<string, Participant>();
    participants.forEach((p) => {
      if (isUserParticipant(p)) {
        map.set(p._id, {
          _id: p._id,
          username: p.username,
          fullName: p.fullName,
          profileImage: p.profileImage,
        });
      } else if (isTeamParticipant(p)) {
        map.set(p._id, {
          _id: p._id,
          name: p.name,
          logo: p.logo,
          fullName: p.name,
          profileImage: p.logo,
        });
      }
    });
    return map;
  }, [participants]);

  const matchByPosition = useMemo(() => {
    const map = new Map<string, MatchDetails>();
    matches.forEach((match) => {
      if (match.bracketPosition) {
        const key = `${match.bracketPosition.round}-${match.bracketPosition.matchNumber}`;
        map.set(key, match);
      }
    });
    return map;
  }, [matches]);

  const matchById = useMemo(() => {
    const map = new Map<string, MatchDetails>();
    matches.forEach((match) => {
      const id = resolveEntityId(match._id);
      if (id) map.set(id, match);
    });
    return map;
  }, [matches]);

  const resolveMatchDoc = (bracketMatch: BracketMatch): MatchDetails | null => {
    const positionKey = `${bracketMatch.bracketPosition.round}-${bracketMatch.bracketPosition.matchNumber}`;
    const byPosition = matchByPosition.get(positionKey);
    if (byPosition) return byPosition;

    const rawMatchId = bracketMatch.matchId;
    const matchId =
      typeof rawMatchId === "string"
        ? rawMatchId
        : resolveEntityId(
            rawMatchId && typeof rawMatchId === "object"
              ? (rawMatchId as { _id?: unknown })._id
              : undefined,
          );
    if (matchId) return matchById.get(matchId) || null;
    return null;
  };

  const enhanceMatchData = (bracketMatch: BracketMatch): EnhancedMatchData => {
    const matchDoc = resolveMatchDoc(bracketMatch);

    let participant1: Participant | null = null;
    let participant2: Participant | null = null;

    if (!isDoubles) {
      participant1 = bracketMatch.participant1 && typeof bracketMatch.participant1 === "string"
        ? participantMap.get(bracketMatch.participant1) || null
        : null;
      participant2 = bracketMatch.participant2 && typeof bracketMatch.participant2 === "string"
        ? participantMap.get(bracketMatch.participant2) || null
        : null;
    }

    let displayState: EnhancedMatchData["displayState"] = "tbd";

    const isByeMatch =
      (bracketMatch.participant1 !== null && bracketMatch.participant2 === null) ||
      (bracketMatch.participant1 === null && bracketMatch.participant2 !== null);

    if (isByeMatch && bracketMatch.completed) {
      displayState = "bye";
    } else if (bracketMatch.completed) {
      displayState = "completed";
    } else if (matchDoc) {
      if (matchDoc.status === "completed") displayState = "completed";
      else if (matchDoc.status === "in_progress") displayState = "live";
      else displayState = "scheduled";
    } else if (bracketMatch.participant1 && bracketMatch.participant2) {
      if (isDoubles) {
        const pair1 = pairsMap.get(bracketMatch.participant1 as string);
        const pair2 = pairsMap.get(bracketMatch.participant2 as string);
        if (pair1 && pair2) {
          displayState = "ready";
        } else {
          displayState = "tbd";
        }
      } else if (participant1 && participant2) {
        displayState = "ready";
      } else {
        displayState = "tbd";
      }
    } else {
      displayState = "tbd";
    }

    const canClick = 
      displayState !== "bye" && 
      displayState !== "tbd" &&
      (matchDoc !== null || displayState === "ready");
    const displayScore = getMatchDisplayScore(
      matchDoc,
      category,
      (bracketMatch.participant1 as string) || null,
      (bracketMatch.participant2 as string) || null,
    );
    const showScore =
      displayState === "completed" && displayScore != null;

    return {
      bracketMatch,
      participant1,
      participant2,
      matchDoc,
      displayState,
      canClick,
      showScore,
      displayScore,
    };
  };

  const getStatusBadge = (displayState: EnhancedMatchData["displayState"]) => {
    const statusStyles = {
      bye: { color: tokens.colors.status.bye, text: 'BYE' },
      completed: { color: tokens.colors.status.completed, text: 'Completed' },
      live: { color: tokens.colors.status.live, text: 'Live' },
      scheduled: { color: tokens.colors.status.scheduled, text: 'Scheduled' },
      ready: { color: tokens.colors.status.ready, text: 'Ready' },
      tbd: { color: tokens.colors.status.tbd, text: 'TBD' },
    };
    
    const style = statusStyles[displayState] || statusStyles.tbd;
    
    return (
      <Text style={[
        modernStyles.statusText,
        { color: style.color }
      ]}>
        {style.text}
      </Text>
    );
  };

  const isWinner = (enhanced: EnhancedMatchData, participantIndex: number): boolean => {
    const { bracketMatch, matchDoc } = enhanced;
    if (bracketMatch.completed && bracketMatch.winner) {
      const participant = participantIndex === 0 ? bracketMatch.participant1 : bracketMatch.participant2;
      return bracketMatch.winner === participant;
    }
    if (matchDoc?.status === "completed" && matchDoc.winnerSide) {
      return (
        (matchDoc.winnerSide === "side1" && participantIndex === 0) ||
        (matchDoc.winnerSide === "side2" && participantIndex === 1)
      );
    }
    return false;
  };

  const getPairForParticipant = (
    participantId: string | null
  ): DoublesPair | null => {
    if (!participantId || !isDoubles) return null;
    return pairsMap.get(participantId) || null;
  };

  const getDisplayName = (
    participant: Participant | null,
    participantId: string | null
  ): string => {
    if (isDoubles) {
      const pair = getPairForParticipant(participantId);
      if (pair && pair.players.length >= 2) {
        const p1Name = getParticipantDisplayName(pair.players[0]);
        const p2Name = getParticipantDisplayName(pair.players[1]);
        return `${p1Name} & ${p2Name}`;
      }
    }
    return getLocalParticipantName(participant);
  };

  const getParticipantDisplay = (
    participant: Participant | null,
    participantId: string | null,
    isWinnerSide: boolean,
    matchParticipants: any[] | undefined,
    sideIndex: number
  ) => {
    if (isDoubles && matchParticipants && matchParticipants.length === 4) {
      const startIdx = sideIndex === 0 ? 0 : 2;
      const players = [
        matchParticipants[startIdx],
        matchParticipants[startIdx + 1],
      ].filter(Boolean);

      if (players.length === 2) {
        return {
          type: "doubles" as const,
          players: players.map((p: any) => ({
            _id: p._id,
            name: getParticipantDisplayName(p),
            image: getParticipantImage(p),
            initials: getParticipantDisplayName(p).substring(0, 2).toUpperCase(),
          })),
        };
      }
    }

    const pair = getPairForParticipant(participantId);
    if (isDoubles && pair && pair.players.length >= 2) {
      return {
        type: "doubles" as const,
        players: pair.players.map((p) => ({
          _id: p._id,
          name: getParticipantDisplayName(p),
          image: getParticipantImage(p),
          initials: getParticipantDisplayName(p).substring(0, 2).toUpperCase(),
        })),
      };
    }

    if (!participant) {
      return {
        type: "singles" as const,
        name: "TBD",
        image: undefined,
        initials: "?",
        isWinner: false,
      };
    }

    return {
      type: "singles" as const,
      name: getLocalParticipantName(participant),
      image: getLocalParticipantImage(participant),
      initials: getLocalParticipantInitials(participant),
      isWinner: isWinnerSide,
    };
  };

  // Modern match card component with animations
  const ModernMatchCard = ({ children, onPress, disabled, isLive }: {
    children: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    isLive?: boolean;
  }) => {
    const [scaleAnim] = useState(new Animated.Value(1));
    
    const handlePressIn = () => {
      if (disabled) return;
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };
    
    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };
    
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={disabled ? 1 : 0.8}
        >
          <Card 
            variant={isLive ? "elevated" : "default"}
            style={[
              modernStyles.matchCard,
              isLive && modernStyles.liveMatchCard
            ]}
          >
            {children}
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Modern VS badge component
  const VSBadge = () => (
    <View style={modernStyles.vsBadge}>
      <Text style={modernStyles.vsText}>VS</Text>
    </View>
  );
  
  // Modern score display
  const ScoreDisplay = ({ score, isWinner }: { score: string; isWinner?: boolean }) => (
    <View style={[
      modernStyles.scoreDisplay,
      isWinner && modernStyles.winnerScoreDisplay
    ]}>
      <Text style={[
        modernStyles.scoreText,
        isWinner && modernStyles.winnerScoreText
      ]}>
        {score}
      </Text>
    </View>
  );

  const renderMatchRow = (bracketMatch: BracketMatch, roundIndex: number, matchIndex: number) => {
    const enhanced = enhanceMatchData(bracketMatch);
    const {
      participant1,
      participant2,
      matchDoc,
      displayState,
      canClick,
      showScore,
      displayScore,
    } = enhanced;
    
    // Get pre-created animation instead of creating new hook
    const slideAnim = getMatchAnimation(roundIndex, matchIndex);

    let matchId: string | null = null;
    if (matchDoc?._id) {
      matchId = String(matchDoc._id);
    } else if (typeof bracketMatch.matchId === 'string') {
      matchId = bracketMatch.matchId;
    } else if (typeof bracketMatch.matchId === 'object' && bracketMatch.matchId && '_id' in bracketMatch.matchId) {
      matchId = String((bracketMatch.matchId as { _id: any })._id);
    }

    const p1Display = getParticipantDisplay(
      participant1,
      bracketMatch.participant1 as string,
      isWinner(enhanced, 0),
      (matchDoc as any)?.participants,
      0
    );

    const p2Display = getParticipantDisplay(
      participant2,
      bracketMatch.participant2 as string,
      isWinner(enhanced, 1),
      (matchDoc as any)?.participants,
      1
    );

    const score = showScore ? displayScore : null;

    // Handle bye matches
    if (displayState === "bye") {
      const advancingParticipant = participant1 || participant2 || bracketMatch.participant1 || bracketMatch.participant2;
      const advancingName = advancingParticipant
        ? getDisplayName(
            participant1 || participant2,
            bracketMatch.participant1 as string || bracketMatch.participant2 as string
          )
        : "BYE";

      return (
        <Animated.View style={{
          transform: [{ translateY: slideAnim }],
          marginBottom: tokens.spacing[3]
        }}>
          <ModernMatchCard
            onPress={() => canClick && matchId && (onMatchClick ? onMatchClick(matchId) : router.push(`/match/${matchId}` as any))}
            disabled={!canClick}
          >
            <View style={modernStyles.byeMatchContent}>
              <View style={modernStyles.byeMatchInfo}>
                <Ionicons name="arrow-forward" size={16} color={tokens.colors.info} />
                <Text style={modernStyles.byeMatchText}>
                  {advancingName} advances
                </Text>
              </View>
              <Badge variant="warning" size="sm">BYE</Badge>
            </View>
          </ModernMatchCard>
        </Animated.View>
      );
    }

    return (
      <Animated.View style={{
        transform: [{ translateY: slideAnim }],
        marginBottom: tokens.spacing[3]
      }}>
        <ModernMatchCard
          onPress={() => canClick && matchId && (onMatchClick ? onMatchClick(matchId) : router.push(`/match/${matchId}` as any))}
          disabled={!canClick}
          isLive={displayState === "live"}
        >
          <View style={modernStyles.matchContent}>
            {/* Participants Section */}
            <View style={modernStyles.participantsSection}>
              {/* Participant 1 */}
              <View style={modernStyles.participantContainer}>
                {p1Display.type === "doubles" ? (
                  <View style={modernStyles.doublesContainer}>
                    {p1Display.players.map((player, idx) => (
                      <View key={player._id} style={modernStyles.doublesPlayer}>
                        <Avatar
                          src={player.image}
                          alt={player.name}
                          fallback={player.initials}
                          size={responsiveSpacing.avatar.size}
                        />
                        <Text style={[
                          modernStyles.playerName,
                          isWinner(enhanced, 0) && modernStyles.winnerName
                        ]}>
                          {player.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={modernStyles.singlesPlayer}>
                    <Avatar
                      src={p1Display.image}
                      alt={p1Display.name}
                      fallback={p1Display.initials}
                      size={responsiveSpacing.avatar.size}
                    />
                    <Text style={[
                      modernStyles.playerName,
                      isWinner(enhanced, 0) && modernStyles.winnerName
                    ]}>
                      {p1Display.name}
                    </Text>
                  </View>
                )}
              </View>

              {/* VS or Score */}
              <View style={modernStyles.centerSection}>
                {score ? (
                  <ScoreDisplay 
                    score={score} 
                    isWinner={isWinner(enhanced, 0) || isWinner(enhanced, 1)}
                  />
                ) : (
                  <VSBadge />
                )}
              </View>

              {/* Participant 2 */}
              <View style={modernStyles.participantContainer}>
                {p2Display.type === "doubles" ? (
                  <View style={modernStyles.doublesContainer}>
                    {p2Display.players.map((player, idx) => (
                      <View key={player._id} style={modernStyles.doublesPlayer}>
                        <Avatar
                          src={player.image}
                          alt={player.name}
                          fallback={player.initials}
                          size={responsiveSpacing.avatar.size}
                        />
                        <Text style={[
                          modernStyles.playerName,
                          isWinner(enhanced, 1) && modernStyles.winnerName
                        ]}>
                          {player.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={modernStyles.singlesPlayer}>
                    <Text style={[
                      modernStyles.playerName,
                      isWinner(enhanced, 1) && modernStyles.winnerName
                    ]}>
                      {p2Display.name}
                    </Text>
                    <Avatar
                      src={p2Display.image}
                      alt={p2Display.name}
                      fallback={p2Display.initials}
                      size={responsiveSpacing.avatar.size}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Status and Date Section */}
            <View style={modernStyles.statusSection}>
              <View style={modernStyles.statusBadges}>
                {getStatusBadge(displayState)}
              </View>
              
              {matchDoc?.date && (
                <View style={modernStyles.dateContainer}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={12} 
                    color={tokens.colors.text.tertiary} 
                  />
                  <Text style={modernStyles.dateText}>
                    {new Date(matchDoc.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ModernMatchCard>
      </Animated.View>
    );
  };

  if (!bracket || bracket.rounds.length === 0) {
    return (
      <Animated.View style={[modernStyles.emptyContainer, { opacity: fadeAnim }]}>
        <View style={modernStyles.emptyContent}>
          <View style={modernStyles.emptyIcon}>
            <Ionicons name="trophy-outline" size={48} color={tokens.colors.gray[400]} />
          </View>
          <Text style={modernStyles.emptyTitle}>No Bracket Generated</Text>
          <Text style={modernStyles.emptySubtitle}>
            Generate a knockout bracket to view the tournament structure
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[modernStyles.container, { opacity: fadeAnim }]}>
      <ScrollView 
        style={modernStyles.scrollView}
        contentContainerStyle={modernStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={modernStyles.bracketContainer}>
          {bracket.rounds.map((round, roundIndex) => {
            // Check if any match in this round is live
            const hasLiveMatch = round.matches.some((bracketMatch) => {
              const enhanced = enhanceMatchData(bracketMatch);
              return enhanced.displayState === "live";
            });
            
            const isExpanded = expandedRound === roundIndex;
            // Get pre-created animation instead of creating new hook
            const slideAnim = getRoundAnimation(roundIndex);

            return (
              <Animated.View 
                key={round.roundNumber} 
                style={{
                  transform: [{ translateY: slideAnim }]
                }}
              >
                {/* Modern Round Header */}
                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.create(
                        tokens.animation.duration.normal,
                        LayoutAnimation.Types.easeInEaseOut,
                        LayoutAnimation.Properties.opacity,
                      ),
                    );
                    setExpandedRound(isExpanded ? null : roundIndex);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={modernStyles.roundHeader}
                >
                  <View style={modernStyles.roundHeaderLeft}>
                    <View style={modernStyles.roundTitleContainer}>
                      <Text style={modernStyles.roundTitle}>
                        {round.roundName || `Round ${round.roundNumber}`}
                      </Text>
                      <Text style={modernStyles.roundSubtitle}>
                        {round.matches.length} {round.matches.length === 1 ? 'match' : 'matches'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={modernStyles.roundHeaderRight}>
                    {hasLiveMatch && (
                      <Text style={[
                        modernStyles.statusText,
                        { color: tokens.colors.status.live }
                      ]}>
                        LIVE
                      </Text>
                    )}
                    
                    {round.scheduledDate && (
                      <View style={modernStyles.roundDate}>
                        <Ionicons 
                          name="calendar-outline" 
                          size={12} 
                          color={tokens.colors.text.tertiary} 
                        />
                        <Text style={modernStyles.roundDateText}>
                          {new Date(round.scheduledDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </Text>
                      </View>
                    )}
                    
                    <Animated.View
                      style={{
                        transform: [{
                          rotate: isExpanded ? '180deg' : '0deg'
                        }]
                      }}
                    >
                      <Ionicons 
                        name="chevron-down" 
                        size={16} 
                        color={tokens.colors.text.secondary} 
                      />
                    </Animated.View>
                  </View>
                </TouchableOpacity>

                {/* Matches - with expand/collapse animation */}
                {isExpanded && (
                  <Animated.View style={modernStyles.matchesContainer}>
                    {round.matches.length === 0 ? (
                      <View style={modernStyles.noMatchesContainer}>
                        <Ionicons name="calendar-outline" size={24} color={tokens.colors.gray[400]} />
                        <Text style={modernStyles.noMatchesText}>
                          No matches scheduled
                        </Text>
                      </View>
                    ) : (
                      <View style={modernStyles.roundMatches}>
                        {round.matches.map((bracketMatch, matchIndex) => (
                          <View key={matchIndex}>
                            {renderMatchRow(bracketMatch, roundIndex, matchIndex)}
                          </View>
                        ))}
                      </View>
                    )}
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}

          {/* Third Place Match */}
          {showThirdPlace && bracket.thirdPlaceMatch && (
            <Animated.View style={modernStyles.thirdPlaceContainer}>
              <View style={modernStyles.thirdPlaceHeader}>
                <View style={modernStyles.roundHeaderLeft}>
                  <View style={modernStyles.roundTitleContainer}>
                    <Text style={modernStyles.roundTitle}>Third Place Match</Text>
                    <Text style={modernStyles.roundSubtitle}>Bronze medal match</Text>
                  </View>
                </View>
              </View>
              <View style={modernStyles.thirdPlaceMatch}>
                {renderMatchRow(bracket.thirdPlaceMatch, 999, 0)}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// Modern styles using design tokens
const modernStyles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background.primary,
  },
  scrollView: {
    backgroundColor: tokens.colors.background.primary,
  },
  
  // Bracket container
  bracketContainer: {
    backgroundColor: tokens.colors.background.primary,
    gap: tokens.spacing[1],
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: tokens.spacing[16],
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 200,
  },
  emptyIcon: {
    marginBottom: tokens.spacing[4],
  },
  emptyTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginBottom: tokens.spacing[2],
  },
  emptySubtitle: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.tertiary,
    textAlign: 'center',
  },
  
  // Round header
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[5],
    backgroundColor: tokens.colors.background.primary,
    ...tokens.shadows.sm,
  },
  roundHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: tokens.spacing[3],
  },
  roundHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  roundIcon: {
    width: 40,
    height: 40,
    borderRadius: tokens.borderRadius.base,
    backgroundColor: tokens.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveRoundIcon: {
    backgroundColor: tokens.colors.error + '20',
  },
  roundTitleContainer: {
    flex: 1,
  },
  roundTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  roundSubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    marginTop: 2,
  },
  roundDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  roundDateText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  
  // Matches container
  matchesContainer: {
    marginTop: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[4],
  },
  roundMatches: {
    gap: tokens.spacing[1],
  },
  noMatchesContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing[8],
  },
  noMatchesText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.tertiary,
    marginTop: tokens.spacing[2],
  },
  
  // Match card - following schedule pattern
  matchCard: {
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.borderRadius.sm,
    padding: responsiveSpacing.matchCard.padding,
  },
  liveMatchCard: {
    borderWidth: 1,
    borderColor: tokens.colors.status.live + '40', // Light border for live matches
  },
  matchContent: {
    gap: tokens.spacing[4],
  },
  
  // Participants section - following schedule pattern
  participantsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  participantContainer: {
    flex: 1,
  },
  singlesPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  doublesContainer: {
    gap: tokens.spacing[2],
  },
  doublesPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  playerName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.primary,
    flex: 1,
  },
  winnerName: {
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.success,
  },
  
  // Center section (VS/Score) - following schedule pattern
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[2],
  },
  vsText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.normal,
    color: tokens.colors.text.secondary,
  },
  scoreText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    minWidth: 26,
    textAlign: 'center',
  },
  
  // Status section - following schedule pattern
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacing[3],
  },
  statusBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  statusText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  dateText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  
  // Bye match - following schedule pattern
  byeMatchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[2],
  },
  byeMatchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    flex: 1,
  },
  byeMatchText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  
  // Third place match
  thirdPlaceContainer: {
    backgroundColor: tokens.colors.background.primary,
    padding: tokens.spacing[4],
  },
  thirdPlaceHeader: {
    marginBottom: tokens.spacing[4],
  },
  thirdPlaceMatch: {
    marginTop: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[4],
  },
  
  // Legend
  legend: {
    marginTop: tokens.spacing[8],
    padding: tokens.spacing[5],
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
  },
  legendTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[4],
    textAlign: 'center',
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: tokens.spacing[4],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: tokens.borderRadius.full,
  },
  legendText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
});
