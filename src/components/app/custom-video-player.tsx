'use client';

import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import { Play, Pause, RotateCcw, VolumeX, Volume2, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CustomVideoPlayerProps = {
  url: string;
};

export function CustomVideoPlayer({ url }: CustomVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);


  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleRewind = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.max(0, currentTime - 5));
    }
  };

  const handlePlayerReady = () => {
    setIsReady(true);
  };
  
  const handleUnmute = () => {
    if (muted) {
        setMuted(false);
    }
  }

  const handleWrapperClick = () => {
    handleUnmute();
    if (isReady) {
        handlePlayPause();
    }
  }

  const handleFullScreen = () => {
    const elem = playerWrapperRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }
        setIsFullScreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        setIsFullScreen(false);
    }
  };

  React.useEffect(() => {
    const onFullScreenChange = () => {
        setIsFullScreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
  }, []);

  return (
    <div ref={playerWrapperRef} className="relative w-full h-full group bg-black" onClick={handleWrapperClick}>
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        muted={muted}
        controls={false}
        width="100%"
        height="100%"
        onReady={handlePlayerReady}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        config={{
          youtube: {
            playerVars: {
              showinfo: 0,
              modestbranding: 1,
              rel: 0,
            },
          },
        }}
      />
      {isReady && muted && !playing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 cursor-pointer text-white pointer-events-none">
           <VolumeX className="h-12 w-12 mb-2"/>
           <p className="text-lg font-semibold">Clique para ativar o som</p>
        </div>
      )}
      {isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hover:text-white h-12 w-12 sm:h-14 sm:w-14"
              onClick={(e) => { e.stopPropagation(); handleRewind(); }}
            >
              <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="sr-only">Retroceder 5 segundos</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hover:text-white h-16 w-16 sm:h-20 sm:w-20"
              onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
            >
              {playing ? (
                <Pause className="h-10 w-10 sm:h-12 sm:w-12" />
              ) : (
                <Play className="h-10 w-10 sm:h-12 sm:w-12" />
              )}
              <span className="sr-only">{playing ? 'Pausar' : 'Play'}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hover:text-white h-12 w-12 sm:h-14 sm:w-14"
              onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
            >
              {muted ? <VolumeX className="h-6 w-6 sm:h-8 sm:w-8" /> : <Volume2 className="h-6 w-6 sm:h-8 sm:w-8" />}
              <span className="sr-only">{muted ? 'Ativar som' : 'Desativar som'}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hover:text-white h-12 w-12 sm:h-14 sm:w-14"
              onClick={(e) => { e.stopPropagation(); handleFullScreen(); }}
            >
              {isFullScreen ? <Minimize className="h-6 w-6 sm:h-8 sm:w-8" /> : <Maximize className="h-6 w-6 sm:h-8 sm:w-8" />}
              <span className="sr-only">{isFullScreen ? 'Sair da tela cheia' : 'Tela cheia'}</span>
            </Button>

          </div>
        </div>
      )}
    </div>
  );
}
