import { useState, useMemo } from "react";
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
  ScrollView,
} from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useThemeColors } from "@/hooks/useThemeColors";
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
  const theme = useThemeColors();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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
          marginBottom: theme.spacing[12],
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
        formCard: { padding: theme.spacing[6] },
        inputContainer: { marginBottom: theme.spacing[8] },
        paperInput: {
          backgroundColor: theme.colors.background.primary,
          fontSize: theme.typography.fontSize.sm,
          height: 44,
        },
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
        backButton: {
          alignItems: "center",
          marginTop: theme.spacing[8],
          minHeight: 44,
          justifyContent: "center",
        },
        backText: {
          color: theme.colors.primary[500],
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
        },
      }),
    [theme],
  );

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
                textColor={theme.colors.text.primary}
                left={
                  <PaperTextInput.Icon
                    icon={() => <Icon name="email" size={20} color={theme.colors.text.tertiary} />}
                  />
                }
                style={styles.paperInput}
                theme={{
                  colors: {
                    primary: theme.colors.primary[500],
                    background: "transparent",
                    onSurfaceVariant: theme.colors.text.tertiary,
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
                <ActivityIndicator size="small" color={theme.colors.white} />
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
