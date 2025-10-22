import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiService,UserProfile } from "../../utils/api";

const Profile = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationTracking, setLocationTracking] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await apiService.getProfile();
        setUserProfile(profile);
      } catch (error) {
        Alert.alert("Error", "Failed to load profile");
        // Fallback to mock data
        setUserProfile({
          id: 1,
          name: "Eco Warrior",
          email: "eco.warrior@example.com",
          total_scans: 127,
          co2_saved: 15.8,
          level: "Eco Warrior",
          created_at: new Date().toISOString(),
        } as UserProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading || !userProfile) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#D2EBDA",
        }}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  const menuItems = [
    {
      iconName: "create",
      title: "Edit Profile",
      subtitle: "Update your personal information",
      action: () => console.log("Edit profile"),
    },
    {
      iconName: "notifications",
      title: "Notifications",
      subtitle: "Manage your notification preferences",
      toggle: true,
      value: notifications,
      onChange: setNotifications,
    },
    {
      iconName: "trophy",
      title: "Achievements",
      subtitle: "View your eco-friendly badges",
      action: () => router.push("/reward"),
    },
    {
      iconName: "stats-chart",
      title: "Statistics",
      subtitle: "Detailed impact analytics",
      action: () => console.log("View stats"),
    },
    {
      iconName: "shield",
      title: "Privacy & Security",
      subtitle: "Control your data and privacy settings",
      action: () => console.log("Privacy settings"),
    },
    {
      iconName: "settings",
      title: "App Settings",
      subtitle: "Customize your app experience",
      action: () => console.log("App settings"),
    },
    {
      iconName: "help-circle",
      title: "Help & Support",
      subtitle: "Get help and contact support",
      action: () => console.log("Help & support"),
    },
    {
      iconName: "share",
      title: "Share EcoSort",
      subtitle: "Invite friends to join the movement",
      action: () => console.log("Share app"),
    },
  ];

  const ProgressBar = ({ value }: { value: number }) => (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${value}%` }]} />
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#D2EBDA" }}>
      {/* Header */}
      <View className="bg-green-500 px-6 pt-12 pb-6 rounded-b-3xl">
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full"
          >
            <Ionicons name="arrow-back" className="h-6 w-6 text-white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">Profile</Text>
        </View>
        <Text className="text-white opacity-80">
          Manage your account and preferences
        </Text>
      </View>

      <View className="px-6 -mt-3">
        {/* Profile Info */}
        <View className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center">
              <Ionicons name="person" className="h-8 w-8 text-white" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {userProfile.name}
              </Text>
              <Text className="text-sm text-gray-500">{userProfile.email}</Text>
              <Text className="text-xs text-gray-500">
                Member since{" "}
                {new Date(userProfile.created_at).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity className="p-2 border border-green-300 rounded-xl">
              <Ionicons name="create" className="h-4 w-4 text-green-500" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-900">
                {userProfile.total_scans}
              </Text>
              <Text className="text-xs text-gray-500">Items Scanned</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-900">
                {userProfile.co2_saved}kg
              </Text>
              <Text className="text-xs text-gray-500">CO₂ Saved</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-900">
                {userProfile.level}
              </Text>
              <Text className="text-xs text-gray-500">Current Level</Text>
            </View>
          </View>

          {/* Level */}
          <View className="mt-4">
            <Text className="text-sm font-medium text-gray-900 text-center">
              Current Level: {userProfile.level}
            </Text>
          </View>
        </View>

        {/* Progress Card */}
        <View className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <View className="items-center">
            <Text className="font-semibold text-gray-900 mb-2">
              Your Impact This Month
            </Text>
            <View className="bg-green-100 rounded-xl p-4 w-full items-center">
              <Text className="text-2xl font-bold text-green-600 mb-1">
                🌱 +127 items
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                You've helped prevent {userProfile.co2_saved}kg of CO₂
                emissions!
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Menu */}
        <View className="space-y-3 mb-6">
          {menuItems.map((item, index) => (
            <View key={index} className="bg-white rounded-xl shadow-lg p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center">
                    <Ionicons
                      name={item.iconName as any}
                      className="h-5 w-5 text-green-500"
                    />
                  </View>
                  <View>
                    <Text className="font-medium text-gray-900">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
                {item.toggle ? (
                  <Switch value={item.value} onValueChange={item.onChange} />
                ) : (
                  <TouchableOpacity onPress={item.action} className="p-2">
                    <Text className="text-gray-500 text-lg">→</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Quick Settings */}
        <View className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <Text className="font-semibold text-gray-900 mb-4">
            Quick Settings
          </Text>
          <View className="space-y-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-medium text-gray-900">Dark Mode</Text>
                <Text className="text-sm text-gray-500">
                  Switch to dark theme
                </Text>
              </View>
              <Switch value={darkMode} onValueChange={setDarkMode} />
            </View>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-medium text-gray-900">
                  Location Services
                </Text>
                <Text className="text-sm text-gray-500">
                  Find nearby recycling centers
                </Text>
              </View>
              <Switch
                value={locationTracking}
                onValueChange={setLocationTracking}
              />
            </View>
          </View>
        </View>

        {/* Logout */}
        <View className="mb-24 bg-white rounded-xl shadow-lg p-4">
          <TouchableOpacity
            className="flex-row items-center p-2"
            onPress={() => {
              Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sign Out",
                  style: "destructive",
                  onPress: () => router.push("/auth?mode=signup" as any),
                },
              ]);
            }}
          >
            <Ionicons name="log-out" className="mr-3 h-5 w-5 text-red-500" />
            <Text className="text-red-500 font-medium">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 4,
  },
});

export default Profile;
