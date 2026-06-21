import { Icon } from "@/components/ui/Icon";
import { DesignTokens } from "@/constants/designTokens";
import type { LineupPlayer } from "@/features/team-lineup/types";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Divider, Menu } from "react-native-paper";

interface Props {
  position: string;
  selectedPlayerId: string | null;
  roster: LineupPlayer[];
  usedPlayerIds: Set<string>;
  onSelect: (playerId: string | null) => void;
}

export function PositionSlotRow({
  position,
  selectedPlayerId,
  roster,
  usedPlayerIds,
  onSelect,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const selected = roster.find((p) => p.id === selectedPlayerId);

  return (
    <View style={styles.row}>
      <View style={styles.positionBadge}>
        <Text style={styles.positionText}>{position}</Text>
      </View>

      <Menu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        anchor={
          <Pressable
            style={[styles.selector, menuOpen && styles.selectorActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMenuOpen(true);
            }}
          >
            {selected ? (
              <View style={styles.playerRow}>
                {selected.profileImage ? (
                  <Image
                    source={{ uri: selected.profileImage }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>
                      {selected.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.playerName} numberOfLines={1}>
                  {selected.name}
                </Text>
              </View>
            ) : (
              <Text style={styles.placeholder}>Select player</Text>
            )}
            <Icon
              name={menuOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={DesignTokens.colors.text.tertiary}
            />
          </Pressable>
        }
        contentStyle={styles.menuContent}
      >
        <Menu.Item
          title="Unassigned"
          onPress={() => {
            onSelect(null);
            setMenuOpen(false);
          }}
        />
        <Divider />
        {roster.map((player) => {
          const takenElsewhere =
            usedPlayerIds.has(player.id) && player.id !== selectedPlayerId;
          return (
            <Menu.Item
              key={player.id}
              title={player.name}
              disabled={takenElsewhere}
              onPress={() => {
                onSelect(player.id);
                setMenuOpen(false);
              }}
            />
          );
        })}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[3],
  },
  positionBadge: {
    width: 36,
    height: 36,
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: DesignTokens.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  positionText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.primary[700],
  },
  selector: {
    width: '80%',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[3],
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: DesignTokens.colors.background.secondary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.light,
  },
  selectorActive: {
    borderColor: DesignTokens.colors.primary[300],
  },
  playerRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    marginRight: DesignTokens.spacing[2],
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DesignTokens.colors.gray[200],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 12,
    fontWeight: "600",
    color: DesignTokens.colors.text.secondary,
  },
  playerName: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.primary,
  },
  placeholder: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
  },
  menuContent: {
    borderRadius: DesignTokens.borderRadius.sm,
  },
});
