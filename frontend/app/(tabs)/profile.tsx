import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiService, UserProfile, ProfileStatusResponse } from "../../utils/api";
import { useAuth } from "../../context/auth-context";

const Profile = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationTracking, setLocationTracking] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileStatusResponse | null>(null);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [completingProfile, setCompletingProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await apiService.getProfile();
        setUserProfile(profile);

        // Check profile completion status
        try {
          const status = await apiService.checkProfileStatus();
          setProfileStatus(status);
          setShowCompletionForm(!status.profile_complete);

          // Pre-fill form with existing data if available
          if (profile.first_name) setFirstName(profile.first_name);
          if (profile.last_name) setLastName(profile.last_name);
          if (profile.address) setAddress(profile.address);
          if (profile.name) setName(profile.name);
        } catch (statusError) {
          console.log("Profile status check failed:", statusError);
          // Default to showing completion form if status check fails
          setShowCompletionForm(true);
        }
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
        setShowCompletionForm(true);
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
      action: () => router.push('/registration'),
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

  const handleCompleteProfile = async () => {
    if (!firstName || !lastName || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setCompletingProfile(true);
    try {
      const response = await apiService.completeProfile({
        first_name: firstName,
        last_name: lastName,
        address,
        name: name || `${firstName} ${lastName}`,
      });

      // Update local state
      setUserProfile(response.user);
      setProfileStatus({ profile_complete: true, missing_fields: [] });
      setShowCompletionForm(false);

      Alert.alert('Success', 'Profile completed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete profile. Please try again.');
    } finally {
      setCompletingProfile(false);
    }
  };

  const ProgressBar = ({ value }: { value: number }) => (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${value}%` }]} />
    </View>
  );

  // Show profile completion form if profile is incomplete
  if (showCompletionForm && profileStatus) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: "#D2EBDA" }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="bg-green-500 px-6 pt-12 pb-6 rounded-b-3xl">
          <View className="flex-row items-center gap-4 mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white">Complete Profile</Text>
          </View>
          <Text className="text-white opacity-80">
            Please complete your profile to continue using EcoSort
          </Text>
        </View>

        <View className="px-6 -mt-3">
          {/* Profile Completion Form */}
          <View className="mb-6 bg-white rounded-xl shadow-lg p-6">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-4">
                <Ionicons name="person" size={32} color="white" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                📝 Profile Update Required
              </Text>
              <Text className="text-sm text-red-600 text-center font-medium">
                Please fill in all required fields to continue
              </Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-sm font-bold text-red-600 mb-2">First Name *</Text>
                <TextInput
                  className={`border-2 rounded-lg px-4 py-3 ${!firstName ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}
                  placeholder="Enter your first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>

              <View>
                <Text className="text-sm font-bold text-red-600 mb-2">Last Name *</Text>
                <TextInput
                  className={`border-2 rounded-lg px-4 py-3 ${!lastName ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}
                  placeholder="Enter your last name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Display Name (Optional)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  placeholder="Enter your display name (optional)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View>
                <Text className="text-sm font-bold text-red-600 mb-2">Address *</Text>
                <TextInput
                  className={`border-2 rounded-lg px-4 py-3 ${!address ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}
                  placeholder="Enter your full address"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TouchableOpacity
              className={`rounded-lg py-3 mt-6 ${completingProfile ? 'bg-gray-400' : 'bg-green-500'}`}
              onPress={handleCompleteProfile}
              disabled={completingProfile}
            >
              <Text className="text-white text-center font-bold text-lg">
                {completingProfile ? 'Updating Profile...' : '✅ Complete Profile Update'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#D2EBDA" }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
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
          {profileStatus && !profileStatus.profile_complete && (
            <View className="bg-red-500 px-3 py-1 rounded-full ml-auto">
              <Text className="text-white text-sm font-bold">UPDATE REQUIRED</Text>
            </View>
          )}
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
                {userProfile.first_name && userProfile.last_name
                  ? `${userProfile.first_name} ${userProfile.last_name}`
                  : userProfile.name}
              </Text>
              <Text className="text-sm text-gray-500">{userProfile.email}</Text>
              {userProfile.address && (
                <Text className="text-xs text-gray-500">{userProfile.address}</Text>
              )}
              <Text className="text-xs text-gray-500">
                Member since{" "}
                {new Date(userProfile.created_at).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              className="p-2 border border-green-300 rounded-xl"
              onPress={() => setShowCompletionForm(true)}
            >
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

        {/* Profile Completion Prompt - Made More Prominent */}
        {profileStatus && !profileStatus.profile_complete && (
          <View className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl shadow-lg p-6">
            <View className="flex-row items-center gap-3 mb-3">
              <Ionicons name="alert-circle" size={28} color="#dc2626" />
              <Text className="text-xl font-bold text-red-800">
                ⚠️ Profile Update Required
              </Text>
            </View>
            <Text className="text-red-700 mb-2 text-base">
              Please complete your profile to continue using EcoSort effectively.
            </Text>
            <Text className="text-red-600 mb-4 text-sm">
              • Add your first and last name{"\n"}
              • Provide your address for location-based features{"\n"}
              • Personalize your EcoSort experience
            </Text>
            <TouchableOpacity
              className="bg-red-500 rounded-lg py-4"
              onPress={() => setShowCompletionForm(true)}
            >
              <Text className="text-white text-center font-bold text-lg">
                Update Profile Now
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
            <View className="border-t border-gray-200 pt-4 pb-2">
              <TouchableOpacity
                className="flex-row items-center justify-between p-2"
                onPress={() => {
                  Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Sign Out",
                      style: "destructive",
                      onPress: async () => {
                        await logout();
                        // Navigation will be handled by AuthGate
                      },
                    },
                  ]);
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="log-out" className="mr-3 h-5 w-5 text-red-500" />
                  <View>
                    <Text className="text-red-500 font-medium">Sign Out</Text>
                    <Text className="text-sm text-gray-500">End your current session</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" className="h-5 w-5 text-gray-400" />
              </TouchableOpacity>
            </View>
          </View>
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
