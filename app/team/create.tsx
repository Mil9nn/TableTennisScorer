import { axiosInstance } from "@/lib/axiosInstance";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect, useMemo } from "react";
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
import { useThemeColors } from "@/hooks/useThemeColors";
import { useLocationSelection } from "@/hooks/useLocationSelection";
import { SafeAreaView } from "react-native-safe-area-context";
import * as z from "zod";
import { Icon } from "@/components/ui/Icon";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import UserSearchInput from "../match/components/UserSearchInput";
import { useAuthStore } from "@/hooks/useAuthStore";
import { FormTextField } from "@/components/ui/FormTextField";
import { LocationSelectRow } from "@/components/location/LocationSelectRow";
import { Avatar } from "@/components/ui/Avatar";

const teamSchema = z.object({
  name: z
    .string()
    .min(3, "Team name must be at least 3 characters")
    .max(100, "Team name is too long"),
  captain: z.string().min(1, "Captain is required"),
  cityId: z.string().optional(),
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

const CreateTeamPage = () => {
  const theme = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        },
        header: {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.primary,
        },
        headerContent: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[6],
          paddingHorizontal: theme.spacing[7],
          height: 56,
        },
        backButton: {
          padding: theme.spacing[3],
          borderRadius: theme.borderRadius.sm,
        },
        headerTitle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
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
        section: {
          paddingHorizontal: theme.spacing[7],
          paddingVertical: theme.spacing[3],
        },
        sectionTitle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[3],
        },
        sectionSubtitle: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          marginBottom: theme.spacing[4],
        },
        fieldLabel: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        fieldHint: {
          marginTop: theme.spacing[1],
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        },
        logoRow: {
          marginTop: theme.spacing[4],
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[4],
        },
        logoPreviewWrap: {
          position: "relative",
          width: 64,
          height: 64,
        },
        logoPreview: {
          width: 64,
          height: 64,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.secondary,
        },
        removeLogoButton: {
          position: "absolute",
          right: -6,
          top: -6,
          width: 20,
          height: 20,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.text.primary,
        },
        uploadButton: {
          height: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing[2],
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.text.primary,
        },
        uploadButtonText: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.white,
        },
        formFieldGap: {
          marginBottom: theme.spacing[3],
        },
        captainCard: {
          marginBottom: theme.spacing[4],
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
          borderRadius: theme.borderRadius.md,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.primary,
          padding: theme.spacing[3],
        },
        captainName: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
        captainMeta: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        },
        captainBadge: {
          color: theme.colors.info,
          fontWeight: theme.typography.fontWeight.medium,
        },
        searchLabel: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          marginBottom: theme.spacing[2],
        },
        errorText: {
          marginTop: theme.spacing[2],
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.error,
        },
        rosterList: {
          marginTop: theme.spacing[4],
          gap: theme.spacing[2],
        },
        rosterCard: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: theme.borderRadius.md,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.primary,
          padding: theme.spacing[3],
        },
        rosterCardLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
          flex: 1,
          minWidth: 0,
        },
        rosterIndex: {
          width: 28,
          height: 28,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.primary[50],
        },
        rosterIndexText: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary[700],
        },
        rosterName: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
        },
        rosterUsername: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        },
        removePlayerButton: {
          borderRadius: theme.borderRadius.sm,
          backgroundColor: theme.scheme === "dark" ? "rgba(248,113,113,0.15)" : "#FEF2F2",
          padding: theme.spacing[2],
        },
        emptyRoster: {
          marginTop: theme.spacing[4],
          alignItems: "center",
          borderRadius: theme.borderRadius.md,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: theme.colors.border.medium,
          paddingVertical: theme.spacing[8],
        },
        emptyRosterText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          paddingHorizontal: theme.spacing[7],
          textAlign: "center",
        },
        rosterFooter: {
          marginTop: theme.spacing[4],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        rosterCount: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
        },
        rosterHint: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        },
        submitSection: {
          paddingHorizontal: theme.spacing[7],
          paddingTop: theme.spacing[4],
        },
        submitButton: {
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          height: theme.spacing[14],
          borderRadius: theme.borderRadius.sm,
          backgroundColor: theme.colors.background.buttons.lightBlue,
        },
        submitButtonText: {
          color: theme.colors.white,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
        },
        submitRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
        },
      }),
    [theme],
  );

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
    defaultValues: { name: "", captain: "", cityId: "", city: "", players: [] },
  });

  const { city, openCityPicker, cityLabel } = useLocationSelection({
    clearVenueOnCityChange: false,
  });

  useEffect(() => {
    if (user?._id) {
      setValue("captain", user._id);
    }
  }, [user, setValue]);

  useEffect(() => {
    setValue("cityId", city?._id ?? "");
    setValue("city", city?.name ?? "");
  }, [city, setValue]);

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
      const cityId = data.cityId?.trim() || city?._id || "";
      const cityName = data.city?.trim() || city?.name || "";

      if (teamImage) {
        const formData = new FormData();
        formData.append("name", data.name.trim());
        if (cityId) {
          formData.append("cityId", cityId);
        }
        if (cityName.length >= 2) {
          formData.append("city", cityName);
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
            ...(cityId ? { cityId } : {}),
            ...(cityName.length >= 2 ? { city: cityName } : {}),
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
            <Icon name="chevron-left" size={20} color={theme.colors.text.primary} />
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Branding</Text>
            <Text style={styles.sectionSubtitle}>
              Add a team logo; you can change it later from team settings.
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing[4] }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.fieldLabel}>Team logo</Text>
                <Text style={styles.fieldHint}>PNG or JPG, max 5MB</Text>
                <View style={styles.logoRow}>
                  <View style={styles.logoPreviewWrap}>
                    <View style={styles.logoPreview}>
                      {imagePreview ? (
                        <Image
                          source={{ uri: imagePreview }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <Icon name="image" size={24} color={theme.colors.text.tertiary} />
                      )}
                    </View>
                    {imagePreview ? (
                      <Pressable onPress={removeImage} hitSlop={8} style={styles.removeLogoButton}>
                        <Icon name="close" size={11} color={theme.colors.white} />
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Pressable onPress={pickImage} style={styles.uploadButton}>
                      <Icon name="image" size={16} color={theme.colors.white} />
                      <Text style={styles.uploadButtonText}>
                        {imagePreview ? "Change logo" : "Upload logo"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team details</Text>
            <View style={styles.formFieldGap}>
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
              <LocationSelectRow
                label="City (optional)"
                value={cityLabel}
                placeholder="Search city…"
                onPress={openCityPicker}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Roster</Text>
            <Text style={styles.sectionSubtitle}>
              You are captain. Teammates are optional now — invite players later
              with a team code.
            </Text>

            {user && (
              <View style={styles.captainCard}>
                <View style={{ height: 36, width: 36, alignItems: "center", justifyContent: "center" }}>
                  <Avatar size={40} src={user.profileImage} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.captainName} numberOfLines={1}>
                    {user.fullName || user.username}
                  </Text>
                  <Text style={styles.captainMeta} numberOfLines={1}>
                    @{user.username} ·{" "}
                    <Text style={styles.captainBadge}>Captain</Text>
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.searchLabel}>Find players</Text>
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
              <Text style={styles.errorText}>{errors.players.message}</Text>
            ) : null}

            {teammates.length > 0 ? (
              <View style={styles.rosterList}>
                {teammates.map((p, idx) => (
                  <View key={p._id} style={styles.rosterCard}>
                    <View style={styles.rosterCardLeft}>
                      <View style={styles.rosterIndex}>
                        <Text style={styles.rosterIndexText}>{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.rosterName} numberOfLines={1}>
                          {p.fullName || p.username}
                        </Text>
                        <Text style={styles.rosterUsername} numberOfLines={1}>
                          @{p.username}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => removePlayer(p._id)}
                      hitSlop={10}
                      style={styles.removePlayerButton}
                    >
                      <Icon name="close" size={15} color={theme.colors.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyRoster}>
                <Text style={styles.emptyRosterText}>
                  Search to add teammates to your roster.
                </Text>
              </View>
            )}

            <View style={styles.rosterFooter}>
              <Text style={styles.rosterCount}>
                {rosterCount} player{rosterCount === 1 ? "" : "s"} in roster
              </Text>
              <Text style={styles.rosterHint}>Captain counts as 1</Text>
            </View>
          </View>

          <View style={styles.submitSection}>
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={styles.submitButton}
            >
              {isSubmitting ? (
                <View style={styles.submitRow}>
                  <ActivityIndicator size="small" color={theme.colors.white} />
                  <Text style={styles.submitButtonText}>Creating team</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Create team</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateTeamPage;
