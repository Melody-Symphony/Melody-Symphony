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
    await Notifications.setNotificationChannelAsync("playback", {
      name: "Playback Controls",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 0, 0, 0],
      lightColor: "#6200ee",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      sound: null,
    })
  }
}

// Request notification permissions
export async function requestNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync()
  if (status !== "granted") {
    return await Notifications.requestPermissionsAsync()
  }
  return { status }
}

// Create and show a media notification
export async function showMediaNotification(track: Track, isPlaying: boolean) {
  await Notifications.dismissAllNotificationsAsync()

  if (Platform.OS === "android") {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: track.title || track.filename,
        body: `${track.artist || "Unknown Artist"} • ${track.album || "Unknown Album"}`,
        data: { trackId: track.id },
        categoryIdentifier: "playback",
        color: "#6200ee",
        priority: "max",
        sticky: true,
        ...(track.artwork && { largeIcon: track.artwork }),
      },
      trigger: null,
    })
  } else {
    return await Notifications.scheduleNotificationAsync({
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
}

// Set up notification response handler
export function setupNotificationResponseHandler(
  onPlay: () => void,
  onPause: () => void,
  onNext: () => void,
  onPrevious: () => void,
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const { actionIdentifier } = response

    console.log("Notification action received:", actionIdentifier)

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
        onPrevious()
        break
      default:
        break
    }
  })
}

