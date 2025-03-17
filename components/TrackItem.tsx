import type React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudio, type Track } from "./AudioContext";

interface TrackItemProps {
  track: Track;
  onPress: () => void;
  showOptions?: boolean;
  onOptionsPress?: () => void;
}

const formatDuration = (milliseconds: number | undefined) => {
  if (!milliseconds) return "0:00";

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const TrackItem: React.FC<TrackItemProps> = ({
  track,
  onPress,
  showOptions = false,
  onOptionsPress,
}) => {
  const { currentTrack, isPlaying, togglePlayPause } = useAudio();
  const isCurrentTrack = currentTrack && currentTrack.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  console.log(
    `TrackItem: ${track.title}, isCurrentTrack: ${isCurrentTrack}, isPlaying: ${isCurrentlyPlaying}`
  );

  const handlePlayPausePress = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    console.log(`Play/pause button pressed for: ${track.title}`);
    togglePlayPause(track);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isCurrentTrack && styles.currentTrack]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {isCurrentTrack ? (
          <TouchableOpacity
            style={styles.playingIndicator}
            onPress={handlePlayPausePress}
          >
            {isCurrentlyPlaying ? (
              <Ionicons name="pause" size={22} color="#6200ee" />
            ) : (
              <Ionicons name="play" size={22} color="#6200ee" />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.trackNumber}>
            <Ionicons name="musical-note" size={22} color="#888" />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text
          style={[styles.title, isCurrentTrack && styles.currentText]}
          numberOfLines={1}
        >
          {track.title || track.filename}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist || "Unknown Artist"}
        </Text>
      </View>

      <View style={styles.durationContainer}>
        <Text style={styles.duration}>{formatDuration(track.duration)}</Text>

        {showOptions && onOptionsPress && (
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={onOptionsPress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentTrack: {
    backgroundColor: "#f0e6ff",
    borderLeftWidth: 3,
    borderLeftColor: "#6200ee",
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  playingIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0e6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  trackNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  currentText: {
    color: "#6200ee",
    fontWeight: "bold",
  },
  artist: {
    fontSize: 14,
    color: "#888",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  duration: {
    fontSize: 14,
    color: "#888",
    marginRight: 8,
  },
  optionsButton: {
    padding: 8,
  },
});

export default TrackItem;
