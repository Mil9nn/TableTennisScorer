import { Avatar } from "@/components/ui/Avatar";
import { DesignTokens } from "@/constants/designTokens";
import { createFlowChoiceStyles as choiceStyles } from "@/styles/createFlowChoiceStyles";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  NestableDraggableFlatList,
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { TouchableOpacity as GestureTouchableOpacity } from "react-native-gesture-handler";

type TeamPlayer = {
  user: {
    _id: string;
    fullName?: string;
    username?: string;
    profileImage?: string;
  };
};

type MatchConfig = {
  type: "singles" | "doubles";
  team1Players: string[];
  team2Players: string[];
};

type MatchConfigWithId = MatchConfig & { id: string };

function createEmptyMatch(): MatchConfigWithId {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: "singles",
    team1Players: [],
    team2Players: [],
  };
}

function MatchListSeparator() {
  return <View style={{ height: DesignTokens.spacing[2] }} />;
}

interface CustomFormatConfigProps {
  team1Players: TeamPlayer[];
  team2Players: TeamPlayer[];
  team1Name: string;
  team2Name: string;
  team1Logo?: string;
  team2Logo?: string;
  onChange: (config: { matches: MatchConfig[] }) => void;
}

function getPlayerName(player: TeamPlayer) {
  return player.user.fullName || player.user.username || "Unknown";
}

function findPlayer(roster: TeamPlayer[], id: string) {
  return roster.find((p) => p.user._id === id);
}

