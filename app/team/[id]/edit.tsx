import { axiosInstance } from "@/lib/axiosInstance";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as z from "zod";
import { Icon } from "@/components/ui/Icon";
import { FormTextField } from "@/components/ui/FormTextField";
import * as Haptics from "expo-haptics";
import UserSearchInput from "@/app/match/components/UserSearchInput";
import { useAuthStore } from "@/hooks/useAuthStore";
import Toast from "react-native-toast-message";
import { StyleSheet } from "react-native";
import { DesignTokens } from "@/constants/designTokens";
import { Avatar } from "@/components/ui/Avatar";

const teamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
  city: z.string().optional(),
  players: z.array(z.string()).min(1, "Captain must remain on the roster"),
});

type User = {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
};

type Team = {
  _id: string;
  name: string;
  city?: string;
  logo?: string;
  captain: User;
  players: Array<{ user: User }>;
};

type EditTeamFormValues = z.infer<typeof teamSchema>;

const tokens = DesignTokens;

export default function EditTeamPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teamImage, setTeamImage] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditTeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      city: "",
      players: [],
    },
  });

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/teams/${id}`);
      const fetchedTeam = res.data.team;
      setTeam(fetchedTeam);

      if (user && fetchedTeam.captain._id !== user._id) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Only the team captain can edit this team",
        });
        router.back();
        return;
      }

      setValue("name", fetchedTeam.name);
      setValue("city", fetchedTeam.city || "");
      setImageUri(fetchedTeam.logo || null);

      const teamPlayers = fetchedTeam.players.map((p: any) => p.user);
      const captainId = fetchedTeam.captain._id;
      if (!teamPlayers.some((p: User) => p._id === captainId)) {
        teamPlayers.unshift(fetchedTeam.captain);
      }
      setPlayers(teamPlayers);
      setValue("players", teamPlayers.map((p: User) => p._id));
    } catch (err: any) {
      console.error("Error fetching team:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load team",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission Required",
        text2: "Please grant camera roll permissions",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setTeamImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setTeamImage(null);
    setImageUri(null);
  };

  const addPlayer = useCallback((selected: User) => {
    setPlayers((prev) => {
      if (prev.some((p) => p._id === selected._id)) return prev;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updated = [...prev, selected];
      setValue(
        "players",
        updated.map((p) => p._id)
      );
      return updated;
    });
  }, [setValue]);

  const removePlayer = useCallback((userId: string) => {
    if (team && userId === team.captain._id) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Cannot remove the team captain",
      });
      return;
    }

    setPlayers((prev) => {
      const updated = prev.filter((p) => p._id !== userId);
      setValue(
        "players",
        updated.map((p) => p._id)
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return updated;
    });
  }, [setValue, team]);

  const onSubmit = async (data: EditTeamFormValues) => {
    if (!team) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("city", (data.city || "").trim());
      formData.append("players", JSON.stringify(players.map((p) => p._id)));

      if (teamImage) {
        const filename = teamImage.split("/").pop() || "team-image.jpg";
        const ext = filename.split(".").pop()?.toLowerCase();
        const type =
          ext === "png"
            ? "image/png"
            : ext === "gif"
              ? "image/gif"
              : ext === "webp"
                ? "image/webp"
                : "image/jpeg";

        formData.append("teamImage", {
          uri: teamImage,
          name: filename,
          type,
        } as any);
      }

      await axiosInstance.put(`/teams/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Team updated successfully!",
      });
      router.back();
    } catch (err: any) {
      console.error("Error updating team:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.message || "Failed to update team",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  if (!team) return null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View className="border-b border-gray-100 bg-white/90">
          <View className="flex-row items-center gap-3 px-4 h-14">
            <Pressable
              onPress={() => router.back()}
              className="p-1.5 rounded-md active:bg-gray-100"
            >
              <Icon name="chevron-left" size={20} color="#0f172a" />
            </Pressable>
            <Text className="text-lg font-semibold text-slate-900">Edit team</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-4 py-3">
            <Text className="text-lg font-semibold text-slate-950 mb-3">Branding</Text>
            <Text className="text-sm text-slate-500 mb-4">
              Update logo and visual identity for your team.
            </Text>
            <View style={styles.logoContainer}>
              {imageUri ? (
                <Avatar
                  size={54}
                  src={imageUri}
                  className="rounded-2xl"
                />
              ) : (
                <View className="h-[84px] w-[84px] items-center justify-center rounded-2xl bg-slate-50">
                  <Icon name="image" size={26} color="#94a3b8" />
                </View>
              )}
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-semibold text-slate-900">Team logo</Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  <Pressable
                    onPress={pickImage}
                    style={styles.chooseLogoButton}
                  >
                    <Icon name="image" size={16} color="#0f172a" />
                    <Text className="text-sm font-medium text-slate-800">
                      {imageUri ? "Change logo" : "Choose logo"}
                    </Text>
                  </Pressable>
                  {imageUri ? (
                    <Pressable
                      onPress={removeImage}
                      style={styles.removeLogoButton}
                    >
                      <Text className="text-sm font-medium text-red-700">Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          <View className="px-4 py-3">
            <Text className="text-lg font-semibold text-slate-950 mb-3">Team details</Text>
            <View className="mb-3">
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <FormTextField
                    label="Team name"
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
                    value={value || ""}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          </View>

          <View className="px-4 py-3">
            <Text className="text-lg font-semibold text-slate-950 mb-3">Roster</Text>
            <Text className="text-sm text-slate-500 mb-4">
              Captain remains fixed. Add or remove teammates below.
            </Text>

            <View className="mb-4 flex-row items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-indigo-600">
                <Text className="text-sm font-bold text-white">C</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>
                  {team.captain.fullName || team.captain.username}
                </Text>
                <Text className="text-xs text-slate-500" numberOfLines={1}>
                  @{team.captain.username} · Captain
                </Text>
              </View>
            </View>

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
              <Text className="mt-2 text-xs text-red-600">{errors.players.message}</Text>
            ) : null}

            {players.length > 0 ? (
              <View className="mt-4 gap-2">
                {players.map((p, idx) => {
                  const isCaptain = p._id === team.captain._id;
                  return (
                    <View
                      key={p._id}
                      className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white p-3"
                    >
                      <View className="flex-row items-center gap-3 flex-1 min-w-0">
                        <View className={`h-7 w-7 items-center justify-center rounded-full ${isCaptain ? "bg-amber-100" : "bg-indigo-50"}`}>
                          <Text className={`text-xs font-bold ${isCaptain ? "text-amber-700" : "text-indigo-700"}`}>
                            {isCaptain ? "C" : idx + 1}
                          </Text>
                        </View>
                        <View className="flex-1 min-w-0">
                          <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
                            {p.fullName || p.username}
                          </Text>
                          <Text className="text-xs text-slate-500" numberOfLines={1}>
                            @{p.username}
                          </Text>
                        </View>
                      </View>
                      {!isCaptain ? (
                        <Pressable
                          onPress={() => removePlayer(p._id)}
                          hitSlop={10}
                          className="rounded-lg bg-red-50 p-2 active:opacity-80"
                        >
                          <Icon name="close" size={15} color="#b91c1c" />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
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
                {players.length} player{players.length === 1 ? "" : "s"} in roster
              </Text>
              <Text className="text-xs text-slate-400">Captain required</Text>
            </View>
          </View>

          <View className="px-4 pb-8 pt-4">
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
              style={styles.submitButton}
            >
              {submitting ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white text-sm font-medium">Saving changes</Text>
                </View>
              ) : (
                <Text className="text-white text-sm font-medium">Save changes</Text>
              )}
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => router.back()} className="mt-3 h-11 items-center justify-center rounded-xl border border-gray-200 bg-white">
              <Text className="text-sm font-medium text-slate-700">Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[6],
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    padding: tokens.spacing[4],
  },
  chooseLogoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[4],
  },
  removeLogoButton: {
    padding: tokens.spacing[4],
  },
  submitButton: {
    height: tokens.spacing[14],
    backgroundColor: tokens.colors.background.buttons.primary[500],
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: tokens.spacing[2],
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.inverse,
  },
  cancelButton: {
    height: tokens.spacing[14],
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
});

