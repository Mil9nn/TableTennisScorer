import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const LOGO_BASE_URL = "https://table-tennis-xi.vercel.app";

const resolveUserAvatarUri = (user: { _id?: string; fullName?: string; username?: string; profileImage?: string }) => {
  const profileImage = user.profileImage?.trim();
  if (profileImage) return profileImage;
  const seed = (user.fullName?.trim() || user.username?.trim() || user._id || "user").slice(0, 64);
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;
};

// Mock data for demonstration
const mockOpponents = [
  {
    _id: "1",
    opponent: {
      _id: "opp1",
      fullName: "George Mathew",
      username: "george",
      profileImage: ""
    },
    wins: 12,
    losses: 8,
    total: 20,
    winRate: 60,
    recentForm: ["win", "loss", "win", "win", "loss"]
  },
  {
    _id: "2",
    opponent: {
      _id: "opp2",
      fullName: "Sarah Chen",
      username: "sarah",
      profileImage: ""
    },
    wins: 8,
    losses: 10,
    total: 18,
    winRate: 44,
    recentForm: ["loss", "win", "loss", "loss", "win"]
  },
  {
    _id: "3",
    opponent: {
      _id: "opp3",
      fullName: "Mike Johnson",
      username: "mike",
      profileImage: ""
    },
    wins: 15,
    losses: 5,
    total: 20,
    winRate: 75,
    recentForm: ["win", "win", "win", "loss", "win"]
  }
];

const mockMatchHistory = [
  {
    _id: "m1",
    matchId: "match1",
    result: "win",
    score: "3-1",
    matchType: "singles",
    date: "2026-04-12",
    tournament: { name: "Spring Championship" }
  },
  {
    _id: "m2",
    matchId: "match2",
    result: "loss",
    score: "2-3",
    matchType: "singles",
    date: "2026-04-05",
    tournament: null
  },
  {
    _id: "m3",
    matchId: "match3",
    result: "win",
    score: "3-0",
    matchType: "singles",
    date: "2026-03-28",
    tournament: { name: "Weekly Tournament" }
  }
];

