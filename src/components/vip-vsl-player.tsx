'use client';

import { useState, useEffect, useRef } from 'react';
import { VolumeX, Play, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VipVslPlayer = ({ videoId }: { videoId: string }) => {
  const playerRef = useRef<any>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      createPlayer();
    };

    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const createPlayer = () => {
    if (playerRef.current) return;
    
    playerRef.current = new (window as any).YT.Player('vip-youtube-player', {
      videoId: videoId,
      playerVars: {
        autoplay: 1, 
        mute: 1,
        controls: 0,
        showinfo: 0,
        rel: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        disablekb: 1,
        playsinline: 1,
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  };

  const onPlayerReady = (event: any) => {
    setIsReady(true);
    setIsMuted(true);
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      setVideoEnded(false);
    } else {
      setIsPlaying(false);
    }

    if (event.data === (window as any).YT.PlayerState.ENDED) {
       setVideoEnded(true);
    }
  };

  const handleInteraction = () => {
    if (!isReady) return;

    if (!hasInteracted) {
      // First interaction: unmute and restart.
      playerRef.current.unMute();
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
      setIsMuted(false);
      setHasInteracted(true);
    } else {
      // Subsequent interactions: play/pause
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };
  
  const handleRepeat = () => {
    if (!isReady) return;
    setVideoEnded(false);
    playerRef.current.seekTo(0, true);
    playerRef.current.playVideo();
  }


  return (
    <div 
      className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/20"
      onClick={handleInteraction}
    >
      <div id="vip-youtube-player" className="w-full h-full pointer-events-none" />
      
      {!hasInteracted && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer">
            <VolumeX className="h-16 w-16 text-white" />
            <p className="mt-4 text-xl font-bold uppercase text-white">Clique para ativar o som</p>
        </div>
      )}

      {hasInteracted && !isPlaying && !videoEnded && (
         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 pointer-events-none cursor-pointer">
            <Play className="h-20 w-20 text-white/80 animate-pulse" />
            <p className="mt-2 text-lg font-bold text-white uppercase">Pausado</p>
        </div>
      )}
      
      {videoEnded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60">
            <Button
              size="lg"
              variant="outline"
              className="bg-background/80 text-foreground hover:bg-background"
              onClick={(e) => {
                e.stopPropagation(); // Prevent the main div's onClick from firing
                handleRepeat();
              }}
            >
              <RotateCw className="mr-2 h-5 w-5" />
              Repetir Vídeo
            </Button>
        </div>
      )}
    </div>
  );
};

export default VipVslPlayer;
