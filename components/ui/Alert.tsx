import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";

interface AlertProps {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "warning" | "success" | "info";
  className?: string;
}

interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function Alert({ children, variant = "default", className }: AlertProps) {
  const variantStyles = {
    default: "bg-gray-50 border-gray-200",
    destructive: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    success: "bg-green-50 border-green-200",
    info: "bg-blue-50 border-blue-200",
  };

  return (
    <View
      className={cn(
        "w-full rounded-lg border px-4 py-3",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </View>
  );
}

export function AlertTitle({ children, className }: AlertTitleProps) {
  return (
    <Text className={cn("font-semibold text-gray-900 mb-1", className)}>
      {children}
    </Text>
  );
}

export function AlertDescription({ children, className }: AlertDescriptionProps) {
  return (
    <Text className={cn("text-sm text-gray-600", className)}>
      {children}
    </Text>
  );
}

