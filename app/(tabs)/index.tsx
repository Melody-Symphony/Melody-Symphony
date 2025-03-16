"use client";

import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Track, useAudioPlayer } from "../../hooks/useAudioPlayer";
import TrackItem from "../../components/TrackItem";
import { StatusBar } from "expo-status-bar";

export default function LibraryScreen() {
  const {
    tracks,
    loadTracks,
    playTrack,
    currentTrack,
    isPlaying,
    permissionGranted,
  } = useAudioPlayer();

  useEffect(() => {
    if (permissionGranted) {
      loadTracks();
    }
  }, [permissionGranted]);

  const handleTrackPress = (track: Track) => {
    playTrack(track);
  };

  if (!permissionGranted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Media library permission is required to access your music.
        </Text>
        <TouchableOpacity style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Your Music Library</Text>

      {tracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No audio files found</Text>
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    margin: 16,
    color: "#333",
  },
  listContent: {
    paddingBottom: 100, // Space for mini player
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
