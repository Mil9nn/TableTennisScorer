import React from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

export interface RefreshableListShellProps {
  refreshing: boolean;
  onRefresh: () => void;
  children: (refreshControl: React.ReactElement<RefreshControlProps>) => React.ReactNode;
}

/**
 * Provides a themed RefreshControl for FlatList / ScrollView children.
 */
export function RefreshableListShell({
  refreshing,
  onRefresh,
  children,
}: RefreshableListShellProps) {
  const theme = useThemeColors();

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.colors.primary[600]}
      colors={[theme.colors.primary[600]]}
    />
  );

  return <>{children(refreshControl)}</>;
}
