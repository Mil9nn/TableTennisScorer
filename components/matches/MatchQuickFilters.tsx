/**
 * Match feed quick filters — styled with React Native StyleSheet + DesignTokens
 * (this app does not use NativeWind/className).
 */
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { DesignTokens } from "@/constants/designTokens";
import {
  buildDateFilterFromPreset,
  DATE_RANGE_QUICK_PRESETS,
  type DateRangePresetId,
} from "@/lib/dateRangePresets";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

const t = DesignTokens;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterPanel = "format" | "date" | "sort" | null;

export type MatchFeedTab = "singles" | "doubles" | "team";

export interface MatchQuickFilterValues {
  type: string;
  format: string;
  status: string;
  sort: string;
  datePreset: string;
  dateFrom: string;
  dateTo: string;
}

interface ChipOption {
  label: string;
  value: string;
}

interface MatchQuickFiltersProps {
  /** Feed tab — format chips only apply on the Teams tab. */
  tab: MatchFeedTab;
  filters: MatchQuickFilterValues;
  onFiltersChange: (updates: Partial<MatchQuickFilterValues>) => void;
}

const STATUS_QUICK_CHIPS: ChipOption[] = [
  { label: "Live", value: "in_progress" },
  { label: "Upcoming", value: "scheduled" },
  { label: "Completed", value: "completed" },
];

const TEAM_FORMAT_CHIPS: ChipOption[] = [
  { label: "All", value: "" },
  { label: "Swaythling", value: "five_singles" },
  { label: "S-D-S", value: "single_double_single" },
];

const SORT_CHIPS: ChipOption[] = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
];

const FEED_DATE_RANGE_CHIPS: { label: string; value: DateRangePresetId | "all" }[] = [
  { label: "Any time", value: "all" },
  ...DATE_RANGE_QUICK_PRESETS.map((p) => ({ label: p.label, value: p.id })),
];

