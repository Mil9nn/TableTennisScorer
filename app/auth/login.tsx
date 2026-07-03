import { useState, useEffect } from "react";
import { useRouter, useFocusEffect, useNavigation, type Href } from "expo-router";
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
import { DesignTokens } from "@/constants/designTokens";
import { useAuthStore } from "@/hooks/useAuthStore";
import { AuthLegalFooter } from "@/components/auth/AuthLegalFooter";
import Toast from "react-native-toast-message";

const LoginPage = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const login = useAuthStore((state) => state.login);
  const authLoading = useAuthStore((state) => state.authLoading);
  
  const tokens = DesignTokens;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.primary[50],
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: tokens.spacing[8],
      fontSize: tokens.typography.fontSize.base,
      color: tokens.colors.gray[500],
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
      paddingHorizontal: tokens.spacing[8],
    },
    content: {
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: tokens.spacing[16],
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
    },
    formCard: {
      padding: tokens.spacing[6],
    },
    inputContainer: {
      marginBottom: tokens.spacing[8],
    },
    paperInput: {
      backgroundColor: tokens.colors.gray[50],
      fontSize: tokens.typography.fontSize.sm,
      height: 44,
    },
    eyeIcon: {
      padding: tokens.spacing[4],
    },
    loginButton: {
      backgroundColor: tokens.colors.primary[500],
      paddingVertical: tokens.spacing[6],
      borderRadius: tokens.borderRadius.sm,
      alignItems: "center",
    },
    disabledButton: {
      opacity: 0.7,
    },
    loginButtonText: {
      color: tokens.colors.white,
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
    },
    forgotPasswordButton: {
      alignItems: "center",
      marginTop: tokens.spacing[8],
    },
    forgotPasswordText: {
      color: tokens.colors.primary[500],
      fontSize: tokens.typography.fontSize.sm,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    footerText: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.gray[500],
    },
    registerLink: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.primary[500],
      fontWeight: tokens.typography.fontWeight.semibold,
    },
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /** Extra scroll padding on iOS only; Android uses KeyboardAvoidingView `padding`. */
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const showSub = Keyboard.addListener("keyboardWillShow", (e) =>
      setKeyboardInset(e.endCoordinates.height)
    );

    const hideSub = Keyboard.addListener("keyboardWillHide", () =>
      setKeyboardInset(0)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Hide header when screen is focused
  useFocusEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Temporarily disable password validation to test basic login

    setLoading(true);
    try {
      await login({ email, password });
    } catch (error: any) {
      if (error?.response?.status === 403 && error?.response?.data?.requiresVerification) {
        const verifyEmail =
          (error.response.data.email as string | undefined) ?? email.trim().toLowerCase();
        Toast.show({
          type: "info",
          text1: "Verify your email",
          text2:
            error.response.data.message ||
            "Enter the code we sent you to finish signing up",
        });
        router.replace({
          pathname: "/auth/verify-email",
          params: { email: verifyEmail },
        });
        return;
      }
      console.error("Login error in component:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/auth/register");
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
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
                tokens.spacing[8] +
                (Platform.OS === "ios" ? keyboardInset : 0),
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
          <Text style={styles.subtitle}>Log in to your account</Text>
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
              left={<PaperTextInput.Icon icon={() => <Icon name="email" size={20} color={tokens.colors.gray[500]} />} />}
              style={styles.paperInput}
              theme={{
                colors: {
                  primary: tokens.colors.primary[500],
                  background: "transparent",
                }
              }}
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
              left={<PaperTextInput.Icon icon={() => <Icon name="lock" size={20} color={tokens.colors.gray[500]} />} />}
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
                }
              }}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => router.push("/auth/forgot-password" as Href)}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <AuthLegalFooter />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


export default LoginPage;