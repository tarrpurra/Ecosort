import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { apiService, UserProfile } from '../utils/api';

export default function RegistrationScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await apiService.getProfile();
        setUserProfile(profile);
        // Pre-populate form with existing data
        if (profile.first_name) setFirstName(profile.first_name);
        if (profile.last_name) setLastName(profile.last_name);
        if (profile.address) setAddress(profile.address);
      } catch (error) {
        console.log('Profile not found or error loading:', error);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await apiService.updateProfile({
        first_name: firstName,
        last_name: lastName,
        address: address,
      });

      Alert.alert('Success', 'Profile completed successfully!');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    const isUpdate = userProfile?.first_name && userProfile?.last_name;
    Alert.alert(
      isUpdate ? 'Skip Update' : 'Skip Registration',
      isUpdate
        ? 'You can update your profile later from the profile page. Continue without changes?'
        : 'You can complete your profile later from the profile page. Continue without registration?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => router.replace('/(tabs)') },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#D2EBDA' }}>
      {/* Header */}
      <View className="bg-green-500 px-6 pt-12 pb-6 rounded-b-3xl">
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">
            {userProfile?.first_name && userProfile?.last_name
              ? 'Update Profile'
              : 'Complete Your Profile'}
          </Text>
        </View>
        <Text className="text-white opacity-80">
          {userProfile?.first_name && userProfile?.last_name
            ? 'Manage your account settings'
            : 'Help us personalize your EcoSort experience'}
        </Text>
      </View>

      <View className="px-6 -mt-3">
        {/* Registration Form */}
        <View className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-4">
              <Ionicons name={userProfile?.first_name && userProfile?.last_name ? "person" : "person-add"} size={32} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {userProfile?.first_name && userProfile?.last_name
                ? 'Update Profile'
                : 'Complete Your Profile'}
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              {userProfile?.first_name && userProfile?.last_name
                ? 'Update your personal information'
                : 'Help us personalize your EcoSort experience'}
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">First Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Enter your first name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Last Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Enter your last name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Address</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Enter your address"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-green-500 rounded-lg py-3 mt-6"
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold">
              {loading ? 'Updating...' : (userProfile?.first_name && userProfile?.last_name ? 'Update Profile' : 'Complete Registration')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4"
            onPress={handleSkip}
          >
            <Text className="text-green-600 text-center font-medium">
              {userProfile?.first_name && userProfile?.last_name ? 'Skip Update' : 'Skip for now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Information */}
        <View className="mb-24 bg-white rounded-xl shadow-lg p-6">
          <Text className="text-gray-600 text-center">
            {userProfile?.first_name && userProfile?.last_name
              ? 'Why update this information?'
              : 'Why do we need this information?'}
          </Text>
          <Text className="text-sm text-gray-500 text-center mt-2">
            {userProfile?.first_name && userProfile?.last_name
              ? 'Keeping your profile up to date helps us provide better recycling guidance and connect you with local recycling centers.'
              : 'Your name and address help us provide personalized recycling guidance and connect you with local recycling centers.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
