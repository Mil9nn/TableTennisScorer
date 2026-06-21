import { useSharedValue } from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useState } from "react";
import { TooltipData } from "../types";

export const useChartGestures = (
  onTooltipChange?: (data: TooltipData | null) => void,
  enabled: boolean = true
) => {
  const tooltipX = useSharedValue(0);
  const tooltipY = useSharedValue(0);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  const tapGesture = Gesture.Tap().enabled(enabled).onEnd((event) => {
    tooltipX.value = event.x;
    tooltipY.value = event.y;
  });

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((event) => {
      tooltipX.value = event.x;
      tooltipY.value = event.y;
    })
    .onEnd(() => {
      if (onTooltipChange) {
        onTooltipChange(null);
      }
      setTooltipData(null);
    });

  const updateTooltip = (data: TooltipData | null) => {
    setTooltipData(data);
    if (onTooltipChange) {
      onTooltipChange(data);
    }
  };

  return {
    tooltipX,
    tooltipY,
    tooltipData,
    updateTooltip,
    tapGesture,
    panGesture,
    GestureDetector,
    GestureHandlerRootView,
  };
};
