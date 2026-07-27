import React, { useMemo } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TextStyle,
  StyleProp,
} from "react-native";
import { Spacing, Typography } from "@/constants/theme";
import { useThemeColors } from "@/hooks/useThemeColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: StyleProp<TextStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  style,
  ...props
}) => {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: Spacing.base,
        },
        label: {
          ...Typography.sm,
          fontWeight: Typography.weights.medium,
          color: theme.colors.text.primary,
          marginBottom: Spacing.xs,
        },
        inputContainer: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.background.primary,
          borderWidth: 1.5,
          borderColor: theme.colors.border.light,
          borderRadius: 12,
          paddingHorizontal: Spacing.base,
          minHeight: 44,
        },
        inputError: {
          borderColor: theme.colors.error,
        },
        input: {
          flex: 1,
          ...Typography.base,
          color: theme.colors.text.primary,
          paddingVertical: Spacing.sm,
        },
        inputWithLeftIcon: {
          paddingLeft: Spacing.sm,
        },
        inputWithRightIcon: {
          paddingRight: Spacing.sm,
        },
        leftIcon: {
          marginRight: Spacing.xs,
        },
        rightIcon: {
          marginLeft: Spacing.xs,
        },
        error: {
          ...Typography.xs,
          color: theme.colors.error,
          marginTop: Spacing.xs,
        },
      }),
    [theme],
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            inputStyle,
            style,
          ]}
          placeholderTextColor={theme.colors.text.tertiary}
          {...props}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};
