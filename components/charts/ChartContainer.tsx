import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { Canvas } from "@shopify/react-native-skia";
import { ChartMargin } from "./types";
import { getChartDimensions } from "./ChartUtils";
import { Colors } from "@/constants/theme";
import { ChartAxisLabels } from "./ChartAxis";

interface ChartContainerProps {
  width: number;
  height: number;
  margin?: Partial<ChartMargin>;
  children: (dimensions: {
    chartWidth: number;
    chartHeight: number;
    chartX: number;
    chartY: number;
  }) => React.ReactNode;
  gesture?: any;
  style?: ViewStyle;
  showGrid?: boolean;
}

const defaultMargin: ChartMargin = {
  top: 20,
  right: 10,
  bottom: 30,
  left: 40,
};

export const ChartContainer: React.FC<ChartContainerProps> = ({
  width,
  height,
  margin = {},
  children,
  gesture,
  style,
  showGrid = false,
}) => {
  const chartMargin = { ...defaultMargin, ...margin };
  const dimensions = getChartDimensions(width, height, chartMargin);

  const content = (
    <View style={[styles.container, { width, height }, style]}>
      <Canvas style={{ width, height }}>
        {children(dimensions)}
      </Canvas>
    </View>
  );

  if (gesture) {
    return (
      <GestureHandlerRootView style={styles.gestureRoot}>
        <GestureDetector gesture={gesture}>{content}</GestureDetector>
      </GestureHandlerRootView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  canvas: {
    flex: 1,
  },
  gestureRoot: {
    flex: 1,
  },
});
