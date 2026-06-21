import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Text,
  View,
  Pressable,
  TextInput,
  Platform,
  StyleSheet,
} from "react-native";
import { NestableScrollContainer } from "react-native-draggable-flatlist";
import { Switch } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { axiosInstance } from "@/lib/axiosInstance";
import UserSearchInput from "@/app/match/components/UserSearchInput";
import TeamSearchInput from "@/app/match/components/TeamSearchInput";
import { Icon } from "@/components/ui/Icon";
import { FormTextField } from "@/components/ui/FormTextField";
import Toast from "react-native-toast-message";
import { createFlowChoiceStyles as styles } from "@/styles/createFlowChoiceStyles";
import { DesignTokens } from "@/constants/designTokens";
import {
  DEFAULT_CUSTOM_SUB_MATCHES,
  type TeamCustomSubMatchConfig,
} from "@/lib/tournament/teamConfig";

const tokens = DesignTokens;

/** RHF can leave `{}` on unmounted nested fields; treat as missing so optional groups don't fail. */
const emptyObjectToUndefined = (val: unknown) =>
  val != null &&
  typeof val === "object" &&
  !Array.isArray(val) &&
  Object.keys(val as object).length === 0
    ? undefined
    : val;

const optionalNested = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(emptyObjectToUndefined, schema.optional());

const teamCustomSubMatchSchema = z.object({
  matchNumber: z.number().int().min(1).max(9),
  matchType: z.enum(["singles", "doubles"]),
});

const teamConfigSchema = z.object({
  matchFormat: z.enum(["five_singles", "single_double_single", "custom"], {
    errorMap: () => ({
      message: "Select a match structure (5 singles, S-D-S, or custom)",
    }),
  }),
  setsPerSubMatch: z.string().min(1, "Select best-of for sub-matches"),
  customSubMatches: z.array(teamCustomSubMatchSchema).optional(),
});

