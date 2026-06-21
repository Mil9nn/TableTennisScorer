import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface RadioGroupItemProps {
  value: string;
  label: string;
  className?: string;
}

export function RadioGroup({
  value,
  onValueChange,
  children,
  className,
}: RadioGroupProps) {
  return (
    <View className={cn("gap-3", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<RadioGroupItemProps>(child)) {
          return React.cloneElement(child, {
            selected: child.props.value === value,
            onSelect: () => onValueChange(child.props.value),
          });
        }
        return child;
      })}
    </View>
  );
}

export function RadioGroupItem({
  value,
  label,
  selected = false,
  onSelect,
  className,
}: RadioGroupItemProps & { selected?: boolean; onSelect?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      className={cn(
        "flex-row items-center gap-3 p-3 rounded-lg border",
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
        className
      )}
      activeOpacity={0.7}
    >
      <View
        className={cn(
          "w-5 h-5 rounded-full border-2 items-center justify-center",
          selected ? "border-blue-500" : "border-gray-300"
        )}
      >
        {selected && (
          <View className="w-3 h-3 rounded-full bg-blue-500" />
        )}
      </View>
      <Text
        className={cn(
          "text-sm font-medium",
          selected ? "text-blue-700" : "text-gray-700"
        )}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

