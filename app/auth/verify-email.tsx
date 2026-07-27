import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useLocalSearchParams, useFocusEffect, useNavigation } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColors } from "@/hooks/useThemeColors";
import { axiosInstance } from "@/lib/axiosInstance";
import { useAuthStore } from "@/hooks/useAuthStore";
import Toast from "react-native-toast-message";

const OTP_LENGTH = 6;

const VerifyEmailPage = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ email?: string }>();
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const theme = useThemeColors();

  const email = (params.email ?? "").trim().toLowerCase();

  const [otp, setOtp] = useState("");
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
        keyboardAvoidingView: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: theme.spacing[8],
          paddingVertical: theme.spacing[8],
        },
        header: {
          alignItems: "center",
          marginBottom: theme.spacing[12],
        },
        logoBox: {
          width: 56,
          height: 56,
          alignItems: "center",
          justifyContent: "center",
        },
        logoImage: {
          width: "88%",
          height: "88%",
        },
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
        formCard: {
          padding: theme.spacing[6],
        },
        otpInput: {
          fontSize: 28,
          letterSpacing: 12,
          textAlign: "center",
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.sm,
          paddingVertical: theme.spacing[6],
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[8],
          minHeight: 56,
        },
        verifyButton: {
          backgroundColor: theme.colors.primary[500],
          paddingVertical: theme.spacing[6],
          borderRadius: theme.borderRadius.sm,
          alignItems: "center",
          minHeight: 44,
        },
        disabledButton: {
          opacity: 0.7,
        },
        verifyButtonText: {
          color: theme.colors.white,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
        },
        resendButton: {
          alignItems: "center",
          marginTop: theme.spacing[8],
          minHeight: 44,
          justifyContent: "center",
        },
        resendText: {
          color: theme.colors.primary[500],
          fontSize: theme.typography.fontSize.sm,
        },
        backButton: {
          alignItems: "center",
          marginTop: theme.spacing[6],
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

  useFocusEffect(() => {
    navigation.setOptions({ headerShown: false });
  });

  useEffect(() => {
    if (!email) {
      router.replace("/auth/login");
    }
  }, [email, router]);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) {
      Alert.alert("Error", "Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post("auth/verify-otp", {
        email,
        otp,
        purpose: "email_verification",
      });
      await fetchUser();
      Toast.show({
        type: "success",
        text1: "Email verified",
        text2: "Welcome to TTPro!",
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Verification failed. Please try again.";
      Alert.alert("Verification failed", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axiosInstance.post("auth/send-otp", {
        email,
        purpose: "email_verification",
      });
      Toast.show({
        type: "info",
        text1: "Code sent",
        text2: "Check your email for a new verification code",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Could not resend code. Please try again.";
      Alert.alert("Resend failed", message);
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null;
  }

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
            <Text style={styles.brandName}>Verify your email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{"\n"}
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
              autoFocus
            />

            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.disabledButton]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.verifyButtonText}>Verify Email</Text>
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
              onPress={() => router.replace("/auth/login")}
            >
              <Text style={styles.backText}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyEmailPage;
