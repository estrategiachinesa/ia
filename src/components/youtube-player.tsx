
'use client';

import { useState, useEffect, useRef } from 'react';

const YoutubePlayer = ({ videoId }: { videoId: string }) => {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Evita recarregar a API se já estiver presente
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const onYouTubeIframeAPIReady = () => {
      if (!playerRef.current) {
        playerRef.current = new (window as any).YT.Player(`youtube-player-${videoId}`, {
          videoId: videoId,
          playerVars: {
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        });
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      (window as any).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }

    return () => {
      // Limpeza do player ao desmontar o componente
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const onPlayerReady = () => {
    setIsReady(true);
  };

  const onPlayerStateChange = (event: any) => {
    setIsPlaying(event.data === (window as any).YT.PlayerState.PLAYING);
  };

  return (
    <div className="aspect-video w-full">
      <div id={`youtube-player-${videoId}`} className="w-full h-full rounded-lg shadow-2xl shadow-primary/20 border-2 border-primary/30" />
    </div>
  );
};

export default YoutubePlayer;
