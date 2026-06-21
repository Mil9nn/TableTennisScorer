import { axiosInstance } from "@/lib/axiosInstance";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Alert,
  TextInput,
  StyleSheet,
} from "react-native";
import * as z from "zod";
import { FormTextField } from "@/components/ui/FormTextField";
import UserSearchInput from "./UserSearchInput";
import { createFlowChoiceStyles } from "@/styles/createFlowChoiceStyles";
import { DesignTokens } from "@/constants/designTokens";

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
    city: z.string().min(1, "City is required"),
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const venueInputRef = useRef<TextInput>(null);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { matchType: "singles", numberOfSets: "3", city: "", venue: "" },
  });

  const matchType = watch("matchType");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        matchType: data.matchType,
        numberOfSets: Number(data.numberOfSets),
        city: data.city,
        venue: data.venue || data.city,
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingBottom: DesignTokens.spacing[8],
  },
  section: {
    paddingVertical: DesignTokens.spacing[3],
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
    marginBottom: DesignTokens.spacing[3],
  },
  sectionSubtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[4],
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.error,
  },
  singlesPlayerList: {
    gap: DesignTokens.spacing[8],
  },
  doublesContainer: {
    gap: DesignTokens.spacing[4],
  },
  doublesTeamCard: {
    backgroundColor: DesignTokens.colors.background.secondary,
    padding: DesignTokens.spacing[3],
  },
  doublesTeamLabel: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[3],
  },
  doublesPlayerList: {
    gap: DesignTokens.spacing[3],
  },
  locationFields: {
    gap: DesignTokens.spacing[3],
  },
  submitWrapper: {
    paddingBottom: DesignTokens.spacing[2],
    paddingTop: DesignTokens.spacing[4],
  },
  submitButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: DesignTokens.colors.text.primary,
  },
  submitButtonDisabled: {
    backgroundColor: DesignTokens.colors.gray[300],
  },
  submitButtonText: {
    color: DesignTokens.colors.background.primary,
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
});