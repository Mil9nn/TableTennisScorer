import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";

interface AccordionProps {
  children: React.ReactNode;
  defaultValue?: string;
  type?: "single" | "multiple";
  className?: string;
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Accordion({
  children,
  defaultValue,
  type = "single",
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(
    defaultValue ? [defaultValue] : []
  );

  const handleToggle = (value: string) => {
    if (type === "single") {
      setOpenItems(openItems.includes(value) ? [] : [value]);
    } else {
      setOpenItems(
        openItems.includes(value)
          ? openItems.filter((item) => item !== value)
          : [...openItems, value]
      );
    }
  };

  return (
    <View className={cn("", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === AccordionItem) {
          const item = child as React.ReactElement<{ value: string }>;
          return React.cloneElement(item, {
            isOpen: openItems.includes(item.props.value),
            onToggle: handleToggle,
          } as Partial<{ value: string; isOpen?: boolean; onToggle?: (value: string) => void }>);
        }
        return child;
      })}
    </View>
  );
}

export function AccordionItem({
  value,
  children,
  className,
  isOpen,
  onToggle,
}: AccordionItemProps & { isOpen?: boolean; onToggle?: (value: string) => void }) {
  return (
    <View className={cn("border-b border-gray-200 last:border-b-0", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === AccordionTrigger) {
            return React.cloneElement(child as any, {
              value,
              isOpen,
              onToggle,
            });
          }
          if (child.type === AccordionContent) {
            return React.cloneElement(child as any, { isOpen });
          }
        }
        return child;
      })}
    </View>
  );
}

export function AccordionTrigger({
  children,
  className,
  value,
  isOpen,
  onToggle,
}: AccordionTriggerProps & {
  value?: string;
  isOpen?: boolean;
  onToggle?: (value: string) => void;
}) {
  return (
    <TouchableOpacity
      className={cn(
        "flex-row items-center justify-between py-4",
        className
      )}
      onPress={() => value && onToggle?.(value)}
      activeOpacity={0.7}
    >
      <View className="flex-1">{children}</View>
      <Ionicons
        name={isOpen ? "chevron-up" : "chevron-down"}
        size={20}
        color="#6b7280"
      />
    </TouchableOpacity>
  );
}

export function AccordionContent({
  children,
  className,
  isOpen,
}: AccordionContentProps & { isOpen?: boolean }) {
  if (!isOpen) return null;

  return (
    <View className={cn("pb-4", className)}>
      {children}
    </View>
  );
}

