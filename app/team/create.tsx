import { axiosInstance } from "@/lib/axiosInstance";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { DesignTokens } from "@/constants/designTokens";
import { SafeAreaView } from "react-native-safe-area-context";
import * as z from "zod";
import { Icon } from "@/components/ui/Icon";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import UserSearchInput from "../match/components/UserSearchInput";
import { useAuthStore } from "@/hooks/useAuthStore";
import { FormTextField } from "@/components/ui/FormTextField";
import { Avatar } from "@/components/ui/Avatar";

const teamSchema = z.object({
  name: z
    .string()
    .min(3, "Team name must be at least 3 characters")
    .max(100, "Team name is too long"),
  captain: z.string().min(1, "Captain is required"),
  city: z.string().optional(),
  players: z.array(z.string()),
});

type TeamCreateFormValues = z.infer<typeof teamSchema>;

type User = {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
};

const tokens = DesignTokens;

const CreateTeamPage = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [teammates, setTeammates] = useState<User[]>([]);
  const [teamImage, setTeamImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Extra scroll padding on iOS only; Android uses KeyboardAvoidingView `padding`. */
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const showSub = Keyboard.addListener("keyboardWillShow", (e) =>
      setKeyboardInset(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener("keyboardWillHide", () =>
      setKeyboardInset(0),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TeamCreateFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", captain: "", city: "", players: [] },
  });

  useEffect(() => {
    if (user?._id) {
      setValue("captain", user._id);
    }
  }, [user, setValue]);

  useEffect(() => {
    setValue(
      "players",
      teammates.map((p) => p._id),
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  }, [teammates, setValue]);

  const addPlayer = useCallback(
    (selected: User) => {
      if (user?._id && selected._id === user._id) {
        Alert.alert(
          "Already on the team",
          "You are the captain and are already included.",
        );
        return;
      }
      setTeammates((prev) => {
        if (prev.some((p) => p._id === selected._id)) return prev;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return [...prev, selected];
      });
    },
    [user?._id],
  );

  const removePlayer = useCallback((id: string) => {
    setTeammates((prev) => {
      const next = prev.filter((p) => p._id !== id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return next;
    });
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setTeamImage(result.assets[0].uri);
      setImagePreview(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setTeamImage(null);
    setImagePreview(null);
  };

  const onSubmit = async (data: TeamCreateFormValues) => {
    if (!user?._id) {
      Alert.alert("Error", "You must be signed in.");
      return;
    }

    const rosterIds = [...new Set([user._id, ...teammates.map((p) => p._id)])];

    setIsSubmitting(true);
    try {
      const cityTrim = data.city?.trim() ?? "";

      if (teamImage) {
        const formData = new FormData();
        formData.append("name", data.name.trim());
        if (cityTrim.length >= 2) {
          formData.append("city", cityTrim);
        }
        formData.append("captain", data.captain);
        formData.append("players", JSON.stringify(rosterIds));

        const localUri = teamImage;
        const filename = localUri.split("/").pop() || "team-image.jpg";
        const ext = filename.split(".").pop()?.toLowerCase();
        const mime =
          ext === "png"
            ? "image/png"
            : ext === "gif"
              ? "image/gif"
              : ext === "webp"
                ? "image/webp"
                : "image/jpeg";

        formData.append("teamImage", {
          uri: localUri,
          name: filename,
          type: mime,
        } as unknown as Parameters<FormData["append"]>[1]);

        await axiosInstance.post("/teams", formData);
      } else {
        await axiosInstance.post(
          "/teams",
          {
            name: data.name.trim(),
            captain: data.captain,
            players: rosterIds,
            ...(cityTrim.length >= 2 ? { city: cityTrim } : {}),
          },
          { headers: { "Content-Type": "application/json" } },
        );
      }
      Alert.alert("Success", "Team created!");
      router.push("/(tabs)/teams");
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String((err.response.data as { message?: string }).message)
          : "Failed to create team";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rosterCount = (user ? 1 : 0) + teammates.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="chevron-left" size={20} color="#0f172a" />
          </Pressable>
          <Text style={styles.headerTitle}>Create team</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Platform.OS === "ios" ? keyboardInset : 0,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-4 py-3">
            <Text className="text-lg font-semibold text-slate-950 mb-3">
              Branding
            </Text>
            <Text className="text-sm text-slate-500 mb-4">
              Add a team logo; you can change it later from team settings.
            </Text>
            <View className="flex-row items-center gap-4">
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-semibold text-slate-900">
                  Team logo
                </Text>

                <Text className="mt-1 text-xs text-slate-500">
                  PNG or JPG, max 5MB
                </Text>

                <View className="mt-4 flex-row items-center gap-4">
                  <View className="relative h-16 w-16">
                    <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {imagePreview ? (
                        <Image
                          source={{ uri: imagePreview }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <Icon name="image" size={24} color="#94a3b8" />
                      )}
                    </View>
                    {imagePreview ? (
                      <Pressable
                        onPress={removeImage}
                        hitSlop={8}
                        className="absolute -right-1.5 -top-1.5 h-5 w-5 items-center justify-center rounded-full bg-slate-900 active:opacity-90"
                      >
                        <Icon name="close" size={11} color="white" />
                      </Pressable>
                    ) : null}
                  </View>

                  <View className="flex-1">
                    <Pressable
                      onPress={pickImage}
                      className="h-12 flex-row items-center justify-center gap-2 rounded-full bg-slate-900 active:opacity-90"
                    >
                      <Icon name="image" size={16} color="white" />
                      <Text className="text-sm font-semibold text-white">
                        {imagePreview ? "Change logo" : "Upload logo"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="px-4 py-3">
            <Text className="text-lg font-semibold text-slate-950 mb-3">
              Team details
            </Text>
            <View className="mb-3">
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <FormTextField
                    label="Enter your team name"
                    placeholder="e.g. Downtown Spinners"
                    value={value}
                    onChangeText={onChange}
                    error={errors.name?.message}
                    autoCorrect
                  />
                )}
              />
            </View>
            <View>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, value } }) => (
                  <FormTextField
                    label="City (optional)"
                    placeholder="City"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          </View>

          <View className="px-4 py-3">
            <Text className="text-lg font-semibold text-slate-950 mb-3">
              Roster
            </Text>
            <Text className="text-sm text-slate-500 mb-4">
              You are captain. Teammates are optional now — invite players later
              with a team code.
            </Text>

            {user && (
              <View className="mb-4 flex-row items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                <View className="h-9 w-9 items-center justify-center rounded-full">
                  <Avatar size={40} src={user.profileImage} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text
                    className="text-sm font-semibold text-slate-900"
                    numberOfLines={1}
                  >
                    {user.fullName || user.username}
                  </Text>
                  <Text className="text-xs text-slate-500" numberOfLines={1}>
                    @{user.username} ·{" "}
                    <Text className="text-blue-500 font-medium">Captain</Text>
                  </Text>
                </View>
              </View>
            )}

            <Text className="text-sm text-slate-500 mb-2">Find players</Text>
            <Controller
              control={control}
              name="players"
              render={() => (
                <UserSearchInput
                  placeholder="Search by name or username"
                  clearAfterSelect
                  onSelect={addPlayer}
                />
              )}
            />
            {errors.players ? (
              <Text className="mt-2 text-xs text-red-600">
                {errors.players.message}
              </Text>
            ) : null}

            {teammates.length > 0 ? (
              <View className="mt-4 gap-2">
                {teammates.map((p, idx) => (
                  <View
                    key={p._id}
                    className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white p-3"
                  >
                    <View className="flex-row items-center gap-3 flex-1 min-w-0">
                      <View className="h-7 w-7 items-center justify-center rounded-full bg-indigo-50">
                        <Text className="text-xs font-bold text-indigo-700">
                          {idx + 1}
                        </Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text
                          className="text-sm font-medium text-slate-900"
                          numberOfLines={1}
                        >
                          {p.fullName || p.username}
                        </Text>
                        <Text
                          className="text-xs text-slate-500"
                          numberOfLines={1}
                        >
                          @{p.username}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => removePlayer(p._id)}
                      hitSlop={10}
                      className="rounded-lg bg-red-50 p-2 active:opacity-80"
                    >
                      <Icon name="close" size={15} color="#b91c1c" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View className="mt-4 items-center rounded-xl border border-dashed border-gray-300 py-8">
                <Text className="text-sm text-slate-500 px-4 text-center">
                  Search to add teammates to your roster.
                </Text>
              </View>
            )}

            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-xs font-medium text-slate-600">
                {rosterCount} player{rosterCount === 1 ? "" : "s"} in roster
              </Text>
              <Text className="text-xs text-slate-400">
                Captain counts as 1
              </Text>
            </View>
          </View>

          <View className="px-4 pt-4">
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={styles.submitButton}
            >
              {isSubmitting ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white text-sm font-medium">
                    Creating team
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-sm font-medium">
                  Create team
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 6,
    borderRadius: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
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
  submitButton: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    height: tokens.spacing[14],
    borderRadius: tokens.borderRadius.sm,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    backgroundColor: tokens.colors.background.buttons.lightBlue,
    color: tokens.colors.text.primary,
  },
});

export default CreateTeamPage;
