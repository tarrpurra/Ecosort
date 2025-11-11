import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter, usePathname, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const tabs = [
  { name: "index", label: "Home", icon: "home-outline", route: "/(tabs)" },
  { name: "guide", label: "Guide", icon: "reader-outline", route: "/(tabs)/guide" },
  { name: "scan", label: "Scan", icon: "scan-circle", route: "/(tabs)/scan", isCenter: true },
  { name: "reward", label: "Rewards", icon: "gift-outline", route: "/(tabs)/reward" },
  { name: "profile", label: "Profile", icon: "person-circle-outline", route: "/(tabs)/profile" },
];

const CustomTabBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (tabRoute: string, tabName: string) => {
    const cleanedPath = pathname.replace(/\/$/, "");
    const cleanedRoute = tabRoute.replace(/\/$/, "");

    if (tabName === "index") {
      return cleanedPath === "" || cleanedPath === "/" || cleanedPath === cleanedRoute;
    }

    return cleanedPath.startsWith(cleanedRoute);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.sideContainer}>
          {tabs
            .filter((tab) => !tab.isCenter && ["index", "guide"].includes(tab.name))
            .map((tab) => {
              const active = isActive(tab.route, tab.name);
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={[styles.tab, active && styles.activeTab]}
                  onPress={() => router.push(tab.route as any)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={22}
                    color={active ? "#22c55e" : "rgba(226,232,240,0.7)"}
                  />
                  <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
        </View>

        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => router.push("/(tabs)/scan" as any)}
        >
          <View style={styles.centerButtonInner}>
            <Ionicons name="scan" size={32} color="#0f172a" />
          </View>
        </TouchableOpacity>

        <View style={styles.sideContainer}>
          {tabs
            .filter((tab) => !tab.isCenter && ["reward", "profile"].includes(tab.name))
            .map((tab) => {
              const active = isActive(tab.route, tab.name);
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={[styles.tab, active && styles.activeTab]}
                  onPress={() => router.push(tab.route as any)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={22}
                    color={active ? "#22c55e" : "rgba(226,232,240,0.7)"}
                  />
                  <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
        </View>
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
          tabBarStyle: { display: "none" },
        }}
      >
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
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(2,6,23,0.9)",
    borderRadius: 32,
    paddingHorizontal: 22,
    paddingVertical: 14,
    width: "92%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
  },
  sideContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 70,
  },
  activeTab: {
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    color: "rgba(226,232,240,0.7)",
    fontWeight: "600",
  },
  activeLabel: {
    color: "#22c55e",
  },
  centerButton: {
    marginHorizontal: 12,
  },
  centerButtonInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
});
