import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useThemeColors';

export interface ListEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  primaryAction?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
  clearFiltersAction?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export function ListEmptyState({
  icon,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  clearFiltersAction,
  style,
}: ListEmptyStateProps) {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          minHeight: 280,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: theme.spacing[6],
        },
        card: {
          alignItems: 'center',
          maxWidth: 320,
        },
        title: {
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.secondary,
          marginTop: theme.spacing[4],
          marginBottom: theme.spacing[2],
          textAlign: 'center',
        },
        subtitle: {
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.tertiary,
          textAlign: 'center',
          lineHeight: theme.typography.fontSize.base * 1.45,
        },
        actions: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: theme.spacing[2],
          marginTop: theme.spacing[4],
        },
      }),
    [theme],
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        {icon}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {(primaryAction || secondaryAction || clearFiltersAction) && (
          <View style={styles.actions}>
            {clearFiltersAction ? (
              <Button variant="outline" size="sm" onPress={clearFiltersAction.onPress}>
                {clearFiltersAction.label}
              </Button>
            ) : null}
            {primaryAction ? (
              <Button variant="primary" size="sm" onPress={primaryAction.onPress}>
                {primaryAction.label}
              </Button>
            ) : null}
            {secondaryAction ? (
              <Button variant="outline" size="sm" onPress={secondaryAction.onPress}>
                {secondaryAction.label}
              </Button>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}
