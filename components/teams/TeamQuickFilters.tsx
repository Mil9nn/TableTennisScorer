/**
 * Teams feed quick filters — Open / Mine / city modal / sort chips.
 */
import { CitySearchPickerModal } from "@/components/location/CitySearchPickerModal";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { DesignTokens } from "@/constants/designTokens";
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

type FilterPanel = "sort" | null;

export interface TeamQuickFilterValues {
  /** "" | "open" */
  openness: string;
  /** "" | "mine" */
  membership: string;
  city: string;
  sort: string;
}

interface TeamQuickFiltersProps {
  filters: TeamQuickFilterValues;
  onFiltersChange: (updates: Partial<TeamQuickFilterValues>) => void;
  /** Show Mine chip when user is signed in. */
  showMine?: boolean;
}

const OPENNESS_CHIPS = [{ label: "Open", value: "open" }];

const SORT_CHIPS = [
  { label: "A–Z", value: "name" },
  { label: "Newest", value: "createdAt" },
  { label: "Most players", value: "players" },
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

export function TeamQuickFilters({
  filters,
  onFiltersChange,
  showMine = false,
}: TeamQuickFiltersProps) {
  const [activePanel, setActivePanel] = useState<FilterPanel>(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const hasCityFilter = Boolean(filters.city);
  const hasSortFilter = Boolean(filters.sort && filters.sort !== "name");

  const scopeChips = useMemo(() => {
    const chips = [...OPENNESS_CHIPS];
    if (showMine) chips.push({ label: "Mine", value: "mine" });
    return chips;
  }, [showMine]);

  const openSortPanel = useCallback(() => {
    animateRowChange();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePanel("sort");
  }, []);

  const openCityPicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePanel(null);
    setCityPickerOpen(true);
  }, []);

  const clearCity = useCallback(() => {
    animateRowChange();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFiltersChange({ city: "" });
  }, [onFiltersChange]);

  const dismissSortPanel = useCallback(
    (clearValue = true) => {
      animateRowChange();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (clearValue) onFiltersChange({ sort: "name" });
      setActivePanel(null);
    },
    [onFiltersChange],
  );

  const summaryChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (filters.openness === "open") {
      chips.push({
        key: "open",
        label: "Open",
        onClear: () => onFiltersChange({ openness: "" }),
      });
    }
    if (filters.membership === "mine") {
      chips.push({
        key: "mine",
        label: "Mine",
        onClear: () => onFiltersChange({ membership: "" }),
      });
    }
    if (filters.city) {
      chips.push({
        key: "city",
        label: filters.city,
        onClear: () => onFiltersChange({ city: "" }),
      });
    }
    if (filters.sort && filters.sort !== "name") {
      const sortLabel = SORT_CHIPS.find((c) => c.value === filters.sort)?.label;
      if (sortLabel) {
        chips.push({
          key: "sort",
          label: sortLabel,
          onClear: () => onFiltersChange({ sort: "name" }),
        });
      }
    }
    return chips;
  }, [filters, onFiltersChange]);

  const renderOptionChip = (
    key: string,
    label: string,
    selected: boolean,
    onPress: () => void,
  ) => (
    <ChoiceChip
      key={key}
      selected={selected}
      onPress={onPress}
      style={[styles.pill, selected && styles.pillActiveFill]}
      textStyle={[styles.pillText, selected && styles.pillTextActiveFill]}
    >
      {label}
    </ChoiceChip>
  );

  const renderCityPill = () => {
    if (hasCityFilter) {
      return (
        <View style={[styles.pillWithClear, styles.pillSelected]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear city"
            hitSlop={12}
            onPress={clearCity}
            style={styles.clearBtn}
          >
            <Ionicons name="close" size={12} color={t.colors.info} />
          </Pressable>
          <Pressable
            onPress={openCityPicker}
            style={({ pressed }) => [styles.pillLabelHit, pressed && styles.pressed]}
          >
            <Text style={[styles.pillText, styles.pillTextSelected]} numberOfLines={1}>
              {filters.city}
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <ChoiceChip
        selected={false}
        onPress={openCityPicker}
        style={styles.pill}
        textStyle={styles.pillText}
      >
        City
      </ChoiceChip>
    );
  };

  const renderSortPill = () => {
    if (hasSortFilter) {
      return (
        <View style={[styles.pillWithClear, styles.pillSelected]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear sort"
            hitSlop={12}
            onPress={() => dismissSortPanel(true)}
            style={styles.clearBtn}
          >
            <Ionicons name="close" size={12} color={t.colors.info} />
          </Pressable>
          <Pressable
            onPress={openSortPanel}
            style={({ pressed }) => [styles.pillLabelHit, pressed && styles.pressed]}
          >
            <Text style={[styles.pillText, styles.pillTextSelected]} numberOfLines={1}>
              Sort
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <ChoiceChip
        selected={false}
        onPress={openSortPanel}
        style={styles.pill}
        textStyle={styles.pillText}
      >
        Sort
      </ChoiceChip>
    );
  };

  const renderSortPanel = () => {
    if (activePanel !== "sort") return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
      >
        <View style={[styles.pillWithClear, styles.pillSelected]}>
          <Pressable
            hitSlop={12}
            onPress={() => dismissSortPanel(false)}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Close sort"
          >
            <Ionicons name="close" size={12} color={t.colors.info} />
          </Pressable>
          <Text style={[styles.pillText, styles.pillTextSelected]}>Sort</Text>
        </View>
        {SORT_CHIPS.map((chip) =>
          renderOptionChip(
            `sort-${chip.value}`,
            chip.label,
            (filters.sort || "name") === chip.value,
            () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFiltersChange({ sort: chip.value });
            },
          ),
        )}
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
        {scopeChips.map((chip) => {
          const selected =
            chip.value === "mine"
              ? filters.membership === "mine"
              : filters.openness === chip.value;
          return renderOptionChip(`scope-${chip.value}`, chip.label, selected, () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (chip.value === "mine") {
              onFiltersChange({
                membership: filters.membership === "mine" ? "" : "mine",
              });
              return;
            }
            onFiltersChange({
              openness: filters.openness === chip.value ? "" : chip.value,
            });
          });
        })}
      </ScrollView>

      {activePanel === "sort" ? (
        <View>{renderSortPanel()}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.row}
        >
          {renderCityPill()}
          {renderSortPill()}
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
                hitSlop={10}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  chip.onClear();
                }}
                style={styles.summaryClear}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${chip.label}`}
              >
                <Ionicons name="close" size={12} color={t.colors.text.secondary} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <CitySearchPickerModal
        visible={cityPickerOpen}
        selectedCity={filters.city}
        onClose={() => setCityPickerOpen(false)}
        onSelect={(cityName) => onFiltersChange({ city: cityName })}
        onClear={() => onFiltersChange({ city: "" })}
      />
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
    maxWidth: 160,
  },
  pillSelected: {
    borderColor: t.colors.info,
  },
  pillLabelHit: {
    paddingVertical: 1,
    paddingRight: 2,
    flexShrink: 1,
  },
  pillText: {
    fontSize: t.typography.fontSize.sm,
    fontWeight: t.typography.fontWeight.semibold,
    color: t.colors.text.secondary,
  },
  pillTextActiveFill: {
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
