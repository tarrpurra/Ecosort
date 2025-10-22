import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname,Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

const CustomTabBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: 'index', label: 'Home', icon: 'home', route: '/(tabs)' as any },
    { name: 'guide', label: 'Guide', icon: 'book', route: '/guide' as any },
    { name: 'scan', label: 'Scan', icon: 'camera', route: '/scan' as any, isCenter: true },
    { name: 'reward', label: 'Reward', icon: 'trophy', route: '/reward' as any },
    { name: 'profile', label: 'Profile', icon: 'person', route: '/profile' as any },
  ];

  const isActive = (route: string) => {
    if (route === '/' && pathname === '/') return true;
    return pathname === route;
  };

  return (
    <View style={styles.container}>
      {/* Left tabs */}
      <View style={styles.sideContainer}>
        {tabs.slice(0, 2).map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tab, isActive(tab.route) && styles.activeTab]}
            onPress={() => router.push(tab.route as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={isActive(tab.route) ? '#22c55e' : '#64748b'}
            />
            <Text style={[styles.label, isActive(tab.route) && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Center scan button */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => router.push('/scan' as any)}
      >
        <View style={styles.centerButtonInner}>
          <Ionicons name="camera" size={28} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* Right tabs */}
      <View style={styles.sideContainer}>
        {tabs.slice(3).map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tab, isActive(tab.route) && styles.activeTab]}
            onPress={() => router.push(tab.route as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={isActive(tab.route) ? '#22c55e' : '#64748b'}
            />
            <Text style={[styles.label, isActive(tab.route) && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default tab bar
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="scan" />
        <Tabs.Screen name="guide" />
        <Tabs.Screen name="reward" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <CustomTabBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sideContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#f0fdf4',
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#22c55e',
  },
  centerButton: {
    marginHorizontal: 20,
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
