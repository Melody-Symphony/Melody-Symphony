"use client"

import { useEffect } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native"
import Slider from "@react-native-community/slider"
import { Ionicons } from "@expo/vector-icons"
import { useAudio } from "@/components/AudioContext"
import { StatusBar } from "expo-status-bar"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"

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
    togglePlayPause,
    playNextTrack,
    playPreviousTrack,
    seekTo,
    isLoading,
  } = useAudio()

  // Ensure the screen updates when playback position changes
  useEffect(() => {
    // This effect is just to make sure the component re-renders
    // when playbackPosition changes
  }, [playbackPosition, isPlaying])

  if (!currentTrack) {
    return (
      <View style={styles.noTrackContainer}>
        <StatusBar style="light" />
        <LinearGradient colors={["#6200ee", "#3700b3"]} style={styles.gradientBackground} />
        <Text style={styles.noTrackText}>No track is currently playing</Text>
        <TouchableOpacity style={styles.browseButton} onPress={() => router.back()}>
          <Text style={styles.browseButtonText}>Browse Library</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Calculate progress percentage for the progress bar
  const progress = playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient colors={["#6200ee", "#3700b3"]} style={styles.gradientBackground} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-down" size={28} color="white" />
      </TouchableOpacity>

      <View style={styles.artworkContainer}>
        <Image
          source={currentTrack.artwork ? { uri: currentTrack.artwork } : require("../../assets/default-album.png")}
          style={styles.artwork}
        />

        {/* Vinyl record effect */}
        <View style={[styles.vinylRecord, isPlaying && styles.vinylRecordSpinning]}>
          <View style={styles.vinylCenter} />
        </View>
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
          minimumTrackTintColor="#ffffff"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#ffffff"
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
          <Text style={styles.timeText}>{formatTime(playbackDuration)}</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={playPreviousTrack} style={styles.controlButton}>
          <Ionicons name="play-skip-back" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            console.log("=== PLAY/PAUSE PRESSED IN PLAYER SCREEN ===")
            togglePlayPause(currentTrack)
          }}
          style={styles.playPauseButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#6200ee" size="large" />
          ) : (
            <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#6200ee" />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={playNextTrack} style={styles.controlButton}>
          <Ionicons name="play-skip-forward" size={32} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.extraControlsContainer}>
        <TouchableOpacity style={styles.extraControlButton}>
          <Ionicons name="repeat" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.extraControlButton}>
          <Ionicons name="shuffle" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.extraControlButton}>
          <Ionicons name="heart-outline" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.extraControlButton}>
          <Ionicons name="share-outline" size={24} color="rgba(255,255,255,0.7)" />
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
    backgroundColor: "#121212",
    padding: 20,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    backgroundColor: "#121212",
    padding: 20,
  },
  noTrackText: {
    fontSize: 18,
    color: "white",
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
  },
  browseButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  artworkContainer: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    borderRadius: width * 0.35,
    overflow: "hidden",
    position: "relative",
  },
  artwork: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: width * 0.35,
  },
  vinylRecord: {
    position: "absolute",
    top: "10%",
    left: "10%",
    width: "80%",
    height: "80%",
    borderRadius: width * 0.35,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 0 }],
  },
  vinylRecordSpinning: {
    transform: [{ scale: 1 }, { rotate: "0deg" }],
  },
  vinylCenter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
  },
  infoContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
    textAlign: "center",
  },
  artist: {
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 5,
    textAlign: "center",
  },
  album: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
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
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 20,
  },
  controlButton: {
    padding: 15,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  extraControlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "80%",
    marginTop: 20,
  },
  extraControlButton: {
    padding: 10,
  },
})

