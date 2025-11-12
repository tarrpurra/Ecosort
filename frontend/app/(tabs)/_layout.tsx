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

const accentColor = "#2dd36f";

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
                    color={active ? accentColor : "rgba(226,232,240,0.7)"}
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
            <Ionicons name="scan" size={32} color="#032814" />
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
                    color={active ? accentColor : "rgba(226,232,240,0.7)"}
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
  const pathname = usePathname();

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
      {pathname !== "/scan" && <CustomTabBar />}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(3, 31, 16, 0.96)",
    borderRadius: 36,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: "94%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: "rgba(36, 181, 101, 0.25)",
  },
  sideContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    flexGrow: 1,
    minWidth: 0,
  },
  activeTab: {
    backgroundColor: "rgba(45, 211, 111, 0.22)",
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    color: "rgba(226,232,240,0.7)",
    fontWeight: "600",
  },
  activeLabel: {
    color: accentColor,
  },
  centerButton: {
    marginHorizontal: 12,
  },
  centerButtonInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: accentColor,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 22,
  },
});
