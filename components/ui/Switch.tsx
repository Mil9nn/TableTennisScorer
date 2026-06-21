import React from "react";
import { View, TouchableOpacity, Switch as RNSwitch } from "react-native";
import { cn } from "@/lib/utils";

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  value,
  onValueChange,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <View className={cn("", className)}>
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
        thumbColor={value ? "#fff" : "#f3f4f6"}
      />
    </View>
  );
}

