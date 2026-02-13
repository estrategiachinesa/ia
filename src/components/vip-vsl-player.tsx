'use client';

import { useEffect, useRef } from 'react';

const VipVslPlayer = ({ videoId }: { videoId: string }) => {
  const playerRef = useRef<any>(null);
  const playerId = `vip-player-${videoId}`;

  useEffect(() => {
    // This function creates the YouTube player
    const createPlayer = () => {
      // Avoid creating multiple players
      if (playerRef.current) {
        return;
      }
      playerRef.current = new (window as any).YT.Player(playerId, {
        videoId: videoId,
        playerVars: {
          rel: 0, // Don't show related videos from other channels
          showinfo: 0, // Deprecated, but good to have
          modestbranding: 1, // Less YouTube branding
          playsinline: 1, // Plays inline on mobile
          controls: 1, // Show default YouTube controls - THIS IS THE KEY CHANGE
        },
      });
    };

    // Load the YouTube IFrame API script if it's not already loaded
    if (!(window as any).YT || !(window as any).YT.Player) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
      
      // The API will call this function when it's ready
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    } else {
      // If API is already ready, create the player immediately
      createPlayer();
    }

    // Cleanup function to destroy the player on component unmount
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, playerId]);


  return (
    // The main container for the video, maintaining aspect ratio and styling.
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/20">
      <div id={playerId} className="w-full h-full" />
    </div>
  );
};

export default VipVslPlayer;
