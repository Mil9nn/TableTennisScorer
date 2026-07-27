import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

export interface UnifiedSearchBarProps extends Omit<TextInputProps, 'style'> {
  containerStyle?: StyleProp<ViewStyle>;
  onClear?: () => void;
}

export function UnifiedSearchBar({
  value,
  onChangeText,
  onClear,
  containerStyle,
  placeholder,
  onFocus,
  onBlur,
  ...rest
}: UnifiedSearchBarProps) {
  const theme = useThemeColors();
  const [focused, setFocused] = React.useState(false);
  const hasValue = typeof value === 'string' && value.length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.full,
          borderWidth: 1,
          borderColor: focused ? theme.colors.primary[500] : theme.colors.border.light,
          paddingHorizontal: theme.spacing[3],
          minHeight: 36,
        },
        icon: { marginRight: theme.spacing[2] },
        input: {
          flex: 1,
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.primary,
          paddingVertical: theme.spacing[2],
        },
        clearButton: {
          padding: theme.spacing[1],
          marginLeft: theme.spacing[1],
        },
      }),
    [theme, focused],
  );

  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
  };

  return (
    <View style={[styles.row, containerStyle]}>
      <Ionicons
        name="search-outline"
        size={16}
        color={theme.colors.info}
        style={styles.icon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.tertiary}
        selectionColor={theme.colors.primary[600]}
        style={styles.input}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        {...rest}
      />
      {hasValue ? (
        <Pressable
          onPress={handleClear}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={16} color={theme.colors.text.tertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}