function PlayerPickerField({
  teamName,
  teamLogo,
  value,
  options,
  onSelect,
  disabled,
  roster,
  inline,
  cell,
}: {
  teamName: string;
  teamLogo?: string;
  value: string;
  options: TeamPlayer[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  roster?: TeamPlayer[];
  inline?: boolean;
  /** Full-width slot inside doubles 2×2 grid */
  cell?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected =
    options.find((p) => p.user._id === value) ||
    (roster && value ? findPlayer(roster, value) : undefined);
  const displayName = selected ? getPlayerName(selected) : null;
  const filled = !!displayName;

  return (
    <>
      <Pressable
        onPress={() => {
          if (disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setOpen(true);
        }}
        style={({ pressed }) => [
          inline
            ? filled
              ? styles.inlinePlayer
              : styles.inlinePicker
            : filled
              ? styles.playerLine
              : styles.pickerField,
          inline && (cell ? styles.gridCellPicker : styles.inlinePickerFlex),
          pressed && !disabled && styles.pickerPressed,
          disabled && styles.pickerFieldDisabled,
        ]}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={filled ? `${displayName}, tap to change` : "Choose player"}
      >
        <View style={styles.playerRow}>
          {selected && (
            <Avatar
              src={selected.user.profileImage}
              alt={displayName ?? undefined}
              size={inline ? 22 : 28}
            />
          )}
          <Text
            style={[
              inline ? styles.inlinePlayerLabel : styles.playerLabel,
              !filled && (inline ? styles.inlinePlayerLabelEmpty : styles.playerLabelEmpty),
            ]}
          >
            {displayName || (inline ? "Choose" : "Tap to choose player")}
          </Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitle}>
                <Avatar src={teamLogo} alt={teamName} size={28} />
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {teamName}
                </Text>
              </View>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={12}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={22} color={DesignTokens.colors.text.secondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {options.length === 0 ? (
                <Text style={styles.modalEmpty}>No players available</Text>
              ) : (
                options.map((p) => {
                  const id = p.user._id;
                  const isSelected = value === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                      onPress={() => {
                        onSelect(id);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.modalOptionLeft}>
                        <Avatar
                          src={p.user.profileImage}
                          alt={getPlayerName(p)}
                          size={36}
                        />
                        <Text
                          style={[
                            styles.modalOptionText,
                            isSelected && styles.modalOptionTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {getPlayerName(p)}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#4974db" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function IconAction({
  icon,
  onPress,
  disabled,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconAction,
        disabled && styles.iconActionDisabled,
        pressed && !disabled && styles.iconActionPressed,
        destructive && !disabled && styles.iconActionDestructive,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={
          disabled
            ? DesignTokens.colors.gray[300]
            : destructive
              ? DesignTokens.colors.error
              : DesignTokens.colors.text.secondary
        }
      />
    </Pressable>
  );
}

export default function CustomFormatConfig({
  team1Players,
  team2Players,
  team1Name,
  team2Name,
  team1Logo,
  team2Logo,
  onChange,
}: CustomFormatConfigProps) {
  const [matches, setMatches] = useState<MatchConfigWithId[]>([createEmptyMatch()]);

  const updateMatches = useCallback(
    (newMatches: MatchConfigWithId[]) => {
      setMatches(newMatches);
      onChange({
        matches: newMatches.map(({ id: _id, ...rest }) => rest),
      });
    },
    [onChange]
  );

  const isMatchComplete = (match: MatchConfig) => {
    const requiredPlayers = match.type === "singles" ? 1 : 2;
    const hasTeam1 =
      match.team1Players.length === requiredPlayers &&
      match.team1Players.every((p) => p && p.trim() !== "");
    const hasTeam2 =
      match.team2Players.length === requiredPlayers &&
      match.team2Players.every((p) => p && p.trim() !== "");
    return hasTeam1 && hasTeam2;
  };

  const canAddMatch = () => {
    if (matches.length === 0) return true;
    return isMatchComplete(matches[matches.length - 1]);
  };

  const addMatch = () => {
    if (!canAddMatch()) return;
    updateMatches([...matches, createEmptyMatch()]);
  };

  const confirmRemoveMatch = (index: number) => {
    if (matches.length === 1) return;
    Alert.alert("Remove match?", `Match ${index + 1} will be removed from the lineup.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          updateMatches(matches.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const applyMatchType = (index: number, type: "singles" | "doubles") => {
    const match = matches[index];
    if (match.type === type) return;
    const hasPlayers =
      match.team1Players.some(Boolean) || match.team2Players.some(Boolean);
    if (hasPlayers) {
      Alert.alert(
        "Change format?",
        "Switching singles/doubles will clear the players selected for this rubber.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Change",
            onPress: () => {
              const newMatches = [...matches];
              newMatches[index] = {
                ...newMatches[index],
                type,
                team1Players: [],
                team2Players: [],
              };
              updateMatches(newMatches);
            },
          },
        ]
      );
      return;
    }
    const newMatches = [...matches];
    newMatches[index] = {
      ...newMatches[index],
      type,
      team1Players: [],
      team2Players: [],
    };
    updateMatches(newMatches);
  };

  const getAvailablePlayers = (
    teamPlayers: TeamPlayer[],
    currentMatchIndex: number,
    currentTeam: "team1" | "team2",
    excludeIds: string[] = []
  ) => {
    const usedPlayerIds = new Set<string>(excludeIds);
    matches.forEach((match, idx) => {
      if (idx < currentMatchIndex) {
        const ids =
          currentTeam === "team1" ? match.team1Players : match.team2Players;
        ids.forEach((id) => usedPlayerIds.add(id));
      }
    });
    return teamPlayers.filter((p) => !usedPlayerIds.has(p.user._id));
  };

  const updateMatchPlayers = (
    index: number,
    field: "team1Players" | "team2Players",
    next: string[]
  ) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: next };
    updateMatches(newMatches);
  };

  const renderPlayerSlot = (
    match: MatchConfig,
    index: number,
    team: "team1" | "team2",
    teamName: string,
    teamLogo: string | undefined,
    roster: TeamPlayer[],
    slotIndex: number,
    cell = false
  ) => {
    const players = team === "team1" ? match.team1Players : match.team2Players;
    const fieldKey = team === "team1" ? "team1Players" : "team2Players";
    const playerId = players[slotIndex] || "";
    const available = getAvailablePlayers(
      roster,
      index,
      team,
      players.filter((_, i) => i !== slotIndex && players[i])
    );

    return (
      <PlayerPickerField
        key={`${index}-${team}-${slotIndex}`}
        teamName={teamName}
        teamLogo={teamLogo}
        value={playerId}
        options={available}
        roster={roster}
        inline
        cell={cell}
        onSelect={(id) => {
          const next = [...players];
          next[slotIndex] = id;
          updateMatchPlayers(index, fieldKey, next);
        }}
      />
    );
  };

  const renderSinglesMatchup = (match: MatchConfig, index: number) => (
    <View style={styles.singlesMatchup}>
      <View style={styles.singlesCell}>
        {renderPlayerSlot(match, index, "team1", team1Name, team1Logo, team1Players, 0)}
      </View>
      <Text style={styles.vsInline}>vs</Text>
      <View style={styles.singlesCell}>
        {renderPlayerSlot(match, index, "team2", team2Name, team2Logo, team2Players, 0)}
      </View>
    </View>
  );

  const renderDoublesMatchup = (match: MatchConfig, index: number) => (
    <View style={styles.doublesMatchup}>
      <View style={styles.doublesRow}>
        <View style={styles.doublesCell}>
          {renderPlayerSlot(match, index, "team1", team1Name, team1Logo, team1Players, 0, true)}
        </View>
        <View style={styles.doublesVsSpacer} />
        <View style={styles.doublesCell}>
          {renderPlayerSlot(match, index, "team2", team2Name, team2Logo, team2Players, 0, true)}
        </View>
      </View>
      <View style={styles.doublesRow}>
        <View style={styles.doublesCell}>
          {renderPlayerSlot(match, index, "team1", team1Name, team1Logo, team1Players, 1, true)}
        </View>
        <Text style={styles.vsDoubles}>vs</Text>
        <View style={styles.doublesCell}>
          {renderPlayerSlot(match, index, "team2", team2Name, team2Logo, team2Players, 1, true)}
        </View>
      </View>
    </View>
  );

  const renderMatchupLine = (match: MatchConfig, index: number) =>
    match.type === "singles"
      ? renderSinglesMatchup(match, index)
      : renderDoublesMatchup(match, index);

  const renderTypePills = (index: number, match: MatchConfig) => (
    <View style={[choiceStyles.segmentedControlContainer, styles.typePills]}>
      {(["singles", "doubles"] as const).map((type) => {
        const isTypeActive = match.type === type;
        return (
          <Pressable
            key={type}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              applyMatchType(index, type);
            }}
            style={[
              choiceStyles.segmentedButton,
              styles.typePillButton,
              isTypeActive && choiceStyles.segmentedButtonActive,
            ]}
          >
            <Text
              style={[
                choiceStyles.segmentedButtonText,
                styles.typePillText,
                isTypeActive && choiceStyles.segmentedButtonTextActive,
              ]}
            >
              {type === "singles" ? "Singles" : "Doubles"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderMatchCard = ({
    item: match,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<MatchConfigWithId>) => {
    const index = getIndex() ?? 0;
    const isComplete = isMatchComplete(match);
    const typeLabel = match.type === "singles" ? "Singles" : "Doubles";

    return (
      <ScaleDecorator activeScale={1.02}>
        <View
          style={[
            styles.matchCard,
            isComplete && styles.matchCardComplete,
            isActive && styles.matchCardDragging,
          ]}
        >
          <View style={styles.matchCardHeader}>
            <View style={styles.matchCardHeaderLeft}>
              <GestureTouchableOpacity
                onLongPress={drag}
                delayLongPress={180}
                disabled={isActive}
                style={styles.dragHandle}
                accessibilityLabel={`Drag to reorder match ${index + 1}`}
                accessibilityHint="Press and hold, then drag to reorder"
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                <Ionicons
                  name="reorder-three"
                  size={20}
                  color={DesignTokens.colors.text.secondary}
                />
              </GestureTouchableOpacity>
              <Text style={styles.matchIndexText}>Match {index + 1}</Text>
              {isComplete ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert(
                      "Change format?",
                      "Changing singles/doubles clears players for this rubber.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Singles",
                          onPress: () => applyMatchType(index, "singles"),
                        },
                        {
                          text: "Doubles",
                          onPress: () => applyMatchType(index, "doubles"),
                        },
                      ]
                    );
                  }}
                  style={styles.typeChip}
                  hitSlop={6}
                >
                  <Text style={styles.typeChipText}>{typeLabel}</Text>
                </Pressable>
              ) : (
                renderTypePills(index, match)
              )}
            </View>

            <IconAction
              icon="trash-outline"
              onPress={() => confirmRemoveMatch(index)}
              disabled={matches.length === 1}
              destructive
            />
          </View>

          {renderMatchupLine(match, index)}
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Build the tie in order. Long-press the handle to reorder rubbers. Each player can only
        appear once per team before later matches.
      </Text>

      <NestableDraggableFlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchCard}
        onDragEnd={({ data }) => updateMatches(data)}
        extraData={matches.length}
        scrollEnabled={false}
        activationDistance={16}
        autoscrollThreshold={28}
        autoscrollSpeed={48}
        dragItemOverflow
        ItemSeparatorComponent={MatchListSeparator}
      />

      <Pressable
        onPress={addMatch}
        disabled={!canAddMatch()}
        style={[
          styles.addMatchButton,
          !canAddMatch() && styles.addMatchButtonDisabled,
          canAddMatch() && styles.addMatchButtonPressed,
        ]}
      >
        <Ionicons
          name="add-circle-outline"
          size={20}
          color={canAddMatch() ? "#4974db" : DesignTokens.colors.gray[400]}
        />
        <Text
          style={[
            styles.addMatchButtonText,
            !canAddMatch() && styles.addMatchButtonTextDisabled,
          ]}
        >
          Add match
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: DesignTokens.spacing[4],
  },
  hint: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    lineHeight: 18,
  },
  matchCard: {
    backgroundColor: DesignTokens.colors.background.primary,
    borderRadius: DesignTokens.borderRadius.sm,
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[2],
    gap: DesignTokens.spacing[2],
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
  },
  matchCardComplete: {
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  matchCardDragging: {
    borderColor: "#C7D2FE",
    ...DesignTokens.shadows.md,
  },
  dragHandle: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DesignTokens.borderRadius.sm,
  },
  dragHandlePressed: {
    backgroundColor: DesignTokens.colors.gray[200],
  },
  matchCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  matchIndexText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
    minWidth: 14,
    textAlign: "center",
  },
  typePills: {
    padding: 2,
    gap: 2,
  },
  typePillButton: {
    minWidth: 28,
    paddingHorizontal: DesignTokens.spacing[2],
  },
  typePillText: {
    fontSize: DesignTokens.typography.fontSize.sm,
  },
  typeChip: {
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: 2,
    borderRadius: DesignTokens.borderRadius.full,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  typeChipText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
  completeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: 4,
    borderRadius: DesignTokens.borderRadius.full,
    backgroundColor: "#ECFDF5",
  },
  completeTagText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.success,
  },
  iconAction: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DesignTokens.borderRadius.sm,
  },
  iconActionPressed: {
    backgroundColor: DesignTokens.colors.gray[200],
  },
  iconActionDisabled: {
    opacity: 0.45,
  },
  iconActionDestructive: {},
  singlesMatchup: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  singlesCell: {
    flex: 1,
  },
  doublesMatchup: {
    gap: DesignTokens.spacing[1],
  },
  doublesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  doublesCell: {
    flex: 1,
  },
  vsInline: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.tertiary,
    flexShrink: 0,
  },
  doublesVsSpacer: {
    width: 28,
    flexShrink: 0,
  },
  vsDoubles: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.tertiary,
    flexShrink: 0,
    width: 28,
    textAlign: "center",
  },
  inlinePickerFlex: {
    flex: 1,
    alignSelf: "stretch",
  },
  gridCellPicker: {
    width: "100%",
    alignSelf: "stretch",
  },
  inlinePicker: {
    minHeight: 34,
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: 4,
    borderRadius: DesignTokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  inlinePlayer: {
    minHeight: 32,
    paddingVertical: 2,
  },
  inlinePlayerLabel: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  inlinePlayerLabelEmpty: {
    fontWeight: DesignTokens.typography.fontWeight.normal,
    color: DesignTokens.colors.text.tertiary,
  },
  playerLine: {
    minHeight: 40,
    paddingVertical: DesignTokens.spacing[1],
  },
  playerRow: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  playerLabel: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  playerLabelEmpty: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.normal,
    color: DesignTokens.colors.text.tertiary,
  },
  pickerPressed: {
    opacity: 0.85,
  },
  pickerField: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[2],
    borderRadius: DesignTokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
    backgroundColor: DesignTokens.colors.background.secondary,
    gap: DesignTokens.spacing[2],
  },
  pickerFieldDisabled: {
    opacity: 0.5,
  },
  incompleteBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    padding: DesignTokens.spacing[3],
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: "#FFFBEB",
  },
  incompleteBannerText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.sm,
    color: "#92400E",
  },
  addMatchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DesignTokens.spacing[2],
    minHeight: 48,
    borderRadius: DesignTokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderStyle: "dashed",
    backgroundColor: "#F8FAFF",
  },
  addMatchButtonPressed: {
    opacity: 0.85,
  },
  addMatchButtonDisabled: {
    borderColor: DesignTokens.colors.border.light,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  addMatchButtonText: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: "#4974db",
  },
  addMatchButtonTextDisabled: {
    color: DesignTokens.colors.gray[400],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: DesignTokens.colors.background.primary,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border.light,
  },
  modalHeaderTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    marginRight: DesignTokens.spacing[2],
  },
  modalTitle: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  modalClose: {
    padding: DesignTokens.spacing[1],
  },
  modalList: {
    maxHeight: 320,
  },
  modalEmpty: {
    padding: DesignTokens.spacing[6],
    textAlign: "center",
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignTokens.colors.border.light,
  },
  modalOptionSelected: {
    backgroundColor: "#F8FAFF",
  },
  modalOptionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[3],
    marginRight: DesignTokens.spacing[2],
  },
  modalOptionText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.lg,
    color: DesignTokens.colors.text.primary,
  },
  modalOptionTextSelected: {
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: "#4974db",
  },
});
