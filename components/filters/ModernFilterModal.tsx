import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FilterOption {
  label: string;
  value: string;
}

interface FilterSection {
  title: string;
  type: 'dropdown' | 'date';
  options?: FilterOption[];
  value?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Quick range chips (Today, This week, …) — same semantics as match feed presets. */
  quickPresetOptions?: { label: string; value: string }[];
  datePreset?: string;
  onValueChange?: (value: string) => void;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  onDatePresetSelect?: (preset: string) => void;
}

interface ModernFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  sections: FilterSection[];
  activeTab: 'individual' | 'teams';
}

const ANIMATION_DURATION = 300;

export const ModernFilterModal: React.FC<ModernFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  onClearAll,
  hasActiveFilters,
  sections,
  activeTab,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Date picker state
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const handleApply = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply();
  }, [onApply]);

  const handleClearAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClearAll();
  }, [onClearAll]);

  const FilterDropdown: React.FC<{
    section: FilterSection;
  }> = ({ section }) => {
    return (
      <View className="mb-4">
        <View className="flex-row items-center justify-between px-1 py-2">
          <Text className="text-white font-semibold text-base">
            {section.title}
          </Text>
        </View>

        <View className="bg-[#1a1a1a] rounded-2xl mt-2 p-2">
          <View className="flex-row flex-wrap gap-2">
            {section.options?.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`px-4 py-2 rounded-full ${
                  section.value === option.value ? 'bg-[#3b82f6]' : 'bg-transparent'
                }`}
                onPress={() => {
                  section.onValueChange?.(option.value);
                }}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm ${
                    section.value === option.value ? 'text-white font-semibold' : 'text-gray-300'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const FilterDatePicker: React.FC<{
    section: FilterSection;
  }> = ({ section }) => {

    const handleDatePress = (type: 'from' | 'to') => {
      if (type === 'from') {
        setShowFromDatePicker(true);
      } else {
        setShowToDatePicker(true);
      }
    };

    const formatDateDisplay = (dateString: string) => {
      if (!dateString) return 'Select date';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    return (
      <View className="mb-4">
        <View className="flex-row items-center justify-between p-4 bg-[#2a2a2a] rounded-2xl">
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar" size={18} color="#9CA3AF" />
            <Text className="text-white font-semibold text-base">
              {section.title}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-300 text-sm mr-2">
              {section.dateFrom || section.dateTo ? 'Selected' : 'Select dates'}
            </Text>
          </View>
        </View>

        <View className="bg-[#1a1a1a] rounded-2xl mt-2 p-4">
          {section.quickPresetOptions && section.quickPresetOptions.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {section.quickPresetOptions.map((opt) => {
                const selected =
                  opt.value === 'all'
                    ? !section.dateFrom && !section.dateTo
                    : section.datePreset === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    className={`px-3 py-2 rounded-full ${
                      selected ? 'bg-[#3b82f6]' : 'bg-[#2a2a2a]'
                    }`}
                    onPress={() => section.onDatePresetSelect?.(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text
                      className={`text-xs ${
                        selected ? 'text-white font-semibold' : 'text-gray-300'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View className="">
            <TouchableOpacity
              className="p-3 bg-[#2a2a2a] rounded-xl"
              onPress={() => handleDatePress('from')}
              activeOpacity={0.7}
            >
              <Text className="text-gray-300 text-sm">
                From: {section.dateFrom ? formatDateDisplay(section.dateFrom) : 'Select date'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="p-3 mt-2 bg-[#2a2a2a] rounded-xl"
              onPress={() => handleDatePress('to')}
              activeOpacity={0.7}
            >
              <Text className="text-gray-300 text-sm">
                To: {section.dateTo ? formatDateDisplay(section.dateTo) : 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {showFromDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={new Date(section.dateFrom || new Date())}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={(event, selectedDate) => {
              const currentDate = selectedDate || new Date();
              section.onDateFromChange?.(currentDate.toISOString());
              setShowFromDatePicker(false);
            }}
          />
        )}
        {showToDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={new Date(section.dateTo || new Date())}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={(event, selectedDate) => {
              const currentDate = selectedDate || new Date();
              section.onDateToChange?.(currentDate.toISOString());
              setShowToDatePicker(false);
            }}
          />
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: backdropOpacity,
        }}
      />
      
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0f0f0f',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: [{ translateY: slideAnim }],
          maxHeight: SCREEN_HEIGHT * 0.8,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 border-b border-gray-800">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 bg-[#3b82f6] rounded-full items-center justify-center">
              <Ionicons name="filter" size={20} color="white" />
            </View>
            <Text className="text-white text-xl font-bold">
              Filters
            </Text>
          </View>
          
          <View className="flex-row items-center gap-2">
            {hasActiveFilters && (
              <TouchableOpacity
                className="px-3 py-1.5 bg-red-500 rounded-full"
                onPress={handleClearAll}
                activeOpacity={0.7}
              >
                <Text className="text-white text-xs font-semibold">Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="w-8 h-8 items-center justify-center"
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4">
          <View className="space-y-2">
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">
              {activeTab === 'individual' ? 'Individual Matches' : 'Team Matches'}
            </Text>
            
            {sections.map((section) => (
              <View key={section.title}>
                {section.type === 'dropdown' ? (
                  <FilterDropdown section={section} />
                ) : (
                  <FilterDatePicker section={section} />
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="p-6 border-t border-gray-800">
          <TouchableOpacity
            className="w-full bg-[#3b82f6] py-4 rounded-2xl items-center"
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-base">
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};
