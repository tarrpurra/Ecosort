import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useRouter, usePathname, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

const tabs = [
  { name: "index", label: "Home", icon: "home-outline", route: "/" },
  { name: "guide", label: "Guide", icon: "reader-outline", route: "/guide" },
  { name: "scan", label: "Scan", icon: "scan-circle", route: "/scan", isCenter: true },
  { name: "reward", label: "Rewards", icon: "gift-outline", route: "/reward" },
  { name: "profile", label: "Profile", icon: "person-circle-outline", route: "/profile" },
];


const CustomTabBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Debug: Log pathname to console
  console.log("Current pathname:", pathname);

  // Hide tab bar on scan page
  if (pathname.includes("scan")) {
    return null;
  }

  const isActive = (tabRoute: string, tabName: string) => {
    const cleanedPath = pathname.replace(/\/$/, "");
    if (tabName === "index") {
      return cleanedPath === "/(tabs)" || cleanedPath === "/(tabs)/index";
    }
    return cleanedPath === `/(tabs)${tabRoute}`;
  };

  return (
    <View className="absolute left-0 right-0 bottom-0 items-center" style={{ bottom: insets.bottom }}>
      <View className="flex-row items-center justify-between rounded-none px-5 py-1.5 w-full shadow-2xl border border-green-400" style={{ backgroundColor: "rgba(3, 31, 16, 0.96)" }}>
        <View className="flex-1 flex-row items-center justify-evenly">
          {tabs
            .filter((tab) => !tab.isCenter && ["index", "guide"].includes(tab.name))
            .map((tab) => {
              const active = isActive(tab.route, tab.name);
              return (
                <TouchableOpacity
                  key={tab.name}
                  activeOpacity={0.8}
                  className={`items-center justify-center px-2.5 py-1 rounded-2xl flex-grow min-w-0 ${active ? 'border border-green-500 shadow-lg' : ''}`}
                  style={active ? { backgroundColor: "rgba(34, 197, 94, 0.15)" } : undefined}
                  onPress={() => router.push(tab.route as any)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={22}
                    color={active ? "#22c55e" : "#e2e8f0"}
                  />
                  <Text className={`text-xs mt-0.5 font-semibold ${active ? 'text-green-500' : 'text-slate-200/70'}`}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="mx-3"
          onPress={() => router.push("scan" as any)}
        >
          <View className="w-20 h-20 rounded-full bg-green-500 items-center justify-center shadow-2xl">
            <Ionicons name="scan" size={32} color="#032814" />
          </View>
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center justify-evenly">
          {tabs
            .filter((tab) => !tab.isCenter && ["reward", "profile"].includes(tab.name))
            .map((tab) => {
              const active = isActive(tab.route, tab.name);
              return (
                <TouchableOpacity
                  key={tab.name}
                  activeOpacity={0.8}
                  className={`items-center justify-center px-2.5 py-1 rounded-2xl flex-grow min-w-0 ${active ? 'border border-green-500 shadow-lg' : ''}`}
                  style={active ? { backgroundColor: "rgba(34, 197, 94, 0.15)" } : undefined}
                  onPress={() => router.push(tab.route as any)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={22}
                    color={active ? "#22c55e" : "#e2e8f0"}
                  />
                  <Text className={`text-xs mt-0.5 font-semibold ${active ? 'text-green-500' : 'text-slate-200/70'}`}>{tab.label}</Text>
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
};