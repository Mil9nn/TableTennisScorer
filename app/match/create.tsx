import React, { useEffect, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NestableScrollContainer } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import * as Haptics from "expo-haptics";
import IndividualMatchForm from "./components/IndividualMatchForm";
import TeamMatchForm from "./components/TeamMatchForm";
import { getCreateFlowChoiceStyles } from "@/styles/createFlowChoiceStyles";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useMemo } from "react";

export default function CreateMatchPage() {
  const theme = useThemeColors();
  const categoryStyles = useMemo(() => getCreateFlowChoiceStyles(theme), [theme]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        },
        header: {
          backgroundColor: theme.colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
        },
        headerContent: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[4],
          paddingHorizontal: theme.spacing[4],
          height: 56,
        },
        backButton: {
          padding: theme.spacing[2],
          borderRadius: theme.borderRadius.sm,
          backgroundColor: "transparent",
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
          paddingTop: theme.spacing[4],
        },
        scrollContent: {
          flexGrow: 1,
        },
        categoryWrapper: {
          marginBottom: theme.spacing[10],
          paddingHorizontal: theme.spacing[4],
        },
        categoryHeader: {
          marginBottom: theme.spacing[5],
        },
        categoryTitle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        },
      }),
    [theme],
  );

  const [matchCategory, setMatchCategory] = useState<
    "individual" | "team"
  >("individual");

  /** Extra scroll padding on iOS only; Android uses KeyboardAvoidingView `padding` to avoid double inset with edge-to-edge / resize. */
  const [keyboardInset, setKeyboardInset] = useState(0);

  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const categories = [
    {
      type: "individual" as const,
      title: "Individual",
      description: "Singles / Doubles / Mixed",
      icon: "person" as const,
    },
    {
      type: "team" as const,
      title: "Team Tie",
      description: "Club vs Club / Group",
      icon: "groups" as const,
    },
  ];

  const handleCategoryChange = (type: "individual" | "team") => {
    if (type === matchCategory) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setMatchCategory(type);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon
              name="chevron-left"
              size={16}
              color={theme.colors.text.primary}
            />
          </Pressable>

          <Text style={styles.headerTitle}>Create match</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <NestableScrollContainer
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scrollContent}
        >
          {/* CATEGORY SELECTOR */}
          <View style={styles.categoryWrapper}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Select Category</Text>
            </View>

            <View style={categoryStyles.segmentedControlContainer}>
              {categories.map((category) => {
                const isActive = matchCategory === category.type;

                return (
                  <Pressable
                    key={category.type}
                    onPress={() => handleCategoryChange(category.type)}
                    style={[
                      categoryStyles.segmentedButton,
                      isActive && categoryStyles.segmentedButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        categoryStyles.segmentedButtonText,
                        isActive && categoryStyles.segmentedButtonTextActive,
                      ]}
                    >
                      {category.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>
            {matchCategory === "individual" ? (
              <IndividualMatchForm endpoint="/matches/individual" />
            ) : (
              <TeamMatchForm endpoint="/matches/team" />
            )}
          </Animated.View>
        </NestableScrollContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
