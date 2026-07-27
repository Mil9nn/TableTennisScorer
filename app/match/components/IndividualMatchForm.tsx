import { axiosInstance } from "@/lib/axiosInstance";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import * as z from "zod";
import { LocationSelectRow } from "@/components/location/LocationSelectRow";
import UserSearchInput from "./UserSearchInput";
import { getCreateFlowChoiceStyles } from "@/styles/createFlowChoiceStyles";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useLocationSelection } from "@/hooks/useLocationSelection";

const userSchema = z.object({
  _id: z.string(),
  username: z.string().min(1),
  fullName: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
});

const schema = z
  .object({
    matchType: z.enum(["singles", "doubles"]),
    numberOfSets: z.enum(["1", "3", "5", "7", "9"]),
    player1: userSchema.optional(),
    player2: userSchema.optional(),
    player3: userSchema.optional(),
    player4: userSchema.optional(),
    cityId: z.string().min(1, "Select a city"),
    venueId: z.string().optional(),
    city: z.string().optional(),
    venue: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.matchType === "singles") {
      if (!data.player1)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["player1"] });
      if (!data.player2)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["player2"] });
    } else {
      ["player1", "player2", "player3", "player4"].forEach((p) => {
        if (!data[p as keyof typeof data])
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: [p] });
      });
    }
  });

type FormData = z.infer<typeof schema>;

interface Props {
  endpoint: string;
}

const matchTypeOptions = [
  { label: "Singles", val: "singles" as const, icon: "person" as const },
  { label: "Doubles", val: "doubles" as const, icon: "groups" as const },
];

