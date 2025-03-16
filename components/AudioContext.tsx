import React, { createContext, useState, useContext, ReactNode } from "react";

interface Track {
  title: string;
  artist: string;
}

interface AudioContextType {
  isPlaying: boolean;
  currentTrack: Track | null;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const pauseTrack = () => {
    setIsPlaying(false);
  };

  return (
    <AudioContext.Provider value={{ isPlaying, currentTrack, playTrack, pauseTrack }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
