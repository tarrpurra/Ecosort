import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { apiService } from '../../utils/api';

interface UserStats {
  totalPoints: number;
  currentLevel: string;
  nextLevel: string | null;
  pointsToNext: number;
  itemsScanned: number;
  co2Saved: number;
  streakDays: number;
}

interface Badge {
  name: string;
  icon: string;
  earned: boolean;
  color: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  avatar: string;
}

interface Milestone {
  goal: string;
  progress: number;
  total: number;
  reward: string;
}

const Rewards = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    currentLevel: "Beginner",
    nextLevel: "Recycle Rookie",
    pointsToNext: 50,
    itemsScanned: 0,
    co2Saved: 0,
    streakDays: 0
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    const fetchRewardsData = async () => {
      try {
        // Ensure token is initialized
        await apiService.initializeToken();

        // Fetch data sequentially to avoid overwhelming the server
        const stats = await apiService.getRewardsStats();
        const badgesData = await apiService.getUserBadges();
        const leaderboardData = await apiService.getLeaderboard();
        const milestonesData = await apiService.getMilestones();

        setUserStats({
          totalPoints: stats.total_points,
          currentLevel: stats.current_level,
          nextLevel: stats.next_level || null,
          pointsToNext: stats.points_to_next,
          itemsScanned: stats.items_scanned,
          co2Saved: stats.co2_saved,
          streakDays: stats.streak_days
        });

        setBadges(badgesData.map(badge => ({
          name: badge.name,
          icon: badge.name === "First Scan" ? "target" :
                badge.name === "Streak Master" ? "trending-up" :
                badge.name === "Plastic Pro" ? "award" :
                badge.name === "Glass Guardian" ? "trophy" :
                badge.name === "Metal Master" ? "star" : "gift",
          earned: badge.earned,
          color: badge.earned ? "text-primary" : "text-muted-foreground"
        })));

        setLeaderboard(leaderboardData);
        setMilestones(milestonesData);
      } catch (error) {
        console.error('Failed to fetch rewards data:', error);
        // Set fallback data if API fails
        setUserStats({
          totalPoints: 0,
          currentLevel: "Beginner",
          nextLevel: "Recycle Rookie",
          pointsToNext: 50,
          itemsScanned: 0,
          co2Saved: 0,
          streakDays: 0
        });
        // Fallback badges
        setBadges([
          { name: "First Scan", icon: "target", earned: false, color: "text-muted-foreground" },
          { name: "Streak Master", icon: "trending-up", earned: false, color: "text-muted-foreground" },
          { name: "Plastic Pro", icon: "award", earned: false, color: "text-muted-foreground" },
          { name: "Glass Guardian", icon: "trophy", earned: false, color: "text-muted-foreground" },
          { name: "Metal Master", icon: "star", earned: false, color: "text-muted-foreground" },
          { name: "E-waste Expert", icon: "gift", earned: false, color: "text-muted-foreground" }
        ].map(badge => ({
          name: badge.name,
          icon: badge.icon as any,
          earned: badge.earned,
          color: badge.color
        })));
        setLeaderboard([]);
        // Fallback milestones
        setMilestones([
          { goal: "Scan 150 items", progress: 0, total: 150, reward: "+500 points" },
          { goal: "Save 20kg CO₂", progress: 0, total: 20, reward: "Eco Hero badge" },
          { goal: "30-day streak", progress: 0, total: 30, reward: "Premium features" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRewardsData();
  }, []);

  const ProgressBar = ({ value }: { value: number }) => (
    <View className="h-3 bg-slate-200 rounded-lg overflow-hidden">
      <View className="h-full bg-green-500 rounded-lg" style={{ width: `${value}%` }} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-green-50 justify-center items-center">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-4 text-slate-900">Loading rewards...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-green-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="bg-green-500 px-5 py-6 rounded-b-3xl">
          <View className="flex-row items-center mb-5">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 rounded-2xl"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white">Rewards & Progress</Text>
          </View>
          <Text className="text-white opacity-90">Track your eco-friendly achievements</Text>
        </View>

        <View className="px-5 -mt-3">
          {/* Level Progress */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-lg">
            <View className="items-center mb-5">
              <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-4">
                <Ionicons name="trophy" size={40} color="white" />
              </View>
              <Text className="text-2xl font-bold text-slate-900 mb-1">{userStats.currentLevel}</Text>
              <Text className="text-sm text-slate-500 text-center">
                {userStats.pointsToNext} points to {userStats.nextLevel}
              </Text>
            </View>

            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-medium text-slate-900">Level Progress</Text>
                <Text className="text-xs text-slate-500">
                  {userStats.totalPoints}/{userStats.totalPoints + userStats.pointsToNext}
                </Text>
              </View>
              <ProgressBar value={(userStats.totalPoints / (userStats.totalPoints + userStats.pointsToNext)) * 100} />
            </View>
          </View>

          {/* Stats Cards */}
          <View className="flex-row justify-between mb-4">
            <View className="bg-white rounded-xl p-4 items-center w-1/3 shadow-md">
              <Ionicons name="trophy" size={24} color="#22c55e" />
              <Text className="text-lg font-bold text-slate-900 mt-2">{userStats.totalPoints}</Text>
              <Text className="text-xs text-slate-500 mt-1">Eco Points</Text>
            </View>
            <View className="bg-white rounded-xl p-4 items-center w-1/3 shadow-md">
              <Ionicons name="leaf" size={24} color="#10b981" />
              <Text className="text-lg font-bold text-slate-900 mt-2">{userStats.co2Saved}kg</Text>
              <Text className="text-xs text-slate-500 mt-1">CO₂ Saved</Text>
            </View>
            <View className="bg-white rounded-xl p-4 items-center w-1/3 shadow-md">
              <Ionicons name="flame" size={24} color="#059669" />
              <Text className="text-lg font-bold text-slate-900 mt-2">{userStats.streakDays}</Text>
              <Text className="text-xs text-slate-500 mt-1">Day Streak</Text>
            </View>
          </View>

          {/* Badges */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-lg">
            <Text className="text-lg font-semibold text-slate-900 mb-4">Achievements</Text>
            <View className="flex-row flex-wrap justify-between">
              {badges.map((badge, index) => (
                <View key={index} className="items-center w-1/3 mb-4">
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-2 ${badge.earned ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <Ionicons name={badge.icon as any} size={24} color={badge.earned ? '#22c55e' : '#64748b'} />
                  </View>
                  <Text className={`text-xs text-center ${badge.earned ? 'text-slate-900' : 'text-slate-400'}`}>
                    {badge.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Milestones */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-lg">
            <Text className="text-lg font-semibold text-slate-900 mb-4">Current Goals</Text>
            <View style={{ gap: 16 }}>
              {milestones.map((milestone, index) => (
                <View key={index} style={{ gap: 8 }}>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-medium text-slate-900 flex-1">{milestone.goal}</Text>
                    <Text className="text-xs text-green-600 font-medium">{milestone.reward}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-slate-500">
                      {milestone.progress} / {milestone.total}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {Math.round((milestone.progress / milestone.total) * 100)}%
                    </Text>
                  </View>
                  <ProgressBar value={(milestone.progress / milestone.total) * 100} />
                </View>
              ))}
            </View>
          </View>

          {/* Leaderboard */}
          <View className="bg-white rounded-2xl p-5 mb-24 shadow-lg">
            <Text className="text-lg font-semibold text-slate-900 mb-4">Community Leaderboard</Text>
            <View style={{ gap: 12 }}>
              {leaderboard.map((user, index) => (
                <View key={index} className={`flex-row items-center justify-between p-3 rounded-xl ${user.name === "You" ? 'bg-green-50' : 'bg-slate-50'}`}>
                  <View className="flex-row items-center gap-3">
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${user.rank <= 3 ? 'bg-green-500' : 'bg-slate-400'}`}>
                      {user.rank <= 3 ? <Text className="text-sm">{user.avatar}</Text> : <Text className="text-sm text-slate-100 font-medium">{user.rank}</Text>}
                    </View>
                    <Text className={`text-base font-medium ${user.name === "You" ? 'text-green-600' : 'text-slate-900'}`}>
                      {user.name}
                    </Text>
                  </View>
                  <Text className="text-sm text-slate-500 font-medium">{user.points} pts</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Rewards;