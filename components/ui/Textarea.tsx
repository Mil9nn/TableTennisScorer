import React from 'react';
import { TextInput, Text, View, ViewStyle, TextInputProps } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface TextareaProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[{ marginBottom: Spacing.base }, containerStyle]}>
      {label && (
        <Text style={{
          ...Typography.sm,
          fontWeight: Typography.weights.medium,
          color: Colors.light.text,
          marginBottom: Spacing.xs,
        }}>
          {label}
        </Text>
      )}
      <View style={{
        backgroundColor: Colors.light.background,
        borderWidth: 1.5,
        borderColor: error ? Colors.light.error : Colors.light.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        minHeight: 120,
      }}>
        <TextInput
          style={[{
            ...Typography.base,
            color: Colors.light.text,
            textAlignVertical: 'top',
            flex: 1,
          }, style]}
          placeholderTextColor={Colors.light.textTertiary}
          multiline
          {...props}
        />
      </View>
      {error && (
        <Text style={{
          ...Typography.xs,
          color: Colors.light.error,
          marginTop: Spacing.xs,
        }}>
          {error}
        </Text>
      )}
    </View>
  );
};

