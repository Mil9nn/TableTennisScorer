import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useLocalSearchParams, useFocusEffect, useNavigation, type Href } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  passwordResetErrorMessage,
  requestPasswordResetCode,
  resetPasswordWithOtp,
} from "@/lib/auth/passwordReset";
import { passwordSchema } from "@/lib/validations/auth";
import Toast from "react-native-toast-message";

const OTP_LENGTH = 6;

const ResetPasswordPage = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ email?: string }>();
  const theme = useThemeColors();
  const email = (params.email ?? "").trim().toLowerCase();

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background.secondary,
        },
        keyboardAvoidingView: { flex: 1 },
        scrollContent: {
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: theme.spacing[8],
          paddingVertical: theme.spacing[8],
        },
        header: {
          alignItems: "center",
          marginBottom: theme.spacing[10],
        },
        logoBox: {
          width: 56,
          height: 56,
          alignItems: "center",
          justifyContent: "center",
        },
        logoImage: { width: "88%", height: "88%" },
        brandName: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.extrabold,
          color: theme.colors.text.primary,
          letterSpacing: theme.typography.letterSpacing.tight,
          marginBottom: theme.spacing[2],
        },
        subtitle: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          textAlign: "center",
          lineHeight: 20,
        },
        emailText: {
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.secondary,
        },
        formCard: { padding: theme.spacing[6], gap: theme.spacing[6] },
        otpInput: {
          fontSize: 28,
          letterSpacing: 12,
          textAlign: "center",
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.sm,
          paddingVertical: theme.spacing[6],
          color: theme.colors.text.primary,
          minHeight: 56,
        },
        paperInput: {
          backgroundColor: theme.colors.background.primary,
          fontSize: theme.typography.fontSize.sm,
          height: 44,
        },
        eyeIcon: { padding: theme.spacing[4] },
        submitButton: {
          backgroundColor: theme.colors.primary[500],
          paddingVertical: theme.spacing[6],
          borderRadius: theme.borderRadius.sm,
          alignItems: "center",
          minHeight: 44,
        },
        disabledButton: { opacity: 0.7 },
        submitButtonText: {
          color: theme.colors.white,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
        },
        resendButton: {
          alignItems: "center",
          minHeight: 44,
          justifyContent: "center",
        },
        resendText: {
          color: theme.colors.primary[500],
          fontSize: theme.typography.fontSize.sm,
        },
        backButton: {
          alignItems: "center",
          minHeight: 44,
          justifyContent: "center",
        },
        backText: {
          color: theme.colors.text.tertiary,
          fontSize: theme.typography.fontSize.sm,
        },
      }),
    [theme],
  );

  const paperTheme = useMemo(
    () => ({
      colors: {
        primary: theme.colors.primary[500],
        background: "transparent",
        onSurfaceVariant: theme.colors.text.tertiary,
      },
    }),
    [theme],
  );

  useFocusEffect(() => {
    navigation.setOptions({ headerShown: false });
  });

  useEffect(() => {
    if (!email) {
      router.replace("/auth/forgot-password" as Href);
    }
  }, [email, router]);

  const handleReset = async () => {
    if (otp.length !== OTP_LENGTH) {
      Alert.alert("Enter your code", "Please enter the 6-digit code from your email.");
      return;
    }

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      Alert.alert("Choose a stronger password", parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Make sure both password fields match.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithOtp({ email, otp, password: parsed.data });
      Toast.show({
        type: "success",
        text1: "Password updated",
        text2: "You can now log in with your new password.",
      });
      router.replace("/auth/login");
    } catch (error: unknown) {
      Alert.alert(
        "Couldn't reset password",
        passwordResetErrorMessage(
          error,
          "The code may be wrong or expired. Request a new code and try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await requestPasswordResetCode(email);
      Toast.show({
        type: "info",
        text1: "New code sent",
        text2: "Check your email for a fresh reset code.",
      });
    } catch (error: unknown) {
      Alert.alert(
        "Couldn't resend code",
        passwordResetErrorMessage(error, "Please wait a moment and try again."),
      );
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Choose a new password</Text>
            <Text style={styles.subtitle}>
              Enter the code we sent to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.formCard}>
            <TextInput
              ref={inputRef}
              style={styles.otpInput}
              value={otp}
              onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
              maxLength={OTP_LENGTH}
              placeholder="000000"
              placeholderTextColor={theme.colors.text.tertiary}
            />

            <PaperTextInput
              mode="flat"
              label="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textColor={theme.colors.text.primary}
              left={
                <PaperTextInput.Icon
                  icon={() => <Icon name="lock" size={20} color={theme.colors.text.tertiary} />}
                />
              }
              right={
                <PaperTextInput.Icon
                  icon={() => (
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Icon
                        name={showPassword ? "eye-slash" : "eye"}
                        size={20}
                        color={theme.colors.text.tertiary}
                      />
                    </TouchableOpacity>
                  )}
                />
              }
              style={styles.paperInput}
              theme={paperTheme}
            />

            <PaperTextInput
              mode="flat"
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textColor={theme.colors.text.primary}
              left={
                <PaperTextInput.Icon
                  icon={() => <Icon name="lock" size={20} color={theme.colors.text.tertiary} />}
                />
              }
              style={styles.paperInput}
              theme={paperTheme}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Update password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResend}
              disabled={resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
              ) : (
                <Text style={styles.resendText}>Resend code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/auth/forgot-password" as Href)}
            >
              <Text style={styles.backText}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPasswordPage;
