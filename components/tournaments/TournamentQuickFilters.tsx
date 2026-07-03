/**
 * Tournament feed quick filters — same hub + panel layout as MatchQuickFilters.
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
import React, { useCallback, useMemo, useState } from "react";
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

type FilterPanel = "format" | "status" | "sort" | "date" | null;

export interface TournamentQuickFilterValues {
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

interface TournamentQuickFiltersProps {
  filters: TournamentQuickFilterValues;
  onFiltersChange: (updates: Partial<TournamentQuickFilterValues>) => void;
}

const STATUS_CHIPS: ChipOption[] = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const FORMAT_CHIPS: ChipOption[] = [
  { label: "All", value: "" },
  { label: "Round Robin", value: "round_robin" },
  { label: "Knockout", value: "knockout" },
  { label: "Hybrid", value: "hybrid" },
];

const SORT_CHIPS: ChipOption[] = [
  { label: "Most Recent", value: "recent" },
  { label: "Upcoming", value: "upcoming" },
  { label: "A-Z", value: "name" },
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
  f: Pick<TournamentQuickFilterValues, "datePreset" | "dateFrom" | "dateTo">
): boolean {
  if (value === "all") {
    return !f.dateFrom?.trim() && !f.dateTo?.trim();
  }
  return f.datePreset === value;
}

function getActiveDateLabel(filters: TournamentQuickFilterValues): string | null {
  const match = FEED_DATE_RANGE_CHIPS.find((chip) =>
    isFeedDateChipSelected(chip.value, filters)
  );
  if (!match || match.value === "all") return null;
  return match.label;
}

export function TournamentQuickFilters({ filters, onFiltersChange }: TournamentQuickFiltersProps) {
  const [activePanel, setActivePanel] = useState<FilterPanel>(null);

  const hasFormatFilter = Boolean(filters.format);
  const hasStatusFilter = Boolean(filters.status);
  const hasSortFilter = Boolean(filters.sort && filters.sort !== "recent");
  const hasDateFilter = Boolean(getActiveDateLabel(filters));

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
        } else if (panel === "status") {
          onFiltersChange({ status: "" });
        } else if (panel === "sort") {
          onFiltersChange({ sort: "recent" });
        } else {
          onFiltersChange({ datePreset: "", dateFrom: "", dateTo: "" });
        }
      }
      setActivePanel(null);
    },
    [onFiltersChange]
  );

  const hubCategories = useMemo(
    () =>
      [
        { id: "format" as const, label: "Format", isActive: hasFormatFilter },
        { id: "status" as const, label: "Status", isActive: hasStatusFilter },
        { id: "sort" as const, label: "Sort", isActive: hasSortFilter },
        { id: "date" as const, label: "Date", isActive: hasDateFilter },
      ] satisfies {
        id: Exclude<FilterPanel, null>;
        label: string;
        isActive: boolean;
      }[],
    [hasDateFilter, hasFormatFilter, hasSortFilter, hasStatusFilter]
  );

  const renderAnchorPill = (panel: Exclude<FilterPanel, null>, label: string) => (
    <View style={[styles.pillWithClear, styles.pillSelected]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Close ${label} filter`}
        hitSlop={8}
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
            hitSlop={8}
            onPress={() => dismissPanel(category.id)}
            style={styles.clearBtn}
          >
            <Ionicons name="close" size={13} color={t.colors.info} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => openPanel(category.id)}
            style={({ pressed }) => [styles.pillLabelHit, pressed && styles.pressed]}
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
    tone: "default" | "live" = "default"
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
      activePanel === "format"
        ? "Format"
        : activePanel === "status"
          ? "Status"
          : activePanel === "sort"
            ? "Sort"
            : "Date";

    let options: React.ReactNode = null;

    if (activePanel === "format") {
      options = FORMAT_CHIPS.map((chip) =>
        renderOptionChip(
          `format-${chip.value || "all"}`,
          chip.label,
          filters.format === chip.value,
          () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFiltersChange({ format: chip.value });
          }
        )
      );
    } else if (activePanel === "status") {
      options = STATUS_CHIPS.map((chip) =>
        renderOptionChip(
          `status-${chip.value || "all"}`,
          chip.label,
          filters.status === chip.value,
          () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFiltersChange({ status: chip.value });
          },
          chip.value === "active" ? "live" : "default"
        )
      );
    } else if (activePanel === "sort") {
      options = SORT_CHIPS.map((chip) =>
        renderOptionChip(
          `sort-${chip.value}`,
          chip.label,
          filters.sort === chip.value,
          () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFiltersChange({ sort: chip.value });
          }
        )
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
          }
        )
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
      {activePanel ? (
        renderPanelRow()
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.row}
        >
          {hubCategories.map(renderHubPill)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: t.spacing[3],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: t.spacing[4],
  },
  pill: {
    flexShrink: 0,
    height: 32,
    minHeight: 32,
    marginRight: t.spacing[2],
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderColor: t.colors.border.medium,
    backgroundColor: t.colors.white,
  },
  pillActiveFill: {
    backgroundColor: t.colors.primary[600],
    borderColor: t.colors.primary[600],
    ...t.shadows.base,
  },
  pillLiveFill: {
    backgroundColor: t.colors.status.live,
    borderColor: t.colors.status.live,
    ...t.shadows.base,
  },
  pillWithClear: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    marginRight: t.spacing[2],
    paddingLeft: 4,
    paddingRight: 12,
    borderRadius: t.borderRadius.full,
    borderWidth: 1,
    borderColor: t.colors.border.medium,
    backgroundColor: t.colors.white,
  },
  pillSelected: {
    borderColor: t.colors.info,
  },
  pillLabelHit: {
    paddingVertical: 2,
    paddingRight: 2,
  },
  pillText: {
    fontSize: t.typography.fontSize.base,
    fontWeight: t.typography.fontWeight.semibold,
    color: t.colors.text.secondary,
    letterSpacing: t.typography.letterSpacing.wide,
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
    marginRight: 3,
    borderRadius: t.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.primary[50],
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
