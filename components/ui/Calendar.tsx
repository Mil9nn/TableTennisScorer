import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface CalendarProps {
  value?: Date;
  onValueChange?: (date: Date) => void;
  mode?: "date" | "time" | "datetime";
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function Calendar({
  value,
  onValueChange,
  mode = "date",
  className,
  placeholder = "Select date",
  disabled = false,
}: CalendarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || new Date());

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
    }
  }, [value]);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (date) {
      setSelectedDate(date);
      if (onValueChange) {
        onValueChange(date);
      }
      if (Platform.OS === "ios") {
        setShowPicker(false);
      }
    } else if (Platform.OS === "ios") {
      setShowPicker(false);
    }
  };

  return (
    <View className={cn("", className)}>
      <TouchableOpacity
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
        className={cn(
          "flex-row items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white",
          disabled && "opacity-50"
        )}
        activeOpacity={0.7}
      >
        <Text className={cn("text-sm", value ? "text-gray-900" : "text-gray-500")}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode={mode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

