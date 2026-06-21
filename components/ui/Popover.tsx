import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { cn } from "@/lib/utils";

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === PopoverTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onPress: () => setIsOpen(!isOpen),
            });
          }
          if (child.type === PopoverContent) {
            return (
              <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
              >
                <Pressable
                  className="flex-1 justify-center items-center bg-black/50"
                  onPress={() => setIsOpen(false)}
                >
                  <Pressable
                    onPress={(e) => e.stopPropagation()}
                    className="bg-white rounded-lg shadow-lg p-4 max-w-xs"
                  >
                    {child}
                  </Pressable>
                </Pressable>
              </Modal>
            );
          }
        }
        return child;
      })}
    </>
  );
}

export function PopoverTrigger({
  children,
  onPress,
}: PopoverTriggerProps & { onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

export function PopoverContent({ children, className }: PopoverContentProps) {
  return <View className={cn("", className)}>{children}</View>;
}

export function PopoverAnchor({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

