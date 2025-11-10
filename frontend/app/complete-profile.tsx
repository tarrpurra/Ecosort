import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { apiService } from '../utils/api';

export default function CompleteProfileScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCompleteProfile = async () => {
    if (!firstName || !lastName || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.completeProfile({
        first_name: firstName,
        last_name: lastName,
        address,
        name: name || `${firstName} ${lastName}`,
      });

      Alert.alert('Success', 'Profile completed successfully!');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          <Text className="text-2xl font-bold text-white">Complete Profile</Text>
        </View>
        <Text className="text-white opacity-80">
          Please complete your profile to continue using EcoSort
        </Text>
      </View>

      <View className="px-6 -mt-3">
        {/* Profile Form */}
        <View className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-4">
              <Ionicons name="person" size={32} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              Complete Your Profile
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              We need some additional information to personalize your experience
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">First Name *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Enter your first name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Last Name *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Enter your last name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Display Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Enter your display name (optional)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Address *</Text>
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
            className={`rounded-lg py-3 mt-6 ${isLoading ? 'bg-gray-400' : 'bg-green-500'}`}
            onPress={handleCompleteProfile}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold">
              {isLoading ? 'Completing Profile...' : 'Complete Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}