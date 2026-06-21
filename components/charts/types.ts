export interface ChartDataPoint {
  value: number;
  label?: string;
  matchId?: string;
  matchCategory?: "individual" | "team";
  [key: string]: any;
}

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartColors {
  primary: string;
  secondary?: string;
  gradient?: {
    start: string;
    end: string;
  };
}

export interface BarChartProps {
  data: ChartDataPoint[];
  data2?: ChartDataPoint[];
  width: number;
  height: number;
  margin?: Partial<ChartMargin>;
  color?: string;
  color2?: string;
  gradientColor?: string;
  gradientColor2?: string;
  animated?: boolean;
  animationDuration?: number;
  showTooltip?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  barWidth?: number;
  spacing?: number;
  rounded?: boolean;
  maxValue?: number;
  minValue?: number;
  yAxisLabelFormatter?: (value: number) => string;
  xAxisLabelFormatter?: (label: string) => string;
  onBarPress?: (dataPoint: ChartDataPoint, index: number) => void;
}

export interface LineChartProps {
  data: ChartDataPoint[];
  data2?: ChartDataPoint[];
  width: number;
  height: number;
  margin?: Partial<ChartMargin>;
  color?: string;
  color2?: string;
  gradientColor?: string;
  gradientColor2?: string;
  animated?: boolean;
  animationDuration?: number;
  showTooltip?: boolean;
  showGrid?: boolean;
  showArea?: boolean;
  curved?: boolean;
  thickness?: number;
  maxValue?: number;
  minValue?: number;
  yAxisLabelFormatter?: (value: number) => string;
  xAxisLabelFormatter?: (label: string) => string;
  onPointPress?: (dataPoint: ChartDataPoint, index: number) => void;
}

export interface PieChartProps {
  data: Array<{ value: number; color: string; text?: string }>;
  width: number;
  height: number;
  radius?: number;
  innerRadius?: number;
  animated?: boolean;
  animationDuration?: number;
  showTooltip?: boolean;
  showLabels?: boolean;
  centerLabel?: string | React.ReactNode;
}

export interface TooltipData {
  x: number;
  y: number;
  value: number;
  label?: string;
  color?: string;
}
