import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiService } from "../utils/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      await apiService.forgotPassword(email);
      Alert.alert("Success", "Password reset instructions sent to your email");
      router.back();
    } catch (error) {
      Alert.alert(
        "Error",
        (error as Error).message || "Failed to send reset instructions"
      );
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#D2EBDA" }}>
      {/* Header */}
      <View className="bg-green-500 px-6 pt-12 pb-6 rounded-b-3xl">
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">Forgot Password</Text>
        </View>
        <Text className="text-white opacity-80">
          Enter your email address and we'll send you instructions to reset your
          password.
        </Text>
      </View>

      <View className="px-6 -mt-3">
        {/* Form */}
        <View className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-4">
              <Ionicons name="mail" size={32} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              Reset Password
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              We'll send a reset link to your email
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email Address
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-green-500 rounded-lg py-3 mt-6"
            onPress={handleSubmit}
          >
            <Text className="text-white text-center font-semibold">
              Send Reset Instructions
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