export default function IndividualMatchForm({ endpoint }: Props) {
  const theme = useThemeColors();
  const createFlowChoiceStyles = useMemo(
    () => getCreateFlowChoiceStyles(theme),
    [theme],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[8],
        },
        section: {
          paddingVertical: theme.spacing[3],
        },
        sectionTitle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[3],
        },
        sectionSubtitle: {
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing[4],
        },
        errorText: {
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.error,
        },
        singlesPlayerList: {
          gap: theme.spacing[8],
        },
        doublesContainer: {
          gap: theme.spacing[4],
        },
        doublesTeamCard: {
          backgroundColor: theme.colors.background.secondary,
          padding: theme.spacing[3],
        },
        doublesTeamLabel: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing[3],
        },
        doublesPlayerList: {
          gap: theme.spacing[3],
        },
        locationFields: {
          gap: theme.spacing[3],
        },
        submitWrapper: {
          paddingBottom: theme.spacing[2],
          paddingTop: theme.spacing[4],
        },
        submitButton: {
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.borderRadius.sm,
          backgroundColor: theme.colors.text.primary,
        },
        submitButtonDisabled: {
          backgroundColor: theme.colors.gray[300],
        },
        submitButtonText: {
          color: theme.colors.background.primary,
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.medium,
        },
      }),
    [theme],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const {
    city,
    venue,
    openCityPicker,
    openVenuePicker,
    cityLabel,
    venueLabel,
    venueSubtitle,
  } = useLocationSelection();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      matchType: "singles",
      numberOfSets: "3",
      cityId: "",
      venueId: "",
      city: "",
      venue: "",
    },
  });

  const matchType = watch("matchType");

  useEffect(() => {
    setValue("cityId", city?._id ?? "", { shouldValidate: Boolean(city) });
    setValue("city", city?.name ?? "");
    if (!city) {
      setValue("venueId", "");
      setValue("venue", "");
    }
  }, [city, setValue]);

  useEffect(() => {
    setValue("venueId", venue?._id ?? "");
    setValue("venue", venue?.name ?? "");
  }, [venue, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        matchType: data.matchType,
        numberOfSets: Number(data.numberOfSets),
        cityId: data.cityId,
        venueId: data.venueId || undefined,
        city: data.city || city?.name,
        venue: data.venue || venue?.name || undefined,
        participants:
          data.matchType === "singles"
            ? [data.player1!._id, data.player2!._id]
            : [data.player1!._id, data.player2!._id, data.player3!._id, data.player4!._id],
      };
      const res = await axiosInstance.post(endpoint, payload);
      router.push(`/match/${res.data.match._id}?category=individual` as any);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to create match");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Match Format */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match format</Text>
        <Text style={createFlowChoiceStyles.sectionLabel}>Match type</Text>
        <Controller
          control={control}
          name="matchType"
          render={({ field: { onChange, value } }) => (
            <View style={createFlowChoiceStyles.segmentedControlContainer}>
              {matchTypeOptions.map((opt) => {
                const isActive = value === opt.val;
                return (
                  <Pressable
                    key={opt.val}
                    onPress={() => onChange(opt.val)}
                    style={[
                      createFlowChoiceStyles.segmentedButton,
                      isActive && createFlowChoiceStyles.segmentedButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        createFlowChoiceStyles.segmentedButtonText,
                        isActive && createFlowChoiceStyles.segmentedButtonTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />

        <Text style={createFlowChoiceStyles.sectionLabel}>Best of</Text>
        <Controller
          control={control}
          name="numberOfSets"
          render={({ field: { onChange, value } }) => (
            <View style={createFlowChoiceStyles.segmentedControlContainer}>
              {["1", "3", "5", "7", "9"].map((n) => {
                const isActive = value === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => onChange(n)}
                    style={[
                      createFlowChoiceStyles.segmentedButton,
                      isActive && createFlowChoiceStyles.segmentedButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        createFlowChoiceStyles.segmentedButtonText,
                        isActive && createFlowChoiceStyles.segmentedButtonTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>

      {/* Players */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Players</Text>
        <Text style={styles.sectionSubtitle}>
          {matchType === "singles"
            ? "Search and select both players."
            : "Assign two players to each side."}
        </Text>

        {matchType === "singles" ? (
          <View style={styles.singlesPlayerList}>
            <UserSearchInput
              placeholder="Search player 1"
              onSelect={(u) => setValue("player1", u, { shouldValidate: true })}
            />
            {errors.player1 && (
              <Text style={styles.errorText}>Player 1 is required</Text>
            )}
            <UserSearchInput
              placeholder="Search player 2"
              onSelect={(u) => setValue("player2", u, { shouldValidate: true })}
            />
            {errors.player2 && (
              <Text style={styles.errorText}>Player 2 is required</Text>
            )}
          </View>
        ) : (
          <View style={styles.doublesContainer}>
            {["Side A", "Side B"].map((team, idx) => (
              <View key={team} style={styles.doublesTeamCard}>
                <Text style={styles.doublesTeamLabel}>{team}</Text>
                <View style={styles.doublesPlayerList}>
                  <UserSearchInput
                    placeholder="Player 1"
                    onSelect={(u) =>
                      setValue(idx === 0 ? "player1" : "player3", u, { shouldValidate: true })
                    }
                  />
                  <UserSearchInput
                    placeholder="Player 2"
                    onSelect={(u) =>
                      setValue(idx === 0 ? "player2" : "player4", u, { shouldValidate: true })
                    }
                  />
                </View>
              </View>
            ))}
            {(errors.player1 || errors.player2 || errors.player3 || errors.player4) && (
              <Text style={styles.errorText}>All four players are required for doubles.</Text>
            )}
          </View>
        )}
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationFields}>
          <LocationSelectRow
            label="City"
            value={cityLabel}
            placeholder="Search city…"
            error={errors.cityId?.message}
            onPress={openCityPicker}
          />
          <LocationSelectRow
            label="Venue (optional)"
            value={venueLabel}
            subtitle={venueSubtitle}
            placeholder={city ? "Search venue…" : "Select a city first"}
            disabled={!city}
            onPress={openVenuePicker}
          />
        </View>
      </View>

      {/* Submit */}
      <View style={styles.submitWrapper}>
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Create match</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
