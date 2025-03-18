"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useAudioPlayer } from "../hooks/useAudioPlayer"

// Create context with undefined as initial value
const AudioPlayerContext = createContext(undefined)

// Provider component
export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioPlayerData = useAudioPlayer()

  return <AudioPlayerContext.Provider value={audioPlayerData}>{children}</AudioPlayerContext.Provider>
}

// Custom hook to use the audio player context
export function useAudioPlayerContext() {
  const context = useContext(AudioPlayerContext)
  if (context === undefined) {
    throw new Error("useAudioPlayerContext must be used within an AudioPlayerProvider")
  }
  return context
}

