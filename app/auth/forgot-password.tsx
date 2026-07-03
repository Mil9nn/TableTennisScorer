import { useState } from "react";
import { useRouter, useFocusEffect, useNavigation, type Href } from "expo-router";
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
} from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { DesignTokens } from "@/constants/designTokens";
import { AuthLegalFooter } from "@/components/auth/AuthLegalFooter";
import {
  passwordResetErrorMessage,
  requestPasswordResetCode,
} from "@/lib/auth/passwordReset";
import { emailSchema } from "@/lib/validations/auth";
import Toast from "react-native-toast-message";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const tokens = DesignTokens;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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
      marginBottom: tokens.spacing[12],
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
    formCard: { padding: tokens.spacing[6] },
    inputContainer: { marginBottom: tokens.spacing[8] },
    paperInput: {
      backgroundColor: tokens.colors.gray[50],
      fontSize: tokens.typography.fontSize.sm,
      height: 44,
    },
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
    backButton: { alignItems: "center", marginTop: tokens.spacing[8] },
    backText: {
      color: tokens.colors.primary[500],
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
    },
  });

  useFocusEffect(() => {
    navigation.setOptions({ headerShown: false });
  });

  const handleSubmit = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      Alert.alert("Check your email", parsed.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordResetCode(parsed.data);
      Toast.show({
        type: "success",
        text1: "Check your email",
        text2: "We sent you a 6-digit code to reset your password.",
      });
      router.push({
        pathname: "/auth/reset-password",
        params: { email: parsed.data },
      } as unknown as Href);
    } catch (error: unknown) {
      Alert.alert(
        "Couldn't send code",
        passwordResetErrorMessage(
          error,
          "We couldn't send a reset code. Check your email and try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.brandName}>Reset your password</Text>
            <Text style={styles.subtitle}>
              Enter the email on your account. We&apos;ll send you a code to choose a new password.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <PaperTextInput
                mode="flat"
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                left={
                  <PaperTextInput.Icon
                    icon={() => <Icon name="email" size={20} color={tokens.colors.gray[500]} />}
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
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Send reset code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/auth/login")}
            >
              <Text style={styles.backText}>Back to login</Text>
            </TouchableOpacity>
          </View>

          <AuthLegalFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordPage;
