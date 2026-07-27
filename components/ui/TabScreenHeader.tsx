import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

export interface TabScreenHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function TabScreenHeader({ title, subtitle, style }: TabScreenHeaderProps) {
  const theme = useThemeColors();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing[3],
        },
        textBlock: { flex: 1, minWidth: 0 },
        title: {
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        subtitle: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          marginTop: 2,
        },
      }),
    [theme],
  );

  return (
    <View style={[styles.row, style]}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
