import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Colors, Spacing, Typography, Gradients } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { DesignTokens } from "@/constants/designTokens";
import { TournamentTabView, TabRoute } from "@/components/ui/TournamentTabView";

const tokens = DesignTokens;

type AnyUser = {
  _id?: string;
  username?: string;
  fullName?: string;
  name?: string;
  profileImage?: string;
};
type DoublesPair = { _id?: string; player1?: AnyUser | string; player2?: AnyUser | string };

interface Tournament {
  _id: string;
  name: string;
  format: string;
  category?: "individual" | "team";
  matchType?: "singles" | "doubles";
  currentPhase?: "round_robin" | "knockout" | "transition";
  participants?: AnyUser[] | string[];
  qualifiedParticipants?: AnyUser[] | string[];
  doublesPairs?: DoublesPair[];
  knockoutConfig?: { allowCustomMatching?: boolean };
  bracket?: {
    rounds: Array<{
      roundNumber: number;
      roundName: string;
      completed?: boolean;
      matches?: Array<{
        matchId?: any;
        participant1?: string | null;
        participant2?: string | null;
        participant1Info?: { name?: string };
        participant2Info?: { name?: string };
        completed?: boolean;
        winner?: string | null;
        bracketPosition?: { matchNumber: number; nextMatchNumber?: number };
      }>;
    }>;
  };
}

type DraftSlot = { p1: string | null; p2: string | null };
type DraftMap = Record<number, DraftSlot>;
type EntryOption = { id: string; label: string; profileImage?: string };

function resolveId(ref: any): string | null {
  if (ref == null) return null;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && ref._id) return String(ref._id);
  if (typeof ref === "object" && ref.toString) return ref.toString();
  return String(ref);
}

function formatUser(u: AnyUser | string | null | undefined): string {
  if (u == null) return "";
  if (typeof u === "string") return u;
  return u.fullName || u.username || u.name || "Player";
}

function formatPair(pair: DoublesPair): string {
  const p1 = typeof pair.player1 === "object" ? formatUser(pair.player1) : "";
  const p2 = typeof pair.player2 === "object" ? formatUser(pair.player2) : "";
  if (p1 && p2) return `${p1} & ${p2}`;
  return "Pair";
}

function sideLabelFromMatchDoc(
  matchDoc: any,
  side: 1 | 2,
  category: string | undefined,
  matchType: string | undefined
): string | null {
  if (!matchDoc || typeof matchDoc !== "object") return null;
  if (category === "team") {
    const team = side === 1 ? matchDoc.team1 : matchDoc.team2;
    return team?.name || null;
  }
  const parts = matchDoc.participants;
  if (!Array.isArray(parts) || parts.length === 0) return null;
  if (matchType === "doubles") {
    if (side === 1 && parts.length >= 2) {
      return `${formatUser(parts[0])} & ${formatUser(parts[1])}`;
    }
    if (side === 2 && parts.length >= 4) {
      return `${formatUser(parts[2])} & ${formatUser(parts[3])}`;
    }
  }
  const u = side === 1 ? parts[0] : parts[1];
  return formatUser(u) || null;
}

function getParticipantPools(tournament: Tournament): any[] {
  const pools: any[] = [];
  if (
    tournament.format === "hybrid" &&
    tournament.currentPhase === "knockout" &&
    tournament.qualifiedParticipants?.length
  ) {
    pools.push(...tournament.qualifiedParticipants);
  }
  if (tournament.participants?.length) pools.push(...tournament.participants);
  return pools;
}

function buildParticipantLookup(tournament: Tournament): Map<string, EntryOption> {
  const map = new Map<string, EntryOption>();
  for (const p of getParticipantPools(tournament)) {
    const id = resolveId(p);
    if (!id) continue;
    if (typeof p === "object" && p) {
      map.set(id, {
        id,
        label: p.fullName || p.username || p.name || "Player",
        profileImage: p.profileImage,
      });
    }
  }
  if (tournament.matchType === "doubles" && tournament.doublesPairs?.length) {
    for (const pair of tournament.doublesPairs) {
      const id = resolveId(pair._id);
      if (!id) continue;
      const p1 = typeof pair.player1 === "object" ? pair.player1 : null;
      const p2 = typeof pair.player2 === "object" ? pair.player2 : null;
      map.set(id, {
        id,
        label: formatPair(pair),
        profileImage: p1?.profileImage || p2?.profileImage,
      });
    }
  }
  return map;
}

