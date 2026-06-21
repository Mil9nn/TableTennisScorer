import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { cn } from "@/lib/utils";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

export function Table({ children, className }: TableProps) {
  return (
    <View className={cn("border border-gray-200 rounded-lg bg-white", className)}>
      {children}
    </View>
  );
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return <View className={cn("border-b border-gray-200 bg-gray-50", className)}>{children}</View>;
}

export function TableBody({ children, className }: TableBodyProps) {
  return <View className={cn("", className)}>{children}</View>;
}

export function TableRow({ children, className, onPress }: TableRowProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        className={cn("flex-row border-b border-gray-100", className)}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View className={cn("flex-row border-b border-gray-100", className)}>
      {children}
    </View>
  );
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <View className={cn("px-3 py-2 flex-1", className)}>
      {children}
    </View>
  );
}

export function TableCell({ children, className, colSpan }: TableCellProps) {
  return (
    <View className={cn("px-3 py-2 flex-1", colSpan && "flex-1", className)}>
      {children}
    </View>
  );
}

