import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Shot } from "@/types/shot.type";

interface Participant {
  _id: string;
  fullName?: string;
  username: string;
}

interface Game {
  gameNumber: number;
  shots: any[];
}

interface WagonWheelSectionProps {
  participants: Participant[];
  allShots: any[];
  games: Game[];
  hideByGame?: boolean;
}

export function WagonWheelSection({
  participants,
  allShots,
  games,
  hideByGame = false,
}: WagonWheelSectionProps) {
  // Note: WagonWheel visualization would need to be implemented separately
  // For now, we'll show a placeholder with shot statistics

  return (
    <View className="gap-4 p-2">
      {/* Player Combined Shots */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-4">
          {participants.map((player) => {
            const playerShots = allShots.filter((shot) => {
              const id =
                typeof shot.player === "string"
                  ? shot.player
                  : shot.player._id || shot.player.toString();
              return id === player._id.toString();
            });

            if (!playerShots.length) return null;

            return (
              <Card
                key={player._id}
                className="rounded-2xl border border-gray-800 bg-black min-w-[280px]"
              >
                <View className="p-4">
                  <Text className="text-lg font-semibold text-white">
                    {player.fullName || player.username}'s shot placement points
                  </Text>
                </View>

                <View className="p-4 items-center">
                  <View className="w-64 h-64 bg-gray-900 rounded-lg items-center justify-center">
                    <Text className="text-gray-500 text-sm">
                      Wagon Wheel Visualization
                    </Text>
                    <Text className="text-gray-600 text-xs mt-2">
                      {playerShots.length} shots
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* Game-wise Shot Placements */}
      {!hideByGame && games.length > 1 && (
        <View className="gap-4">
          <Text className="text-lg font-semibold text-gray-900">
            Shot Placement by Game
          </Text>

          {participants.map((player) => {
            const playerGames = games
              .map((g) => ({
                gameNumber: g.gameNumber,
                shots:
                  g.shots?.filter((shot) => {
                    const id =
                      typeof shot.player === "string"
                        ? shot.player
                        : shot.player._id || shot.player.toString();
                    return id === player._id.toString();
                  }) || [],
              }))
              .filter((x) => x.shots.length > 0);

            if (!playerGames.length) return null;

            return (
              <View key={player._id} className="gap-2">
                <View className="flex-row items-center gap-4 mb-2">
                  <Text className="font-semibold text-gray-900">
                    {player.fullName || player.username}
                  </Text>
                  <Badge variant="secondary" size="sm">
                    {playerGames.reduce((s, g) => s + g.shots.length, 0)} points
                  </Badge>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-4">
                    {playerGames.map((game) => (
                      <Card
                        key={`${player._id}-game-${game.gameNumber}`}
                        className="rounded-2xl border border-gray-800 bg-black min-w-[200px]"
                      >
                        <View className="p-4 border-b border-gray-800 flex-row items-center justify-between">
                          <Text className="text-sm font-semibold text-white">
                            Game {game.gameNumber}
                          </Text>
                          <Badge variant="outline" size="sm">
                            {game.shots.length} points
                          </Badge>
                        </View>

                        <View className="p-4 items-center">
                          <View className="w-48 h-48 bg-gray-900 rounded-lg items-center justify-center">
                            <Text className="text-gray-500 text-xs">
                              Wagon Wheel
                            </Text>
                            <Text className="text-gray-600 text-[10px] mt-1">
                              {game.shots.length} shots
                            </Text>
                          </View>
                        </View>
                      </Card>
                    ))}
                  </View>
                </ScrollView>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

