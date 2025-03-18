"use client";

import { useState, useEffect, useRef } from "react";
import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import {
  showMediaNotification,
  setupNotificationResponseHandler,
} from "@/services/notification-service";

export interface Track {
  id: string;
  uri: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

export function useAudioPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const notificationResponseSubscription = useRef<any>(null);

  // Request permissions and setup audio
  useEffect(() => {
    const setup = async () => {
      try {
        console.log("Setting up audio player...");

        // Request media library permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        console.log("Media library permission status:", status);
        setPermissionGranted(status === "granted");

        if (status === "granted") {
          // Setup audio mode for background playback
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            playsInSilentModeIOS: true,
          });

          console.log("Audio mode set for background playback");

          // Load tracks
          await loadTracks();

          // Load playlists from storage
          await loadPlaylists();

          // Try to restore last playing track
          const lastTrackJson = await AsyncStorage.getItem("lastPlayingTrack");
          if (lastTrackJson) {
            const lastTrack = JSON.parse(lastTrackJson);
            const lastPosition = Number.parseInt(
              (await AsyncStorage.getItem("lastPlayingPosition")) || "0"
            );
            console.log(
              "Restoring last track:",
              lastTrack.title,
              "at position",
              lastPosition
            );
            setCurrentTrack(lastTrack);
            setPlaybackPosition(lastPosition);

            // Show notification immediately for the last track
            if (lastTrack) {
              showMediaNotification(lastTrack, false);
            }
          }

          // Set up notification response handler
          notificationResponseSubscription.current =
            setupNotificationResponseHandler(
              resumeTrack,
              pauseTrack,
              playNextTrack,
              playPreviousTrack
            );
        }
      } catch (error) {
        console.error("Error during setup:", error);
      }
    };

    setup();