function lookupParticipantName(tournament: Tournament, participantId: string | null): string | null {
  if (!participantId) return null;
  return buildParticipantLookup(tournament).get(participantId)?.label ?? null;
}

function lookupParticipantImage(
  tournament: Tournament,
  participantId: string | null
): string | undefined {
  if (!participantId) return undefined;
  return buildParticipantLookup(tournament).get(participantId)?.profileImage;
}

function getEliminatedParticipants(
  bracket: Tournament["bracket"],
  upToRound: number
): Set<string> {
  const eliminated = new Set<string>();
  if (!bracket?.rounds) return eliminated;

  for (const round of bracket.rounds) {
    if (round.roundNumber >= upToRound) break;
    for (const match of round.matches || []) {
      if (match.completed && match.winner) {
        const loser =
          String(match.participant1) === String(match.winner)
            ? match.participant2
            : match.participant1;
        if (loser) eliminated.add(String(loser));
      }
    }
  }
  return eliminated;
}

function getTournamentEntryIds(tournament: Tournament): string[] {
  if (tournament.matchType === "doubles" && tournament.doublesPairs?.length) {
    return tournament.doublesPairs
      .map((p) => resolveId(p._id))
      .filter((id): id is string => Boolean(id));
  }
  const useQualified =
    tournament.format === "hybrid" &&
    tournament.currentPhase === "knockout" &&
    tournament.qualifiedParticipants &&
    tournament.qualifiedParticipants.length > 0;
  const pool = useQualified
    ? tournament.qualifiedParticipants!
    : tournament.participants || [];
  return pool.map((p) => resolveId(p)).filter((id): id is string => Boolean(id));
}

function getEligibleParticipantIds(tournament: Tournament, roundNumber: number): Set<string> {
  const entryIds = getTournamentEntryIds(tournament);
  if (roundNumber <= 1) return new Set(entryIds);

  const eliminated = getEliminatedParticipants(tournament.bracket, roundNumber);
  const eligible = new Set<string>();
  for (const id of entryIds) {
    if (!eliminated.has(id)) eligible.add(id);
  }
  return eligible;
}

function getFeedingPriorMatch(
  bracket: Tournament["bracket"],
  roundNumber: number,
  matchNumber: number,
  side: "p1" | "p2"
): {
  match: NonNullable<NonNullable<Tournament["bracket"]>["rounds"][number]["matches"]>[number];
  roundName: string;
} | null {
  if (!bracket?.rounds || roundNumber <= 1) return null;
  const priorRound = bracket.rounds.find((r) => r.roundNumber === roundNumber - 1);
  if (!priorRound?.matches) return null;

  for (const m of priorRound.matches) {
    if (m.bracketPosition?.nextMatchNumber !== matchNumber) continue;
    const mn = m.bracketPosition?.matchNumber ?? 0;
    const feedsP1 = mn % 2 === 1;
    if ((side === "p1" && feedsP1) || (side === "p2" && !feedsP1)) {
      return { match: m, roundName: priorRound.roundName };
    }
  }
  return null;
}

function isSlotAwaitingPriorWinner(
  bracket: Tournament["bracket"],
  roundNumber: number,
  matchNumber: number,
  side: "p1" | "p2"
): boolean {
  const feeder = getFeedingPriorMatch(bracket, roundNumber, matchNumber, side);
  if (!feeder) return false;
  return !feeder.match.completed;
}

function isPriorRoundComplete(
  bracket: Tournament["bracket"],
  roundNumber: number
): boolean {
  if (roundNumber <= 1) return true;
  const prior = bracket?.rounds?.find((r) => r.roundNumber === roundNumber - 1);
  if (!prior?.matches?.length) return true;
  return prior.matches.every((m) => m.completed);
}

function getSideDisplay(
  tournament: Tournament,
  match: any,
  side: 1 | 2,
  draft: DraftMap
): string {
  const mn = match.bracketPosition?.matchNumber ?? 0;
  const d = draft[mn];
  const draftId = side === 1 ? d?.p1 : d?.p2;
  if (draftId) {
    if (tournament.matchType === "doubles" && tournament.doublesPairs?.length) {
      const pair = tournament.doublesPairs.find((p) => resolveId(p._id) === draftId);
      if (pair) return formatPair(pair);
    }
    return lookupParticipantName(tournament, draftId) || draftId;
  }

  if (tournament.category === "team") {
    const info = side === 1 ? match.participant1Info : match.participant2Info;
    if (info?.name) return info.name;
  }

  const pid = side === 1 ? match.participant1 : match.participant2;
  if (pid) {
    if (tournament.matchType === "doubles" && tournament.doublesPairs?.length) {
      const pair = tournament.doublesPairs.find((p) => resolveId(p._id) === String(pid));
      if (pair) return formatPair(pair);
    }
    return lookupParticipantName(tournament, String(pid)) || String(pid);
  }

  const doc = match.matchId;
  if (doc && typeof doc === "object") {
    const fromDoc = sideLabelFromMatchDoc(doc, side, tournament.category, tournament.matchType);
    if (fromDoc) return fromDoc;
  }

  return "TBD";
}

