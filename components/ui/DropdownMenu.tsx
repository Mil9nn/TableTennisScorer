import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  sideOffset?: number;
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
  className?: string;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

interface DropdownMenuGroupProps {
  children: React.ReactNode;
}

// Context for managing dropdown state
const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onPress: () => setOpen(!open),
    });
  }

  return (
    <TouchableOpacity onPress={() => setOpen(!open)} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

export function DropdownMenuContent({
  children,
  align = "end",
  sideOffset = 4,
  className,
}: DropdownMenuContentProps) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  const contentRef = useRef<View>(null);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setOpen(false)}
        activeOpacity={1}
      >
        <View
          ref={contentRef}
          style={[
            styles.content,
            align === "start" && styles.contentStart,
            align === "center" && styles.contentCenter,
            { marginTop: sideOffset },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {children}
        </View>
      </Pressable>
    </Modal>
  );
}

export function DropdownMenuItem({
  children,
  onSelect,
  disabled = false,
  variant = "default",
  className,
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handlePress = () => {
    if (disabled) return;
    onSelect?.();
    setOpen(false);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.item,
        variant === "destructive" && styles.itemDestructive,
        disabled && styles.itemDisabled,
      ]}
      activeOpacity={0.7}
    >
      {typeof children === "string" ? (
        <Text
          style={[
            styles.itemText,
            variant === "destructive" && styles.itemTextDestructive,
            disabled && styles.itemTextDisabled,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return <View style={styles.label}>{children}</View>;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <View style={styles.separator} />;
}

export function DropdownMenuGroup({ children }: DropdownMenuGroupProps) {
  return <View style={styles.group}>{children}</View>;
}

// Additional components for compatibility
export function DropdownMenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  children: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handlePress = () => {
    if (disabled) return;
    onCheckedChange?.(!checked);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[styles.item, disabled && styles.itemDisabled]}
      activeOpacity={0.7}
    >
      <View style={styles.checkboxItem}>
        <View style={styles.checkbox}>
          {checked && <Ionicons name="checkmark" size={16} color={Colors.light.text} />}
        </View>
        {typeof children === "string" ? (
          <Text style={[styles.itemText, disabled && styles.itemTextDisabled]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </TouchableOpacity>
  );
}

export function DropdownMenuRadioGroup({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <View style={styles.radioGroup}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            checked: child.props.value === value,
            onSelect: () => onValueChange?.(child.props.value),
          });
        }
        return child;
      })}
    </View>
  );
}

export function DropdownMenuRadioItem({
  children,
  value,
  checked,
  onSelect,
  disabled = false,
}: {
  children: React.ReactNode;
  value: string;
  checked?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handlePress = () => {
    if (disabled) return;
    onSelect?.();
    setOpen(false);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[styles.item, disabled && styles.itemDisabled]}
      activeOpacity={0.7}
    >
      <View style={styles.radioItem}>
        <View style={styles.radio}>
          {checked && <View style={styles.radioIndicator} />}
        </View>
        {typeof children === "string" ? (
          <Text style={[styles.itemText, disabled && styles.itemTextDisabled]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </TouchableOpacity>
  );
}

export function DropdownMenuShortcut({ children }: { children: React.ReactNode }) {
  return <Text style={styles.shortcut}>{children}</Text>;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: Spacing.base,
  },
  content: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minWidth: 200,
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    padding: Spacing.xs,
  },
  contentStart: {
    alignSelf: "flex-start",
  },
  contentCenter: {
    alignSelf: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minHeight: 36,
  },
  itemDestructive: {
    // Destructive styling can be added
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemText: {
    ...Typography.sm,
    color: Colors.light.text,
  },
  itemTextDestructive: {
    color: "#ef4444",
  },
  itemTextDisabled: {
    color: Colors.light.textTertiary,
  },
  label: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    ...Typography.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.xs,
    marginHorizontal: Spacing.xs,
  },
  group: {
    gap: Spacing.xs,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  radioGroup: {
    gap: Spacing.xs,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  radio: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  radioIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.text,
  },
  shortcut: {
    ...Typography.xs,
    color: Colors.light.textSecondary,
    marginLeft: "auto",
    letterSpacing: 1,
  },
});

