import React, { useState } from "react";
import { View, TouchableOpacity, Text, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LeaderboardFilters as FilterType } from "@/types/leaderboard";

interface LeaderboardFiltersProps {
  filters: Partial<FilterType>;
  onFiltersChange: (filters: Partial<FilterType>) => void;
  tabType?: "individual" | "teams";
}

type TimeRange = "all_time" | "this_year" | "this_month";
type Gender = "all" | "male" | "female";
type Handedness = "all" | "left" | "right";
type MatchFormat = "all" | "singles" | "doubles";
type CompFormat = "all" | "friendly" | "tournament";

export function LeaderboardFilters({
  filters,
  onFiltersChange,
  tabType = "individual",
}: LeaderboardFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof FilterType, value: string | undefined) => {
    if (value === "" || value === "all" || value === "all_time" || value === undefined) {
      const newFilters = { ...filters };
      delete newFilters[key];
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setShowFilters(false);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const timeRangeOptions = [
    { label: "All Time", value: "all_time" },
    { label: "This Year", value: "this_year" },
    { label: "This Month", value: "this_month" },
  ];

  const genderOptions = [
    { label: "All", value: "all" },
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];

  const handednessOptions = [
    { label: "All", value: "all" },
    { label: "Left", value: "left" },
    { label: "Right", value: "right" },
  ];

  const matchTypeOptions = [
    { label: "All", value: "all" },
    { label: "Singles", value: "singles" },
    { label: "Doubles", value: "doubles" },
  ];

  const compFormatOptions = [
    { label: "All Formats", value: "all" },
    { label: "Friendly", value: "friendly" },
    { label: "Tournament", value: "tournament" },
  ];

  const FilterButton = ({
    label,
    value,
    options,
    filterKey,
  }: {
    label: string;
    value: string;
    options: Array<{ label: string; value: string }>;
    filterKey: keyof FilterType;
  }) => {
    const currentValue = (filters[filterKey] as string) || value;
    const currentLabel =
      options.find((opt) => opt.value === currentValue)?.label || label;

    return (
      <View className="flex-1 min-w-[150px] mb-3 mr-3">
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-2">
          {label}
        </Text>
        <View className="border border-gray-200 rounded-lg bg-white">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
          >
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => updateFilter(filterKey, opt.value === value ? undefined : opt.value)}
                className={`px-3 py-2 ${
                  currentValue === opt.value
                    ? "bg-indigo-600"
                    : "bg-white border-r border-gray-100"
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-xs font-medium whitespace-nowrap ${
                    currentValue === opt.value
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View className="border-b border-gray-200 bg-white">
      {/* Filter Toggle Button */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center gap-2"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="filter-variant"
            size={16}
            color="#353535"
          />
          <Text className="text-xs font-semibold uppercase tracking-wider text-gray-700">
            Filters
          </Text>
          {hasActiveFilters && (
            <View className="ml-1.5 px-1.5 py-0.5 rounded-full bg-indigo-600">
              <Text className="text-[10px] font-bold text-white">
                {Object.keys(filters).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity
            onPress={clearAllFilters}
            activeOpacity={0.7}
          >
            <Text className="text-xs text-gray-400 font-medium">Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Options (Collapsed/Expanded) */}
      {showFilters && (
        <View className="border-t border-gray-200 bg-gray-50 p-4">
          <View className="flex-row flex-wrap">
            {/* Match Type - Only for Individual tab */}
            {tabType === "individual" && (
              <FilterButton
                label="Match Type"
                value="all"
                options={matchTypeOptions}
                filterKey="type"
              />
            )}

            {/* Time Range */}
            <FilterButton
              label="Time Range"
              value="all_time"
              options={timeRangeOptions}
              filterKey="timeRange"
            />

            {/* Gender */}
            <FilterButton
              label="Gender"
              value="all"
              options={genderOptions}
              filterKey="gender"
            />

            {/* Handedness */}
            <FilterButton
              label="Handedness"
              value="all"
              options={handednessOptions}
              filterKey="handedness"
            />

            {/* Format */}
            <FilterButton
              label="Format"
              value="all"
              options={compFormatOptions}
              filterKey="matchFormat"
            />
          </View>
        </View>
      )}
    </View>
  );
}
