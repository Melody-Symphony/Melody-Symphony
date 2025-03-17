"use client";

import { Stack } from "expo-router";
import { AudioProvider } from "@/components/AudioContext";
import { useEffect } from "react";
import {
  setupNotificationChannels,
  requestNotificationPermissions,
} from "@/services/notification-service";

export default function RootLayout() {
  useEffect(() => {
    // Set up notification channels when the app starts
    setupNotificationChannels();
    requestNotificationPermissions();
  }, []);

  return (
    <AudioProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="playlist" />
      </Stack>
    </AudioProvider>
  );
}
