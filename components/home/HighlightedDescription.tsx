import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

type HighlightedDescriptionProps = {
  text: string;
  highlight: string;
  baseStyle?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function HighlightedDescription({
  text,
  highlight,
  baseStyle,
  highlightStyle,
  numberOfLines,
}: HighlightedDescriptionProps) {
  const parts = text.split(new RegExp(`(${highlight})`, "g"));

  return (
    <Text style={baseStyle} numberOfLines={numberOfLines}>
      {parts.map((part, index) =>
        part === highlight ? (
          <Text key={`${part}-${index}`} style={highlightStyle}>
            {part}
          </Text>
        ) : (
          <Text key={`${part}-${index}`}>{part}</Text>
        ),
      )}
    </Text>
  );
}
