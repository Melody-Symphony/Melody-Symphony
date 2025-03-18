import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import type { Track } from "@/hooks/useAudioPlayer"

// Configure notification appearance and behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
})

// For Android, we need to create notification channels
export async function setupNotificationChannels() {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("playback", {
        name: "Playback Controls",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 0, 0, 0], // No vibration
        lightColor: "#6200ee",
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        sound: null, 
      })
      console.log("Notification channel created successfully")
    } catch (error) {
      console.error("Error creating notification channel:", error)
    }
  }
}

// Request notification permissions
export async function requestNotificationPermissions() {
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== "granted") {
      return await Notifications.requestPermissionsAsync()
    }
    return { status }
  } catch (error) {
    console.error("Error requesting notification permissions:", error)
    return { status: "error" }
  }
}

// Create and show a media notification
export async function showMediaNotification(track: Track, isPlaying: boolean) {
  try {
    // Dismiss any existing notifications first
    await Notifications.dismissAllNotificationsAsync()

    if (Platform.OS === "android") {
      // Android allows for more customization
      await Notifications.scheduleNotificationAsync({
        content: {
          title: track.title || track.filename,
          body: `${track.artist || "Unknown Artist"} • ${track.album || "Unknown Album"}`,
          data: {
            trackId: track.id,
            isPlaying: isPlaying,
          },
          // Set Android-specific properties
       
          // Set color for notification
          color: "#6200ee",
          // Set priority to max to ensure it's always visible
          priority: "max",
          // Make it sticky so it doesn't disappear
          sticky: true,
          // Set the notification to be ongoing (persistent)
          // Add artwork if available
          ...(track.artwork && { largeIcon: track.artwork }),
        },
        trigger: null,
      })

      console.log("Media notification shown successfully")
    } else {
      // iOS has more limitations
      await Notifications.scheduleNotificationAsync({
        content: {
          title: track.title || track.filename,
          body: `${track.artist || "Unknown Artist"} • ${track.album || "Unknown Album"}`,
          data: { trackId: track.id },
          categoryIdentifier: "playback",
          sticky: true,
        },
        trigger: null,
      })
    }
  } catch (error) {
    console.error("Error showing media notification:", error)
  }
}

// Set up notification response handler
export function setupNotificationResponseHandler(
  onPlay: () => void,
  onPause: () => void,
  onNext: () => void,
  onPrevious: () => void,
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const { actionIdentifier, notification } = response
      const data = notification.request.content.data

      console.log("Notification action received:", actionIdentifier)
      console.log("Notification data:", data)

      // If no specific action, handle based on data
      if (!actionIdentifier || actionIdentifier === "default") {
        // Check if we have isPlaying data
        if (data && typeof data.isPlaying === "boolean") {
          if (data.isPlaying) {
            onPause()
          } else {
            onPlay()
          }
        }
        return
      }

      // Handle specific actions
      switch (actionIdentifier) {
        case "play":
          onPlay()
          break
        case "pause":
          onPause()
          break
        case "next":
          onNext()
          break
        case "prev":
        case "previous":
          onPrevious()
          break
      }
    } catch (error) {
      console.error("Error handling notification response:", error)
    }
  })
}

