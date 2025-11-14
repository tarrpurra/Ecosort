import React from 'react';
import { Stack } from 'expo-router';

const GuideLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="centers"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
};

export default GuideLayout;
