import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Chip, Divider, Text } from "react-native-paper";
import { EnhancedStandingsTable } from "@/components/tournaments/EnhancedStandingsTable";
import { Avatar } from "@/components/ui/Avatar";
import { getParticipantDisplayName, getParticipantImage } from "@/types/tournament.type";
import { normalizeStandingRow } from "@/lib/standingsUtils";
import { DesignTokens } from "@/constants/designTokens";

interface Participant {
  _id?: string;
  fullName?: string;
  username?: string;
  name?: string;
  profileImage?: string;
  logo?: string;
}

interface Group {
  groupId?: string;
  groupName?: string;
  participants?: Participant[];
  standings?: any[];
  rounds?: any[];
}

interface GroupsViewProps {
  groups: Group[];
  participants?: Participant[];
  advancePerGroup?: number;
  showDetailedStats?: boolean;
  category?: "individual" | "team";
  matchType?: string;
  drawGenerated?: boolean;
}

const tokens = DesignTokens;

const getParticipantName = (participant: Participant) =>
  getParticipantDisplayName(participant) || "Participant";

const normalizeId = (value: any): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    // Mongo extended JSON shape
    if (typeof value.$oid === "string") return value.$oid;
    if (value._id) return normalizeId(value._id);
    if (typeof value.toString === "function") {
      const asString = value.toString();
      if (asString && asString !== "[object Object]") return asString;
    }
    return "";
  }
  return String(value);
};

const getParticipantId = (participant: any) => {
  if (!participant) return "";
  return normalizeId(participant);
};

const getStandings = (group: Group) => {
  const standings = Array.isArray(group?.standings) ? group.standings : [];
  if (standings.length > 0) return standings;
  if (Array.isArray((group as any)?.table)) return (group as any).table;
  if (Array.isArray((group as any)?.leaderboard)) return (group as any).leaderboard;
  return [];
};

