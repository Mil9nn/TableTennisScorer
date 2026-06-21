import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={() => onOpenChange(false)}
      >
        <Pressable
          className="bg-white rounded-2xl w-[90%] max-w-md max-h-[80%]"
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <ScrollView className={cn("max-h-[80%]", className)}>
      {children}
    </ScrollView>
  );
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <View className={cn("px-4 py-4 border-b border-gray-200", className)}>
      {children}
    </View>
  );
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <Text className={cn("text-lg font-bold text-gray-900", className)}>
      {children}
    </Text>
  );
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <Text className={cn("text-sm text-gray-500 mt-1", className)}>
      {children}
    </Text>
  );
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <View className={cn("px-4 py-4 border-t border-gray-200 flex-row justify-end gap-2", className)}>
      {children}
    </View>
  );
}

