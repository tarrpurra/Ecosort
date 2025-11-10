import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { apiService } from '../../utils/api';

const { width } = Dimensions.get('window');

const colors = {
  gradientHero: ['#22c55e', '#16a34a'], // green gradients
  primary: '#22c55e',
  primaryDark: '#16a34a',
  secondary: '#10b981',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textWhite: '#ffffff',
  border: '#e2e8f0',
  shadow: '#000000',
};

const Home = () => {
  const router = useRouter();
  const [currentTip] = useState(0);

  const ecoTips = [
    "💡 Rinse containers before recycling to prevent contamination",
    "🌱 Composting reduces methane emissions by 25%",
    "♻️ One recycled aluminum can saves enough energy to power a TV for 3 hours",
    "🌍 You've helped save 2.3kg of plastic this month!"
  ];

  const stats = [
    { label: "Items Scanned", value: "127", icon: "camera" },
    { label: "CO₂ Saved", value: "15kg", icon: "leaf" },
    { label: "Eco Points", value: "2,340", icon: "trophy" },
    { label: "Streak Days", value: "12", icon: "refresh" }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#D2EBDA' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={[styles.header, { backgroundColor: colors.primary }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Hello, Eco Hero! 🌿</Text>
              <Text style={styles.headerSubtitle}>Ready to make a difference today?</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="leaf" size={24} color={colors.textWhite} />
            </View>
          </View>

          {/* Eco Tips Carousel */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsText}>
              {ecoTips[currentTip]}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Scan Button */}
          <View style={styles.scanCard}>
            <TouchableOpacity
              onPress={() => router.push('/scan')}
              style={styles.scanButton}
            >
              <View
                style={[styles.scanButtonGradient, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="camera" size={24} color={colors.textWhite} />
                <Text style={styles.scanButtonText}>Scan Item</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.scanDescription}>
              Point your camera at any item to get instant recycling guidance
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Ionicons name={stat.icon as any} size={24} color={colors.primary} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              onPress={() => router.push('/guide')}
              style={styles.actionButton}
            >
              <Ionicons name="book" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Guide</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/guide')}
              style={styles.actionButton}
            >
              <Ionicons name="location" size={20} color={colors.secondary} />
              <Text style={styles.actionButtonText}>Centers</Text>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textWhite,
    opacity: 0.9,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  tipsText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -12,
  },
  scanCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButton: {
    width: '100%',
    marginBottom: 16,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  scanButtonText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '600',
  },
  scanDescription: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 52) / 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 100,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default Home;
