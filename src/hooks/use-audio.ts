
'use client';

import { useRef, useCallback, useEffect } from 'react';

// This hook manages loading and playing an audio file.
// It ensures that the audio object is created only once and can be reused.
export function useAudio(url: string): () => void {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pre-load the audio when the component mounts or URL changes.
  useEffect(() => {
    // We only want to run this on the client-side.
    if (typeof window !== 'undefined') {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioRef.current = audio;
    }
  }, [url]);

  // Returns a memoized function to play the sound.
  const play = useCallback(() => {
    if (audioRef.current) {
      // Reset the current time to allow for rapid re-playing of the sound.
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        // Autoplay policies can prevent playback until user interaction.
        console.error("Audio playback failed:", error);
      });
    }
  }, []);

  return play;
}
