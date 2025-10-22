import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const colors = {
  gradientHero: ['#22c55e', '#16a34a'],
  primary: '#22c55e',
  primaryDark: '#16a34a',
  secondary: '#10b981',
  accent: '#059669',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textWhite: '#ffffff',
  border: '#e2e8f0',
  shadow: '#000000',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
};

const Rewards = () => {
  const router = useRouter();

  const userStats = {
    totalPoints: 2340,
    currentLevel: "Eco Warrior",
    nextLevel: "Planet Guardian",
    pointsToNext: 660,
    itemsScanned: 127,
    co2Saved: 15.8,
    streakDays: 12
  };

  const badges = [
    { name: "First Scan", icon: "target", earned: true, color: "text-primary" },
    { name: "Streak Master", icon: "trending-up", earned: true, color: "text-secondary" },
    { name: "Plastic Pro", icon: "award", earned: true, color: "text-accent" },
    { name: "Glass Guardian", icon: "trophy", earned: false, color: "text-muted-foreground" },
    { name: "Metal Master", icon: "star", earned: false, color: "text-muted-foreground" },
    { name: "E-waste Expert", icon: "gift", earned: false, color: "text-muted-foreground" }
  ];

  const leaderboard = [
    { rank: 1, name: "EcoChampion", points: 4250, avatar: "🌟" },
    { rank: 2, name: "GreenThumb", points: 3890, avatar: "🌱" },
    { rank: 3, name: "You", points: 2340, avatar: "🏆" },
    { rank: 4, name: "RecycleKing", points: 2180, avatar: "♻️" },
    { rank: 5, name: "PlanetSaver", points: 1950, avatar: "🌍" }
  ];

  const milestones = [
    { goal: "Scan 150 items", progress: 127, total: 150, reward: "+500 points" },
    { goal: "Save 20kg CO₂", progress: 15.8, total: 20, reward: "Eco Hero badge" },
    { goal: "30-day streak", progress: 12, total: 30, reward: "Premium features" }
  ];

  const ProgressBar = ({ value }: { value: number }) => (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${value}%` }]} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#D2EBDA' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Rewards & Progress</Text>
          </View>
          <Text style={styles.headerSubtitle}>Track your eco-friendly achievements</Text>
        </View>

        <View style={styles.content}>
          {/* Level Progress */}
          <View style={styles.card}>
            <View style={styles.levelContent}>
              <View style={styles.trophyContainer}>
                <Ionicons name="trophy" size={40} color={colors.textWhite} />
              </View>
              <Text style={styles.levelTitle}>{userStats.currentLevel}</Text>
              <Text style={styles.levelSubtitle}>
                {userStats.pointsToNext} points to {userStats.nextLevel}
              </Text>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Level Progress</Text>
                <Text style={styles.progressValue}>
                  {userStats.totalPoints}/{userStats.totalPoints + userStats.pointsToNext}
                </Text>
              </View>
              <ProgressBar value={(userStats.totalPoints / (userStats.totalPoints + userStats.pointsToNext)) * 100} />
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{userStats.totalPoints}</Text>
              <Text style={styles.statLabel}>Eco Points</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="leaf" size={24} color={colors.secondary} />
              <Text style={styles.statValue}>{userStats.co2Saved}kg</Text>
              <Text style={styles.statLabel}>CO₂ Saved</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color={colors.accent} />
              <Text style={styles.statValue}>{userStats.streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.badgesGrid}>
              {badges.map((badge, index) => (
                <View key={index} style={styles.badgeItem}>
                  <View style={[styles.badgeIcon, { backgroundColor: badge.earned ? colors.primary + '20' : colors.muted }]}>
                    <Ionicons name={badge.icon as any} size={24} color={badge.earned ? colors.primary : colors.mutedForeground} />
                  </View>
                  <Text style={[styles.badgeName, { color: badge.earned ? colors.text : colors.mutedForeground }]}>
                    {badge.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Milestones */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Current Goals</Text>
            <View style={styles.milestonesContainer}>
              {milestones.map((milestone, index) => (
                <View key={index} style={styles.milestoneItem}>
                  <View style={styles.milestoneHeader}>
                    <Text style={styles.milestoneGoal}>{milestone.goal}</Text>
                    <Text style={styles.milestoneReward}>{milestone.reward}</Text>
                  </View>
                  <View style={styles.milestoneProgress}>
                    <Text style={styles.milestoneProgressText}>
                      {milestone.progress} / {milestone.total}
                    </Text>
                    <Text style={styles.milestoneProgressPercent}>
                      {Math.round((milestone.progress / milestone.total) * 100)}%
                    </Text>
                  </View>
                  <ProgressBar value={(milestone.progress / milestone.total) * 100} />
                </View>
              ))}
            </View>
          </View>

          {/* Leaderboard */}
          <View style={[styles.card, styles.lastCard]}>
            <Text style={styles.sectionTitle}>Community Leaderboard</Text>
            <View style={styles.leaderboardContainer}>
              {leaderboard.map((user, index) => (
                <View key={index} style={[styles.leaderboardItem, user.name === "You" && styles.currentUser]}>
                  <View style={styles.userInfo}>
                    <View style={[styles.rankBadge, user.rank <= 3 && styles.topRank]}>
                      {user.rank <= 3 ? <Text style={styles.rankEmoji}>{user.avatar}</Text> : <Text style={styles.rankNumber}>{user.rank}</Text>}
                    </View>
                    <Text style={[styles.userName, user.name === "You" && styles.currentUserName]}>
                      {user.name}
                    </Text>
                  </View>
                  <Text style={styles.userPoints}>{user.points} pts</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textWhite,
    opacity: 0.9,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  levelContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trophyContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  levelSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  progressValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.muted,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    alignItems: 'center',
    width: (width - 80) / 3,
    marginBottom: 16,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
  },
  milestonesContainer: {
    gap: 16,
  },
  milestoneItem: {
    gap: 8,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneGoal: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  milestoneReward: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  milestoneProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneProgressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  milestoneProgressPercent: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  lastCard: {
    marginBottom: 100,
  },
  leaderboardContainer: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.muted + '20',
  },
  currentUser: {
    backgroundColor: colors.primary + '20',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  topRank: {
    backgroundColor: colors.primary,
  },
  rankEmoji: {
    fontSize: 16,
  },
  rankNumber: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  currentUserName: {
    color: colors.primary,
  },
  userPoints: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default Rewards;