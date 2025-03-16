import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import MiniPlayer from "../../components/MiniPlayer"
import { useAudioPlayer } from "../../hooks/useAudioPlayer"

export default function TabLayout() {
  const { currentTrack, isPlaying, playbackPosition, playbackDuration, pauseTrack, resumeTrack, isLoading } =
    useAudioPlayer()

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack()
    } else {
      resumeTrack()
    }
  }

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#6200ee",
          tabBarStyle: {
            height: 50,
            paddingBottom: 5,
          },
          headerStyle: {
            backgroundColor: "#6200ee",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Library",
            tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="player"
          options={{
            title: "Now Playing",
            tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes-outline" size={size} color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: "Playlists",
            tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
          }}
        />
      </Tabs>

      {currentTrack && (
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          playbackPosition={playbackPosition}
          playbackDuration={playbackDuration}
          isLoading={isLoading}
        />
      )}
    </>
  )
}

