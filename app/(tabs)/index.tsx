"use client";

import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Track, useAudioPlayer } from "../../hooks/useAudioPlayer";
import TrackItem from "../../components/TrackItem";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

export default function LibraryScreen() {
  const {
    tracks,
    loadTracks,
    playTrack,
    currentTrack,
    isPlaying,
    permissionGranted,
    isLoading,
  } = useAudioPlayer();

  useEffect(() => {
    if (permissionGranted) {
      loadTracks();
    }
  }, [permissionGranted]);

  const handleTrackPress = (track: Track) => {
    playTrack(track); // Gère maintenant la pause et la lecture
  };

  const handleRequestPermission = async () => {
    // This will trigger the permission request again
    loadTracks();
  };

  if (!permissionGranted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar style="light" />
        <Ionicons
          name="musical-notes"
          size={80}
          color="#6200ee"
          style={styles.permissionIcon}
        />
        <Text style={styles.permissionTitle}>Music Access Required</Text>
        <Text style={styles.permissionText}>
          Media library permission is required to access your music files.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={handleRequestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Your Music Library</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadTracks}>
          <Ionicons name="refresh" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading your music...</Text>
        </View>
      ) : tracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="musical-notes"
            size={60}
            color="#6200ee"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>No audio files found</Text>
          <Text style={styles.emptySubtext}>
            Add music files to your device or check your storage permissions
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadTracks}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              isCurrentTrack={currentTrack?.id === item.id}
              isPlaying={isPlaying && currentTrack?.id === item.id}
              onPress={() => handleTrackPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#6200ee",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  refreshButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 120, // Space for mini player and tab bar
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#f5f5f5",
  },
  permissionIcon: {
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 50,
    elevation: 3,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
