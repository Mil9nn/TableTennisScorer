import { useState, useEffect, useRef } from "react";
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
import { DesignTokens } from "@/constants/designTokens";
import { axiosInstance } from "@/lib/axiosInstance";
import { useAuthStore } from "@/hooks/useAuthStore";
import Toast from "react-native-toast-message";

const OTP_LENGTH = 6;

const VerifyEmailPage = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ email?: string }>();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const tokens = DesignTokens;
  const email = (params.email ?? "").trim().toLowerCase();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.primary[50],
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: tokens.spacing[8],
      paddingVertical: tokens.spacing[8],
    },
    header: {
      alignItems: "center",
      marginBottom: tokens.spacing[12],
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
    formCard: {
      padding: tokens.spacing[6],
    },
    otpInput: {
      fontSize: 28,
      letterSpacing: 12,
      textAlign: "center",
      backgroundColor: tokens.colors.gray[50],
      borderRadius: tokens.borderRadius.sm,
      paddingVertical: tokens.spacing[6],
      color: tokens.colors.gray[900],
      marginBottom: tokens.spacing[8],
    },
    verifyButton: {
      backgroundColor: tokens.colors.primary[500],
      paddingVertical: tokens.spacing[6],
      borderRadius: tokens.borderRadius.sm,
      alignItems: "center",
    },
    disabledButton: {
      opacity: 0.7,
    },
    verifyButtonText: {
      color: tokens.colors.white,
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
    },
    resendButton: {
      alignItems: "center",
      marginTop: tokens.spacing[8],
    },
    resendText: {
      color: tokens.colors.primary[500],
      fontSize: tokens.typography.fontSize.sm,
    },
    backButton: {
      alignItems: "center",
      marginTop: tokens.spacing[6],
    },
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
              placeholderTextColor={tokens.colors.gray[300]}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.disabledButton]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
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
                <ActivityIndicator size="small" color={tokens.colors.primary[500]} />
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
