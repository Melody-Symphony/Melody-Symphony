import { Stack } from "expo-router";
import { AudioProvider } from "@/components/AudioContext";

export default function RootLayout() {
  return (
    <AudioProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="playlist/[id]" options={{ title: "Playlist" }} />
        <Stack.Screen
          name="playlist/add-tracks"
          options={{ title: "Add Tracks" }}
        />
        <Stack.Screen
          name="player"
          options={{ title: "Now Playing", headerShown: false }}
        />
      </Stack>
    </AudioProvider>
  );
}
