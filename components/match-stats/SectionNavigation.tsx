import { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface Section {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SectionNavigationProps {
  sections: Section[];
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export function SectionNavigation({
  sections,
  activeSection,
  onNavigate,
}: SectionNavigationProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [buttonLayouts, setButtonLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  // Update indicator position when active section changes
  useEffect(() => {
    const layout = buttonLayouts[activeSection];
    if (layout) {
      Animated.parallel([
        Animated.spring(indicatorPosition, {
          toValue: layout.x,
          useNativeDriver: false,
          tension: 100,
          friction: 12,
        }),
        Animated.spring(indicatorWidth, {
          toValue: layout.width,
          useNativeDriver: false,
          tension: 100,
          friction: 12,
        }),
      ]).start();
    }
  }, [activeSection, buttonLayouts]);

  const handleButtonLayout = (sectionId: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setButtonLayouts((prev) => ({
      ...prev,
      [sectionId]: { x, width },
    }));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.buttonsContainer}>
          {/* Sliding indicator */}
          <Animated.View
            style={[
              styles.indicator,
              {
                left: indicatorPosition,
                width: indicatorWidth,
              },
            ]}
          />

          {sections.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <TouchableOpacity
                key={section.id}
                onPress={() => onNavigate(section.id)}
                onLayout={(e) => handleButtonLayout(section.id, e)}
                style={styles.button}
              >
                {section.icon && (
                  <Ionicons
                    name={section.icon}
                    size={16}
                    color={isActive ? "#2B2F36" : "#6B7280"}
                  />
                )}
                <Text
                  style={[
                    styles.buttonText,
                    isActive && styles.buttonTextActive,
                  ]}
                >
                  {section.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f3",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 10,
    paddingBottom: 0,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    backgroundColor: "#0f172a",
    borderRadius: 999,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    zIndex: 1,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  buttonTextActive: {
    color: "#0f172a",
  },
});
