import React, { forwardRef, useMemo, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export interface FormTextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const FormTextField = forwardRef<TextInput, FormTextFieldProps>(
  function FormTextField(
    {
      label,
      error,
      containerStyle,
      labelStyle,
      inputStyle,
      style,
      onFocus,
      onBlur,
      autoCorrect = false,
      autoCapitalize = "words",
      underlineColorAndroid = "transparent",
      placeholderTextColor,
      ...props
    },
    ref
  ) {
    const theme = useThemeColors();
    const [focused, setFocused] = useState(false);
    const hasError = Boolean(error);

    const styles = useMemo(
      () =>
        StyleSheet.create({
          label: {
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing[2],
          },
          input: {
            minHeight: 48,
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[2],
            borderTopLeftRadius: theme.borderRadius.sm,
            borderTopRightRadius: theme.borderRadius.sm,
            borderBottomWidth: 1,
            borderColor: theme.colors.border.medium,
            backgroundColor: theme.colors.background.secondary,
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.primary,
          },
          inputFocused: {
            borderColor: theme.colors.info,
            borderBottomWidth: 2,
          },
          inputError: {
            borderColor: theme.colors.error,
          },
          errorText: {
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.error,
            marginTop: theme.spacing[2],
          },
        }),
      [theme],
    );

    const handleFocus: TextInputProps["onFocus"] = (e) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur: TextInputProps["onBlur"] = (e) => {
      setFocused(false);
      onBlur?.(e);
    };

    return (
      <View style={containerStyle}>
        {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
        <TextInput
          ref={ref}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          underlineColorAndroid={underlineColorAndroid}
          placeholderTextColor={placeholderTextColor ?? theme.colors.text.tertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            focused && styles.inputFocused,
            hasError && styles.inputError,
            inputStyle,
            style,
          ]}
          {...props}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }
);
