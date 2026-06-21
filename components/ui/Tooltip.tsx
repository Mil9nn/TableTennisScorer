import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ children, content, side = "top", className }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        onLongPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => setVisible(false)}
        >
          <Pressable
            className={cn(
              "bg-gray-900 px-3 py-2 rounded-lg max-w-xs",
              className
            )}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-white text-sm">{content}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

export function TooltipContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn("bg-gray-900 px-3 py-2 rounded-lg", className)}>
      {typeof children === "string" ? (
        <Text className="text-white text-sm">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

