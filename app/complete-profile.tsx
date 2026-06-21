import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import DateTimePicker from "@react-native-community/datetimepicker";

const profileSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], {
    message: "Please select a gender",
  }),
  handedness: z.enum(["left", "right"], {
    message: "Please select your handedness",
  }),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

const CompleteProfilePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { fetchUser } = useAuthStore();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      dateOfBirth: "",
      phoneNumber: "",
      location: "",
      bio: "",
    },
  });

  // Progress bar calculation
  const requiredFields = ["dateOfBirth", "gender", "handedness"];
  type FormValues = z.infer<typeof profileSchema>;
  const total = requiredFields.length;
  const watchedValues = form.watch();

  const completed = requiredFields.filter((field) => {
    const value = watchedValues[field as keyof FormValues];
    return value !== undefined && value !== "" && value !== null;
  }).length;

  const progressPercent = (completed / total) * 100;

  // Submit Handler
  async function onSubmit(values: z.infer<typeof profileSchema>) {
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="max-w-3xl mx-auto w-full">
          <View className="bg-white shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <View className="bg-blue-400 p-8 border-b">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-white mb-1">
                    Complete Your Profile
                  </Text>
                  <Text className="text-white/90 text-xs">
                    Just a few more details to get started
                  </Text>
                </View>

                {/* Skip Button */}
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)")}
                  className="px-4 py-2 border border-white/30 rounded-full"
                >
                  <Text className="text-white text-xs font-medium">Skip</Text>
                </TouchableOpacity>
              </View>

              {/* Progress */}
              <View className="mt-4">
                <Text className="text-xs text-white/95 mb-1">
                  {completed} out of {total} fields completed
                </Text>
                <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
              </View>
            </View>

            {/* Form */}
            <View className="p-8">
              <View className="space-y-6">
                <View className="flex-row flex-wrap gap-6">
                  {/* Date of Birth */}
                  <View className="flex-1 min-w-[48%]">
                    <Controller
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field: { onChange, value } }) => (
                        <View>
                          <View className="flex-row items-center gap-2 mb-1.5">
                            <Ionicons name="calendar" size={16} color="#6366f1" />
                              <Text className="text-xs font-medium text-gray-700">
                                Date of Birth
                              </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className="border border-gray-200 rounded-md px-4 py-3"
                          >
                            <Text className="text-base text-gray-900">
                              {value || "Select date"}
                            </Text>
                          </TouchableOpacity>
                          {showDatePicker && (
                            <DateTimePicker
                              value={selectedDate}
                              mode="date"
                              display="default"
                              maximumDate={new Date()}
                              onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) {
                                  onChange(selectedDate.toISOString().split('T')[0]);
                                }
                              }}
                            />
                          )}
                          {form.formState.errors.dateOfBirth && (
                            <Text className="text-xs text-red-500 mt-1">
                              {form.formState.errors.dateOfBirth.message}
                            </Text>
                          )}
                        </View>
                      )}
                    />
                  </View>

                  {/* Gender */}
                  <View className="flex-1 min-w-[48%]">
                    <Controller
                      control={form.control}
                      name="gender"
                      render={({ field: { onChange, value } }) => (
                        <View>
                          <View className="flex-row items-center gap-2 mb-1.5">
                            <Ionicons name="people" size={16} color="#6366f1" />
                            <Text className="text-xs font-medium text-gray-700">
                              Gender
                            </Text>
                          </View>
                          <View className="flex-row gap-2 mt-2">
                            {["male", "female"].map((option) => (
                              <TouchableOpacity
                                key={option}
                                onPress={() => onChange(option)}
                                className={`px-4 py-2 rounded-md border ${
                                  value === option
                                    ? "bg-blue-500 border-blue-500"
                                    : "bg-white border-gray-300"
                                }`}
                              >
                                <Text
                                  className={`text-xs ${
                                    value === option ? "text-white" : "text-gray-700"
                                  }`}
                                >
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          {form.formState.errors.gender && (
                            <Text className="text-xs text-red-500 mt-1">
                              {form.formState.errors.gender.message}
                            </Text>
                          )}
                        </View>
                      )}
                    />
                  </View>

                  {/* Handedness */}
                  <View className="flex-1 min-w-[48%]">
                    <Controller
                      control={form.control}
                      name="handedness"
                      render={({ field: { onChange, value } }) => (
                        <View>
                          <Text className="text-xs font-medium text-gray-700 mb-1.5">
                            Playing Hand
                          </Text>
                          <View className="flex-row gap-2 mt-2">
                            {["right", "left"].map((option) => (
                              <TouchableOpacity
                                key={option}
                                onPress={() => onChange(option)}
                                className={`px-4 py-2 rounded-md border ${
                                  value === option
                                    ? "bg-blue-500 border-blue-500"
                                    : "bg-white border-gray-300"
                                }`}
                              >
                                <Text
                                  className={`text-xs ${
                                    value === option ? "text-white" : "text-gray-700"
                                  }`}
                                >
                                  {option === "right" ? "Right-handed" : "Left-handed"}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          {form.formState.errors.handedness && (
                            <Text className="text-xs text-red-500 mt-1">
                              {form.formState.errors.handedness.message}
                            </Text>
                          )}
                        </View>
                      )}
                    />
                  </View>

                  {/* Location */}
                  <View className="flex-1 min-w-[48%]">
                    <Controller
                      control={form.control}
                      name="location"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                          <View className="flex-row items-center gap-2 mb-1.5">
                            <Ionicons name="location" size={16} color="#6366f1" />
                            <Text className="text-xs font-medium text-gray-700">
                              Location
                            </Text>
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
                  </View>
                </View>

                {/* Bio */}
                <View>
                  <Controller
                    control={form.control}
                    name="bio"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View>
                        <Text className="text-xs font-medium text-gray-700 mb-1.5">
                          Bio
                        </Text>
                        <Textarea
                          placeholder="Tell us about yourself..."
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          error={form.formState.errors.bio?.message}
                          style={{ minHeight: 120 }}
                        />
                        <Text className="text-xs text-gray-500 mt-1">
                          {value?.length || 0}/500 characters
                        </Text>
                      </View>
                    )}
                  />
                </View>

                {/* Submit Button */}
                <View className="pt-4">
                  <Button
                    onPress={form.handleSubmit(onSubmit)}
                    disabled={isLoading}
                    variant="primary"
                    size="lg"
                    fullWidth
                  >
                    {isLoading ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="#fff" size="small" />
                        <Text className="text-white font-medium">Completing Profile...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-medium">Next</Text>
                    )}
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CompleteProfilePage;