function getSideParticipantId(
  match: any,
  side: 1 | 2,
  draft: DraftMap
): string | null {
  const mn = match.bracketPosition?.matchNumber ?? 0;
  const d = draft[mn];
  const draftId = side === 1 ? d?.p1 : d?.p2;
  if (draftId) return draftId;
  const pid = side === 1 ? match.participant1 : match.participant2;
  return pid != null ? String(pid) : null;
}

type SideDisplayMeta = {
  label: string;
  profileImage?: string;
  isBye?: boolean;
  isWaiting?: boolean;
};

function getSideMeta(
  tournament: Tournament,
  match: any,
  side: 1 | 2,
  draft: DraftMap,
  roundNumber: number,
  lookup: Map<string, EntryOption>
): SideDisplayMeta {
  const mn = match.bracketPosition?.matchNumber ?? 0;
  const sideKey = side === 1 ? "p1" : "p2";
  const participantId = getSideParticipantId(match, side, draft);

  if (
    tournament.bracket &&
    isSlotAwaitingPriorWinner(tournament.bracket, roundNumber, mn, sideKey)
  ) {
    const feeder = getFeedingPriorMatch(tournament.bracket, roundNumber, mn, sideKey);
    const feederMn = feeder?.match.bracketPosition?.matchNumber;
    return {
      label: feederMn ? `Winner of M${feederMn}` : "Awaiting winner",
      isWaiting: true,
    };
  }

  if (participantId) {
    const entry = lookup.get(participantId);
    return {
      label: entry?.label || participantId,
      profileImage: entry?.profileImage,
    };
  }

  const label = getSideDisplay(tournament, match, side, draft);
  if (label === "TBD") return { label };
  return { label };
}

type PickerSlot = { matchNumber: number; side: "p1" | "p2" } | null;

function buildDraftFromRound(
  round: NonNullable<Tournament["bracket"]>["rounds"][number] | undefined
): DraftMap {
  const next: DraftMap = {};
  if (!round?.matches) return next;
  for (const m of round.matches) {
    const mn = m.bracketPosition?.matchNumber ?? 0;
    if (!mn) continue;
    next[mn] = {
      p1: m.participant1 != null ? String(m.participant1) : null,
      p2: m.participant2 != null ? String(m.participant2) : null,
    };
  }
  return next;
}

