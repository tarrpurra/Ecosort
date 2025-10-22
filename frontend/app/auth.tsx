import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { apiService } from '../utils/api'

export default function AuthScreen() {
  const { mode } = useLocalSearchParams();
  const [isLogin, setIsLogin] = useState(mode === 'signup' ? false : true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      let response;
      if (isLogin) {
        response = await apiService.login({ email, password });
      } else {
        response = await apiService.signup({ email, password, name: email.split('@')[0] }); // Simple name extraction
      }

      // Store token
      apiService.setToken(response.access_token);

      Alert.alert('Success', isLogin ? 'Logged in successfully' : 'Account created successfully');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', error.message || 'Authentication failed');
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
          <Text className="text-2xl font-bold text-white">Authentication</Text>
        </View>
        <Text className="text-white opacity-80">
          {isLogin ? 'Welcome back! Please sign in to continue.' : 'Join EcoSort and start making a difference!'}
        </Text>
      </View>

      <View className="px-6 -mt-3">
        {/* Auth Form */}
        <View className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-4">
              <Ionicons name={isLogin ? "log-in" : "person-add"} size={32} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {isLogin ? 'Login' : 'Sign Up'}
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              {isLogin ? 'Enter your credentials to access your account' : 'Create your account to get started'}
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {!isLogin && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Confirm Password</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            className="bg-green-500 rounded-lg py-3 mt-6"
            onPress={handleSubmit}
          >
            <Text className="text-white text-center font-semibold">
              {isLogin ? 'Login' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity
              className="mt-4"
              onPress={() => router.push('/forgot-password' as any)}
            >
              <Text className="text-green-600 text-center font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Toggle */}
        <View className="mb-24 bg-white rounded-xl shadow-lg p-6">
          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            className="items-center"
          >
            <Text className="text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <Text className="text-green-600 font-semibold mt-1">
              {isLogin ? 'Sign Up' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}