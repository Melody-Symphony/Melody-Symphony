"use client";

import { useState, useEffect, useRef } from "react";
import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";

// Configure notifications for media controls
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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

  const soundRef = useRef<Audio.Sound | null>(null);
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

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
          }

          // Setup notifications for media controls
          await setupNotifications();
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

  // Setup notifications for media controls
  const setupNotifications = async () => {
    try {
      console.log("Setting up notifications...");

      // Request notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        console.log("Notification permission status:", newStatus);
      }

      // Configure notification categories for media controls
      await Notifications.setNotificationCategoryAsync("playback", [
        {
          identifier: "play",
          buttonTitle: "Play",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: "pause",
          buttonTitle: "Pause",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: "next",
          buttonTitle: "Next",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: "prev",
          buttonTitle: "Previous",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);

      // Set up notification response handler
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { actionIdentifier } = response;

        console.log("Notification action received:", actionIdentifier);

        switch (actionIdentifier) {
          case "play":
            resumeTrack();
            break;
          case "pause":
            pauseTrack();
            break;
          case "next":
            playNextTrack();
            break;
          case "prev":
            playPreviousTrack();
            break;
        }
      });

      console.log("Notifications setup complete");
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  };

  // Update notification with current track info
  const updateNotification = async (track: Track, isPlaying: boolean) => {
    try {
      console.log(
        "Updating notification for track:",
        track.title,
        "isPlaying:",
        isPlaying
      );

      await Notifications.dismissAllNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: track.title || track.filename,
          body: `${track.artist || "Unknown Artist"} • ${
            track.album || "Unknown Album"
          }`,
          data: { trackId: track.id },
          categoryIdentifier: "playback",
          sticky: true,
        },
        trigger: null,
      });

      console.log("Notification updated successfully");
    } catch (error) {
      console.error("Error updating notification:", error);
    }
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

  // Play a track
  const playTrack = async (track: Track) => {
    try {
      console.log("Playing track:", track.title);
      setIsLoading(true);

      // Unload previous sound
      if (soundRef.current) {
        console.log("Unloading previous sound");
        await soundRef.current.unloadAsync();
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
      updateNotification(track, true);
      setIsPlaying(true);
      startPositionUpdate();

      // Save current track to storage
      await AsyncStorage.setItem("lastPlayingTrack", JSON.stringify(track));

      // Update notification
      updateNotification(track, true);

      setIsLoading(false);
      console.log("Track playing successfully");
    } catch (error) {
      console.error("Error playing track:", error);
      setIsLoading(false);
    }
  };

  // Pause current track
  const pauseTrack = async () => {
    if (soundRef.current) {
      try {
        console.log("Pausing track");
        await soundRef.current.pauseAsync();
        setIsPlaying(false);

        // Update notification
        if (currentTrack) {
          updateNotification(currentTrack, false);
        }

        console.log("Track paused successfully");
      } catch (error) {
        console.error("Error pausing track:", error);
      }
    }
  };

  // Resume current track
  const resumeTrack = async () => {
    if (soundRef.current) {
      try {
        console.log("Resuming track");
        await soundRef.current.playAsync();
        setIsPlaying(true);

        // Update notification
        if (currentTrack) {
          updateNotification(currentTrack, true);
        }

        console.log("Track resumed successfully");
      } catch (error) {
        console.error("Error resuming track:", error);
      }
    } else if (currentTrack) {
      // If we have a track but no sound object, reload it
      console.log("No sound object, reloading track");
      await playTrack(currentTrack);
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
    setCurrentTrack,
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
  };
}
