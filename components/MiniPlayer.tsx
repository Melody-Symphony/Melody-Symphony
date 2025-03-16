"use client"

import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import type { Track } from "../hooks/useAudioPlayer"

const { width } = Dimensions.get("window")

interface MiniPlayerProps {
  currentTrack: Track | null
  isPlaying: boolean
  onPlayPause: () => void
  playbackPosition: number
  playbackDuration: number
  isLoading?: boolean
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  playbackPosition,
  playbackDuration,
  isLoading = false,
}) => {
  const router = useRouter()

  if (!currentTrack) return null

  // Calculate progress percentage
  const progress = playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0

  return (
    <TouchableOpacity style={styles.container} onPress={() => router.push("/(tabs)/player")} activeOpacity={0.9}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />

      <View style={styles.content}>
        <View style={styles.trackInfo}>
          <Ionicons name="musical-note" size={24} color="#6200ee" style={styles.noteIcon} />

          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.title || currentTrack.filename}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentTrack.artist || "Unknown Artist"}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.playPauseButton} onPress={onPlayPause} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#6200ee" />
            ) : (
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#6200ee" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 49, // Just above the tab bar
    width: width,
    height: 65,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressBar: {
    height: 2,
    backgroundColor: "#6200ee",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  trackInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  noteIcon: {
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    color: "#888",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0e6ff",
    alignItems: "center",
    justifyContent: "center",
  },
})

export default MiniPlayer

