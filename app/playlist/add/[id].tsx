"use client";

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudio, type Track } from "@/components/AudioContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AddToPlaylistScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { tracks, playlists, addTrackToPlaylist } = useAudio();
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);

  const playlist = playlists.find((p) => p.id === id);

  if (!playlist) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Playlist not found</Text>
          <View style={styles.placeholder} />
        </View>
      </View>
    );
  }

  // Filter out tracks that are already in the playlist
  const availableTracks = tracks.filter(
    (track) =>
      !playlist.tracks.some((existingTrack) => existingTrack.id === track.id)
  );

  const handleTrackSelect = (track: Track) => {
    setSelectedTracks((prev) => {
      if (prev.includes(track.id)) {
        return prev.filter((id) => id !== track.id);
      } else {
        return [...prev, track.id];
      }
    });
  };

  const handleAddSelected = async () => {
    // Add each selected track to the playlist
    for (const trackId of selectedTracks) {
      const track = tracks.find((t) => t.id === trackId);
      if (track) {
        await addTrackToPlaylist(playlist.id, track);
      }
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add to {playlist.name}</Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            selectedTracks.length === 0 && styles.disabledButton,
          ]}
          onPress={handleAddSelected}
          disabled={selectedTracks.length === 0}
        >
          <Text style={styles.addButtonText}>
            Add {selectedTracks.length > 0 ? `(${selectedTracks.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {availableTracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tracks available</Text>
          <Text style={styles.emptySubtext}>
            All tracks are already in this playlist
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableTracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.trackItem,
                selectedTracks.includes(item.id) && styles.selectedTrack,
              ]}
              onPress={() => handleTrackSelect(item)}
            >
              <View style={styles.checkboxContainer}>
                {selectedTracks.includes(item.id) ? (
                  <Ionicons name="checkbox" size={24} color="#6200ee" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#888" />
                )}
              </View>

              <View style={styles.trackDetails}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {item.title || item.filename}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {item.artist || "Unknown Artist"}
                </Text>
              </View>
            </TouchableOpacity>
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
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 16,
  },
  trackItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  selectedTrack: {
    backgroundColor: "#f0e6ff",
  },
  checkboxContainer: {
    marginRight: 16,
  },
  trackDetails: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: "#888",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});
