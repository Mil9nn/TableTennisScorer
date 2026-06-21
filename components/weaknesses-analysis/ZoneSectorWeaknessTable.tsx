import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Card } from "@/components/ui/Card";
import { ZoneSectorWeakness } from "@/types/weaknesses.type";
import { RecommendationText } from "./RecommendationText";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

interface ZoneSectorWeaknessTableProps {
  weaknesses: ZoneSectorWeakness[];
  showAll?: boolean;
}

export function ZoneSectorWeaknessTable({
  weaknesses,
  showAll = false,
}: ZoneSectorWeaknessTableProps) {
  const displayWeaknesses = showAll
    ? weaknesses
    : weaknesses.filter((w) => w.totalShots >= 3);

  if (displayWeaknesses.length === 0) {
    return null;
  }

  const zones: Array<"short" | "mid" | "deep"> = ["short", "mid", "deep"];
  const sectors: Array<"backhand" | "crossover" | "forehand"> = [
    "backhand",
    "crossover",
    "forehand",
  ];

  return (
    <Card>
      <View className="p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900">
          Zone-Sector Analysis
        </Text>
        <Text className="text-sm text-gray-500">
          Performance across 9 table zones (3 zones × 3 sectors)
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Text className="text-sm font-semibold">Zone</Text>
                </TableHead>
                {sectors.map((sector) => (
                  <TableHead key={sector}>
                    <Text className="text-sm font-semibold capitalize text-center">
                      {sector}
                    </Text>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone}>
                  <TableCell>
                    <Text className="font-semibold capitalize text-sm">{zone}</Text>
                  </TableCell>
                  {sectors.map((sector) => {
                    const weakness = weaknesses.find(
                      (w) => w.zone === zone && w.sector === sector
                    );

                    if (!weakness || weakness.totalShots === 0) {
                      return (
                        <TableCell key={sector}>
                          <Text className="text-center text-gray-400 text-xs">
                            No data
                          </Text>
                        </TableCell>
                      );
                    }

                    const isInsufficientData = weakness.totalShots > 0 && weakness.totalShots < 3;

                    const bgColor =
                      weakness.vulnerability === "high"
                        ? "bg-red-100"
                        : weakness.vulnerability === "medium"
                        ? "bg-yellow-100"
                        : "bg-green-100";

                    const textColor =
                      weakness.vulnerability === "high"
                        ? "text-red-800"
                        : weakness.vulnerability === "medium"
                        ? "text-yellow-800"
                        : "text-green-800";

                    return (
                      <TableCell key={sector}>
                        <View className={`rounded p-2 ${bgColor} ${textColor} ${isInsufficientData ? "opacity-60" : ""}`}>
                          <Text className="text-sm font-semibold text-center">
                            {weakness.winRate.toFixed(0)}%
                          </Text>
                          <Text className="text-xs text-center mt-1">
                            {weakness.totalShots} shots
                          </Text>
                          {isInsufficientData && (
                            <Text className="text-xs text-center text-gray-500 mt-1">
                              *
                            </Text>
                          )}
                        </View>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </View>
      </ScrollView>
    </Card>
  );
}

