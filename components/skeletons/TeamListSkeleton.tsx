import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

function TeamCardSkeleton() {
  return (
    <View className="bg-white p-4">
      <View className="flex-row items-start gap-3">
        {/* Team Logo */}
        <Skeleton width={40} height={40} borderRadius={20} />

        {/* Team Info Container */}
        <View className="flex-1 gap-2">
          {/* Team Name */}
          <Skeleton width={140} height={16} borderRadius={4} />
          
          {/* Meta Row: Players • City */}
          <View className="flex-row items-center gap-2">
            <Skeleton width={48} height={12} borderRadius={4} />
            <Skeleton width={8} height={12} borderRadius={4} />
            <Skeleton width={64} height={12} borderRadius={4} />
          </View>

          {/* Captain Row */}
          <View className="flex-row items-center gap-2">
            <Skeleton width={48} height={12} borderRadius={4} />
            <View className="flex-row items-center gap-1.5 flex-1">
              <Skeleton width={80} height={12} borderRadius={4} />
              <Skeleton width={34} height={34} borderRadius={17} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

interface TeamListSkeletonProps {
  count?: number;
}

export default function TeamListSkeleton({ count = 6 }: TeamListSkeletonProps) {
  return (
    <View className="flex-1 bg-gray-50">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          <TeamCardSkeleton />
          {i < count - 1 && <View className="h-px bg-gray-100 mx-3" />}
        </View>
      ))}
    </View>
  );
}

