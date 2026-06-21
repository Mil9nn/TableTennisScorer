import React from 'react';
import { View, TextInput, ViewStyle, TextInputProps, StyleProp, TextStyle } from 'react-native';
import { DesignTokens } from '@/constants/designTokens';
import { Icon } from './Icon';

interface SearchInputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  iconSize?: number;
}

/**
 * Modern search input with sleek design and proper icon alignment
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  containerStyle,
  inputStyle,
  iconColor = DesignTokens.colors.text.tertiary,
  iconSize = 18,
  style,
  ...props
}) => {
  return (
    <View
      style={[
        styles.container,
        containerStyle,
      ]}
    >
      <View style={styles.iconContainer}>
        <Icon name="search" size={iconSize} color={iconColor} />
      </View>
      <TextInput
        style={[styles.input, inputStyle, style]}
        placeholderTextColor={DesignTokens.colors.text.tertiary}
        {...props}
      />
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: DesignTokens.colors.background.primary,
    borderRadius: DesignTokens.borderRadius.full,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border.medium,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    minHeight: 44,
    ...DesignTokens.shadows.sm,
  },
  iconContainer: {
    marginRight: DesignTokens.spacing[3],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  input: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.normal,
    color: DesignTokens.colors.text.primary,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 20,
  },
};