export default function CustomMatchingPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<DraftMap>({});
  const [pickerSlot, setPickerSlot] = useState<PickerSlot>(null);

  const bracketRounds = tournament?.bracket?.rounds ?? [];
  const currentRound = bracketRounds[tabIndex];
  const selectedRound = currentRound?.roundNumber ?? 1;

  const fetchTournament = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/tournaments/${id}`);
      setTournament(data.tournament);
      if (data.tournament.bracket?.rounds?.length > 0) {
        setTabIndex(0);
      }
    } catch (err) {
      console.error("Error fetching tournament:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load tournament",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [id]);

  useEffect(() => {
    setDraft(buildDraftFromRound(currentRound));
  }, [tournament, tabIndex, currentRound?.roundNumber]);

  const participantLookup = useMemo(
    () => (tournament ? buildParticipantLookup(tournament) : new Map<string, EntryOption>()),
    [tournament]
  );

  const eligibleIds = useMemo(
    () => (tournament ? getEligibleParticipantIds(tournament, selectedRound) : new Set<string>()),
    [tournament, selectedRound]
  );

  const entryOptions = useMemo(() => {
    if (!tournament) return [] as EntryOption[];
    const options: EntryOption[] = [];
    if (tournament.matchType === "doubles" && tournament.doublesPairs?.length) {
      for (const pair of tournament.doublesPairs) {
        const id = resolveId(pair._id);
        if (!id || !eligibleIds.has(id)) continue;
        const p1 = typeof pair.player1 === "object" ? pair.player1 : null;
        const p2 = typeof pair.player2 === "object" ? pair.player2 : null;
        options.push({
          id,
          label: formatPair(pair),
          profileImage: p1?.profileImage || p2?.profileImage,
        });
      }
      return options;
    }
    for (const [id, entry] of participantLookup) {
      if (eligibleIds.has(id)) options.push(entry);
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [tournament, participantLookup, eligibleIds]);

  const priorRoundComplete = useMemo(
    () => (tournament?.bracket ? isPriorRoundComplete(tournament.bracket, selectedRound) : true),
    [tournament?.bracket, selectedRound]
  );

  const assignedIdsExcept = useCallback(
    (except: { matchNumber: number; side: "p1" | "p2" }) => {
      const ids = new Set<string>();
      Object.entries(draft).forEach(([mnStr, slot]) => {
        const mn = Number(mnStr);
        if (slot.p1 && !(mn === except.matchNumber && except.side === "p1")) ids.add(slot.p1);
        if (slot.p2 && !(mn === except.matchNumber && except.side === "p2")) ids.add(slot.p2);
      });
      return ids;
    },
    [draft]
  );

  const pickerChoices = useMemo(() => {
    if (!pickerSlot) return [];
    const taken = assignedIdsExcept(pickerSlot);
    const current =
      pickerSlot.side === "p1"
        ? draft[pickerSlot.matchNumber]?.p1
        : draft[pickerSlot.matchNumber]?.p2;
    return entryOptions.filter((o) => !taken.has(o.id) || o.id === current);
  }, [pickerSlot, entryOptions, assignedIdsExcept, draft]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!tournament) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tournament not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasBracketWithRounds = Boolean(
    tournament.bracket?.rounds &&
      Array.isArray(tournament.bracket.rounds) &&
      tournament.bracket.rounds.length > 0
  );

  const isKnockoutContext =
    tournament.format === "knockout" ||
    (tournament.format === "hybrid" &&
      (tournament.currentPhase === "knockout" || tournament.currentPhase === "transition"));

  if (!isKnockoutContext) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Custom matchups are only available during the knockout phase (including hybrid
            tournaments after you transition from the group stage).
          </Text>
          <Button
            onPress={() => router.push(`/tournaments/${id}`)}
            variant="outline"
            size="md"
            style={styles.backButton}
          >
            <Text>Back to Tournament</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasBracketWithRounds) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No knockout bracket was found for this tournament yet. Try refreshing from the
            tournament screen, or generate the bracket again if the problem continues.
          </Text>
          <Button
            onPress={() => router.push(`/tournaments/${id}`)}
            variant="outline"
            size="md"
            style={styles.backButton}
          >
            <Text>Back to Tournament</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isRoundLocked =
    currentRound?.completed ||
    currentRound?.matches?.some((m: any) => m.completed);

  const allowCustom = tournament.knockoutConfig?.allowCustomMatching === true;
  const canPickSides =
    allowCustom &&
    !isRoundLocked &&
    tournament.category !== "team" &&
    (selectedRound === 1 || priorRoundComplete);

  const openPicker = (matchNumber: number, side: "p1" | "p2") => {
    if (!canPickSides) return;
    if (
      tournament.bracket &&
      isSlotAwaitingPriorWinner(tournament.bracket, selectedRound, matchNumber, side)
    ) {
      const feeder = getFeedingPriorMatch(tournament.bracket, selectedRound, matchNumber, side);
      Toast.show({
        type: "info",
        text1: "Waiting on prior round",
        text2: feeder
          ? `This slot fills when ${feeder.roundName} match ${feeder.match.bracketPosition?.matchNumber ?? ""} finishes.`
          : "Complete the previous round first.",
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerSlot({ matchNumber, side });
  };

  const applyPickerSelection = (entryId: string | null) => {
    if (!pickerSlot) return;
    const { matchNumber, side } = pickerSlot;
    setDraft((prev) => ({
      ...prev,
      [matchNumber]: {
        p1: side === "p1" ? entryId : prev[matchNumber]?.p1 ?? null,
        p2: side === "p2" ? entryId : prev[matchNumber]?.p2 ?? null,
      },
    }));
    setPickerSlot(null);
  };

  const handleSave = async () => {
    if (!tournament || !currentRound) return;

    if (tournament.category === "team") {
      Toast.show({
        type: "info",
        text1: "Not supported yet",
        text2: "Team knockout custom matchups are not available in this mobile flow yet.",
      });
      return;
    }

    if (!allowCustom) {
      Toast.show({
        type: "error",
        text1: "Custom matching disabled",
        text2: "This tournament does not allow custom knockout pairings.",
      });
      return;
    }

    if (isRoundLocked) {
      Toast.show({
        type: "error",
        text1: "Round locked",
        text2: "This round cannot be changed.",
      });
      return;
    }

    if (selectedRound > 1 && !priorRoundComplete) {
      const prev = tournament.bracket?.rounds.find((r) => r.roundNumber === selectedRound - 1);
      Toast.show({
        type: "error",
        text1: "Previous round incomplete",
        text2: `Finish all ${prev?.roundName ?? "prior round"} matches before setting up ${currentRound.roundName}.`,
      });
      return;
    }

    const matchesPayload = (currentRound.matches || []).map((m: any) => {
      const mn = m.bracketPosition?.matchNumber;
      const slot = draft[mn] || { p1: m.participant1 ?? null, p2: m.participant2 ?? null };
      return {
        matchNumber: mn,
        participant1: slot.p1 ? String(slot.p1) : null,
        participant2: slot.p2 ? String(slot.p2) : null,
      };
    });

    for (const row of matchesPayload) {
      const mn = row.matchNumber;
      const awaitingP1 =
        tournament.bracket &&
        isSlotAwaitingPriorWinner(tournament.bracket, selectedRound, mn, "p1");
      const awaitingP2 =
        tournament.bracket &&
        isSlotAwaitingPriorWinner(tournament.bracket, selectedRound, mn, "p2");

      if (awaitingP1 && !row.participant1) continue;
      if (awaitingP2 && !row.participant2) continue;

      if (!row.participant1 || !row.participant2) {
        const feederP1 = tournament.bracket
          ? getFeedingPriorMatch(tournament.bracket, selectedRound, mn, "p1")
          : null;
        const feederP2 = tournament.bracket
          ? getFeedingPriorMatch(tournament.bracket, selectedRound, mn, "p2")
          : null;
        let detail = `Match ${mn} needs both players assigned.`;
        if (!row.participant1 && feederP1 && !feederP1.match.completed) {
          detail = `Match ${mn}: waiting for ${feederP1.roundName} match ${feederP1.match.bracketPosition?.matchNumber ?? ""} winner.`;
        } else if (!row.participant2 && feederP2 && !feederP2.match.completed) {
          detail = `Match ${mn}: waiting for ${feederP2.roundName} match ${feederP2.match.bracketPosition?.matchNumber ?? ""} winner.`;
        }
        Toast.show({
          type: "error",
          text1: "Incomplete bracket",
          text2: detail,
        });
        return;
      }
    }

    const completePayload = matchesPayload.filter((row) => row.participant1 && row.participant2);

    const assignableMatches = matchesPayload.filter((row) => {
      const mn = row.matchNumber;
      const awaitingP1 =
        tournament.bracket &&
        isSlotAwaitingPriorWinner(tournament.bracket, selectedRound, mn, "p1");
      const awaitingP2 =
        tournament.bracket &&
        isSlotAwaitingPriorWinner(tournament.bracket, selectedRound, mn, "p2");
      if (awaitingP1 && !row.participant1) return false;
      if (awaitingP2 && !row.participant2) return false;
      return true;
    });

    if (completePayload.length === 0) {
      Toast.show({
        type: "error",
        text1: "Nothing to save",
        text2: "Assign at least one full matchup before saving.",
      });
      return;
    }

    if (
      selectedRound > 1 &&
      priorRoundComplete &&
      completePayload.length < assignableMatches.length
    ) {
      Toast.show({
        type: "error",
        text1: "Incomplete bracket",
        text2: `Assign both players for each ${currentRound.roundName} match you can edit (${completePayload.length}/${assignableMatches.length} ready).`,
      });
      return;
    }

    if (selectedRound === 1 && completePayload.length !== matchesPayload.length) {
      Toast.show({
        type: "error",
        text1: "Incomplete bracket",
        text2: `Assign both players for every ${currentRound.roundName} match (${matchesPayload.length} matches required).`,
      });
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post(`/tournaments/${id}/custom-bracket`, {
        roundNumber: selectedRound,
        matches: selectedRound === 1 ? matchesPayload : completePayload,
      });
      Toast.show({
        type: "success",
        text1: "Saved",
        text2: "Knockout matchups updated.",
      });
      await fetchTournament();
      router.push(`/tournaments/${id}`);
    } catch (err: any) {
      console.error("Error saving matchups:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Failed to save matchups",
      });
    } finally {
      setSaving(false);
    }
  };

  const resolveMatchRouteId = (matchIdField: any): string | null => {
    if (matchIdField == null) return null;
    if (typeof matchIdField === "object" && matchIdField._id) {
      return String(matchIdField._id);
    }
    return String(matchIdField);
  };

  const roundTabRoutes: TabRoute[] = bracketRounds.map((round) => ({
    key: String(round.roundNumber),
    title: round.roundName,
  }));

  const handleTabIndexChange = (index: number) => {
    if (index === tabIndex) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTabIndex(index);
  };

  const renderRoundScene = ({ route }: { route: TabRoute }) => {
    const roundNumber = Number(route.key);
    const round = bracketRounds.find((r) => r.roundNumber === roundNumber);
    if (!round) return null;

    const sceneRoundLocked =
      round.completed || round.matches?.some((m: any) => m.completed);
    const scenePriorRoundComplete = tournament.bracket
      ? isPriorRoundComplete(tournament.bracket, roundNumber)
      : true;
    const sceneCanPickSides =
      allowCustom &&
      !sceneRoundLocked &&
      tournament.category !== "team" &&
      (roundNumber === 1 || scenePriorRoundComplete);
    const sceneRound1ByeCount =
      roundNumber === 1
        ? (() => {
            const total = getTournamentEntryIds(tournament).length;
            const assigned = new Set<string>();
            Object.values(draft).forEach((slot) => {
              if (slot.p1) assigned.add(slot.p1);
              if (slot.p2) assigned.add(slot.p2);
            });
            return Math.max(0, total - assigned.size);
          })()
        : 0;

    return (
      <View style={styles.scene}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.roundPanel}>
        {!allowCustom && (
          <Card variant="elevated" style={styles.infoCard}>
            <Text style={styles.infoText}>
              This tournament does not have custom knockout matching enabled. You can still view
              bracket slots; pairings are managed automatically.
            </Text>
          </Card>
        )}

        {allowCustom && tournament.category !== "team" && (
          <View style={styles.hintCard}>
            <Text style={styles.hintText}>
              {roundNumber === 1
                ? `Players not placed in a match receive a Bye and advance automatically when you save.`
                : scenePriorRoundComplete
                  ? `Tap each side to arrange ${round.roundName}. Only players still in the bracket can be selected.`
                  : ``}
            </Text>
            {roundNumber === 1 && sceneRound1ByeCount > 0 && (
              <View style={styles.byeChip}>
                <Text style={styles.byeChipText}>
                  {sceneRound1ByeCount} player{sceneRound1ByeCount === 1 ? "" : "s"} will receive a Bye on save
                </Text>
              </View>
            )}
          </View>
        )}

        {allowCustom && roundNumber > 1 && !scenePriorRoundComplete && (
          <View style={styles.warningCard}>
            <Icon name="info" library="material" size={20} color={tokens.colors.status.bye} />
            <Text style={styles.warningText}>
              Finish the previous round before saving {round.roundName}.
            </Text>
          </View>
        )}

        {sceneRoundLocked && (
          <View style={styles.warningCard}>
            <Icon name="eye" library="material" size={20} color={tokens.colors.text.tertiary} />
            <Text style={styles.warningText}>
              View only — this round has already started. Switch to a later round to edit matchups.
            </Text>
          </View>
        )}

        <View style={styles.roundCard}>
            <Text style={styles.roundTitle}>{round.roundName}</Text>
            {round.matches && round.matches.length > 0 ? (
              <View style={styles.matchesList}>
                {round.matches.map((match: any, index: number) => {
                  const mn = match.bracketPosition?.matchNumber ?? index + 1;
                  const meta1 = getSideMeta(
                    tournament,
                    match,
                    1,
                    draft,
                    roundNumber,
                    participantLookup
                  );
                  const meta2 = getSideMeta(
                    tournament,
                    match,
                    2,
                    draft,
                    roundNumber,
                    participantLookup
                  );
                  const routeId = resolveMatchRouteId(match.matchId);
                  const lockedP1 =
                    tournament.bracket &&
                    isSlotAwaitingPriorWinner(tournament.bracket, roundNumber, mn, "p1");
                  const lockedP2 =
                    tournament.bracket &&
                    isSlotAwaitingPriorWinner(tournament.bracket, roundNumber, mn, "p2");
                  const canTapP1 = sceneCanPickSides && !lockedP1;
                  const canTapP2 = sceneCanPickSides && !lockedP2;

                  const renderSide = (
                    meta: SideDisplayMeta,
                    side: "p1" | "p2",
                    canTap: boolean,
                    alignRight?: boolean
                  ) => (
                    <Pressable
                      onPress={() => openPicker(mn, side)}
                      disabled={!canTap}
                      style={[
                        styles.matchSide,
                        canTap && styles.matchSideTappable,
                        meta.isWaiting && styles.matchSideWaiting,
                      ]}
                    >
                      <View
                        style={[
                          styles.sideContent,
                          alignRight && styles.sideContentRight,
                        ]}
                      >
                        {!meta.isWaiting && (
                          <Avatar
                            src={meta.profileImage}
                            alt={meta.label}
                            size={tokens.components.avatar.size.md}
                          />
                        )}
                        <View style={[styles.sideTextWrap, alignRight && styles.sideTextWrapRight]}>
                          <Text
                            style={[
                              styles.matchSideLabel,
                              alignRight && styles.matchSideLabelRight,
                              meta.isWaiting && styles.matchSideLabelWaiting,
                            ]}
                            numberOfLines={2}
                          >
                            {meta.label}
                          </Text>
                          {canTap && (
                            <Text style={[styles.tapHint, alignRight && styles.tapHintRight]}>
                              Tap to change
                            </Text>
                          )}
                          {meta.isWaiting && (
                            <Text style={[styles.tapHint, alignRight && styles.tapHintRight]}>
                              Locked
                            </Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );

                  return (
                    <View key={`${mn}-${index}`} style={styles.matchRow}>
                      {routeId ? (
                        <Pressable
                          onPress={() => router.push(`/match/${routeId}`)}
                          style={styles.matchLink}
                        >
                          <Icon
                            name="chevron-right"
                            library="material"
                            size={16}
                            color={tokens.colors.primary[600]}
                          />
                        </Pressable>
                      ) : null}
                      <Text style={styles.matchNumberLabel}>Match {mn}</Text>
                      <View style={styles.matchSides}>
                        {renderSide(meta1, "p1", canTapP1)}
                          <Text style={styles.vsText}>Vs</Text>
                        {renderSide(meta2, "p2", canTapP2, true)}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyMatches}>
                <Text style={styles.emptyText}>No matches in this round yet</Text>
                <Text style={styles.emptySubtext}>
                  Set up matchups to create matches
                </Text>
              </View>
            )}
          </View>

        {!sceneRoundLocked && allowCustom && tournament.category !== "team" && roundNumber === selectedRound && (
          <Button
            onPress={handleSave}
            variant="secondary"
            fullWidth
            disabled={saving || (roundNumber > 1 && !scenePriorRoundComplete)}
            style={styles.saveButton}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </>
            ) : (
              <Text style={styles.saveButtonText}>Save Matchups</Text>
            )}
          </Button>
        )}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/tournaments/${id}`);
            }}
            style={styles.headerBackButton}
          >
            <Icon
              name="chevron-left"
              size={16}
              color={tokens.colors.text.primary}
            />
          </Pressable>

          <View style={styles.headerContent}>
            <Text style={styles.title}>Custom matching</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {tournament.name}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabViewWrapper}>
        <TournamentTabView
          routes={roundTabRoutes}
          index={tabIndex}
          onIndexChange={handleTabIndexChange}
          renderScene={renderRoundScene}
          swipeEnabled
          lazy
        />
      </View>

      <Modal visible={pickerSlot != null} animationType="slide" transparent>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerSlot(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose participant</Text>
              <Pressable onPress={() => setPickerSlot(null)} hitSlop={12}>
                <Icon name="close" library="material" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            <Pressable
              style={styles.clearRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                applyPickerSelection(null);
              }}
            >
              <Text style={styles.clearRowText}>Clear this slot</Text>
            </Pressable>
            <FlatList
              data={pickerChoices}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected =
                  pickerSlot &&
                  (pickerSlot.side === "p1"
                    ? draft[pickerSlot.matchNumber]?.p1 === item.id
                    : draft[pickerSlot.matchNumber]?.p2 === item.id);
                return (
                  <Pressable
                    style={[styles.choiceRow, isSelected && styles.choiceRowSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      applyPickerSelection(item.id);
                    }}
                  >
                    <Avatar
                      src={item.profileImage}
                      alt={item.label}
                      size={tokens.components.avatar.size.md}
                    />
                    <Text style={styles.choiceLabel}>{item.label}</Text>
                    {isSelected && (
                      <Icon
                        name="check"
                        library="material"
                        size={20}
                        color={tokens.colors.primary[600]}
                      />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyPicker}>
                  {selectedRound > 1 && !priorRoundComplete
                    ? "Complete the previous round to unlock more options."
                    : "No eligible players — eliminated players are hidden."}
                </Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: tokens.spacing[16],
    paddingHorizontal: tokens.spacing[7],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[6],
    textAlign: "center",
  },
  header: {
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[4],
    height: 56,
  },
  headerBackButton: {
    padding: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
  },
  backButton: {
    marginTop: tokens.spacing[4],
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  subtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  tabViewWrapper: {
    flex: 1,
    backgroundColor: tokens.colors.background.secondary,
  },
  scene: {
    flex: 1,
    backgroundColor: tokens.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: tokens.spacing[4],
    paddingTop: tokens.spacing[4],
    paddingBottom: tokens.spacing[16],
    gap: tokens.spacing[6],
  },
  roundPanel: {
    gap: tokens.spacing[6],
  },
  infoCard: {
    padding: tokens.spacing[7],
    backgroundColor: tokens.colors.background.primary,
    borderRadius: tokens.borderRadius.md,
    ...tokens.shadows.sm,
  },
  infoText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
    lineHeight: 18,
  },
  hintCard: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  hintText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.primary,
    lineHeight: 18,
  },
  byeChip: {
    alignSelf: "flex-start",
    backgroundColor: tokens.colors.status.bye + "12",
    borderRadius: tokens.borderRadius.full,
    paddingHorizontal: tokens.spacing[5],
    paddingVertical: tokens.spacing[2],
  },
  byeChipText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.status.bye,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.spacing[4],
  },
  warningText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.warning,
    flex: 1,
  },
  roundCard: {
    
  },
  roundTitle: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing[6],
  },
  matchesList: {
    gap: tokens.spacing[4],
  },
  matchRow: {
    padding: tokens.spacing[6],
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    backgroundColor: tokens.colors.background.secondary,
    gap: tokens.spacing[4],
  },
  matchNumberLabel: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    letterSpacing: tokens.typography.letterSpacing.wide,
    textTransform: "uppercase",
  },
  matchSides: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[3],
  },
  matchSide: {
    flex: 1,
    minWidth: 0,
  },
  matchSideTappable: {
    paddingVertical: tokens.spacing[2],
  },
  matchSideWaiting: {
    opacity: 0.85,
  },
  sideContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[4],
  },
  sideContentRight: {
    flexDirection: "row-reverse",
  },
  sideTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  sideTextWrapRight: {
    alignItems: "flex-end",
  },
  matchSideLabel: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  matchSideLabelRight: {
    textAlign: "right",
  },
  matchSideLabelWaiting: {
    color: tokens.colors.text.tertiary,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  tapHint: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[500],
    marginTop: tokens.spacing[1],
  },
  tapHintRight: {
    textAlign: "right",
  },
  vsText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.components.vsBadge.textColor,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  matchLink: {
    position: "absolute",
    top: tokens.spacing[4],
    right: tokens.spacing[4],
    padding: tokens.spacing[2],
  },
  emptyMatches: {
    alignItems: "center",
    paddingVertical: tokens.spacing[12],
  },
  emptySubtext: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.tertiary,
    marginTop: tokens.spacing[2],
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: tokens.colors.primary[600],
    borderRadius: tokens.borderRadius.sm,
    paddingVertical: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[6],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: tokens.spacing[2],
  },
  saveButtonText: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
    marginLeft: tokens.spacing[3],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: tokens.colors.background.primary,
    maxHeight: "72%",
    paddingBottom: tokens.spacing[10],
    ...tokens.shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing[7],
    paddingTop: tokens.spacing[8],
    paddingBottom: tokens.spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  modalTitle: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  clearRow: {
    paddingVertical: tokens.spacing[6],
    paddingHorizontal: tokens.spacing[7],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  clearRowText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.primary[600],
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[5],
    paddingVertical: tokens.spacing[6],
    paddingHorizontal: tokens.spacing[7],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border.light,
  },
  choiceRowSelected: {
    backgroundColor: tokens.colors.primary[50],
  },
  choiceLabel: {
    flex: 1,
    fontSize: tokens.typography.fontSize.lg,
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  emptyPicker: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.tertiary,
    textAlign: "center",
    padding: tokens.spacing[12],
  },
});
