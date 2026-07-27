import React, { useEffect, useRef } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, TouchableRipple, useTheme } from 'react-native-paper';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const FAB_SIZE = 48;
const FAB_RADIUS = FAB_SIZE / 2;
/** Space between label text and the + icon */
const LABEL_GAP = 2;
/** Leading inset when the FAB is extended */
const LABEL_PADDING = 14;
const COLLAPSE_MS = 180;

export interface ScrollAwareCreateFabProps {
  label: string;
  onPress: () => void;
  isExtended: boolean;
  accessibilityLabel?: string;
  visible?: boolean;
}

export function ScrollAwareCreateFab({
  label,
  onPress,
  isExtended,
  accessibilityLabel,
  visible: visibleProp = true,
}: ScrollAwareCreateFabProps) {
  const theme = useTheme();
  const hasMeasuredLabel = useRef(false);
  const isFirstRender = useRef(true);

  const visibility = useSharedValue(visibleProp ? 1 : 0);
  const progress = useSharedValue(isExtended ? 1 : 0);
  const extendedWidthSv = useSharedValue(FAB_SIZE);

  const isRTL = I18nManager.isRTL;
  const collapsedWidth = FAB_SIZE;

  useEffect(() => {
    visibility.value = withTiming(visibleProp ? 1 : 0, {
      duration: visibleProp ? 180 : 150,
      easing: Easing.out(Easing.cubic),
    });
  }, [visibleProp, visibility]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      progress.value = isExtended ? 1 : 0;
      return;
    }

    progress.value = withTiming(isExtended ? 1 : 0, {
      duration: COLLAPSE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [isExtended, progress]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
    width:
      collapsedWidth +
      (extendedWidthSv.value - collapsedWidth) * progress.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <>
      <Text
        variant="labelLarge"
        onLayout={(event) => {
          if (hasMeasuredLabel.current) return;
          const width = Math.ceil(event.nativeEvent.layout.width);
          if (width > 0) {
            hasMeasuredLabel.current = true;
            extendedWidthSv.value = Math.max(
              FAB_SIZE,
              width + FAB_SIZE + LABEL_PADDING + LABEL_GAP,
            );
          }
        }}
        style={[styles.measureLabel, styles.label]}
      >
        {label}
      </Text>

      <Animated.View
        style={[
          styles.fab,
          isRTL ? styles.fabRtl : styles.fabLtr,
          containerStyle,
        ]}
        pointerEvents={visibleProp ? 'auto' : 'none'}
      >
        <Surface
          elevation={4}
          style={[
            styles.surface,
            { backgroundColor: theme.colors.primary, borderRadius: FAB_RADIUS },
          ]}
        >
          <TouchableRipple
            borderless={false}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            rippleColor="rgba(255, 255, 255, 0.2)"
            style={[styles.ripple, { borderRadius: FAB_RADIUS }]}
          >
            <View style={[styles.content, isRTL && styles.contentRtl]}>
              <Animated.View
                style={[styles.labelWrap, isRTL && styles.labelWrapRtl, labelStyle]}
                pointerEvents={isExtended ? 'auto' : 'none'}
              >
                <Text
                  variant="labelLarge"
                  numberOfLines={1}
                  style={[styles.label, { color: theme.colors.onPrimary }]}
                >
                  {label}
                </Text>
              </Animated.View>
              <View style={[styles.iconSlot, isRTL ? styles.iconSlotRtl : styles.iconSlotLtr]}>
                <Icon source="plus" size={24} color={theme.colors.onPrimary} />
              </View>
            </View>
          </TouchableRipple>
        </Surface>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  measureLabel: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    height: FAB_SIZE,
    borderRadius: FAB_RADIUS,
    overflow: 'hidden',
  },
  fabLtr: {
    right: 16,
  },
  fabRtl: {
    left: 16,
  },
  surface: {
    flex: 1,
    overflow: 'hidden',
  },
  ripple: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: FAB_SIZE,
  },
  contentRtl: {
    flexDirection: 'row-reverse',
    paddingRight: 0,
    paddingLeft: FAB_SIZE,
  },
  labelWrap: {
    flexGrow: 0,
    flexShrink: 1,
    paddingStart: LABEL_PADDING,
    paddingEnd: LABEL_GAP,
    overflow: 'hidden',
  },
  labelWrapRtl: {
    paddingStart: LABEL_GAP,
    paddingEnd: LABEL_PADDING,
  },
  label: {
    fontWeight: '600',
  },
  iconSlot: {
    position: 'absolute',
    top: 0,
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotLtr: {
    right: 0,
  },
  iconSlotRtl: {
    left: 0,
  },
});
