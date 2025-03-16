"use client"
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from "react-native"
import Slider from "@react-native-community/slider"
import { Ionicons } from "@expo/vector-icons"
import { useAudioPlayer } from "@/hooks/useAudioPlayer" 
import { StatusBar } from "expo-status-bar"
import { useRouter } from "expo-router"

const { width } = Dimensions.get("window")

const formatTime = (milliseconds: number) => {
  if (!milliseconds) return "0:00"

  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
}

export default function PlayerScreen() {
  const router = useRouter()
  const {
    currentTrack,
    isPlaying,
    playbackPosition,
    playbackDuration,
    pauseTrack,
    resumeTrack,
    playNextTrack,
    playPreviousTrack,
    seekTo,
  } = useAudioPlayer()

  if (!currentTrack) {
    return (
      <View style={styles.noTrackContainer}>
        <StatusBar style="auto" />
        <Text style={styles.noTrackText}>No track is currently playing</Text>
        <TouchableOpacity style={styles.browseButton} onPress={() => router.back()}>
          <Text style={styles.browseButtonText}>Browse Library</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-down" size={28} color="#333" />
      </TouchableOpacity>

      <View style={styles.artworkContainer}>
        <Image
          source={currentTrack.artwork ? { uri: currentTrack.artwork } : require("../../assets/default-album.png")}
          style={styles.artwork}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {currentTrack.title || currentTrack.filename}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentTrack.artist || "Unknown Artist"}
        </Text>
        <Text style={styles.album} numberOfLines={1}>
          {currentTrack.album || "Unknown Album"}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={playbackDuration || 1}
          value={playbackPosition}
          onSlidingComplete={seekTo}
          minimumTrackTintColor="#6200ee"
          maximumTrackTintColor="#d8d8d8"
          thumbTintColor="#6200ee"
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
          <Text style={styles.timeText}>{formatTime(playbackDuration)}</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={playPreviousTrack} style={styles.controlButton}>
          <Ionicons name="play-skip-back" size={32} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity onPress={isPlaying ? pauseTrack : resumeTrack} style={styles.playPauseButton}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={playNextTrack} style={styles.controlButton}>
          <Ionicons name="play-skip-forward" size={32} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  noTrackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  noTrackText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  browseButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  artworkContainer: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  artwork: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
  },
  artist: {
    fontSize: 18,
    color: "#666",
    marginBottom: 5,
    textAlign: "center",
  },
  album: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    marginBottom: 30,
  },
  progressBar: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  timeText: {
    color: "#666",
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
  },
  controlButton: {
    padding: 15,
  },
  playPauseButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#6200ee",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 30,
  },
})

