import type React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Playlist } from "./AudioContext";

interface PlaylistItemProps {
  playlist: Playlist;
  onPress: () => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ playlist, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name="list" size={24} color="#6200ee" />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={styles.count}>
          {playlist.tracks.length}{" "}
          {playlist.tracks.length === 1 ? "track" : "tracks"}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0e6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
    color: "#888",
  },
});

export default PlaylistItem;
