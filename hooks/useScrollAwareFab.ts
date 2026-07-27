import { useCallback, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/** Extra list padding so the last row clears the bottom FAB. */
export const CREATE_FAB_BOTTOM_INSET = 112;

const COLLAPSE_AFTER_Y = 24;
const EXPAND_BELOW_Y = 4;

export function useScrollAwareFab() {
  const [isExtended, setIsExtended] = useState(true);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    setIsExtended((current) => {
      if (current && offsetY > COLLAPSE_AFTER_Y) return false;
      if (!current && offsetY <= EXPAND_BELOW_Y) return true;
      return current;
    });
  }, []);

  const resetExtended = useCallback(() => {
    setIsExtended(true);
  }, []);

  return { isExtended, onScroll, resetExtended };
}
