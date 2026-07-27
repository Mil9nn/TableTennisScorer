import { TeamMatchLineupView } from "@/components/team-lineup";
import { LocationSelectRow } from "@/components/location/LocationSelectRow";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useLocationSelection } from "@/hooks/useLocationSelection";
import { useTeamLineup } from "@/features/team-lineup";
import { axiosInstance } from "@/lib/axiosInstance";
import { formatRequiresLineup } from "@/shared/match/teamLineup";
import type { TeamMatchFormat } from "@/shared/match/teamMatchTypes.core";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Pressable,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { Button } from "react-native-paper";
import * as z from "zod";
import TeamSearchInput from "./TeamSearchInput";

const schema = z
  .object({
    matchFormat: z.enum(["five_singles", "single_double_single", "custom"]),
    setsPerTie: z.enum(["1", "3", "5", "7", "9"]),
    team1Id: z.string().min(1, "Select Team 1"),
    team2Id: z.string().min(1, "Select Team 2"),
    cityId: z.string().min(1, "Select a city"),
    venueId: z.string().optional(),
    city: z.string().optional(),
    venue: z.string().optional(),
  })
  .refine((data) => data.team1Id !== data.team2Id, {
    message: "Team 1 and Team 2 cannot be the same",
    path: ["team2Id"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  endpoint: string;
}

const teamMatchFormats = [
  { value: "five_singles" as const, label: "5 Singles" },
  { value: "single_double_single" as const, label: "S–D–S" },
  { value: "custom" as const, label: "Custom" },
];

export default function TeamMatchForm({ endpoint }: Props) {
  const theme = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          paddingHorizontal: theme.spacing[4],
        },
        sectionGap: {
          gap: theme.spacing[5],
        },
        sectionTitle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        fieldLabel: {
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing[2],
        },
        segmentedControl: {
          flexDirection: "column",
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.sm,
          padding: theme.spacing[1],
          gap: theme.spacing[1],
        },
        segmentedButton: {
          paddingVertical: theme.spacing[3],
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.borderRadius.sm,
        },
        segmentedButtonActive: {
          backgroundColor: theme.colors.background.primary,
          elevation: 2,
        },
        segmentedButtonText: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
        },
        segmentedButtonTextActive: {
          color: theme.colors.info,
        },
        teamsSection: {
          gap: theme.spacing[5],
          marginTop: theme.spacing[5],
        },
        teamsList: {
          gap: theme.spacing[4],
        },
        lineupSection: {
          marginTop: theme.spacing[6],
        },
        hintText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          marginTop: theme.spacing[4],
        },
        locationSection: {
          gap: theme.spacing[5],
          marginTop: theme.spacing[6],
        },
        locationFields: {
          gap: theme.spacing[3],
        },
        submitWrapper: {
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[8],
          paddingTop: theme.spacing[4],
        },
        submitButton: {
          height: 48,
          borderRadius: theme.borderRadius.sm,
          backgroundColor: theme.colors.text.primary,
        },
        submitLabel: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.background.primary,
        },
        formatSectionGap: {
          gap: theme.spacing[6],
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
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      matchFormat: "five_singles",
      setsPerTie: "3",
      team1Id: "",
      team2Id: "",
      cityId: "",
      venueId: "",
      city: "",
      venue: "",
    },
  });

  const matchFormat = watch("matchFormat");
  const team1Id = watch("team1Id");
  const team2Id = watch("team2Id");

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

  const lineup = useTeamLineup(
    team1Id,
    team2Id,
    matchFormat as TeamMatchFormat
  );

  const showLineup =
    formatRequiresLineup(matchFormat as TeamMatchFormat) &&
    team1Id &&
    team2Id &&
    team1Id !== team2Id;

  const onSubmit = async (data: FormData) => {
    if (
      formatRequiresLineup(data.matchFormat) &&
      !lineup.validation.valid
    ) {
      Alert.alert(
        "Lineup incomplete",
        lineup.validation.errors[0] ?? "Assign all required positions."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const matchData: Record<string, unknown> = {
        matchFormat: data.matchFormat,
        setsPerTie: Number(data.setsPerTie),
        cityId: data.cityId,
        venueId: data.venueId || undefined,
        city: data.city || city?.name,
        venue: data.venue || venue?.name || undefined,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
      };

      if (formatRequiresLineup(data.matchFormat)) {
        const { team1Assignments, team2Assignments } =
          lineup.getAssignmentPayload();
        matchData.team1Assignments = team1Assignments;
        matchData.team2Assignments = team2Assignments;
      }

      const response = await axiosInstance.post(endpoint, matchData);
      const matchId = response.data.match._id;
      Alert.alert("Success", "Team match created successfully!");
      if (data.matchFormat === "custom") {
        router.push(`/match/${matchId}/setup?category=team` as any);
      } else {
        router.push(`/match/${matchId}?category=team` as any);
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error || "Failed to create team match"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View>
      <View style={styles.content}>
        <View style={styles.sectionGap}>
          <Text style={styles.sectionTitle}>Tie Format</Text>

          <View style={styles.formatSectionGap}>
            <View>
              <Text style={styles.fieldLabel}>Structure</Text>
              <Controller
                control={control}
                name="matchFormat"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.segmentedControl}>
                    {teamMatchFormats.map((format) => {
                      const isActive = value === format.value;
                      return (
                        <Pressable
                          key={format.value}
                          onPress={() => {
                            onChange(format.value);
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                          }}
                          style={[
                            styles.segmentedButton,
                            isActive && styles.segmentedButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.segmentedButtonText,
                              isActive && styles.segmentedButtonTextActive,
                            ]}
                          >
                            {format.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </View>

            <View>
              <Text style={styles.fieldLabel}>Best of (per sub-match)</Text>
              <Controller
                control={control}
                name="setsPerTie"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.segmentedControl}>
                    {["1", "3", "5", "7", "9"].map((n) => {
                      const isActive = value === n;
                      return (
                        <Pressable
                          key={n}
                          onPress={() => {
                            onChange(n as FormData["setsPerTie"]);
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                          }}
                          style={[
                            styles.segmentedButton,
                            isActive && styles.segmentedButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.segmentedButtonText,
                              isActive && styles.segmentedButtonTextActive,
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
          </View>
        </View>

        <View style={styles.teamsSection}>
          <Text style={styles.sectionTitle}>Teams</Text>

          <View style={styles.teamsList}>
            {["Team A", "Team B"].map((team, idx) => (
              <View key={team}>
                <Text style={styles.fieldLabel}>{team}</Text>
                <Controller
                  control={control}
                  name={idx === 0 ? "team1Id" : "team2Id"}
                  render={({ field: { onChange } }) => (
                    <TeamSearchInput
                      placeholder={`Search ${team}`}
                      onSelect={(t: { _id: string }) => onChange(t._id)}
                    />
                  )}
                />
              </View>
            ))}
          </View>
        </View>

        {showLineup && (
          <View style={styles.lineupSection}>
            <TeamMatchLineupView lineup={lineup} />
          </View>
        )}

        {matchFormat === "custom" && (
          <Text style={styles.hintText}>
            Configure rubbers after creating the tie.
          </Text>
        )}

        <View style={styles.locationSection}>
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
      </View>

      <View style={styles.submitWrapper}>
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          disabled={
            isSubmitting ||
            (Boolean(showLineup) && !lineup.validation.valid)
          }
          loading={isSubmitting}
          style={styles.submitButton}
          contentStyle={{ height: 48 }}
          labelStyle={styles.submitLabel}
        >
          Create team match
        </Button>
      </View>
    </View>
  );
}
