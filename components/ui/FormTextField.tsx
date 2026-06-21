import React, { forwardRef, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { DesignTokens } from "@/constants/designTokens";

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
      placeholderTextColor = DesignTokens.colors.text.tertiary,
      ...props
    },
    ref
  ) {
    const [focused, setFocused] = useState(false);
    const hasError = Boolean(error);

    const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
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
          placeholderTextColor={placeholderTextColor}
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

const styles = StyleSheet.create({
  label: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[2],
  },
  input: {
    minHeight: 48,
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[2],
    borderTopLeftRadius: DesignTokens.borderRadius.sm,
    borderTopRightRadius: DesignTokens.borderRadius.sm,
    borderBottomWidth: 1,
    borderColor: DesignTokens.colors.border.medium,
    backgroundColor: DesignTokens.colors.background.secondary,
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.primary,
  },
  inputFocused: {
    borderColor: DesignTokens.colors.info,
    borderBottomWidth: 2,
  },
  inputError: {
    borderColor: DesignTokens.colors.error,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.error,
    marginTop: DesignTokens.spacing[2],
  },
});
