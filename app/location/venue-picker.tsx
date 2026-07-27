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
import { useLocalSearchParams, useRouter } from "expo-router";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Icon } from "@/components/ui/Icon";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useLocationPickerStore } from "@/hooks/useLocationPickerStore";
import type { PickedVenue } from "@/lib/location/types";

function asParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function VenuePickerScreen() {
  const theme = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    cityId?: string;
    cityLabel?: string;
  }>();
  const cityId = asParam(params.cityId);
  const cityLabel = asParam(params.cityLabel) || "Selected city";
  const setVenueResult = useLocationPickerStore((s) => s.setVenueResult);

  const [query, setQuery] = useState("");
  const [venues, setVenues] = useState<PickedVenue[]>([]);
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
        titleBlock: { flex: 1 },
        title: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        cityHint: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          marginTop: 2,
        },
        searchWrap: {
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[2],
          gap: theme.spacing[3],
        },
        row: {
          minHeight: 64,
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.light,
          gap: 4,
        },
        name: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
        },
        meta: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
        },
        badge: {
          alignSelf: "flex-start",
          marginTop: 4,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.background.secondary,
        },
        badgeText: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.secondary,
          fontWeight: theme.typography.fontWeight.medium,
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

  const fetchVenues = useCallback(
    async (q: string) => {
      if (!cityId) {
        setError("Select a city first.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get("/venues", {
          params: {
            cityId,
            q: q.trim() || undefined,
            limit: 40,
          },
        });
        setVenues(res.data?.venues ?? []);
      } catch {
        setError("Could not load venues. Try again.");
        setVenues([]);
      } finally {
        setLoading(false);
      }
    },
    [cityId],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      void fetchVenues(query);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, fetchVenues]);

  const onSelect = (venue: PickedVenue) => {
    setVenueResult(venue);
    router.back();
  };

  const openAddVenue = () => {
    router.push({
      pathname: "/location/add-venue",
      params: { cityId, cityLabel },
    });
  };

  const venueSubtitle = (venue: PickedVenue) => {
    const bits: string[] = [];
    if (venue.address) bits.push(venue.address);
    if (venue.tableCount) bits.push(`${venue.tableCount} tables`);
    if (venue.indoorOutdoor) bits.push(venue.indoorOutdoor);
    return bits.join(" · ");
  };

  const renderAddVenueCta = () => (
    <Button fullWidth size="lg" onPress={openAddVenue}>
      Add new venue
    </Button>
  );

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
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Select venue</Text>
          <Text style={styles.cityHint}>{cityLabel}</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <SearchInput
          autoFocus
          placeholder="Search venue…"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {renderAddVenueCta()}
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={theme.colors.info} />
          </View>
        ) : error ? (
          <View style={[styles.empty, { flex: 1 }]}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={venues}
            keyExtractor={(item) => item._id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: theme.spacing[2] }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  No venues yet for this city. Add the first one above.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: theme.colors.background.secondary },
                ]}
              >
                <Text style={styles.name}>{item.name}</Text>
                {venueSubtitle(item) ? (
                  <Text style={styles.meta}>{venueSubtitle(item)}</Text>
                ) : (
                  <Text style={styles.meta}>{item.city}</Text>
                )}
                {item.isOfficial ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Official venue</Text>
                  </View>
                ) : null}
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
