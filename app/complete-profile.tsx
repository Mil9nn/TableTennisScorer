import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import DateTimePicker from "@react-native-community/datetimepicker";

const profileSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    message: "Please select a gender",
  }),
  handedness: z.enum(["left", "right", "ambidextrous"], {
    message: "Please select your handedness",
  }),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof profileSchema>;

const CompleteProfilePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { fetchUser } = useAuthStore();
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: theme.colors.background.secondary,
        },
        card: {
          backgroundColor: theme.colors.background.primary,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border.light,
          overflow: "hidden",
        },
        header: {
          backgroundColor: theme.colors.primary[500],
          padding: theme.spacing[8],
        },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: theme.spacing[4],
        },
        headerTitle: {
          fontSize: theme.typography.fontSize["2xl"],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.white,
          marginBottom: theme.spacing[1],
        },
        headerSubtitle: {
          color: "rgba(255,255,255,0.9)",
          fontSize: theme.typography.fontSize.xs,
        },
        skipButton: {
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[2],
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.3)",
          borderRadius: theme.borderRadius.full,
          minHeight: 44,
          justifyContent: "center",
        },
        skipText: {
          color: theme.colors.white,
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
        },
        progressLabel: {
          fontSize: theme.typography.fontSize.xs,
          color: "rgba(255,255,255,0.95)",
          marginBottom: theme.spacing[1],
        },
        progressTrack: {
          width: "100%",
          height: 8,
          backgroundColor: "rgba(255,255,255,0.3)",
          borderRadius: theme.borderRadius.full,
          overflow: "hidden",
        },
        progressFill: {
          height: "100%",
          backgroundColor: theme.colors.white,
          borderRadius: theme.borderRadius.full,
        },
        form: {
          padding: theme.spacing[8],
          gap: theme.spacing[6],
        },
        field: {
          marginBottom: theme.spacing[2],
        },
        fieldLabelRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
          marginBottom: 6,
        },
        fieldLabel: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
        },
        dateButton: {
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
          backgroundColor: theme.colors.background.primary,
          minHeight: 44,
          justifyContent: "center",
        },
        dateText: {
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.primary,
        },
        datePlaceholder: {
          color: theme.colors.text.tertiary,
        },
        errorText: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.error,
          marginTop: theme.spacing[1],
        },
        optionsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing[2],
          marginTop: theme.spacing[2],
        },
        option: {
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[2],
          borderRadius: theme.borderRadius.md,
          borderWidth: 1,
          borderColor: theme.colors.border.medium,
          backgroundColor: theme.colors.background.primary,
          minHeight: 44,
          justifyContent: "center",
        },
        optionSelected: {
          backgroundColor: theme.colors.primary[500],
          borderColor: theme.colors.primary[500],
        },
        optionText: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.secondary,
        },
        optionTextSelected: {
          color: theme.colors.white,
        },
        submitRow: {
          paddingTop: theme.spacing[4],
        },
        submitInner: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
        },
        submitText: {
          color: theme.colors.white,
          fontWeight: theme.typography.fontWeight.medium,
        },
      }),
    [theme],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      dateOfBirth: "",
      phoneNumber: "",
      location: "",
    },
  });

  const requiredFields = ["dateOfBirth", "gender", "handedness"] as const;
  const total = requiredFields.length;
  const watchedValues = form.watch();

  const completed = requiredFields.filter((field) => {
    const value = watchedValues[field];
    return value !== undefined && value !== "" && value !== null;
  }).length;

  const progressPercent = (completed / total) * 100;

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      await axiosInstance.put("/auth/complete-profile", {
        ...values,
        isProfileComplete: true,
      });

      await fetchUser();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile completed successfully!",
      });
      router.push("/(tabs)");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Failed to complete profile",
      });
      console.error("Profile completion error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const dateOfBirth = form.watch("dateOfBirth");
  const selectedDate = dateOfBirth ? new Date(dateOfBirth) : new Date();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Complete Your Profile</Text>
                <Text style={styles.headerSubtitle}>
                  Just a few more details to get started
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)")}
                style={styles.skipButton}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.progressLabel}>
                {completed} out of {total} fields completed
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.form}>
            <Controller
              control={form.control}
              name="dateOfBirth"
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <View style={styles.fieldLabelRow}>
                    <Ionicons name="calendar" size={16} color={theme.colors.primary[500]} />
                    <Text style={styles.fieldLabel}>Date of Birth</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={styles.dateButton}
                  >
                    <Text style={[styles.dateText, !value && styles.datePlaceholder]}>
                      {value || "Select date"}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker ? (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={(_, nextDate) => {
                        setShowDatePicker(false);
                        if (nextDate) {
                          onChange(nextDate.toISOString().split("T")[0]);
                        }
                      }}
                    />
                  ) : null}
                  {form.formState.errors.dateOfBirth ? (
                    <Text style={styles.errorText}>
                      {form.formState.errors.dateOfBirth.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={form.control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <View style={styles.fieldLabelRow}>
                    <Ionicons name="people" size={16} color={theme.colors.primary[500]} />
                    <Text style={styles.fieldLabel}>Gender</Text>
                  </View>
                  <View style={styles.optionsRow}>
                    {[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                      { value: "prefer_not_to_say", label: "Prefer not to say" },
                    ].map((option) => {
                      const selected = value === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => onChange(option.value)}
                          style={[styles.option, selected && styles.optionSelected]}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              selected && styles.optionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {form.formState.errors.gender ? (
                    <Text style={styles.errorText}>
                      {form.formState.errors.gender.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={form.control}
              name="handedness"
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>Playing Hand</Text>
                  <View style={styles.optionsRow}>
                    {[
                      { value: "right", label: "Right-handed" },
                      { value: "left", label: "Left-handed" },
                      { value: "ambidextrous", label: "Ambidextrous" },
                    ].map((option) => {
                      const selected = value === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => onChange(option.value)}
                          style={[styles.option, selected && styles.optionSelected]}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              selected && styles.optionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {form.formState.errors.handedness ? (
                    <Text style={styles.errorText}>
                      {form.formState.errors.handedness.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={form.control}
              name="location"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <View style={styles.fieldLabelRow}>
                    <Ionicons name="location" size={16} color={theme.colors.primary[500]} />
                    <Text style={styles.fieldLabel}>Location</Text>
                  </View>
                  <Input
                    placeholder="City, Country"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={form.formState.errors.location?.message}
                  />
                </View>
              )}
            />

            <View style={styles.submitRow}>
              <Button
                onPress={form.handleSubmit(onSubmit)}
                disabled={isLoading}
                variant="primary"
                size="lg"
                fullWidth
              >
                {isLoading ? (
                  <View style={styles.submitInner}>
                    <ActivityIndicator color={theme.colors.white} size="small" />
                    <Text style={styles.submitText}>Completing Profile...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitText}>Next</Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CompleteProfilePage;
