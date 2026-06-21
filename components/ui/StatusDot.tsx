import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DesignTokens } from '@/constants/designTokens';

export type StatusType = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'upcoming' | 'ongoing';

interface StatusDotProps {
  status: StatusType | string;
  size?: number;
}

const statusColors: Record<string, string> = {
  scheduled: DesignTokens.colors.status.scheduled,
  upcoming: DesignTokens.colors.status.scheduled,
  in_progress: DesignTokens.colors.status.live,
  ongoing: DesignTokens.colors.status.live,
  completed: DesignTokens.colors.status.completed,
  cancelled: DesignTokens.colors.error,
};

/**
 * Minimal status dot indicator (matching Next.js design)
 * Small 2x2px dot for compact list items
 */
export const StatusDot: React.FC<StatusDotProps> = ({ status, size = 8 }) => {
  const color = statusColors[status] || DesignTokens.colors.text.tertiary;

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {
    // Minimal dot styling
  },
});

