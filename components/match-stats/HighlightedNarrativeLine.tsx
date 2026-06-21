import React, { useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import { DesignTokens } from "@/constants/designTokens";

const tokens = DesignTokens;

type SegmentKind = "plain" | "name" | "metric";

interface TextSegment {
  text: string;
  kind: SegmentKind;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function classifySegment(text: string, playerNames: string[]): SegmentKind {
  const lower = text.toLowerCase();
  if (playerNames.some((name) => name && name.toLowerCase() === lower)) {
    return "name";
  }
  if (/^\d+%$/.test(text) || /^\d+$/.test(text)) {
    return "metric";
  }
  return "plain";
}

function tokenizeNarrativeLine(line: string, playerNames: string[]): TextSegment[] {
  const names = playerNames.filter((n) => n.trim().length > 0);
  const sortedNames = [...names].sort((a, b) => b.length - a.length);

  const patternParts = [
    ...sortedNames.map(escapeRegex),
    "\\d+%",
    "\\b\\d+\\b",
  ].filter(Boolean);

  if (patternParts.length === 0) {
    return [{ text: line, kind: "plain" }];
  }

  const regex = new RegExp(`(${patternParts.join("|")})`, "gi");
  const rawParts = line.split(regex).filter((part) => part.length > 0);

  return rawParts.map((text) => ({
    text,
    kind: classifySegment(text, names),
  }));
}

const segmentStyles = StyleSheet.create({
  plain: {
    color: tokens.colors.text.secondary,
  },
  name: {
    color: tokens.colors.info,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  metric: {
    color: tokens.colors.success,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontVariant: ["tabular-nums"],
  },
});

interface HighlightedNarrativeLineProps {
  line: string;
  playerNames: string[];
}

export function HighlightedNarrativeLine({
  line,
  playerNames,
}: HighlightedNarrativeLineProps) {
  const segments = useMemo(
    () => tokenizeNarrativeLine(line, playerNames),
    [line, playerNames]
  );

  return (
    <Text style={styles.line}>
      {segments.map((segment, index) => (
        <Text key={`${index}-${segment.kind}`} style={segmentStyles[segment.kind]}>
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  line: {
    fontSize: tokens.typography.fontSize.base,
    lineHeight: 20,
  },
});
