import { useState, useEffect, useMemo } from "react";
import { useRouter, useFocusEffect, useNavigation } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuthStore } from "@/hooks/useAuthStore";
import { AuthLegalFooter } from "@/components/auth/AuthLegalFooter";
import Toast from "react-native-toast-message";

const RegisterPage = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const register = useAuthStore((state) => state.register);
  const authLoading = useAuthStore((state) => state.authLoading);
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background.secondary,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
        loadingText: {
          marginTop: theme.spacing[8],
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.tertiary,
        },
        keyboardAvoidingView: {
          flex: 1,
        },
        scrollContainer: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: theme.spacing[8],
          paddingVertical: theme.spacing[8],
        },
        content: {
          justifyContent: "center",
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
        },
        formCard: {
          padding: theme.spacing[6],
        },
        inputContainer: {
          marginBottom: theme.spacing[6],
        },
        paperInput: {
          backgroundColor: theme.colors.background.primary,
          fontSize: theme.typography.fontSize.sm,
          height: 44,
        },
        eyeIcon: {
          padding: theme.spacing[4],
        },
        registerButton: {
          backgroundColor: theme.colors.primary[500],
          paddingVertical: theme.spacing[6],
          borderRadius: theme.borderRadius.sm,
          alignItems: "center",
          minHeight: 44,
        },
        disabledButton: {
          opacity: 0.7,
        },
        registerButtonText: {
          color: theme.colors.white,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
        },
        footer: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: theme.spacing[8],
        },
        footerText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
        },
        loginLink: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.primary[500],
          fontWeight: theme.typography.fontWeight.semibold,
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

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const showSub = Keyboard.addListener("keyboardWillShow", (e) =>
      setKeyboardInset(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener("keyboardWillHide", () => setKeyboardInset(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useFocusEffect(() => {
    navigation.setOptions({ headerShown: false });
  });

  const handleRegister = async () => {
    if (!username || !fullName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      });

      if (result.requiresVerification) {
        Toast.show({
          type: "success",
          text1: "Check your email",
          text2: result.message || "Enter the verification code we sent you",
        });
        router.replace({
          pathname: "/auth/verify-email",
          params: { email: email.trim().toLowerCase() },
        });
      }
    } catch (error) {
      console.error("Register error in component:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                theme.spacing[8] + (Platform.OS === "ios" ? keyboardInset : 0),
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Image
                  source={require("@/assets/images/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandName}>TTPro</Text>
              <Text style={styles.subtitle}>Create your account</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                <PaperTextInput
                  mode="flat"
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textColor={theme.colors.text.primary}
                  left={
                    <PaperTextInput.Icon
                      icon={() => <Icon name="user" size={20} color={theme.colors.text.tertiary} />}
                    />
                  }
                  style={styles.paperInput}
                  theme={paperTheme}
                />
              </View>

              <View style={styles.inputContainer}>
                <PaperTextInput
                  mode="flat"
                  label="Full name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  textColor={theme.colors.text.primary}
                  left={
                    <PaperTextInput.Icon
                      icon={() => <Icon name="person" size={20} color={theme.colors.text.tertiary} />}
                    />
                  }
                  style={styles.paperInput}
                  theme={paperTheme}
                />
              </View>

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
                  theme={paperTheme}
                />
              </View>

              <View style={styles.inputContainer}>
                <PaperTextInput
                  mode="flat"
                  label="Password"
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
              </View>

              <View style={styles.inputContainer}>
                <PaperTextInput
                  mode="flat"
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
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
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                        >
                          <Icon
                            name={showConfirmPassword ? "eye-slash" : "eye"}
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
              </View>

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.disabledButton]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.registerButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>

            <AuthLegalFooter showSignupConsent />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterPage;