    // Handle app state changes
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground
        console.log("App came to foreground, updating UI");
        if (soundRef.current) {
          soundRef.current
            .getStatusAsync()
            .then((status) => {
              if (status.isLoaded) {
                setIsPlaying(status.isPlaying);
                setPlaybackPosition(status.positionMillis);
                setPlaybackDuration(status.durationMillis || 0);

                // Update notification when app comes to foreground
                if (currentTrack) {
                  showMediaNotification(currentTrack, status.isPlaying);
                }
              }
            })
            .catch((err) => console.error("Error getting sound status:", err));
        }
      } else if (
        nextAppState.match(/inactive|background/) &&
        appStateRef.current === "active"
      ) {
        // App has gone to the background
        console.log("App went to background");
        // Save current track and position
        if (currentTrack) {
          AsyncStorage.setItem(
            "lastPlayingTrack",
            JSON.stringify(currentTrack)
          );
          AsyncStorage.setItem(
            "lastPlayingPosition",
            playbackPosition.toString()
          );
        }
      }

      appStateRef.current = nextAppState;
    });

    // Cleanup
    return () => {
      console.log("Cleaning up audio player...");
      subscription.remove();

      if (notificationResponseSubscription.current) {
        notificationResponseSubscription.current.remove();
      }

      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }

      if (soundRef.current) {
        soundRef.current
          .unloadAsync()
          .catch((err) => console.error("Error unloading sound:", err));
      }
    };
  }, []);

  // Update notification when current track or playing state changes
  useEffect(() => {
    if (currentTrack) {
      showMediaNotification(currentTrack, isPlaying);
    }
  }, [currentTrack, isPlaying]);

  // Extract basic metadata from filename
  const extractBasicMetadata = (filename: string) => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

    // Try to extract artist and title if in format "Artist - Title"
    const match = nameWithoutExt.match(/^(.*?)\s*-\s*(.*)$/);

    if (match) {
      return {
        artist: match[1].trim() || "Unknown Artist",
        title: match[2].trim() || "Unknown Title",
      };
    }

    // If no match, just use the filename as title
    return {
      artist: "Unknown Artist",
      title: nameWithoutExt || "Unknown Title",
    };
  };

  // Load tracks from device
  const loadTracks = async () => {
    try {
      console.log("Loading tracks from media library...");
      setIsLoading(true);

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: "audio",
        first: 1000, // Limit to 1000 tracks for performance
      });

      console.log(`Found ${media.assets.length} audio files`);

      const audioTracks = await Promise.all(
        media.assets.map(async (asset) => {
          try {
            // Get file info
            const fileInfo = await MediaLibrary.getAssetInfoAsync(asset);

            // Extract basic metadata from filename
            const metadata = extractBasicMetadata(asset.filename);

            return {
              id: asset.id,
              uri: asset.uri,
              filename: asset.filename,
              title: metadata.title,
              artist: metadata.artist,
              album: "Unknown Album",
              duration: asset.duration * 1000, // Convert to milliseconds
              artwork: null,
            };
          } catch (error) {
            console.error("Error processing asset:", error);
            return null;
          }
        })
      );

      // Filter out any null values from errors
      const validTracks = audioTracks.filter(
        (track) => track !== null
      ) as Track[];
      console.log(`Successfully loaded ${validTracks.length} tracks`);

      setTracks(validTracks);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading tracks:", error);
      setIsLoading(false);
    }
  };

  // Load playlists from storage
  const loadPlaylists = async () => {
    try {
      console.log("Loading playlists from storage...");

      const storedPlaylists = await AsyncStorage.getItem("playlists");
      if (storedPlaylists) {
        const parsedPlaylists = JSON.parse(storedPlaylists);
        console.log(`Loaded ${parsedPlaylists.length} playlists`);
        setPlaylists(parsedPlaylists);
      } else {
        console.log("No playlists found in storage");
      }
    } catch (error) {
      console.error("Error loading playlists:", error);
    }
  };

  // Save playlists to storage
  const savePlaylists = async (updatedPlaylists: Playlist[]) => {
    try {
      console.log(`Saving ${updatedPlaylists.length} playlists to storage`);
      await AsyncStorage.setItem("playlists", JSON.stringify(updatedPlaylists));
    } catch (error) {
      console.error("Error saving playlists:", error);
    }
  };

  // Start position update interval
  const startPositionUpdate = () => {
    console.log("Starting position update interval");

    if (positionUpdateInterval.current) {
      clearInterval(positionUpdateInterval.current);
    }

    positionUpdateInterval.current = setInterval(async () => {
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis);
            setPlaybackDuration(status.durationMillis || 0);
          }
        } catch (error) {
          console.error("Error updating position:", error);
        }
      }
    }, 1000);
  };

  // Toggle play/pause for a track
  const togglePlayPause = async (track?: Track) => {
    try {
      console.log("=== TOGGLE PLAY/PAUSE CALLED ===");
      console.log("Track provided:", track?.title || "none");
      console.log("Current track:", currentTrack?.title || "none");
      console.log("Current playing state:", isPlaying);

      // Case 1: No track provided, toggle current state
      if (!track) {
        console.log("No track provided, toggling current state");
        if (isPlaying) {
          await pauseTrack();
        } else if (currentTrack) {
          await resumeTrack();
        }
        return;
      }

      // Case 2: Track provided is the current track
      if (currentTrack && currentTrack.id === track.id) {
        console.log("Track is current track, toggling play state");
        if (isPlaying) {
          await pauseTrack();
        } else {
          await resumeTrack();
        }
        return;
      }

      // Case 3: New track, play it
      console.log("New track, playing it");
      await playTrack(track);
    } catch (error) {
      console.error("Error in togglePlayPause:", error);
    }
  };

  // Play a track
  const playTrack = async (track: Track) => {
    try {
      console.log("=== PLAY TRACK CALLED ===");
      console.log("Playing track:", track.title);
      setIsLoading(true);

      // If it's the same track as the current one, just resume playback
      if (currentTrack && currentTrack.id === track.id && soundRef.current) {
        console.log("Same track, resuming playback");
        await resumeTrack();
        setIsLoading(false);
        return;
      }

      // Unload previous sound
      if (soundRef.current) {
        console.log("Unloading previous sound");
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      console.log("Creating new sound with URI:", track.uri);
      // Create new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentTrack(track);
      setIsPlaying(true);
      startPositionUpdate();

      // Save current track to storage
      await AsyncStorage.setItem("lastPlayingTrack", JSON.stringify(track));

      // Update notification immediately
      showMediaNotification(track, true);

      setIsLoading(false);
      console.log("Track playing successfully");
    } catch (error) {
      console.error("Error playing track:", error);
      setIsLoading(false);
    }
  };

  // Pause current track
  const pauseTrack = async () => {
    console.log("=== PAUSE TRACK CALLED ===");
    if (soundRef.current) {
      try {
        console.log("Pausing track:", currentTrack?.title);
        await soundRef.current.pauseAsync();
        setIsPlaying(false);

        // Update notification
        if (currentTrack) {
          showMediaNotification(currentTrack, false);
        }

        console.log("Track paused successfully");
      } catch (error) {
        console.error("Error pausing track:", error);
      }
    } else {
      console.log("No sound reference to pause");
    }
  };

  // Resume current track
  const resumeTrack = async () => {
    console.log("=== RESUME TRACK CALLED ===");
    if (soundRef.current) {
      try {
        console.log("Resuming track:", currentTrack?.title);
        await soundRef.current.playAsync();
        setIsPlaying(true);

        // Update notification
        if (currentTrack) {
          showMediaNotification(currentTrack, true);
        }

        console.log("Track resumed successfully");
      } catch (error) {
        console.error("Error resuming track:", error);
      }
    } else if (currentTrack) {
      // If we have a track but no sound object, reload it
      console.log("No sound object, reloading track");
      await playTrack(currentTrack);
    } else {
      console.log("No track to resume");
    }
  };

  // Play next track
  const playNextTrack = async () => {
    if (!currentTrack || tracks.length === 0) return;

    try {
      console.log("Playing next track");
      const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
      const nextIndex = (currentIndex + 1) % tracks.length;
      await playTrack(tracks[nextIndex]);
    } catch (error) {
      console.error("Error playing next track:", error);
    }
  };

  // Play previous track
  const playPreviousTrack = async () => {
    if (!currentTrack || tracks.length === 0) return;

    try {
      console.log("Playing previous track");
      const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
      const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
      await playTrack(tracks[prevIndex]);
    } catch (error) {
      console.error("Error playing previous track:", error);
    }
  };

  // Seek to position
  const seekTo = async (position: number) => {
    if (soundRef.current) {
      try {
        console.log("Seeking to position:", position);
        await soundRef.current.setPositionAsync(position);
        setPlaybackPosition(position);
      } catch (error) {
        console.error("Error seeking to position:", error);
      }
    }
  };

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) return;

    // Update UI with current status
    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      console.log("Track finished, playing next track");
      playNextTrack();
    }
  };

  // Create a new playlist
  const createPlaylist = async (name: string) => {
    try {
      console.log("Creating new playlist:", name);
      const newPlaylist: Playlist = {
        id: Date.now().toString(),
        name,
        tracks: [],
      };

      const updatedPlaylists = [...playlists, newPlaylist];
      setPlaylists(updatedPlaylists);
      await savePlaylists(updatedPlaylists);
      console.log("Playlist created successfully");
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  };

  // Delete a playlist
  const deletePlaylist = async (id: string) => {
    try {
      console.log("Deleting playlist with ID:", id);
      const updatedPlaylists = playlists.filter(
        (playlist) => playlist.id !== id
      );
      setPlaylists(updatedPlaylists);
      await savePlaylists(updatedPlaylists);
      console.log("Playlist deleted successfully");
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  };

  // Add a track to a playlist
  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    try {
      console.log("Adding track to playlist:", playlistId, track.title);
      const updatedPlaylists = playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          // Check if track already exists in playlist
          const trackExists = playlist.tracks.some((t) => t.id === track.id);
          if (!trackExists) {
            return {
              ...playlist,
              tracks: [...playlist.tracks, track],
            };
          }
        }
        return playlist;
      });

      setPlaylists(updatedPlaylists);
      await savePlaylists(updatedPlaylists);
      console.log("Track added to playlist successfully");
    } catch (error) {
      console.error("Error adding track to playlist:", error);
    }
  };

  // Remove a track from a playlist
  const removeTrackFromPlaylist = async (
    playlistId: string,
    trackId: string
  ) => {
    try {
      console.log("Removing track from playlist:", playlistId, trackId);
      const updatedPlaylists = playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: playlist.tracks.filter((track) => track.id !== trackId),
          };
        }
        return playlist;
      });

      setPlaylists(updatedPlaylists);
      await savePlaylists(updatedPlaylists);
      console.log("Track removed from playlist successfully");
    } catch (error) {
      console.error("Error removing track from playlist:", error);
    }
  };

  return {
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    playbackPosition,
    playbackDuration,
    permissionGranted,
    isLoading,
    loadTracks,
    playTrack,
    pauseTrack,
    resumeTrack,
    playNextTrack,
    playPreviousTrack,
    seekTo,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    togglePlayPause,
  };
}
