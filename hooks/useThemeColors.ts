import { useMemo } from 'react';
import { getDesignTokens, type AppTheme } from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Returns the full theme token set for the active color scheme.
 * Use in screens/components that need semantic light/dark colors.
 */
export function useThemeColors(): AppTheme {
  const scheme = useColorScheme() ?? 'light';
  return useMemo(() => getDesignTokens(scheme === 'dark' ? 'dark' : 'light'), [scheme]);
}