export function GroupsView({
  groups,
  participants = [],
  advancePerGroup = 0,
  showDetailedStats = true,
  category = "individual",
  matchType,
  drawGenerated = false,
}: GroupsViewProps) {
  const isDoubles = matchType === "doubles";
  const safeGroups = Array.isArray(groups) ? groups : [];
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    String(safeGroups[0]?.groupId || ""),
  );

  useEffect(() => {
    if (!safeGroups.length) return;
    const exists = safeGroups.some(
      (group) => String(group.groupId || "") === selectedGroupId,
    );
    if (!exists) {
      setSelectedGroupId(String(safeGroups[0]?.groupId || ""));
    }
  }, [safeGroups, selectedGroupId]);

  if (safeGroups.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          No groups generated yet.
        </Text>
      </View>
    );
  }

  const getGroupStatus = (group: Group) => {
    const rounds = Array.isArray(group?.rounds) ? group.rounds : [];
    const totalMatches = rounds.reduce((sum, round: any) => {
      const matches = Array.isArray(round?.matches) ? round.matches.length : 0;
      return sum + matches;
    }, 0);
    const completedRounds = rounds.filter((round: any) => round?.completed).length;
    const allCompleted = rounds.length > 0 && rounds.every((round: any) => round?.completed);
    return { totalRounds: rounds.length, completedRounds, allCompleted, totalMatches };
  };

  const selectedGroup = useMemo(() => {
    const found = safeGroups.find(
      (group) => String(group.groupId || "") === selectedGroupId,
    );
    return found || safeGroups[0];
  }, [safeGroups, selectedGroupId]);

  const selectedGroupStandings = getStandings(selectedGroup);
  const selectedGroupParticipants = Array.isArray(selectedGroup?.participants)
    ? selectedGroup.participants
    : [];
  const mergedParticipants =
    selectedGroupParticipants.length > 0
      ? [...participants, ...selectedGroupParticipants]
      : participants;
  const participantById = useMemo(
    () =>
      new Map<string, Participant>(
        mergedParticipants
          .filter((participant) => participant && typeof participant === "object")
          .map((participant) => [getParticipantId(participant), participant])
          .filter(([id]) => Boolean(id)),
      ),
    [mergedParticipants],
  );
  const resolvedSelectedGroupStandings = useMemo(() => {
    const merged = new Map<string, any>();

    selectedGroupStandings.forEach((row: any, index: number) => {
      const normalized = normalizeStandingRow(row);
      const rowParticipantId =
        getParticipantId(normalized?.participant?._id) ||
        getParticipantId(normalized?.participant) ||
        getParticipantId(normalized?.participantId) ||
        `idx-${index}`;
      const mappedParticipant = participantById.get(rowParticipantId);
      const resolvedRow = mappedParticipant
        ? {
            ...normalized,
            participant: {
              ...(typeof normalized?.participant === "object" ? normalized.participant : {}),
              ...mappedParticipant,
              _id: rowParticipantId,
            },
          }
        : normalized;

      const existing = merged.get(rowParticipantId);
      if (!existing) {
        merged.set(rowParticipantId, resolvedRow);
        return;
      }
      const keepNew =
        (resolvedRow.played ?? 0) > (existing.played ?? 0) ||
        ((resolvedRow.played ?? 0) === (existing.played ?? 0) &&
          (resolvedRow.points ?? 0) > (existing.points ?? 0));
      if (keepNew) {
        merged.set(rowParticipantId, resolvedRow);
      }
    });

    return Array.from(merged.values()).sort(
      (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
    );
  }, [participantById, selectedGroupStandings]);

  const shouldShowStandingsTable =
    drawGenerated && resolvedSelectedGroupStandings.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {safeGroups.map((group, index) => {
          const groupId = String(group.groupId || `group-${index}`);
          const selected = groupId === String(selectedGroup?.groupId || "");
          const status = getGroupStatus(group);

          return (
            <Chip
              key={groupId}
              onPress={() => setSelectedGroupId(groupId)}
              selected={selected}
              style={[styles.tabChip, selected ? styles.tabChipActive : null]}
              textStyle={[
                styles.tabChipText,
                selected ? styles.tabChipTextActive : null,
                status.allCompleted ? styles.tabChipTextComplete : null,
              ]}
            >
              {group.groupName || `Group ${index + 1}`}
            </Chip>
          );
        })}
      </ScrollView>

      {shouldShowStandingsTable ? (
        <EnhancedStandingsTable
          standings={resolvedSelectedGroupStandings}
          showDetailedStats={showDetailedStats}
          highlightTop={advancePerGroup > 0 ? advancePerGroup : 3}
          category={category}
          matchType={matchType}
          participantLabel={isDoubles ? "Pair" : undefined}
          participants={mergedParticipants}
        />
      ) : selectedGroupParticipants.length > 0 ? (
        <View style={styles.participantsWrap}>
          {selectedGroupParticipants.map((participant, participantIndex) => {
            const participantId = getParticipantId(participant);
            const mappedParticipant = participantById.get(participantId);
            const inlineParticipant =
              typeof participant === "object" ? participant : undefined;
            // Prefer mapped participant (from full tournament participants list),
            // because group payloads can contain sparse refs like `{ _id }`.
            const participantData = mappedParticipant || inlineParticipant;
            const participantName = getParticipantName(participantData || {});
            const participantImage = getParticipantImage(participantData);

            return (
              <View
                key={`${participantId || "participant"}-${participantIndex}`}
                style={styles.participantRow}
              >
                <Text variant="bodySmall" style={styles.participantRank}>
                  {participantIndex + 1}
                </Text>
                <Avatar src={participantImage} alt={participantName} size={28} />
                <Text variant="bodyMedium" style={styles.participantName}>
                  {participantName}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyInnerWrap}>
          <Text variant="bodySmall" style={styles.emptyText}>
            {!drawGenerated
              ? "Standings will appear after the tournament draw is generated."
              : "No standings available for this group."}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background.secondary,
  },
  tabsRow: {
    
  },
  tabChip: {
    borderRadius: tokens.borderRadius.none,
    backgroundColor: "#ffffff",
    ...tokens.shadows.lg,
  },
  tabChipActive: {
    backgroundColor: "#f0f9fa",
  },
  tabChipText: {
    color: "#475569",
    fontWeight: tokens.typography.fontWeight.medium,
    fontSize: tokens.typography.fontSize.base,
  },
  tabChipTextActive: {
    color: "#1f2937",
  },
  tabChipTextComplete: {
    color: "#16a34a",
  },
  participantsWrap: {
    gap: 8,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  participantRank: {
    width: 18,
    color: "#64748b",
    fontWeight: "600",
  },
  participantName: {
    color: "#1f2937",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyInnerWrap: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyText: {
    color: "#64748b",
  },
});
