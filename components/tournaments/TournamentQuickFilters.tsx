/**
 * Tournament feed quick filters — Live/Upcoming/Completed/Mine + hub panels.
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

type FilterPanel = "format" | "sort" | "date" | null;

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
  /** Show Mine chip when user is signed in. */
  showMine?: boolean;
}

const STATUS_QUICK_CHIPS: ChipOption[] = [
  { label: "Live", value: "in_progress" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
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
  f: Pick<TournamentQuickFilterValues, "datePreset" | "dateFrom" | "dateTo">,
): boolean {
  if (value === "all") {
    return !f.dateFrom?.trim() && !f.dateTo?.trim();
  }
  return f.datePreset === value;
}

function getActiveDateLabel(filters: TournamentQuickFilterValues): string | null {
  const match = FEED_DATE_RANGE_CHIPS.find((chip) =>
    isFeedDateChipSelected(chip.value, filters),
  );
  if (!match || match.value === "all") return null;
  return match.label;
}

function getSortLabel(sort: string): string | null {
  if (!sort || sort === "recent") return null;
  return SORT_CHIPS.find((c) => c.value === sort)?.label ?? null;
}

function getFormatLabel(value: string): string | null {
  if (!value) return null;
  return FORMAT_CHIPS.find((c) => c.value === value)?.label ?? null;
}

function getStatusLabel(status: string): string | null {
  if (!status) return null;
  if (status === "mine") return "Mine";
  return (
    STATUS_QUICK_CHIPS.find((c) => c.value === status)?.label ??
    status.charAt(0).toUpperCase() + status.slice(1)
  );
}

export function TournamentQuickFilters({
  filters,
  onFiltersChange,
  showMine = false,
}: TournamentQuickFiltersProps) {
  const [activePanel, setActivePanel] = useState<FilterPanel>(null);

  const hasFormatFilter = Boolean(filters.format);
  const hasSortFilter = Boolean(getSortLabel(filters.sort));
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
        if (panel === "format") onFiltersChange({ format: "" });
        else if (panel === "sort") onFiltersChange({ sort: "recent" });
        else onFiltersChange({ datePreset: "", dateFrom: "", dateTo: "" });
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

  const hubCategories = useMemo(
    () =>
      [
        { id: "format" as const, label: "Format", isActive: hasFormatFilter },
        { id: "date" as const, label: "Date", isActive: hasDateFilter },
        { id: "sort" as const, label: "Sort", isActive: hasSortFilter },
      ] satisfies {
        id: Exclude<FilterPanel, null>;
        label: string;
        isActive: boolean;
      }[],
    [hasDateFilter, hasFormatFilter, hasSortFilter],
  );

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
    const formatLabel = getFormatLabel(filters.format);
    if (formatLabel) {
      chips.push({
        key: "format",
        label: formatLabel,
        onClear: () => onFiltersChange({ format: "" }),
      });
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
        onClear: () => onFiltersChange({ sort: "recent" }),
      });
    }
    return chips;
  }, [filters, onFiltersChange]);

  const renderAnchorPill = (panel: Exclude<FilterPanel, null>, label: string) => (
    <View style={[styles.pillWithClear, styles.pillSelected]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Close ${label} filter`}
        hitSlop={12}
        onPress={() => dismissPanel(panel)}
        style={styles.clearBtn}
      >
        <Ionicons name="close" size={12} color={t.colors.info} />
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
            <Ionicons name="close" size={12} color={t.colors.info} />
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
      options = FORMAT_CHIPS.map((chip) =>
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
          filters.sort === chip.value,
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

  const quickChips = useMemo(() => {
    const chips = [...STATUS_QUICK_CHIPS];
    if (showMine) chips.push({ label: "Mine", value: "mine" });
    return chips;
  }, [showMine]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
      >
        {quickChips.map((chip) => {
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
        <View>{renderPanelRow()}</View>
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