export default function HeadToHeadPage() {
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpponentPress = (opponent: any) => {
    setSelectedOpponent(opponent);
    setIsModalOpen(true);
    setLoadingHistory(true);
    
    // Simulate API call
    setTimeout(() => {
      setMatchHistory(mockMatchHistory);
      setLoadingHistory(false);
    }, 1000);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOpponent(null);
    setMatchHistory([]);
  };

  const totalOpponents = mockOpponents.length;
  const dominantRecord = mockOpponents.filter(h => h.wins > h.losses).length;
  const evenRecord = mockOpponents.filter(h => h.wins === h.losses).length;
  const losingRecord = mockOpponents.filter(h => h.wins < h.losses).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 8 }}>
        
        {/* Page Title */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.4, color: '#353535', marginBottom: 4 }}>
            Head to Head
          </Text>
          <View style={{ height: 1, backgroundColor: '#d9d9d9', width: 96 }} />
        </View>

        {/* Key Stats Cards */}
        <View style={{ backgroundColor: '#ffffff', marginBottom: 16 }}>
          <View style={{ backgroundColor: '#f5f5f5', borderRadius: 8, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#353535' }}>Total Opponents</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#3c6e71' }}>{totalOpponents}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#353535' }}>Winning Records</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#3c6e71' }}>{dominantRecord}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#353535' }}>Even Records</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#3c6e71' }}>{evenRecord}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#353535' }}>Losing Records</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#3c6e71' }}>{losingRecord}</Text>
            </View>
          </View>
        </View>

        {/* Opponent Records */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.4, color: '#353535', marginBottom: 4 }}>
              Opponent Records
            </Text>
            <Text style={{ fontSize: 12, color: '#353535' }}>
              Sorted by most matches played
            </Text>
          </View>

          <View style={{ backgroundColor: '#d9d9d9', paddingHorizontal: 4, borderRadius: 4 }}>
            {mockOpponents.map((record) => {
              const isWinning = record.wins > record.losses;
              const isLosing = record.wins < record.losses;
              
              return (
                <TouchableOpacity
                  key={record._id}
                  onPress={() => handleOpponentPress(record)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#d9d9d9',
                    padding: 16,
                    marginBottom: 1,
                  }}
                >
                  {/* Line 1: Opponent & Record */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Opponent: Avatar + Name */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      {/* Rounded Avatar */}
                      <ExpoImage
                        source={{ uri: resolveUserAvatarUri(record.opponent) }}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12, // Fully rounded
                          backgroundColor: '#ffffff',
                          borderWidth: 1,
                          borderColor: '#e5e7eb'
                        }}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: isWinning ? '#059669' : isLosing ? '#dc2626' : '#1f2937'
                        }}>
                          {record.opponent.fullName || record.opponent.username}
                        </Text>
                        {record.opponent.fullName && record.opponent.username && (
                          <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                            @{record.opponent.username}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Record Score */}
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#374151', paddingHorizontal: 6, paddingVertical: 2 }}>
                      {record.wins} - {record.losses}
                    </Text>

                    {/* Win Rate */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: record.winRate >= 60 ? '#059669' : record.winRate >= 40 ? '#374151' : '#dc2626'
                      }}>
                        {record.winRate}%
                      </Text>
                      <View style={{ marginLeft: 2 }}>
                        {record.wins > record.losses && <Feather name="trending-up" size={16} color="#059669" />}
                        {record.wins < record.losses && <Feather name="trending-down" size={16} color="#dc2626" />}
                        {record.wins === record.losses && <Feather name="minus" size={16} color="#6b7280" />}
                      </View>
                    </View>
                  </View>

                  {/* Line 2: Meta info */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}>
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                      {record.total} match{record.total > 1 ? "es" : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Modal with More Details */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '80%',
            overflow: 'hidden'
          }}>
            {selectedOpponent && (
              <>
                {/* Modal Header */}
                <View style={{
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#d9d9d9',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16
                }}>
                  <ExpoImage
                    source={{ uri: resolveUserAvatarUri(selectedOpponent.opponent) }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24, // Fully rounded
                      borderWidth: 2,
                      borderColor: '#d9d9d9'
                    }}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#353535' }}>
                      {selectedOpponent.opponent.fullName || selectedOpponent.opponent.username}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666666' }}>
                      @{selectedOpponent.opponent.username}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={closeModal}>
                    <Feather name="x" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {loadingHistory ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
                    <ActivityIndicator size="small" color="#3c6e71" />
                    <Text style={{ fontSize: 14, color: '#666666', marginTop: 12 }}>Loading match history...</Text>
                  </View>
                ) : matchHistory.length > 0 ? (
                  <View style={{ flex: 1 }}>
                    {/* Summary Stats */}
                    <View style={{
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      backgroundColor: '#f5f5f5',
                      borderBottomWidth: 1,
                      borderBottomColor: '#d9d9d9'
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#666666', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                            Head-to-Head Record
                          </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: selectedOpponent.wins > selectedOpponent.losses ? '#059669' : '#353535'
                              }}>
                                {selectedOpponent.wins}
                              </Text>
                              <Text style={{ color: '#d9d9d9', marginHorizontal: 4 }}>-</Text>
                              <Text style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: selectedOpponent.losses > selectedOpponent.wins ? '#dc2626' : '#353535'
                              }}>
                                {selectedOpponent.losses}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 14, color: '#666666' }}>
                              ({selectedOpponent.winRate}% win rate)
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 14, color: '#666666' }}>
                          {selectedOpponent.total} total matches
                        </Text>
                      </View>
                    </View>

                    {/* Match List */}
                    <ScrollView style={{ flex: 1 }}>
                      <View style={{ borderBottomWidth: 1, borderBottomColor: '#d9d9d9' }}>
                        {matchHistory.map((match, i) => (
                          <TouchableOpacity
                            key={i}
                            style={{
                              paddingHorizontal: 24,
                              paddingVertical: 12,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 16,
                              borderBottomWidth: 1,
                              borderBottomColor: '#d9d9d9'
                            }}
                          >
                            <View style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: match.result === 'win' ? '#d1f4e6' : '#fee2e2'
                            }}>
                              <Text style={{
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: match.result === 'win' ? '#065f46' : '#7f1d1d'
                              }}>
                                {match.result === 'win' ? 'W' : 'L'}
                              </Text>
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#353535', textTransform: 'capitalize' }}>
                                  {match.matchType?.replace('_', ' ')}
                                </Text>
                                {match.tournament && (
                                  <Text style={{ fontSize: 12, color: '#666666' }}>
                                    • {match.tournament.name}
                                  </Text>
                                )}
                              </View>
                              <Text style={{ fontSize: 12, color: '#666666' }}>
                                {match.date ? new Date(match.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : ''}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                              <View>
                                <Text style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 'bold', color: '#353535' }}>
                                  {match.score || '—'}
                                </Text>
                              </View>
                              <Feather name="chevron-right" size={16} color="#d9d9d9" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
                    <Feather name="crosshair" size={48} color="#d9d9d9" style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#353535', marginBottom: 4 }}>
                      No Matches Found
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center' }}>
                      No completed matches found between you and this player.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatRow({ label, left, right }: { label: string; left: string; right: string }) {
  return (
    <View className="flex-row justify-between items-center mb-2">
      <Text className="text-slate-500">{label}</Text>

      <View className="flex-row gap-2">
        <Text className="text-slate-900 font-medium">{left}</Text>
        <Text className="text-slate-400">—</Text>
        <Text className="text-slate-900 font-medium">{right}</Text>
      </View>
    </View>
  );
}

function MatchItem({ date, score, winner }: { date: string; score: string; winner: string }) {
  return (
    <View className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-2 flex-row justify-between">
      <View>
        <Text className="text-slate-900 font-medium">{score}</Text>
        <Text className="text-xs text-slate-500">{date}</Text>
      </View>

      <Text className="text-sm text-green-600 font-medium">
        {winner}
      </Text>
    </View>
  );
}