import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: number;
  className?: string;
}

export function Avatar({
  src,
  alt,
  fallback,
  size = 40,
  className,
}: AvatarProps) {
  const initials = fallback || getInitials(alt || "");

  return (
    <View
      className={cn(
        "rounded-full items-center justify-center overflow-hidden bg-gray-200 border border-gray-300",
        className
      )}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <Text
          className="font-bold text-gray-600"
          style={{ fontSize: size * 0.4 }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

