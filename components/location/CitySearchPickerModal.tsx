/**
 * Searchable city picker modal for feed filters.
 * Queries /cities so the list can scale beyond chip strips.
 */
import { SearchInput } from "@/components/ui/SearchInput";
import { Icon } from "@/components/ui/Icon";
import { useThemeColors } from "@/hooks/useThemeColors";
import { axiosInstance } from "@/lib/axiosInstance";
import type { PickedCity } from "@/lib/location/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CitySearchPickerModalProps = {
  visible: boolean;
  selectedCity?: string;
  onClose: () => void;
  onSelect: (cityName: string) => void;
  onClear: () => void;
};

export function CitySearchPickerModal({
  visible,
  selectedCity = "",
  onClose,
  onSelect,
  onClear,
}: CitySearchPickerModalProps) {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<PickedCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        },
        sheet: {
          maxHeight: "78%",
          backgroundColor: theme.colors.background.primary,
          borderTopLeftRadius: theme.borderRadius["2xl"],
          borderTopRightRadius: theme.borderRadius["2xl"],
          paddingBottom: Math.max(insets.bottom, theme.spacing[3]),
          ...theme.shadows.lg,
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.border.medium,
          marginTop: theme.spacing[2],
          marginBottom: theme.spacing[1],
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[2],
          gap: theme.spacing[2],
        },
        title: {
          flex: 1,
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        closeBtn: {
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        },
        searchWrap: {
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[2],
        },
        clearRow: {
          minHeight: 48,
          marginHorizontal: theme.spacing[4],
          marginBottom: theme.spacing[1],
          paddingHorizontal: theme.spacing[3],
          borderRadius: theme.borderRadius.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
          backgroundColor: !selectedCity
            ? theme.colors.primary[50]
            : theme.colors.background.secondary,
          borderWidth: 1,
          borderColor: !selectedCity
            ? theme.colors.primary[200]
            : theme.colors.border.light,
        },
        clearText: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: !selectedCity
            ? theme.colors.primary[700]
            : theme.colors.text.secondary,
        },
        listContent: {
          paddingHorizontal: theme.spacing[2],
          paddingBottom: theme.spacing[2],
        },
        rowPressable: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.light,
        },
        row: {
          minHeight: 56,
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
          flexDirection: "row",
          alignItems: "center",
        },
        iconWrap: {
          width: 28,
          height: 28,
          marginRight: theme.spacing[3],
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        },
        rowText: {
          flex: 1,
          flexShrink: 1,
        },
        name: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
        },
        subtitle: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          marginTop: 2,
        },
        empty: {
          padding: theme.spacing[8],
          alignItems: "center",
        },
        emptyText: {
          color: theme.colors.text.tertiary,
          fontSize: theme.typography.fontSize.sm,
          textAlign: "center",
        },
        check: {
          marginLeft: theme.spacing[2],
        },
      }),
    [theme, insets.bottom, selectedCity],
  );

  const fetchCities = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/cities", {
        params: { q: q.trim() || undefined, limit: 40 },
      });
      setCities(res.data?.cities ?? []);
    } catch {
      setError("Could not load cities. Try again.");
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      return;
    }
    const handle = setTimeout(() => {
      void fetchCities(query);
    }, 250);
    return () => clearTimeout(handle);
  }, [visible, query, fetchCities]);

  const handleSelect = (city: PickedCity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(city.name);
    onClose();
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClear();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Filter by city</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <Icon name="x" size={22} color={theme.colors.text.primary} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <SearchInput
              autoFocus
              placeholder="Search city…"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [styles.clearRow, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel="Any city"
          >
            <MaterialCommunityIcons
              name="earth"
              size={18}
              color={
                !selectedCity
                  ? theme.colors.primary[700]
                  : theme.colors.text.tertiary
              }
            />
            <Text style={styles.clearText}>Any city</Text>
            {!selectedCity ? (
              <Icon
                name="check"
                size={18}
                color={theme.colors.primary[700]}
                style={styles.check}
              />
            ) : null}
          </Pressable>

          {loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={theme.colors.info} />
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={cities}
              keyExtractor={(item) => item._id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No cities match your search.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const selected = selectedCity === item.name;
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => [
                      styles.rowPressable,
                      (pressed || selected) && {
                        backgroundColor: theme.colors.background.secondary,
                      },
                    ]}
                  >
                    <View style={styles.row}>
                      <View style={styles.iconWrap}>
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={20}
                          color={
                            selected
                              ? theme.colors.primary[600]
                              : theme.colors.text.tertiary
                          }
                        />
                      </View>
                      <View style={styles.rowText}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.subtitle}>
                          {item.state} ({item.stateCode})
                        </Text>
                      </View>
                      {selected ? (
                        <Icon
                          name="check"
                          size={18}
                          color={theme.colors.primary[600]}
                          style={styles.check}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
