"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAudioPlayer, type Playlist } from "../../hooks/useAudioPlayer"
import TrackItem from "../../components/TrackItem"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { playlists, playTrack, currentTrack, isPlaying, removeTrackFromPlaylist, deletePlaylist } = useAudioPlayer()

  const [playlist, setPlaylist] = useState<Playlist | null>(null)

  useEffect(() => {
    const foundPlaylist = playlists.find((p) => p.id === id)
    if (foundPlaylist) {
      setPlaylist(foundPlaylist)
    }
  }, [id, playlists])

  const handleTrackPress = (track) => {
    playTrack(track)
  }

  const handleTrackOptions = (track) => {
    if (!playlist) return

    Alert.alert("Track Options", `${track.title || track.filename}`, [
      {
        text: "Remove from Playlist",
        onPress: () => {
          removeTrackFromPlaylist(playlist.id, track.id)
        },
        style: "destructive",
      },
      { text: "Cancel", style: "cancel" },
    ])
  }

  const handleAddTracks = () => {
    if (!playlist) return

    router.push({
      pathname: "/playlist/add-tracks",
      params: { playlistId: playlist.id },
    })
  }

  const handleDeletePlaylist = () => {
    if (!playlist) return

    Alert.alert("Delete Playlist", `Are you sure you want to delete "${playlist.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          deletePlaylist(playlist.id)
          router.back()
        },
        style: "destructive",
      },
    ])
  }

  if (!playlist) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Playlist not found</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>{playlist.name}</Text>
        <Text style={styles.count}>
          {playlist.tracks.length} {playlist.tracks.length === 1 ? "track" : "tracks"}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTracks}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.buttonText}>Add Tracks</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePlaylist}>
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.buttonText}>Delete Playlist</Text>
        </TouchableOpacity>
      </View>

      {playlist.tracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tracks in this playlist</Text>
          <Text style={styles.emptySubtext}>Add tracks to get started</Text>
        </View>
      ) : (
        <FlatList
          data={playlist.tracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              isCurrentTrack={currentTrack?.id === item.id}
              isPlaying={isPlaying && currentTrack?.id === item.id}
              onPress={() => handleTrackPress(item)}
              showOptions={true}
              onOptionsPress={() => handleTrackOptions(item)}
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
    padding: 16,
    backgroundColor: "#6200ee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  count: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6200ee",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f44336",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 100, // Space for mini player
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