function animateRowChange() {
  LayoutAnimation.configureNext({
    duration: t.animation.duration.fast,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

function isFeedDateChipSelected(
  value: DateRangePresetId | "all",
  f: Pick<MatchQuickFilterValues, "datePreset" | "dateFrom" | "dateTo">,
): boolean {
  if (value === "all") {
    return !f.dateFrom?.trim() && !f.dateTo?.trim();
  }
  return f.datePreset === value;
}

function getActiveDateLabel(filters: MatchQuickFilterValues): string | null {
  const match = FEED_DATE_RANGE_CHIPS.find((chip) =>
    isFeedDateChipSelected(chip.value, filters),
  );
  if (!match || match.value === "all") return null;
  return match.label;
}

function getSortLabel(sort: string): string | null {
  if (!sort || sort === "newest") return null;
  return SORT_CHIPS.find((c) => c.value === sort)?.label ?? null;
}

function getFormatLabel(value: string): string | null {
  if (!value) return null;
  return TEAM_FORMAT_CHIPS.find((c) => c.value === value)?.label ?? null;
}

function getStatusLabel(status: string): string | null {
  if (!status) return null;
  return STATUS_QUICK_CHIPS.find((c) => c.value === status)?.label ?? null;
}

export function MatchQuickFilters({ tab, filters, onFiltersChange }: MatchQuickFiltersProps) {
  const [activePanel, setActivePanel] = useState<FilterPanel>(null);
  const isTeamTab = tab === "team";

  useEffect(() => {
    setActivePanel(null);
  }, [tab]);

  const hasFormatFilter = isTeamTab && Boolean(filters.format);
  const hasDateFilter = Boolean(getActiveDateLabel(filters));
  const hasSortFilter = Boolean(getSortLabel(filters.sort));

  const openPanel = useCallback((panel: FilterPanel) => {
    animateRowChange();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePanel(panel);
  }, []);

  const dismissPanel = useCallback(
    (panel: Exclude<FilterPanel, null>, clearValue = true) => {
      animateRowChange();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (clearValue) {
        if (panel === "format") {
          onFiltersChange({ format: "" });
        } else if (panel === "sort") {
          onFiltersChange({ sort: "newest" });
        } else {
          onFiltersChange({ datePreset: "", dateFrom: "", dateTo: "" });
        }
      }
      setActivePanel(null);
    },
    [onFiltersChange],
  );

  const setStatus = useCallback(
    (value: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onFiltersChange({ status: filters.status === value ? "" : value });
    },
    [filters.status, onFiltersChange],
  );

  const hubCategories = useMemo(() => {
    const items: {
      id: Exclude<FilterPanel, null>;
      label: string;
      isActive: boolean;
    }[] = [];
    if (isTeamTab) {
      items.push({ id: "format", label: "Format", isActive: hasFormatFilter });
    }
    items.push(
      { id: "date", label: "Date", isActive: hasDateFilter },
      { id: "sort", label: "Sort", isActive: hasSortFilter },
    );
    return items;
  }, [hasDateFilter, hasFormatFilter, hasSortFilter, isTeamTab]);

  const summaryChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    const statusLabel = getStatusLabel(filters.status);
    if (statusLabel) {
      chips.push({
        key: "status",
        label: statusLabel,
        onClear: () => onFiltersChange({ status: "" }),
      });
    }
    if (isTeamTab) {
      const formatLabel = getFormatLabel(filters.format);
      if (formatLabel) {
        chips.push({
          key: "format",
          label: formatLabel,
          onClear: () => onFiltersChange({ format: "" }),
        });
      }
    }
    const dateLabel = getActiveDateLabel(filters);
    if (dateLabel) {
      chips.push({
        key: "date",
        label: dateLabel,
        onClear: () => onFiltersChange({ datePreset: "", dateFrom: "", dateTo: "" }),
      });
    }
    const sortLabel = getSortLabel(filters.sort);
    if (sortLabel) {
      chips.push({
        key: "sort",
        label: sortLabel,
        onClear: () => onFiltersChange({ sort: "newest" }),
      });
    }
    return chips;
  }, [filters, isTeamTab, onFiltersChange]);

  const renderAnchorPill = (panel: Exclude<FilterPanel, null>, label: string) => (
    <View style={[styles.pillWithClear, styles.pillSelected]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Close ${label} filter`}
        hitSlop={12}
        onPress={() => dismissPanel(panel)}
        style={styles.clearBtn}
      >
        <Ionicons name="close" size={13} color={t.colors.info} />
      </Pressable>
      <Text style={[styles.pillText, styles.pillTextSelected]}>{label}</Text>
    </View>
  );

  const renderHubPill = (category: (typeof hubCategories)[number]) => {
    if (category.isActive) {
      return (
        <View key={category.id} style={[styles.pillWithClear, styles.pillSelected]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${category.label} filter`}
            hitSlop={12}
            onPress={() => dismissPanel(category.id)}
            style={styles.clearBtn}
          >
            <Ionicons name="close" size={13} color={t.colors.info} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => openPanel(category.id)}
            style={({ pressed }) => [styles.pillLabelHit, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Text style={[styles.pillText, styles.pillTextSelected]} numberOfLines={1}>
              {category.label}
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <ChoiceChip
        key={category.id}
        selected={false}
        onPress={() => openPanel(category.id)}
        style={styles.pill}
        textStyle={styles.pillText}
      >
        {category.label}
      </ChoiceChip>
    );
  };

  const renderOptionChip = (
    key: string,
    label: string,
    selected: boolean,
    onPress: () => void,
    tone: "default" | "live" = "default",
  ) => (
    <ChoiceChip
      key={key}
      selected={selected}
      selectionTone={tone}
      onPress={onPress}
      style={[
        styles.pill,
        selected && tone === "default" && styles.pillActiveFill,
        selected && tone === "live" && styles.pillLiveFill,
      ]}
      textStyle={[
        styles.pillText,
        selected && tone === "default" && styles.pillTextActiveFill,
        selected && tone === "live" && styles.pillTextLiveFill,
      ]}
    >
      {label}
    </ChoiceChip>
  );

  const renderPanelRow = () => {
    if (!activePanel) return null;

    const panelLabel =
      activePanel === "format" ? "Format" : activePanel === "sort" ? "Sort" : "Date";

    let options: React.ReactNode = null;

    if (activePanel === "format") {
      options = TEAM_FORMAT_CHIPS.map((chip) =>
        renderOptionChip(
          `format-${chip.value || "all"}`,
          chip.label,
          filters.format === chip.value,
          () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFiltersChange({ format: chip.value });
          },
        ),
      );
    } else if (activePanel === "sort") {
      options = SORT_CHIPS.map((chip) =>
        renderOptionChip(
          `sort-${chip.value}`,
          chip.label,
          (filters.sort || "newest") === chip.value,
          () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFiltersChange({ sort: chip.value });
          },
        ),
      );
    } else {
      options = FEED_DATE_RANGE_CHIPS.map((chip) =>
        renderOptionChip(
          `date-${chip.value}`,
          chip.label,
          isFeedDateChipSelected(chip.value, filters),
          () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFiltersChange(buildDateFilterFromPreset(chip.value));
          },
        ),
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
      >
        {renderAnchorPill(activePanel, panelLabel)}
        {options}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
      >
        {STATUS_QUICK_CHIPS.map((chip) => {
          const selected = filters.status === chip.value;
          const isLive = chip.value === "in_progress";
          return renderOptionChip(
            `quick-${chip.value}`,
            chip.label,
            selected,
            () => setStatus(chip.value),
            isLive ? "live" : "default",
          );
        })}
      </ScrollView>

      {activePanel ? (
        <View style={styles.panelWrap}>{renderPanelRow()}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.row, styles.hubRow]}
        >
          {hubCategories.map(renderHubPill)}
        </ScrollView>
      )}

      {summaryChips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.row, styles.summaryRow]}
        >
          <Text style={styles.summaryPrefix}>Showing</Text>
          {summaryChips.map((chip) => (
            <View key={chip.key} style={styles.summaryChip}>
              <Text style={styles.summaryChipText}>{chip.label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${chip.label} filter`}
                hitSlop={10}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  chip.onClear();
                }}
                style={styles.summaryClear}
              >
                <Ionicons name="close" size={12} color={t.colors.text.secondary} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: t.spacing[3],
    gap: t.spacing[2],
  },
  panelWrap: {
    marginTop: 0,
  },
  hubRow: {
    marginTop: 0,
  },
  summaryRow: {
    alignItems: "center",
    paddingTop: t.spacing[1],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: t.spacing[4],
  },
  pill: {
    flexShrink: 0,
    height: 28,
    minHeight: 28,
    marginRight: t.spacing[2],
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderColor: t.colors.border.medium,
    backgroundColor: t.colors.white,
  },
  pillActiveFill: {
    backgroundColor: t.colors.primary[600],
    borderColor: t.colors.primary[600],
    ...t.shadows.sm,
  },
  pillLiveFill: {
    backgroundColor: t.colors.status.live,
    borderColor: t.colors.status.live,
    ...t.shadows.sm,
  },
  pillWithClear: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    height: 28,
    marginRight: t.spacing[2],
    paddingLeft: 3,
    paddingRight: 10,
    borderRadius: t.borderRadius.full,
    borderWidth: 1,
    borderColor: t.colors.border.medium,
    backgroundColor: t.colors.white,
  },
  pillSelected: {
    borderColor: t.colors.info,
  },
  pillLabelHit: {
    paddingVertical: 1,
    paddingRight: 2,
  },
  pillText: {
    fontSize: t.typography.fontSize.sm,
    fontWeight: t.typography.fontWeight.semibold,
    color: t.colors.text.secondary,
    letterSpacing: t.typography.letterSpacing.normal,
  },
  pillTextActiveFill: {
    color: t.colors.white,
    fontWeight: t.typography.fontWeight.bold,
  },
  pillTextLiveFill: {
    color: t.colors.white,
    fontWeight: t.typography.fontWeight.bold,
  },
  pillTextSelected: {
    color: t.colors.info,
    fontWeight: t.typography.fontWeight.bold,
  },
  clearBtn: {
    width: 20,
    height: 20,
    marginRight: 2,
    borderRadius: t.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.primary[50],
  },
  summaryPrefix: {
    fontSize: t.typography.fontSize.xs,
    fontWeight: t.typography.fontWeight.medium,
    color: t.colors.text.tertiary,
    marginRight: t.spacing[2],
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 24,
    marginRight: t.spacing[2],
    paddingLeft: 8,
    paddingRight: 4,
    borderRadius: t.borderRadius.full,
    backgroundColor: t.colors.background.secondary,
    borderWidth: 1,
    borderColor: t.colors.border.light,
  },
  summaryChipText: {
    fontSize: t.typography.fontSize.xs,
    fontWeight: t.typography.fontWeight.semibold,
    color: t.colors.text.secondary,
  },
  summaryClear: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
