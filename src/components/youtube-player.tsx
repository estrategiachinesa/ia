"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Youtube, Play, Pause, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

const CustomProgressBar = ({ 
  progress, 
  duration, 
}: { 
  progress: number, 
  duration: number, 
}) => {
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-500/50">
      <div
        className="h-full bg-primary transition-all duration-100 linear"
        style={{ 
          width: `${progressPercent}%`,
        }}
      ></div>
    </div>
  );
};


export default function YoutubePlayer({ videoId }: { videoId: string }) {
  const [videoEnded, setVideoEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const playerRef = useRef<any>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsClient(true);

    const loadYouTubeAPI = () => {
      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
      }

      (window as any).onYouTubeIframeAPIReady = () => {
        createPlayer();
      };

      if ((window as any).YT && (window as any).YT.Player) {
        createPlayer();
      }
    };

    loadYouTubeAPI();

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };

  }, [videoId]);

  const createPlayer = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    const startTime = parseFloat(localStorage.getItem(`videoTime_${videoId}`) || '0');
    playerRef.current = new (window as any).YT.Player('youtube-player-iframe', {
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        showinfo: 0,
        rel: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        disablekb: 1,
        playsinline: 1, // Important for mobile fullscreen behavior
        start: Math.floor(startTime),
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  }

  const onPlayerReady = (event: any) => {
    setDuration(event.target.getDuration());
    const storedTime = parseFloat(localStorage.getItem(`videoTime_${videoId}`) || '0');
    if (storedTime > 0) {
        // We seek to the stored time but do not play it automatically.
        event.target.seekTo(storedTime, true);
        event.target.pauseVideo();
        setProgress(storedTime);
    }
  };

  const onPlayerStateChange = (event: any) => {
    const player = event.target;
    if (event.data === (window as any).YT.PlayerState.ENDED) {
      setVideoEnded(true);
      setIsPlaying(false);
      localStorage.setItem(`videoTime_${videoId}`, '0');
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } else if (event.data === (window as any).YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        progressIntervalRef.current = setInterval(() => {
            const currentTime = player.getCurrentTime();
            if (currentTime !== undefined) {
              setProgress(currentTime);
              localStorage.setItem(`videoTime_${videoId}`, currentTime.toString());
            }
        }, 1000);
    } else {
        setIsPlaying(false);
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
        const currentTime = player.getCurrentTime();
        if (currentTime !== undefined && currentTime > 0) { // Avoid saving 0 on initial load
          localStorage.setItem(`videoTime_${videoId}`, currentTime.toString());
        }
    }
  };

  const togglePlay = () => {
    if (playerRef.current && playerRef.current.getPlayerState) {
      const playerState = playerRef.current.getPlayerState();
      if (playerState === (window as any).YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const enterFullScreen = () => {
    const iframe = playerRef.current?.getIframe();
    if (iframe) {
      const requestFullScreenFn = iframe.requestFullscreen || iframe.mozRequestFullScreen || iframe.webkitRequestFullscreen || iframe.msRequestFullscreen;
      if (requestFullScreenFn) {
        requestFullScreenFn.call(iframe);
      }
    }
  };
  
  if (!isClient) {
    return <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl"></div>;
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl group">
      {!videoEnded ? (
        <>
          <div id="youtube-player-iframe" className="absolute top-0 left-0 h-full w-full"></div>
          
          <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
             <button
                aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                className={cn("bg-black/50 text-white rounded-full p-4 transition-opacity duration-300 opacity-0 group-hover:opacity-75 focus:opacity-100",
                !isPlaying && "opacity-100"
                )}
              >
                {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10" />}
              </button>
          </div>
          <CustomProgressBar progress={progress} duration={duration} />
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={enterFullScreen} 
              aria-label="Tela cheia"
              className="text-white p-2 rounded-full bg-black/50"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-800 text-white p-8 text-center">
            <Youtube className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-2xl font-bold font-headline mb-2">Gostou do que viu?</h3>
            <p className="text-lg mb-6 max-w-md">
                Clique no botão abaixo para garantir seu acesso imediato à Estratégia Chinesa e comece a transformar seus resultados hoje mesmo.
            </p>
            <Button asChild size="lg" className="text-lg font-bold animate-pulse">
                <Link href="#offer">
                    👉 QUERO ACESSO IMEDIATO
                </Link>
            </Button>
        </div>
      )}
    </div>
  );
}
