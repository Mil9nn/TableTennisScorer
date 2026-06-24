import { TeamMatchLineupView } from "@/components/team-lineup";
import { FormTextField } from "@/components/ui/FormTextField";
import { DesignTokens } from "@/constants/designTokens";
import { useTeamLineup } from "@/features/team-lineup";
import { axiosInstance } from "@/lib/axiosInstance";
import { formatRequiresLineup } from "@/shared/match/teamLineup";
import type { TeamMatchFormat } from "@/shared/match/teamMatchTypes.core";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Pressable,
  Text,
  View,
  TextInput,
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
    city: z.string().min(1, "Enter city/venue"),
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const venueInputRef = useRef<TextInput>(null);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      matchFormat: "five_singles",
      setsPerTie: "3",
      team1Id: "",
      team2Id: "",
      city: "",
      venue: "",
    },
  });

  const matchFormat = watch("matchFormat");
  const team1Id = watch("team1Id");
  const team2Id = watch("team2Id");

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
        city: data.city,
        venue: data.venue || data.city,
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
      <View style={{ paddingHorizontal: DesignTokens.spacing[4] }}>
        <View style={{ gap: DesignTokens.spacing[5] }}>
          <Text
            style={{
              fontSize: DesignTokens.typography.fontSize.lg,
              fontWeight: DesignTokens.typography.fontWeight.semibold,
              color: DesignTokens.colors.text.primary,
            }}
          >
            Tie Format
          </Text>

          <View style={{ gap: DesignTokens.spacing[6] }}>
            <View>
              <Text
                style={{
                  fontSize: DesignTokens.typography.fontSize.base,
                  color: DesignTokens.colors.text.secondary,
                  marginBottom: DesignTokens.spacing[2],
                }}
              >
                Structure
              </Text>
              <Controller
                control={control}
                name="matchFormat"
                render={({ field: { onChange, value } }) => (
                  <View
                    style={{
                      flexDirection: "column",
                      backgroundColor: DesignTokens.colors.background.secondary,
                      borderRadius: DesignTokens.borderRadius.sm,
                      padding: DesignTokens.spacing[1],
                      gap: DesignTokens.spacing[1],
                    }}
                  >
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
                          style={{
                            paddingVertical: DesignTokens.spacing[3],
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: DesignTokens.borderRadius.sm,
                            backgroundColor: isActive
                              ? DesignTokens.colors.background.primary
                              : "transparent",
                            elevation: isActive ? 2 : 0,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: DesignTokens.typography.fontSize.base,
                              fontWeight:
                                DesignTokens.typography.fontWeight.medium,
                              color: isActive
                                ? "#4974db"
                                : DesignTokens.colors.text.secondary,
                            }}
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
              <Text
                style={{
                  fontSize: DesignTokens.typography.fontSize.base,
                  color: DesignTokens.colors.text.secondary,
                  marginBottom: DesignTokens.spacing[2],
                }}
              >
                Best of (per sub-match)
              </Text>
              <Controller
                control={control}
                name="setsPerTie"
                render={({ field: { onChange, value } }) => (
                  <View
                    style={{
                      flexDirection: "column",
                      backgroundColor: DesignTokens.colors.background.secondary,
                      borderRadius: DesignTokens.borderRadius.sm,
                      padding: DesignTokens.spacing[1],
                      gap: DesignTokens.spacing[1],
                    }}
                  >
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
                          style={{
                            paddingVertical: DesignTokens.spacing[3],
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: DesignTokens.borderRadius.sm,
                            backgroundColor: isActive
                              ? DesignTokens.colors.background.primary
                              : "transparent",
                            elevation: isActive ? 2 : 0,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: DesignTokens.typography.fontSize.base,
                              fontWeight:
                                DesignTokens.typography.fontWeight.medium,
                              color: isActive
                                ? "#4974db"
                                : DesignTokens.colors.text.secondary,
                            }}
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

        <View style={{ gap: DesignTokens.spacing[5], marginTop: DesignTokens.spacing[5] }}>
          <Text
            style={{
              fontSize: DesignTokens.typography.fontSize.lg,
              fontWeight: DesignTokens.typography.fontWeight.semibold,
              color: DesignTokens.colors.text.primary,
            }}
          >
            Teams
          </Text>

          <View style={{ gap: DesignTokens.spacing[4] }}>
            {["Team A", "Team B"].map((team, idx) => (
              <View key={team}>
                <Text
                  style={{
                    fontSize: DesignTokens.typography.fontSize.base,
                    color: DesignTokens.colors.text.secondary,
                    marginBottom: DesignTokens.spacing[2],
                  }}
                >
                  {team}
                </Text>
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
          <View style={{ marginTop: DesignTokens.spacing[6] }}>
            <TeamMatchLineupView lineup={lineup} />
          </View>
        )}

        {matchFormat === "custom" && (
          <Text
            style={{
              fontSize: DesignTokens.typography.fontSize.sm,
              color: DesignTokens.colors.text.tertiary,
              marginTop: DesignTokens.spacing[4],
            }}
          >
            Configure rubbers after creating the tie.
          </Text>
        )}

        <View
          style={{
            gap: DesignTokens.spacing[5],
            marginTop: DesignTokens.spacing[6],
          }}
        >
          <Text
            style={{
              fontSize: DesignTokens.typography.fontSize.lg,
              fontWeight: DesignTokens.typography.fontWeight.semibold,
              color: DesignTokens.colors.text.primary,
            }}
          >
            Location
          </Text>

          <View style={{ gap: DesignTokens.spacing[3] }}>
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, value } }) => (
                <FormTextField
                  label="City"
                  value={value}
                  onChangeText={onChange}
                  placeholder="City"
                  error={errors.city?.message}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => venueInputRef.current?.focus()}
                />
              )}
            />
            <Controller
              control={control}
              name="venue"
              render={({ field: { onChange, value } }) => (
                <FormTextField
                  ref={venueInputRef}
                  label="Venue"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Club / Arena"
                  returnKeyType="done"
                />
              )}
            />
          </View>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: DesignTokens.spacing[4],
          paddingBottom: DesignTokens.spacing[8],
          paddingTop: DesignTokens.spacing[4],
        }}
      >
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          disabled={
            isSubmitting ||
            (Boolean(showLineup) && !lineup.validation.valid)
          }
          loading={isSubmitting}
          style={{
            height: 48,
            borderRadius: DesignTokens.borderRadius.sm,
            backgroundColor: DesignTokens.colors.text.primary,
          }}
          contentStyle={{ height: 48 }}
          labelStyle={{
            fontSize: DesignTokens.typography.fontSize.lg,
            fontWeight: DesignTokens.typography.fontWeight.medium,
            color: DesignTokens.colors.background.primary,
          }}
        >
          Create team match
        </Button>
      </View>
    </View>
  );
}
