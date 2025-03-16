"use client";

import { useState, useEffect, useRef } from "react";
import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
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

  const soundRef = useRef<Audio.Sound | null>(null);
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Request permissions and setup audio
  useEffect(() => {
    const setup = async () => {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionGranted(status === "granted");

      if (status === "granted") {
        // Load tracks
        await loadTracks();

        // Load playlists from storage
        await loadPlaylists();

        // Setup audio mode for background playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          playThroughEarpieceAndroid: false,
        });

        // Setup notifications for media controls
        if (Platform.OS === "android") {
          await setupNotifications();
        }
      }
    };

    setup();

    // Cleanup
    return () => {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Setup notifications for media controls
  const setupNotifications = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      await Notifications.requestPermissionsAsync();
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
  };

  // Update notification with current track info
  const updateNotification = async (track: Track, isPlaying: boolean) => {
    if (Platform.OS !== "android") return;

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
  };

  // Load tracks from device
  const loadTracks = async () => {
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: "audio",
      });

      const audioTracks = await Promise.all(
        media.assets.map(async (asset) => {
          // Get file info
          const fileInfo = await MediaLibrary.getAssetInfoAsync(asset);

          return {
            id: asset.id,
            uri: asset.uri,
            filename: asset.filename,
            title: fileInfo.filename,
            artist: "Unknown Artist", // We would need to extract this from metadata
            album: "Unknown Album", // We would need to extract this from metadata
            duration: asset.duration,
            artwork: null, // We would need to extract this from metadata
          };
        })
      );

      setTracks(audioTracks);
    } catch (error) {
      console.error("Error loading tracks:", error);
    }
  };

  // Load playlists from storage
  const loadPlaylists = async () => {
    try {
      const storedPlaylists = await AsyncStorage.getItem("playlists");
      if (storedPlaylists) {
        setPlaylists(JSON.parse(storedPlaylists));
      }
    } catch (error) {
      console.error("Error loading playlists:", error);
    }
  };

  // Save playlists to storage
  const savePlaylists = async (updatedPlaylists: Playlist[]) => {
    try {
      await AsyncStorage.setItem("playlists", JSON.stringify(updatedPlaylists));
    } catch (error) {
      console.error("Error saving playlists:", error);
    }
  };

  // Start position update interval
  const startPositionUpdate = () => {
    if (positionUpdateInterval.current) {
      clearInterval(positionUpdateInterval.current);
    }

    positionUpdateInterval.current = setInterval(async () => {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis);
          setPlaybackDuration(status.durationMillis || 0);
        }
      }
    }, 1000);
  };

  // Play a track
  const playTrack = async (track: Track) => {
    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

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

      // Update notification
      updateNotification(track, true);
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  // Pause current track
  const pauseTrack = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);

      // Update notification
      if (currentTrack) {
        updateNotification(currentTrack, false);
      }
    }
  };

  // Resume current track
  const resumeTrack = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);

      // Update notification
      if (currentTrack) {
        updateNotification(currentTrack, true);
      }
    }
  };

  // Play next track
  const playNextTrack = async () => {
    if (!currentTrack || tracks.length === 0) return;

    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    await playTrack(tracks[nextIndex]);
  };

  // Play previous track
  const playPreviousTrack = async () => {
    if (!currentTrack || tracks.length === 0) return;

    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    await playTrack(tracks[prevIndex]);
  };

  // Seek to position
  const seekTo = async (position: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(position);
      setPlaybackPosition(position);
    }
  };

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      playNextTrack();
    }
  };

  // Create a new playlist
  const createPlaylist = async (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: [],
    };

    const updatedPlaylists = [...playlists, newPlaylist];
    setPlaylists(updatedPlaylists);
    await savePlaylists(updatedPlaylists);
  };

  // Delete a playlist
  const deletePlaylist = async (id: string) => {
    const updatedPlaylists = playlists.filter((playlist) => playlist.id !== id);
    setPlaylists(updatedPlaylists);
    await savePlaylists(updatedPlaylists);
  };

  // Add a track to a playlist
  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
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
  };

  // Remove a track from a playlist
  const removeTrackFromPlaylist = async (
    playlistId: string,
    trackId: string
  ) => {
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
  };

  return {
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    playbackPosition,
    playbackDuration,
    permissionGranted,
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
