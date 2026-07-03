import { useState, useEffect, useRef } from "react";
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
import { DesignTokens } from "@/constants/designTokens";
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
  const tokens = DesignTokens;
  const email = (params.email ?? "").trim().toLowerCase();

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.primary[50],
    },
    keyboardAvoidingView: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: tokens.spacing[8],
      paddingVertical: tokens.spacing[8],
    },
    header: {
      alignItems: "center",
      marginBottom: tokens.spacing[10],
    },
    logoBox: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    logoImage: { width: "88%", height: "88%" },
    brandName: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.extrabold,
      color: tokens.colors.gray[900],
      letterSpacing: tokens.typography.letterSpacing.tight,
      marginBottom: tokens.spacing[2],
    },
    subtitle: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.gray[500],
      textAlign: "center",
      lineHeight: 20,
    },
    emailText: {
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.gray[700],
    },
    formCard: { padding: tokens.spacing[6], gap: tokens.spacing[6] },
    otpInput: {
      fontSize: 28,
      letterSpacing: 12,
      textAlign: "center",
      backgroundColor: tokens.colors.gray[50],
      borderRadius: tokens.borderRadius.sm,
      paddingVertical: tokens.spacing[6],
      color: tokens.colors.gray[900],
    },
    paperInput: {
      backgroundColor: tokens.colors.gray[50],
      fontSize: tokens.typography.fontSize.sm,
      height: 44,
    },
    eyeIcon: { padding: tokens.spacing[4] },
    submitButton: {
      backgroundColor: tokens.colors.primary[500],
      paddingVertical: tokens.spacing[6],
      borderRadius: tokens.borderRadius.sm,
      alignItems: "center",
    },
    disabledButton: { opacity: 0.7 },
    submitButtonText: {
      color: tokens.colors.white,
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
    },
    resendButton: { alignItems: "center" },
    resendText: {
      color: tokens.colors.primary[500],
      fontSize: tokens.typography.fontSize.sm,
    },
    backButton: { alignItems: "center" },
    backText: {
      color: tokens.colors.gray[500],
      fontSize: tokens.typography.fontSize.sm,
    },
  });

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
              placeholderTextColor={tokens.colors.gray[300]}
            />

            <PaperTextInput
              mode="flat"
              label="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              left={
                <PaperTextInput.Icon
                  icon={() => <Icon name="lock" size={20} color={tokens.colors.gray[500]} />}
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
                        color={tokens.colors.gray[500]}
                      />
                    </TouchableOpacity>
                  )}
                />
              }
              style={styles.paperInput}
              theme={{
                colors: {
                  primary: tokens.colors.primary[500],
                  background: "transparent",
                },
              }}
            />

            <PaperTextInput
              mode="flat"
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              left={
                <PaperTextInput.Icon
                  icon={() => <Icon name="lock" size={20} color={tokens.colors.gray[500]} />}
                />
              }
              style={styles.paperInput}
              theme={{
                colors: {
                  primary: tokens.colors.primary[500],
                  background: "transparent",
                },
              }}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
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
                <ActivityIndicator size="small" color={tokens.colors.primary[500]} />
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
