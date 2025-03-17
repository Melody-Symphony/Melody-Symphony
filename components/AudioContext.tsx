"use client";

import type React from "react";
import { createContext, useContext } from "react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

// Create a type for the context to avoid typing issues
export type AudioContextType = ReturnType<typeof useAudioPlayer>;

// Create the context with a proper initial value
const AudioContext = createContext<AudioContextType | null>(null);

// Create the provider component
export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioData = useAudioPlayer();

  return (
    <AudioContext.Provider value={audioData}>{children}</AudioContext.Provider>
  );
}

// Custom hook to use the audio context
export function useAudio() {
  const context = useContext(AudioContext);

  if (context === null) {
    throw new Error("useAudio must be used within an AudioProvider");
  }

  return context;
}

// Re-export Track and Playlist types from useAudioPlayer
export type { Track, Playlist } from "@/hooks/useAudioPlayer";
