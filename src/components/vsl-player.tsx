
'use client';

import { useState, useEffect, useRef } from 'react';
import { VolumeX, Play } from 'lucide-react';
import { useAppConfig } from '@/firebase';

const VSL_CTA_TIMESTAMP = 167; // 2 minutos e 47 segundos

const ScarcityCounter = () => {
    const { config } = useAppConfig();
    const [licenses, setLicenses] = useState(11);
    const [licenseColor, setLicenseColor] = useState('text-green-500');

    useEffect(() => {
        const videoEndTime = parseInt(localStorage.getItem('vsl_videoEndTime') || '0');
        if (!videoEndTime) return;

        const updateLicenses = () => {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - videoEndTime) / 1000);

            if (elapsedSeconds >= 42) {
                setLicenses(9);
                setLicenseColor('text-red-500');
            } else if (elapsedSeconds >= 12) {
                setLicenses(10);
                setLicenseColor('text-red-500');
            } else {
                setLicenses(11);
                setLicenseColor('text-green-500');
            }
        };

        updateLicenses();
        const interval = setInterval(updateLicenses, 1000);

        return () => clearInterval(interval);
    }, []);


    return (
        <div className="w-full max-w-4xl text-center p-8 bg-black/50 rounded-lg border border-primary/50">
            <h2 className="text-2xl sm:text-3xl font-bold uppercase text-white mb-4">
                Atenção: Seu Acesso Exclusivo Está Prestes a Expirar!
            </h2>
            <p className="text-lg text-gray-300 mb-6">
                Devido à alta demanda, restam pouquíssimas licenças com o desconto especial.
            </p>
            <div className="mb-8">
                <p className="text-xl text-white">Licenças Disponíveis:</p>
                <p className={`text-6xl sm:text-8xl font-extrabold my-2 transition-colors duration-500 ${licenseColor} animate-pulse`}>
                    {licenses}
                </p>
            </div>
            <a onClick={() => false} href="https://pay.hotmart.com/G102999657C?checkoutMode=2" className="hotmart-fb hotmart__button-checkout"><img src='https://static.hotmart.com/img/btn-buy-green.png' alt="Garantir Vaga"/></a>
        </div>
    );
};


const VslPlayer = ({ videoId }: { videoId: string }) => {
  const { config } = useAppConfig();
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCta, setShowCta] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const currentTimeKey = `vsl_currentTime_${videoId}`;
  const hasInteractedKey = 'vsl_hasInteracted';
  const videoEndedKey = 'vsl_videoEnded';
  const videoEndTimeKey = 'vsl_videoEndTime';

  useEffect(() => {
    // Check localStorage on mount
    const storedVideoEnded = localStorage.getItem(videoEndedKey) === 'true';
    if (storedVideoEnded) {
      setVideoEnded(true);
      return; // Do not load the player if video has already ended
    }

    const storedInteraction = localStorage.getItem(hasInteractedKey) === 'true';
    setHasInteracted(storedInteraction);
    if(storedInteraction){
        setIsMuted(false);
    }

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
      clearInterval(progressIntervalRef.current);
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  useEffect(() => {
    // Save progress to localStorage
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        const currentTime = playerRef.current?.getCurrentTime();
        if (currentTime !== undefined) {
          setProgress(currentTime);
          localStorage.setItem(currentTimeKey, String(currentTime));

          // CTA Logic
          if (currentTime >= VSL_CTA_TIMESTAMP && !showCta) {
            setShowCta(true);
          }
        }
      }, 1000);
    } else {
      clearInterval(progressIntervalRef.current);
    }

    return () => clearInterval(progressIntervalRef.current);
  }, [isPlaying, showCta]);

  const createPlayer = () => {
    if (playerRef.current) return;
    
    const storedTime = parseFloat(localStorage.getItem(currentTimeKey) || '0');
    const storedInteraction = localStorage.getItem(hasInteractedKey) === 'true';
    
    playerRef.current = new (window as any).YT.Player('youtube-player', {
      videoId: videoId,
      playerVars: {
        autoplay: storedInteraction ? 0 : 1, 
        mute: storedInteraction ? 0 : 1,
        controls: 0,
        showinfo: 0,
        rel: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        disablekb: 1,
        playsinline: 1,
        start: Math.floor(storedTime),
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  };

  const handleVideoEnd = () => {
    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    localStorage.setItem(videoEndedKey, 'true');
    localStorage.setItem(videoEndTimeKey, String(Date.now()));
    localStorage.removeItem(currentTimeKey);
    setVideoEnded(true);
  };

  const onPlayerReady = (event: any) => {
    setIsReady(true);
    setDuration(event.target.getDuration());
    
    const storedTime = parseFloat(localStorage.getItem(currentTimeKey) || '0');
    const storedInteraction = localStorage.getItem(hasInteractedKey) === 'true';
    
    if (storedTime >= VSL_CTA_TIMESTAMP) {
        setShowCta(true);
    }

    if (storedInteraction && storedTime > 0) {
      event.target.seekTo(storedTime, true);
      event.target.pauseVideo();
    } else {
       setIsMuted(true); 
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }

    if (event.data === (window as any).YT.PlayerState.ENDED) {
       handleVideoEnd();
    }
  };

  const handleInteraction = () => {
    if (!isReady || videoEnded) return;

    if (isMuted) {
      // First interaction: unmute, restart, and play.
      playerRef.current.unMute();
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
      setIsMuted(false);
      setHasInteracted(true);
      localStorage.setItem(hasInteractedKey, 'true');
    } else {
      // Subsequent interactions: play/pause
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  if (videoEnded) {
    return <ScarcityCounter />;
  }

  return (
    <>
    <div className="relative w-full aspect-video">
      <div 
        className="group relative w-full h-full cursor-pointer"
        onClick={handleInteraction}
      >
        <div id="youtube-player" className="w-full h-full rounded-lg overflow-hidden pointer-events-none" />
        
        {isMuted && hasInteracted === false && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
              <VolumeX className="h-16 w-16 text-white" />
              <p className="mt-4 text-xl font-bold uppercase text-white">Clique para ativar o som</p>
          </div>
        )}

        {!isPlaying && hasInteracted && !videoEnded && (
           <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
              <Play className="h-20 w-20 text-white/80 animate-pulse" />
              <p className="mt-2 text-lg font-bold text-white uppercase">Aperte o play</p>
          </div>
        )}

        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20">
          <div 
            className="h-full bg-primary transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {showCta && !videoEnded && (
        <div className="mt-8 flex justify-center text-center animate-pulse">
            <a onClick={() => false} href="https://pay.hotmart.com/G102999657C?checkoutMode=2" className="hotmart-fb hotmart__button-checkout"><img src='https://static.hotmart.com/img/btn-buy-green.png' alt="Quero Acessar Agora"/></a>
        </div>
      )}
    </div>
    </>
  );
};

export default VslPlayer;
