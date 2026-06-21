import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterButtonProps {
  label: string;
  value: string;
  options: FilterOption[];
  onValueChange: (value: string) => void;
  style?: any;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  value,
  options,
  onValueChange,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <>
      <TouchableOpacity
        className="flex-row items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg min-h-[40px] gap-1"
        style={style}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text className="text-sm text-gray-800 font-medium flex-1" numberOfLines={1}>
          {selectedOption.label}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setModalVisible(false)}
        >
          <View className="bg-white rounded-t-2xl max-h-[70%]">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-800">{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            <View className="p-2">
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className={cn(
                    "flex-row items-center justify-between p-4 rounded-lg mb-1",
                    value === option.value && "bg-gray-50"
                  )}
                  onPress={() => {
                    onValueChange(option.value);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className={cn(
                      "text-base text-gray-800",
                      value === option.value && "text-blue-600 font-semibold"
                    )}
                  >
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};


