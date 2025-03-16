import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import MiniPlayer from "../../components/MiniPlayer"
import { useAudioPlayer } from "../../hooks/useAudioPlayer"

export default function TabLayout() {
  const { currentTrack, isPlaying, playbackPosition, playbackDuration, pauseTrack, resumeTrack } = useAudioPlayer()

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
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
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
        />
      )}
    </>
  )
}

