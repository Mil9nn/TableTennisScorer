import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { TabScreenHeader } from '@/components/ui/TabScreenHeader';
import { useThemeColors } from '@/hooks/useThemeColors';

const COLLAPSE_MS = 180;

export interface CollapsibleListScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** When false (user has scrolled the list), title and subtitle collapse. */
  isExpanded: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function CollapsibleListScreenHeader({
  title,
  subtitle,
  isExpanded,
  style,
  children,
}: CollapsibleListScreenHeaderProps) {
  const theme = useThemeColors();
  const measuredHeight = useSharedValue(0);
  const progress = useSharedValue(1);
  const hasMeasured = useRef(false);
  const isFirstRender = useRef(true);

  const titleMarginBottom = theme.spacing[3];

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      progress.value = isExpanded ? 1 : 0;
      return;
    }

    progress.value = withTiming(isExpanded ? 1 : 0, {
      duration: COLLAPSE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [isExpanded, progress]);

  const collapsibleStyle = useAnimatedStyle(() => {
    const h = measuredHeight.value;
    if (h === 0) {
      return { overflow: 'hidden' as const };
    }
    return {
      height: progress.value * h,
      marginBottom: progress.value * titleMarginBottom,
      overflow: 'hidden' as const,
    };
  });

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.background.primary,
        },
        measureWrap: {
          position: 'absolute',
          opacity: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none',
        },
      }),
    [theme.colors.background.primary],
  );

  const handleMeasureLayout = (height: number) => {
    if (hasMeasured.current || height <= 0) return;
    hasMeasured.current = true;
    measuredHeight.value = height;
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={styles.measureWrap}
        onLayout={(event) => {
          handleMeasureLayout(Math.ceil(event.nativeEvent.layout.height));
        }}
      >
        <TabScreenHeader title={title} subtitle={subtitle} style={{ marginBottom: 0 }} />
      </View>

      <Animated.View style={collapsibleStyle}>
        <TabScreenHeader title={title} subtitle={subtitle} style={{ marginBottom: 0 }} />
      </Animated.View>

      {children}
    </View>
  );
}
