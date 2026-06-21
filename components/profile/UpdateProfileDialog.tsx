import { Button } from "@/components/ui/Button";
import { FormTextField } from "@/components/ui/FormTextField";
import { Textarea } from "@/components/ui/Textarea";
import { DesignTokens } from "@/constants/designTokens";
import type { ProfileDisplayUser } from "@/contexts/ProfileContext";
import { useAuthStore } from "@/hooks/useAuthStore";
import { axiosInstance } from "@/lib/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Dialog, Portal } from "react-native-paper";
import Toast from "react-native-toast-message";

type GenderOption = "male" | "female" | "other" | "prefer_not_to_say";
type HandednessOption = "left" | "right" | "ambidextrous";

interface UpdateProfileDialogProps {
  visible: boolean;
  onClose: () => void;
  user: ProfileDisplayUser | null;
  onSaved?: () => void;
}

const GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const HAND_OPTIONS: { value: HandednessOption; label: string }[] = [
  { value: "right", label: "Right-handed" },
  { value: "left", label: "Left-handed" },
  { value: "ambidextrous", label: "Ambidextrous" },
];

const tokens = DesignTokens;

export function UpdateProfileDialog({
  visible,
  onClose,
  user,
  onSaved,
}: UpdateProfileDialogProps) {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<GenderOption | "">("");
  const [handedness, setHandedness] = useState<HandednessOption | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!visible || !user) return;
    setFullName(user.fullName ?? "");
    setDateOfBirth(user.dateOfBirth ?? "");
    setGender((user.gender as GenderOption) ?? "");
    setHandedness((user.handedness as HandednessOption) ?? "");
    setPhoneNumber(user.phoneNumber ?? "");
    setLocation(user.location ?? "");
    setBio(user.bio ?? "");
  }, [visible, user]);

  const selectedDate = dateOfBirth ? new Date(dateOfBirth) : new Date();

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      Toast.show({
        type: "error",
        text1: "Invalid name",
        text2: "Full name must be at least 2 characters.",
      });
      return;
    }
    if (bio.length > 500) {
      Toast.show({
        type: "error",
        text1: "Bio too long",
        text2: "Bio must be 500 characters or less.",
      });
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.put("/auth/update-profile", {
        fullName: trimmedName,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        handedness: handedness || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      await fetchUser();
      onSaved?.();
      Toast.show({
        type: "success",
        text1: "Profile updated",
        text2: "Your changes have been saved.",
      });
      onClose();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update profile";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>Update profile</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.form}>
              <FormTextField
                label="Full name"
                placeholder="Your full name"
                value={fullName}
                onChangeText={setFullName}
                containerStyle={styles.field}
              />

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Ionicons name="calendar" size={16} color="#6366f1" />
                  <Text style={styles.label}>Date of birth</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateButtonText}>
                    {dateOfBirth || "Select date"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker ? (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(_, picked) => {
                      setShowDatePicker(false);
                      if (picked) {
                        setDateOfBirth(picked.toISOString().split("T")[0]);
                      }
                    }}
                  />
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.chipRow}>
                  {GENDER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setGender(option.value)}
                      style={[
                        styles.chip,
                        gender === option.value && styles.chipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          gender === option.value && styles.chipTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Playing hand</Text>
                <View style={styles.chipRow}>
                  {HAND_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setHandedness(option.value)}
                      style={[
                        styles.chip,
                        handedness === option.value && styles.chipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          handedness === option.value &&
                            styles.chipTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <FormTextField
                label="Phone"
                placeholder="Phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCapitalize="none"
                containerStyle={styles.field}
              />

              <FormTextField
                label="Location"
                placeholder="City, Country"
                value={location}
                onChangeText={setLocation}
                containerStyle={styles.field}
              />

              <View style={styles.field}>
                <Text style={styles.label}>Bio</Text>
                <Textarea
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChangeText={setBio}
                  style={{ minHeight: 100 }}
                />
                <Text style={styles.charCount}>{bio.length}/500</Text>
              </View>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button variant="ghost" size="sm" onPress={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            style={styles.saveButton}
            textStyle={styles.saveButtonText}
            onPress={handleSave}
            disabled={saving}
            loading={saving}
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: "90%",
    backgroundColor: DesignTokens.colors.background.primary,
    borderRadius: DesignTokens.borderRadius.sm,
  },
  scrollArea: {
    paddingHorizontal: 0,
    maxHeight: 420,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textTransform: "capitalize",
    letterSpacing: 0.3,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  dateButtonText: {
    fontSize: 15,
    color: "#111827",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  chipText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    letterSpacing: tokens.typography.letterSpacing.tight,
    textAlign: "center",
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
  },
  chipTextSelected: {
    color: "#fff",
  },
  charCount: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  saveButton: {
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.buttons.primary[500],
    textAlign: "center",
  },
  saveButtonText: {
    color: tokens.colors.text.inverse,
    fontSize: tokens.typography.fontSize.sm,
    paddingHorizontal: tokens.spacing[4],
    fontWeight: tokens.typography.fontWeight.semibold,
    letterSpacing: tokens.typography.letterSpacing.tight,
    textAlign: "center",
  },
});
