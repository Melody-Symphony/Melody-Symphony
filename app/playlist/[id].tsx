"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAudio, type Track, type Playlist } from "@/components/AudioContext"
import TrackItem from "../../components/TrackItem"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { playlists, togglePlayPause, deletePlaylist, removeTrackFromPlaylist } = useAudio()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)

  useEffect(() => {
    // Find the playlist by ID
    const foundPlaylist = playlists.find((p) => p.id === id)
    setPlaylist(foundPlaylist || null)
  }, [id, playlists])

  const handleTrackPress = (track: Track) => {
    togglePlayPause(track)
  }

  const handleDeletePlaylist = () => {
    Alert.alert("Delete Playlist", `Are you sure you want to delete "${playlist?.name}"?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (playlist) {
            await deletePlaylist(playlist.id)
            router.back()
          }
        },
      },
    ])
  }

  const handleRemoveTrack = (trackId: string) => {
    Alert.alert("Remove Track", "Are you sure you want to remove this track from the playlist?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (playlist) {
            await removeTrackFromPlaylist(playlist.id, trackId)
          }
        },
      },
    ])
  }

  const handleAddTracks = () => {
    if (playlist) {
      router.push(`/playlist/add/${playlist.id}`)
    }
  }

  if (!playlist) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Playlist Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>This playlist doesn't exist</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {playlist.name}
        </Text>
        <TouchableOpacity onPress={handleDeletePlaylist} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.playlistIcon}>
          <Ionicons name="musical-notes" size={40} color="#6200ee" />
        </View>
        <Text style={styles.trackCount}>
          {playlist.tracks.length} {playlist.tracks.length === 1 ? "track" : "tracks"}
        </Text>

        <TouchableOpacity style={styles.addTracksButton} onPress={handleAddTracks}>
          <Ionicons name="add" size={20} color="white" style={styles.addIcon} />
          <Text style={styles.addTracksText}>Add Tracks</Text>
        </TouchableOpacity>
      </View>

      {playlist.tracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tracks in this playlist</Text>
          <Text style={styles.emptySubtext}>Add tracks from your library to this playlist</Text>
        </View>
      ) : (
        <FlatList
          data={playlist.tracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              onPress={() => handleTrackPress(item)}
              showOptions={true}
              onOptionsPress={() => handleRemoveTrack(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  )
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  deleteButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  infoContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  playlistIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0e6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  trackCount: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  addTracksButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6200ee",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addIcon: {
    marginRight: 4,
  },
  addTracksText: {
    color: "white",
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 120,
    paddingTop: 8,
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
})

