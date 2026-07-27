import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { axiosInstance } from "@/lib/axiosInstance";
import { SearchInput } from "@/components/ui/SearchInput";
import { Icon } from "@/components/ui/Icon";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useLocationPickerStore } from "@/hooks/useLocationPickerStore";
import type { PickedCity } from "@/lib/location/types";

type CityApiItem = PickedCity;

export default function CityPickerScreen() {
  const theme = useThemeColors();
  const router = useRouter();
  const setCityResult = useLocationPickerStore((s) => s.setCityResult);

  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<CityApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.colors.background.primary },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[2],
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.light,
          gap: theme.spacing[2],
        },
        backBtn: {
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          flex: 1,
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        searchWrap: {
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
        },
        listContent: {
          paddingHorizontal: theme.spacing[2],
          paddingBottom: theme.spacing[4],
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
      }),
    [theme],
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
    const handle = setTimeout(() => {
      void fetchCities(query);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, fetchCities]);

  const onSelect = (city: CityApiItem) => {
    setCityResult(city);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Icon name="x" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Select city</Text>
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
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              style={({ pressed }) => [
                styles.rowPressable,
                pressed && {
                  backgroundColor: theme.colors.background.secondary,
                },
              ]}
            >
              <View style={styles.row} className="flex-row items-center">
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={20}
                    color={theme.colors.text.tertiary}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.subtitle}>
                    {item.state} ({item.stateCode})
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