// Tournament schema
const tournamentSchema = z
  .object({
    name: z.string().min(3, "Tournament name must be at least 3 characters"),
    startDate: z.date(),
    city: z.string().min(2, "City is required"),
    venue: z.string().min(1, "Venue is required"),
    format: z.enum(["round_robin", "knockout", "hybrid"]),
    category: z.enum(["individual", "team"]),
    // Hidden for team tournaments; API still expects a value — defaulted on submit.
    matchType: z.enum(["singles", "doubles"]).optional(),
    setsPerMatch: z.enum(["1", "3", "5", "7", "9"]).optional(),
    participants: z.array(z.string()),
    teamConfig: optionalNested(teamConfigSchema),
    useGroups: z.boolean(),
    numberOfGroups: z.string().optional(),
    knockout: optionalNested(
      z.object({
        thirdPlaceMatch: z.boolean(),
        allowCustomMatching: z.boolean(),
      })
    ),
    hybridRoundRobin: optionalNested(
      z.object({
        useGroups: z.boolean(),
        numberOfGroups: z.string().optional(),
      })
    ),
    qualification: optionalNested(
      z.object({
        method: z.enum(["top_n_per_group"]),
        perGroup: z.string().optional(),
      })
    ),
    hybridKnockout: optionalNested(
      z.object({
        thirdPlaceMatch: z.boolean(),
        allowCustomMatching: z.boolean(),
      })
    ),
  })
  .superRefine((data, ctx) => {
    // Participants are optional at creation; minimums are enforced when generating the draw.

    if (data.category === "individual") {
      if (!data.matchType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select singles or doubles",
          path: ["matchType"],
        });
      }
      if (!data.setsPerMatch) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sets per match is required for individual tournaments",
          path: ["setsPerMatch"],
        });
      }
    }

    if (data.category === "team") {
      const tc = data.teamConfig;
      if (!tc?.matchFormat || !tc?.setsPerSubMatch) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Choose a match structure and best-of for team sub-matches",
          path: ["teamConfig"],
        });
      }
      if (
        tc?.matchFormat === "custom" &&
        (!tc.customSubMatches || tc.customSubMatches.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least one rubber for a custom team format",
          path: ["teamConfig", "customSubMatches"],
        });
      }
    }

    if (data.format === "round_robin" && data.useGroups) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Groups cannot be used with round-robin format. Use 'hybrid' format for round-robin → knockout tournaments.",
        path: ["useGroups"],
      });
    }

    if (data.format === "hybrid" && data.hybridRoundRobin?.useGroups) {
      const numGroups = Number(data.hybridRoundRobin.numberOfGroups || 0);
      if (numGroups < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least 2 groups required for round-robin phase",
          path: ["hybridRoundRobin", "numberOfGroups"],
        });
      }
      if (data.participants.length > 0 && data.participants.length < numGroups) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Need at least ${numGroups} participants for ${numGroups} groups`,
          path: ["participants"],
        });
      }
    }
  });

type TournamentFormValues = {
  name: string;
  startDate: Date;
  city: string;
  venue: string;
  format: "round_robin" | "knockout" | "hybrid";
  category: "individual" | "team";
  matchType?: "singles" | "doubles";
  setsPerMatch?: "1" | "3" | "5" | "7" | "9";
  participants: string[];
  teamConfig?: {
    matchFormat: "five_singles" | "single_double_single" | "custom";
    setsPerSubMatch: string;
    customSubMatches?: TeamCustomSubMatchConfig[];
  };
  useGroups: boolean;
  numberOfGroups?: string;
  knockout?: {
    thirdPlaceMatch: boolean;
    allowCustomMatching: boolean;
  };
  hybridRoundRobin?: {
    useGroups: boolean;
    numberOfGroups?: string;
  };
  qualification?: {
    method: "top_n_per_group";
    perGroup?: string;
  };
  hybridKnockout?: {
    thirdPlaceMatch: boolean;
    allowCustomMatching: boolean;
  };
};



const FIELD_LABELS: Record<string, string> = {
  name: "Tournament name",
  city: "City",
  venue: "Venue",
  setsPerMatch: "Sets per match",
  matchType: "Match type",
  teamConfig: "Team match settings",
  "teamConfig.matchFormat": "Match structure",
  "teamConfig.setsPerSubMatch": "Best of (sub-matches)",
  knockout: "Knockout settings",
  "knockout.thirdPlaceMatch": "3rd place match",
  "knockout.allowCustomMatching": "Custom matching",
  hybridRoundRobin: "Round-robin phase",
  "hybridRoundRobin.useGroups": "Use groups",
  "hybridRoundRobin.numberOfGroups": "Number of groups",
  qualification: "Qualification",
  "qualification.method": "Qualification method",
  "qualification.perGroup": "Advance per group",
  hybridKnockout: "Knockout phase",
  "hybridKnockout.thirdPlaceMatch": "3rd place match",
  "hybridKnockout.allowCustomMatching": "Custom matching",
  participants: "Participants",
  useGroups: "Groups",
};

const getFirstValidationMessage = (
  errorObj: any,
  pathPrefix = ""
): string | null => {
  if (!errorObj || typeof errorObj !== "object") return null;
  if (typeof errorObj.message === "string" && errorObj.message.length > 0) {
    const label =
      FIELD_LABELS[pathPrefix] ??
      (pathPrefix ? pathPrefix.replace(/\./g, " › ") : "");
    if (!pathPrefix) return errorObj.message;
    if (errorObj.message === "Required") {
      return `${label} is required`;
    }
    return `${label}: ${errorObj.message}`;
  }

  for (const [key, value] of Object.entries(errorObj)) {
    const nestedPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    const nested = getFirstValidationMessage(value, nestedPath);
    if (nested) return nested;
  }

  return null;
};

const Section = ({ label, children, description = "" }: { label: string; children: React.ReactNode; description?: string }) => (
  <View className="mb-6 px-6">
    <View className="mb-2">
      <Text className="text-[11px] font-bold text-slate-600 capitalize tracking-[1.5px]">
        {label}
      </Text>
      {description ? <Text className="text-xs text-slate-500 mt-1">{description}</Text> : null}
    </View>
    <View className="gap-3">{children}</View>
  </View>
);

export default function CreateTournamentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const cityInputRef = useRef<TextInput>(null);
  const venueInputRef = useRef<TextInput>(null);
  /** Extra scroll padding on iOS only; Android uses KeyboardAvoidingView `padding` to avoid double inset with edge-to-edge / resize. */
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const showSub = Keyboard.addListener("keyboardWillShow", (e) =>
      setKeyboardInset(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener("keyboardWillHide", () => setKeyboardInset(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema) as Resolver<TournamentFormValues>,
    defaultValues: {
      name: "",
      city: "",
      venue: "",
      format: "round_robin",
      category: "individual",
      matchType: "singles",
      setsPerMatch: "3",
      participants: [],
      teamConfig: {
        matchFormat: "five_singles",
        setsPerSubMatch: "3",
        customSubMatches: DEFAULT_CUSTOM_SUB_MATCHES.map((m) => ({ ...m })),
      },
      useGroups: false,
      knockout: {
        thirdPlaceMatch: false,
        allowCustomMatching: true,
      },
      hybridRoundRobin: {
        useGroups: false,
        numberOfGroups: "4",
      },
      qualification: {
        method: "top_n_per_group",
        perGroup: "2",
      },
      hybridKnockout: {
        thirdPlaceMatch: false,
        allowCustomMatching: true,
      },
      startDate: new Date(),
    },
  });

  const watchFormat = watch("format");
  const watchCategory = watch("category");
  const watchTeamMatchFormat = watch("teamConfig.matchFormat");
  const watchCustomRubbers = watch("teamConfig.customSubMatches");
  const watchHybridUseGroups = watch("hybridRoundRobin.useGroups");

  // Team UI hides matchType/setsPerMatch controllers; keep values the API expects.
  useEffect(() => {
    if (watchCategory !== "team") return;
    if (!watch("matchType")) {
      setValue("matchType", "singles", { shouldValidate: false });
    }
    const tc = watch("teamConfig");
    if (!tc?.matchFormat || !tc?.setsPerSubMatch) {
      setValue(
        "teamConfig",
        {
          matchFormat: tc?.matchFormat ?? "five_singles",
          setsPerSubMatch: tc?.setsPerSubMatch ?? "3",
          customSubMatches:
            tc?.customSubMatches ??
            DEFAULT_CUSTOM_SUB_MATCHES.map((m) => ({ ...m })),
        },
        { shouldValidate: false }
      );
    }
  }, [watchCategory, setValue, watch]);

  const addParticipant = (user: any) => {
    setParticipants((prev) => {
      if (prev.find((p) => p._id === user._id)) return prev;
      const next = [...prev, user];
      setValue(
        "participants",
        next.map((p) => p._id),
        { shouldValidate: true }
      );
      return next;
    });
  };

  const removeParticipant = (userId: string) => {
    setParticipants((prev) => {
      const next = prev.filter((p) => p._id !== userId);
      setValue(
        "participants",
        next.map((p) => p._id),
        { shouldValidate: true }
      );
      return next;
    });
  };

  const onSubmit = async (data: TournamentFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        format: data.format,
        category: data.category,
        ...(data.category === "individual"
          ? { matchType: data.matchType ?? "singles" }
          : {}),
        startDate: data.startDate,
        city: data.city,
        venue: data.venue,
        participants: data.participants,
        seedingMethod: "none",
        rules: {
          // For team tournaments, set setsPerMatch to match setsPerSubMatch for consistency
          setsPerMatch:
            data.category === "team"
              ? Number(data.teamConfig?.setsPerSubMatch) || 3
              : Number(data.setsPerMatch),
          pointsPerSet: 11,
          pointsForWin: 2,
          advanceTop: 0,
          deuceSetting: "standard",
          tiebreakRules: [
            "points",
            "head_to_head",
            "sets_ratio",
            "points_ratio",
            "sets_won",
          ],
        },
      };

      if (data.format === "round_robin") {
        payload.useGroups = false;
      }

      if (data.format === "knockout") {
        payload.knockoutConfig = {
          allowCustomMatching: data.knockout?.allowCustomMatching ?? true,
          autoGenerateBracket: true,
          thirdPlaceMatch: data.knockout?.thirdPlaceMatch ?? false,
          consolationBracket: false,
        };
      }

      if (data.format === "hybrid") {
        const hybridUsesGroups = data.hybridRoundRobin?.useGroups ?? false;
        payload.hybridConfig = {
          roundRobinUseGroups: hybridUsesGroups,
          roundRobinNumberOfGroups: hybridUsesGroups
            ? Number(data.hybridRoundRobin?.numberOfGroups)
            : undefined,
          qualificationMethod: "top_n_per_group",
          qualifyingPerGroup: hybridUsesGroups
            ? Number(data.qualification?.perGroup) || 2
            : undefined,
          knockoutAllowCustomMatching:
            data.hybridKnockout?.allowCustomMatching ?? true,
          knockoutThirdPlaceMatch:
            data.hybridKnockout?.thirdPlaceMatch ?? false,
        };
      }

      if (data.category === "team") {
        const matchFormat = data.teamConfig?.matchFormat || "five_singles";
        payload.teamConfig = {
          matchFormat,
          setsPerSubMatch: Number(data.teamConfig?.setsPerSubMatch) || 3,
          ...(matchFormat === "custom"
            ? {
                customSubMatches: (data.teamConfig?.customSubMatches?.length
                  ? data.teamConfig.customSubMatches
                  : DEFAULT_CUSTOM_SUB_MATCHES
                ).map((m, i) => ({
                  matchNumber: i + 1,
                  matchType: m.matchType,
                })),
              }
            : {}),
        };
      }

      const response = await axiosInstance.post("/tournaments", payload);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Tournament created successfully!",
      });
      router.push(`/tournaments/${response.data.tournament._id}`);
    } catch (err: any) {
      console.error("Error creating tournament:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Failed to create tournament",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (formErrors: any) => {
    const firstMessage =
      getFirstValidationMessage(formErrors) || "Please complete required fields.";
    Toast.show({
      type: "error",
      text1: "Cannot create tournament",
      text2: firstMessage,
    });
  };

  return (
    <SafeAreaView style={pageStyles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={pageStyles.keyboardAvoidingView}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Header — inside KeyboardAvoidingView so the scroll area shrinks with the keyboard */}
        <View style={pageStyles.header}>
          <View style={pageStyles.headerContent}>
            <Pressable
              onPress={() => router.back()}
              style={pageStyles.backButton}
            >
              <Icon name="chevron-left" size={20} color="#0f172a" />
            </Pressable>
            <Text style={pageStyles.headerTitle}>Create tournament</Text>
          </View>
        </View>

        <NestableScrollContainer
          style={pageStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={[
            pageStyles.scrollContent,
            {
              paddingBottom:
                tokens.spacing[8] +
                (Platform.OS === "ios" ? keyboardInset : 0),
            },
          ]}
        >

          {/* Basic Information */}
          <View className="px-4 py-3">
            <Text style={Styles.header}>Basic Information</Text>

            {/* Tournament Name */}
            <View className="gap-4">
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <FormTextField
                    label="Tournament name"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Spring Championship 2025"
                    error={errors.name?.message}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => cityInputRef.current?.focus()}
                  />
                )}
              />

              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, value } }) => (
                  <FormTextField
                    ref={cityInputRef}
                    label="City"
                    containerStyle={pageStyles.halfWidthField}
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
                    containerStyle={pageStyles.halfWidthField}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Club / Arena"
                    error={errors.venue?.message}
                    returnKeyType="done"
                  />
                )}
              />

              {/* Start Date */}
              <View>
                <Text style={Styles.label}>Start date</Text>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field: { onChange, value } }) => (
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      style={Styles.datePickerButton}
                    >
                      <Text style={Styles.datePickerText}>{format(value, "PPP")}</Text>
                      <Icon name="calendar" size={16} color={tokens.colors.gray[500]} />
                    </Pressable>
                  )}
                />
                {showDatePicker && (
                  <DateTimePicker
                    value={watch("startDate")}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        setValue("startDate", selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>
            </View>
          </View>


          {/* Format Selector - Top Priority */}
          <View className="py-2 px-4">
            <View className="mb-3">
              <Text style={Styles.header}>Tournament Format</Text>
            </View>
            <Controller
              control={control}
              name="format"
              render={({ field: { onChange, value } }) => (
                <View style={styles.segmentedControlContainer}>
                  {(
                    [
                      { label: "Round Robin", val: "round_robin" as const },
                      { label: "Knockout", val: "knockout" as const },
                      { label: "Hybrid", val: "hybrid" as const },
                    ] as const
                  ).map((opt) => {
                    const isActive = value === opt.val;
                    return (
                      <Pressable
                        key={opt.val}
                        onPress={() => onChange(opt.val)}
                        style={[styles.segmentedButton, isActive && styles.segmentedButtonActive]}
                      >
                        <Text
                          style={[styles.segmentedButtonText, isActive && styles.segmentedButtonTextActive]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          </View>

          {/* Category */}
          <View className="px-4 py-3">
            <Text style={Styles.header}>Category</Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <View style={styles.segmentedControlContainer}>
                  {(
                    [
                      { label: "Individual", val: "individual" as const },
                      { label: "Team", val: "team" as const },
                    ] as const
                  ).map((opt) => {
                    const isActive = value === opt.val;
                    return (
                      <Pressable
                        key={opt.val}
                        onPress={() => onChange(opt.val)}
                        style={[styles.segmentedButton, isActive && styles.segmentedButtonActive]}
                      >
                        <Text
                          style={[styles.segmentedButtonText, isActive && styles.segmentedButtonTextActive]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          </View>

          {/* Match Settings */}
          <View className="px-4 py-3">
            <Text style={Styles.matchSettingsHeader}>
              {watchCategory === "team" ? "Match format" : "Match format"}
            </Text>
            {watchCategory === "individual" ? (
              <View className="gap-3">
                <View>
                  <Text style={styles.sectionLabel}>Type</Text>
                  <Controller
                    control={control}
                    name="matchType"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.segmentedControlContainer}>
                        {(
                          [
                            { label: "Singles", val: "singles" as const },
                            { label: "Doubles", val: "doubles" as const },
                          ] as const
                        ).map((opt) => {
                          const isActive = value === opt.val;
                          return (
                            <Pressable
                              key={opt.val}
                              onPress={() => onChange(opt.val)}
                              style={[styles.segmentedButton, isActive && styles.segmentedButtonActive]}
                            >
                              <Text
                                style={[
                                  styles.segmentedButtonText,
                                  isActive && styles.segmentedButtonTextActive,
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
                </View>

                <View>
                  <Text style={styles.sectionLabel}>Best of</Text>
                  <Controller
                    control={control}
                    name="setsPerMatch"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.segmentedControlContainer}>
                        {(["1", "3", "5", "7", "9"] as const).map((n) => {
                          const isActive = value === n;
                          return (
                            <Pressable
                              key={n}
                              onPress={() => onChange(n)}
                              style={[styles.segmentedButton, isActive && styles.segmentedButtonActive]}
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
            ) : (
              <View className="gap-3">
                <View>
                  <Text style={styles.sectionLabel}>Match structure</Text>
                  <Controller
                    control={control}
                    name="teamConfig.matchFormat"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.segmentedControlContainer}>
                        {(
                          [
                            { label: "5 Singles", val: "five_singles" as const },
                            { label: "S-D-S", val: "single_double_single" as const },
                            { label: "Custom", val: "custom" as const },
                          ] as const
                        ).map((opt) => {
                          const isActive = value === opt.val;
                          return (
                            <Pressable
                              key={opt.val}
                              onPress={() => {
                                onChange(opt.val);
                                if (opt.val === "custom") {
                                  const existing = watch("teamConfig.customSubMatches");
                                  if (!existing?.length) {
                                    setValue(
                                      "teamConfig.customSubMatches",
                                      DEFAULT_CUSTOM_SUB_MATCHES.map((m) => ({ ...m })),
                                      { shouldValidate: false }
                                    );
                                  }
                                }
                              }}
                              style={[styles.segmentedButton, isActive && styles.segmentedButtonActive]}
                            >
                              <Text
                                style={[
                                  styles.segmentedButtonText,
                                  isActive && styles.segmentedButtonTextActive,
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
                </View>

                <View>
                  <Text style={styles.sectionLabel}>Best of</Text>
                  <Controller
                    control={control}
                    name="teamConfig.setsPerSubMatch"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.segmentedControlContainer}>
                        {(["1", "3", "5"] as const).map((n) => {
                          const isActive = value === n;
                          return (
                            <Pressable
                              key={n}
                              onPress={() => onChange(n)}
                              style={[styles.segmentedButton, isActive && styles.segmentedButtonActive]}
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

                {watchTeamMatchFormat === "custom" && (
                  <View className="gap-2 mt-1">
                    <Text style={styles.sectionLabel}>Custom rubbers</Text>
                    <Text className="text-xs text-slate-500 mb-1">
                      Each rubber can be singles or doubles.
                    </Text>
                    {(watchCustomRubbers ?? []).map((rubber, index) => (
                      <View
                        key={`rubber-${rubber.matchNumber}-${index}`}
                        className="flex-row items-center justify-between gap-2 py-1"
                      >
                        <Text className="text-sm text-slate-700 w-16">
                          #{rubber.matchNumber}
                        </Text>
                        <View style={styles.segmentedControlContainer}>
                          {(["singles", "doubles"] as const).map((type) => {
                            const isActive = rubber.matchType === type;
                            return (
                              <Pressable
                                key={type}
                                onPress={() => {
                                  const next = (watchCustomRubbers ?? []).map(
                                    (r, i) =>
                                      i === index ? { ...r, matchType: type } : r
                                  );
                                  setValue("teamConfig.customSubMatches", next, {
                                    shouldValidate: true,
                                  });
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
                                  {type === "singles" ? "Singles" : "Doubles"}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                        {(watchCustomRubbers?.length ?? 0) > 1 && (
                          <Pressable
                            onPress={() => {
                              const next = (watchCustomRubbers ?? [])
                                .filter((_, i) => i !== index)
                                .map((r, i) => ({ ...r, matchNumber: i + 1 }));
                              setValue("teamConfig.customSubMatches", next, {
                                shouldValidate: true,
                              });
                            }}
                            accessibilityLabel="Remove rubber"
                          >
                            <Icon name="close" size={18} color="#ef4444" />
                          </Pressable>
                        )}
                      </View>
                    ))}
                    {(watchCustomRubbers?.length ?? 0) < 9 && (
                      <Pressable
                        onPress={() => {
                          const current = watchCustomRubbers ?? [];
                          setValue(
                            "teamConfig.customSubMatches",
                            [
                              ...current,
                              {
                                matchNumber: current.length + 1,
                                matchType: "singles" as const,
                              },
                            ],
                            { shouldValidate: true }
                          );
                        }}
                        className="flex-row items-center gap-1 py-2"
                      >
                        <Icon name="plus" size={16} color={tokens.colors.primary[600]} />
                        <Text className="text-sm text-primary-600 font-medium">
                          Add rubber
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Format-specific options */}
          {(watchFormat === "knockout" || watchFormat === "hybrid") && (
            <View className="px-4 py-3">
              <Text className="text-sm font-semibold text-slate-900 mb-4">
                {watchFormat === "knockout" ? "Knockout settings" : "Group Stage → Knockout Tournament Settings"}
              </Text>

              {/* Knockout Format Settings */}
              {watchFormat === "knockout" && (
                <View className="gap-3">
                  <Controller
                    control={control}
                    name="knockout.thirdPlaceMatch"
                    render={({ field: { onChange, value } }) => (
                      <Pressable
                        onPress={() => onChange(!value)}
                        style={Styles.switchContainer}
                      >
                        <Text className="text-sm font-medium text-slate-700">3rd Place Match</Text>
                        <Switch
                          value={value}
                          onValueChange={onChange}
                        />
                      </Pressable>
                    )}
                  />
                </View>
              )}

              {/* Hybrid Format Settings */}
              {watchFormat === "hybrid" && (
                <View className="gap-4">
                  {/* Round Robin Phase */}
                  <View>
                    <Text className="text-sm text-slate-500 mb-2">Round Robin phase</Text>
                    <Controller
                      control={control}
                      name="hybridRoundRobin.useGroups"
                      render={({ field: { onChange, value } }) => (
                        <Pressable
                          onPress={() => onChange(!value)}
                          style={Styles.switchContainerCompact}
                        >
                          <Text style={Styles.switchLabelText}>Use Groups</Text>
                          <Switch
                            value={value}
                            onValueChange={onChange}
                          />
                        </Pressable>
                      )}
                    />
                    {watchHybridUseGroups && (
                      <View className="mt-3">
                        <Controller
                          control={control}
                          name="hybridRoundRobin.numberOfGroups"
                          render={({ field: { onChange, value } }) => (
                            <FormTextField
                              label="Number of groups"
                              value={value || ""}
                              onChangeText={onChange}
                              placeholder="4"
                              keyboardType="numeric"
                              autoCapitalize="none"
                            />
                          )}
                        />
                      </View>
                    )}
                  </View>

                  {/* Qualification — only when round-robin uses groups */}
                  {watchHybridUseGroups ? (
                    <View>
                      <Text className="text-xs text-slate-500 mb-2">Advance per group</Text>
                      <Controller
                        control={control}
                        name="qualification.perGroup"
                        render={({ field: { onChange, value } }) => (
                          <View style={styles.segmentedControlContainer}>
                            {(["1", "2", "3", "4"] as const).map((n) => {
                              const isActive = value === n;
                              return (
                                <Pressable
                                  key={n}
                                  onPress={() => onChange(n)}
                                  style={[styles.segmentedButton, isActive && styles.segmentedButtonActive]}
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
                  ) : null}

                  {/* Knockout Phase */}
                  <View>
                    <Text className="text-sm text-slate-500 mb-2">Knockout Phase</Text>
                    <View className="gap-3">
                      <Controller
                        control={control}
                        name="hybridKnockout.thirdPlaceMatch"
                        render={({ field: { onChange, value } }) => (
                          <Pressable
                            onPress={() => onChange(!value)}
                            style={Styles.switchContainer}
                          >
                            <Text style={Styles.switchLabelText}>3rd Place Match</Text>
                            <Switch
                              value={value}
                              onValueChange={onChange}
                            />
                          </Pressable>
                        )}
                      />
                      <Controller
                        control={control}
                        name="hybridKnockout.allowCustomMatching"
                        render={({ field: { onChange, value } }) => (
                          <Pressable
                            onPress={() => onChange(!value)}
                            style={Styles.switchContainer}
                          >
                            <Text style={Styles.switchLabelText}>Custom Matching</Text>
                            <Switch
                              value={value}
                              onValueChange={onChange}
                            />
                          </Pressable>
                        )}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Participants */}
          <View className="px-4 py-4">
            <Text className="text-sm font-semibold text-slate-900 mb-4">
              {watchCategory === "team" ? "Teams" : "Participants"}
            </Text>
            {watchCategory === "team" ? (
              <TeamSearchInput
                placeholder="Search teams..."
                onSelect={addParticipant}
                clearAfterSelect
              />
            ) : (
              <UserSearchInput
                placeholder="Search players..."
                onSelect={addParticipant}
                clearAfterSelect
              />
            )}

            {participants.length > 0 ? (
              <View className="gap-2 mt-4">
                {participants.map((p, idx) => (
                  <View key={p._id} className="flex-row items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center">
                        <Text className="text-xs font-medium text-slate-500">{idx + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-slate-900">
                          {watchCategory === "team" ? p.name : p.fullName || p.username}
                        </Text>
                        <Text className="text-xs text-slate-500">
                          {watchCategory === "team" ? `${p.players?.length || 0} players` : `@${p.username}`}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => removeParticipant(p._id)}
                      className="p-1.5 rounded-md active:bg-gray-100"
                    >
                      <Icon name="x" size={16} color="#64748b" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-8 items-center border border-dashed border-gray-300 rounded-xl mt-4">
                <Text className="text-sm text-slate-500">
                  Search to pre add {watchCategory === "team" ? "teams" : "participants"}
                </Text>
              </View>
            )}

          </View>

          {/* Submit Button */}
          <View className="px-4 pt-4">
            <Pressable
              onPress={handleSubmit(onSubmit, onInvalid)}
              disabled={isSubmitting}
              className={`h-12 items-center justify-center rounded-xl ${isSubmitting ? "bg-gray-300" : "bg-slate-900"
                }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-sm font-medium">Create tournament</Text>
              )}
            </Pressable>
          </View>
        </NestableScrollContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const pageStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    height: 56,
  },
  backButton: {
    padding: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.gray[900],
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  halfWidthField: {
    flex: 1,
  },
});

const Styles = StyleSheet.create({
  header: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.gray[900],
    marginBottom: tokens.spacing[3],
  },
  label: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.gray[600],
    marginBottom: tokens.spacing[2],
  },
  chip: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: 9999,
    borderWidth: 2,
  },
  chipText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
  },
  datePickerButton: {
    height: 58,
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing[4],
    backgroundColor: tokens.colors.background.primary,
    borderWidth: 1,
    borderColor: tokens.colors.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.gray[900],
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.secondary,
  },
  // Match settings header
  matchSettingsHeader: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.gray[900],
    marginBottom: tokens.spacing[3],
  },
  // Switch container styles
  switchContainerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[6],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.secondary,
  },
  switchLabelText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
  },
});
