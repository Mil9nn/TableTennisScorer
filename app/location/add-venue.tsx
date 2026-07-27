import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/Button";
import { FormTextField } from "@/components/ui/FormTextField";
import { Icon } from "@/components/ui/Icon";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useLocationPickerStore } from "@/hooks/useLocationPickerStore";
import type { PickedVenue } from "@/lib/location/types";

function asParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

type IndoorOutdoor = "indoor" | "outdoor" | "mixed";

const INDOOR_OPTIONS: { id: IndoorOutdoor; label: string }[] = [
  { id: "indoor", label: "Indoor" },
  { id: "outdoor", label: "Outdoor" },
  { id: "mixed", label: "Mixed" },
];

export default function AddVenueScreen() {
  const theme = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    cityId?: string;
    cityLabel?: string;
  }>();
  const cityId = asParam(params.cityId);
  const cityLabel = asParam(params.cityLabel) || "Selected city";
  const setVenueResult = useLocationPickerStore((s) => s.setVenueResult);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [tableCount, setTableCount] = useState("");
  const [indoorOutdoor, setIndoorOutdoor] = useState<IndoorOutdoor | null>(null);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

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
        content: {
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[6],
          gap: theme.spacing[4],
        },
        label: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing[2],
        },
        chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
        chip: {
          minHeight: 40,
          paddingHorizontal: theme.spacing[4],
          borderRadius: theme.borderRadius.full,
          borderWidth: 1,
          borderColor: theme.colors.border.medium,
          backgroundColor: theme.colors.background.secondary,
          alignItems: "center",
          justifyContent: "center",
        },
        chipActive: {
          borderColor: theme.colors.info,
          backgroundColor: theme.colors.background.primary,
        },
        chipText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          fontWeight: theme.typography.fontWeight.medium,
        },
        chipTextActive: {
          color: theme.colors.info,
        },
        footer: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border.light,
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[3],
          paddingBottom: theme.spacing[2],
          backgroundColor: theme.colors.background.primary,
        },
      }),
    [theme],
  );

  const onSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameError("Venue name must be at least 2 characters");
      return;
    }
    if (!cityId) {
      Toast.show({ type: "error", text1: "Select a city first" });
      return;
    }

    setNameError(undefined);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        cityId,
        name: trimmed,
      };
      if (address.trim()) payload.address = address.trim();
      const tables = Number(tableCount);
      if (tableCount.trim() && Number.isFinite(tables) && tables >= 1) {
        payload.tableCount = Math.floor(tables);
      }
      if (indoorOutdoor) payload.indoorOutdoor = indoorOutdoor;

      const res = await axiosInstance.post("/venues", payload);
      const venue = res.data?.venue as PickedVenue | undefined;
      if (!venue?._id) {
        throw new Error("Invalid response");
      }

      setVenueResult(venue);
      Toast.show({ type: "success", text1: "Venue added" });
      // Pop add-venue + leave venue-picker result for the create form
      if (router.canDismiss()) {
        router.dismiss(2);
      } else {
        router.back();
        router.back();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not create venue";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Icon name="chevron-left" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Add new venue</Text>
          <Text style={styles.cityHint}>{cityLabel}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <FormTextField
            label="Venue name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. KC Sports Club"
            error={nameError}
            autoFocus
          />

          <FormTextField
            label="Address (optional)"
            value={address}
            onChangeText={setAddress}
            placeholder="Street / landmark"
          />

          <FormTextField
            label="Number of tables (optional)"
            value={tableCount}
            onChangeText={setTableCount}
            placeholder="e.g. 8"
            keyboardType="number-pad"
          />

          <View>
            <Text style={styles.label}>Indoor / Outdoor (optional)</Text>
            <View style={styles.chips}>
              {INDOOR_OPTIONS.map((opt) => {
                const active = indoorOutdoor === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() =>
                      setIndoorOutdoor((prev) =>
                        prev === opt.id ? null : opt.id,
                      )
                    }
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            fullWidth
            size="lg"
            loading={saving}
            disabled={saving || name.trim().length < 2}
            onPress={() => void onSave()}
          >
            Save venue
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
