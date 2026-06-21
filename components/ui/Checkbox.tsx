import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  size = "md",
}: CheckboxProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <TouchableOpacity
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        "items-center justify-center rounded border-2",
        sizeClasses[size],
        checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300",
        disabled && "opacity-50",
        className
      )}
      activeOpacity={0.7}
    >
      {checked && (
        <Ionicons name="checkmark" size={iconSizes[size]} color="#fff" />
      )}
    </TouchableOpacity>
  );
}

