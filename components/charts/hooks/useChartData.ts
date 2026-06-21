import { useMemo } from "react";
import { ChartDataPoint } from "../types";
import {
  getSafeMaxValue,
  getSafeMinValue,
  hasValidChartData,
} from "../ChartUtils";

export const useChartData = (
  data: ChartDataPoint[],
  data2?: ChartDataPoint[],
  maxValue?: number,
  minValue?: number
) => {
  const values = useMemo(() => data.map((d) => d.value), [data]);
  const values2 = useMemo(
    () => (data2 ? data2.map((d) => d.value) : []),
    [data2]
  );

  const allValues = useMemo(
    () => [...values, ...values2],
    [values, values2]
  );

  const max = useMemo(() => {
    if (maxValue !== undefined) return maxValue;
    return getSafeMaxValue(allValues);
  }, [allValues, maxValue]);

  const min = useMemo(() => {
    if (minValue !== undefined) return minValue;
    return getSafeMinValue(allValues, 0);
  }, [allValues, minValue]);

  const isValid = useMemo(() => hasValidChartData(data), [data]);

  return {
    values,
    values2,
    allValues,
    max,
    min,
    isValid,
    range: max - min,
  };
};
