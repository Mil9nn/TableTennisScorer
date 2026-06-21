import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Image } from 'expo-image';
import { DesignTokens } from '@/constants/designTokens';
import { profilePath } from '@/lib/profile/navigation';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.authLoading);
  const userName = user?.fullName || user?.username || "";
  const tokens = DesignTokens;

  const styles = StyleSheet.create({
    quickAction: {
      flex: 1,
      backgroundColor: 'white',
      borderRadius: tokens.borderRadius.sm,
      padding: tokens.spacing[6],
      ...tokens.shadows.sm,
    },
    leaderboardContainer: {
      paddingHorizontal: tokens.spacing[6],
      paddingVertical: tokens.spacing[4],
      marginHorizontal: tokens.spacing[6],
      borderRadius: tokens.borderRadius.sm,
      backgroundColor: "#000",
    },
    leaderboardAction: {
      paddingHorizontal: tokens.spacing[8],
      paddingVertical: tokens.spacing[4],
      flexDirection: 'row',
      alignItems: 'center',
    },
    leaderboardContent: {
      flex: 1,
    },
    leaderboardTitle: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.bold,
      color: "#3B82F6",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    leaderboardSubtitle: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.bold,
      color: "white",
      marginBottom: 4,
    },
    leaderboardDescription: {
      fontSize: 10,
      color: "#94A3B8",
      paddingRight: tokens.spacing[8],
    },
    leaderboardIconContainer: {
      width: 40,
      height: 40,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* --- Fixed Header Section --- */}
      <View className="px-6 pt-4 pb-2">
        {/* Brand Section */}
        <View className="flex-row items-center">
          {/* Logo */}
          <View className="w-12 h-12 items-center justify-center mr-2">
            <Image 
              source={require("@/assets/images/logo.png")} 
              style={{ width: 48, height: 48 }}
              contentFit="contain"
            />
          </View>
          <View>
            <Text className="text-sm font-bold tracking-tight text-blue-600">
              TTPro
            </Text>
            <Text className="text-[10px] font-semibold text-blue-600 tracking-wider">
              The Home of Table Tennis Players
            </Text>
          </View>
        </View>
      </View>
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* --- Welcome & Intro Paragraph --- */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-base font-bold text-slate-800 tracking-tight mb-3">
            Welcome back
          </Text>
          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 bg-slate-200 rounded-full items-center justify-center mr-3">
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={{ width: "100%", height: "100%", borderRadius: 9999 }}
                  contentFit="cover"
                />
              ) : (
                <Feather name="user" size={16} color="#64748B" />
              )}
            </View>
            <Text className="text-base font-semibold text-slate-800">
              {authLoading ? "Loading profile..." : userName || "Welcome"}
            </Text>
          </View>
          <Text className="text-xs font-medium text-slate-500 leading-5 pr-4">
            Your centralized hub to organize multi-format tournaments, track detailed match statistics, and manage your local table tennis ecosystem.
          </Text>
        </View>

        {/* --- Quick Actions (Create) --- */}
        <View className="px-6 py-4">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
            Quick Actions
          </Text>
          
          <View className="flex-row justify-between gap-4 mb-3">
            {/* Action 1: Tournament */}
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.quickAction}
              onPress={() => router.push("/tournaments/create")}
            >
              <View className="w-8 h-8 bg-indigo-50 rounded-full items-center justify-center mb-3">
                <Feather name="award" size={14} color="#4F46E5" />
              </View>
              <Text className="text-xs font-bold text-slate-800 mb-0.5">Tournament</Text>
              <Text className="text-[10px] text-slate-500">Organize leagues</Text>
            </TouchableOpacity>

            {/* Action 2: Friendly Match */}
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.quickAction}
              onPress={() => router.push("/match/create")}
            >
              <View className="w-8 h-8 bg-emerald-50 rounded-full items-center justify-center mb-3">
                <Feather name="play" size={14} color="#10B981" />
              </View>
              <Text className="text-xs font-bold text-slate-800 mb-0.5">Quick Match</Text>
              <Text className="text-[10px] text-slate-500">1v1 or Doubles</Text>
            </TouchableOpacity>
          </View>

          {/* Action 3: Team Creation (Full width) */}
          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.quickAction}
            onPress={() => router.push("/team/create")}
          >
            <View className="w-8 h-8 bg-orange-50 rounded-full items-center justify-center mr-3">
              <FontAwesome5 name="users" size={14} color="#F97316" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-800 mb-0.5">Create a Team</Text>
              <Text className="text-[10px] text-slate-500">Manage players & team stats</Text>
            </View>
          </TouchableOpacity>

          {/* Action 4: My Profile (Full width) */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.quickAction, { marginTop: tokens.spacing[4] }]}
            onPress={() => {
              const id = user?._id;
              if (id) {
                router.push(profilePath(id));
              }
            }}
          >
            <View className="w-8 h-8 bg-sky-50 rounded-full items-center justify-center mr-3">
              <FontAwesome5 name="user" size={14} color="#0EA5E9" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-800 mb-0.5">My Profile</Text>
              <Text className="text-[10px] text-slate-500">History, stats, teams, tournaments</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Leaderboards Banner --- */}
        <View style={styles.leaderboardContainer}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.leaderboardAction}
            onPress={() => router.push("/leaderboard")}
          >
            <View style={styles.leaderboardContent}>
              <Text style={styles.leaderboardTitle}>
                Global Rankings
              </Text>
              <Text style={styles.leaderboardSubtitle}>
                Explore the Leaderboards
              </Text>
              <Text style={styles.leaderboardDescription}>
                See who's dominating the tables in your city and worldwide.
              </Text>
            </View>
            <View style={styles.leaderboardIconContainer}>
              <Feather name="bar-chart-2" size={18} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Bonus: Recent Activity --- */}
        <View className="px-6 pt-6">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
            Recent Ecosystem Activity
          </Text>
          
          {/* Sample Activity Card */}
          <View className="bg-white p-4 rounded-2xl shadow-sm shadow-slate-200 border border-slate-200 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-2 h-2 bg-emerald-400 rounded-full mr-3" />
              <View>
                <Text className="text-xs font-bold text-slate-800">Profile synced</Text>
                <Text className="text-[10px] text-slate-500 mt-0.5">
                  Welcome {userName || "back"}, your dashboard is ready.
                </Text>
              </View>
            </View>
            <Text className="text-[10px] font-medium text-slate-400">Now</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}