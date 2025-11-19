
'use client';

import { useState, useEffect, useRef } from 'react';
import { VolumeX, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { useFirebase } from '@/firebase/provider';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';


const VSL_CTA_TIMESTAMP = 167; // 2 minutos e 47 segundos

const VslPlayer = ({ videoId }: { videoId: string }) => {
  const { firebaseApp } = useFirebase();
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  
  const [playerState, setPlayerState] = useState<number>(-1);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCta, setShowCta] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);

  // New state for the return popup
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  // States for analytics events to fire only once
  const [hasTrackedStart, setHasTrackedStart] = useState(false);
  const [trackedProgress, setTrackedProgress] = useState<Set<number>>(new Set());

  useEffect(() => {
    const storedInteraction = localStorage.getItem('vsl_hasInteracted') === 'true';
    const storedVideoEnded = localStorage.getItem('vsl_videoEnded') === 'true';
    const storedEndTime = localStorage.getItem('vsl_endTime');
    const storedTime = parseFloat(localStorage.getItem(`vsl_currentTime_${videoId}`) || '0');

    setHasInteracted(storedInteraction);

    const initPlayer = () => {
       if (storedVideoEnded && storedEndTime) {
        setVideoEnded(true);
        setEndTime(parseInt(storedEndTime, 10));
        setShowCta(true); 
      } else {
          // Determine if the return dialog should be shown BEFORE creating the player
          const shouldShowReturnDialog = storedInteraction && storedTime > 1;
          setShowReturnDialog(shouldShowReturnDialog);

          const tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          document.head.appendChild(tag);

          (window as any).onYouTubeIframeAPIReady = () => {
              createPlayer(false, storedTime); // Always create with autoplay false initially
          };
          if ((window as any).YT) {
            createPlayer(false, storedTime);
          }
      }
    }

    initPlayer();

    return () => {
      clearInterval(progressIntervalRef.current);
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (showCta) {
        const analytics = getAnalytics(firebaseApp);
        logEvent(analytics, 'cta_shown');
    }
  }, [showCta, firebaseApp]);


  const createPlayer = (shouldAutoplay: boolean, startTime: number = 0) => {
    if (playerRef.current) return;

    playerRef.current = new (window as any).YT.Player('youtube-player', {
      videoId: videoId,
      playerVars: {
        autoplay: shouldAutoplay ? 1 : 0,
        controls: 0,
        showinfo: 0,
        rel: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        disablekb: 1,
        playsinline: 1,
        start: Math.floor(startTime),
        mute: shouldAutoplay ? 1 : 0, // Only mute if we intend to autoplay initially
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  };

  const onPlayerReady = (event: any) => {
    setDuration(event.target.getDuration());
    
    // Logic for initial load (not returning user)
    if (!showReturnDialog && !hasInteracted) {
      event.target.mute();
      event.target.playVideo();
    } else if (!showReturnDialog && hasInteracted) {
       // Returning user, no dialog, just play with sound
      const storedTime = parseFloat(localStorage.getItem(`vsl_currentTime_${videoId}`) || '0');
      event.target.seekTo(storedTime, true);
      event.target.unMute();
      event.target.playVideo();
      setIsMuted(false);
    }
    // If showReturnDialog is true, do nothing. The video is already loaded and paused at the correct time.
  };

  const onPlayerStateChange = (event: any) => {
    setPlayerState(event.data);
    
    // If user somehow pauses it, play it again, unless the dialog is open.
    if (event.data === (window as any).YT.PlayerState.PAUSED && hasInteracted && !showReturnDialog) {
        playerRef.current.playVideo();
    }
    
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
      startProgressTracker();
    } else {
      clearInterval(progressIntervalRef.current);
    }

    if (event.data === (window as any).YT.PlayerState.ENDED) {
        handleVideoEnd();
    }
  };

  const handleVideoEnd = () => {
    const analytics = getAnalytics(firebaseApp);
    logEvent(analytics, 'video_complete');

    const videoEndTime = Date.now();
    setVideoEnded(true);
    setEndTime(videoEndTime);
    setShowCta(true);
    localStorage.setItem('vsl_videoEnded', 'true');
    localStorage.setItem('vsl_endTime', String(videoEndTime));
    localStorage.removeItem(`vsl_currentTime_${videoId}`);
    playerRef.current?.destroy();
  }

  const startProgressTracker = () => {
    clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      const currentTime = playerRef.current?.getCurrentTime();
      if (currentTime !== undefined) {
        setProgress(currentTime);
        localStorage.setItem(`vsl_currentTime_${videoId}`, String(currentTime));

        // CTA Logic
        if (currentTime >= VSL_CTA_TIMESTAMP && !showCta) {
          setShowCta(true);
        }

        // Analytics progress tracking
        if (duration > 0) {
            const analytics = getAnalytics(firebaseApp);
            const percentage = (currentTime / duration) * 100;
            const milestones = [25, 50, 75];
            
            milestones.forEach(milestone => {
                if (percentage >= milestone && !trackedProgress.has(milestone)) {
                    logEvent(analytics, 'video_progress', { progress_percent: milestone });
                    setTrackedProgress(prev => new Set(prev).add(milestone));
                }
            });
        }
      }
    }, 1000);
  };
  
  const handleInitialPlay = () => {
    if (playerRef.current && !hasInteracted) {
        const analytics = getAnalytics(firebaseApp);
        if(!hasTrackedStart){
            logEvent(analytics, 'video_start');
            setHasTrackedStart(true);
        }

      playerRef.current.unMute();
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
      setIsMuted(false);
      setHasInteracted(true);
      localStorage.setItem('vsl_hasInteracted', 'true');
    }
  };

  const continueVideo = () => {
    setShowReturnDialog(false);
    if (playerRef.current) {
        playerRef.current.unMute();
        playerRef.current.playVideo();
        setIsMuted(false);
    }
  }

  const restartVideo = () => {
    setShowReturnDialog(false);
    localStorage.setItem(`vsl_currentTime_${videoId}`, '0');
    if (playerRef.current) {
        playerRef.current.seekTo(0, true);
        playerRef.current.unMute();
        playerRef.current.playVideo();
        setIsMuted(false);
    }
  }


  const getNonLinearProgress = (current: number, total: number) => {
    if (total === 0) return 0;
    const percentage = (current / total);

    if (percentage <= 0.10) { // Fase 1
      return (percentage / 0.10) * 60;
    } else if (percentage <= 0.70) { // Fase 2
      return 60 + ((percentage - 0.10) / 0.60) * 20;
    } else if (percentage <= 0.80) { // Fase 3
      return 80 + ((percentage - 0.70) / 0.10) * 10;
    } else { // Fase 4
      return 90 + ((percentage - 0.80) / 0.20) * 10;
    }
  };

  const calculatedProgress = getNonLinearProgress(progress, duration);

  const ScarcityCounter = () => {
    const [licenses, setLicenses] = useState(11);
    const [color, setColor] = useState('text-primary');

    useEffect(() => {
      if (!endTime) return;

      const updateCounter = () => {
        const elapsed = (Date.now() - endTime) / 1000;
        if (elapsed > 42) { // 12s + 30s
          setLicenses(9);
          setColor('text-red-600');
        } else if (elapsed > 12) {
          setLicenses(10);
          setColor('text-red-600');
        } else {
          setLicenses(11);
          setColor('text-primary');
        }
      };

      updateCounter();
      const interval = setInterval(updateCounter, 1000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="flex flex-col items-center justify-center bg-black/50 p-8 rounded-lg aspect-video">
        <h3 className="text-xl font-bold uppercase sm:text-2xl text-center">Faltam apenas</h3>
        <p className={cn("text-7xl sm:text-9xl font-extrabold my-4 transition-colors", color)}>{licenses}</p>
        <h3 className="text-xl font-bold uppercase sm:text-2xl text-center">Licenças Disponíveis</h3>
      </div>
    );
  };
  
  const handleCtaClick = () => {
    const analytics = getAnalytics(firebaseApp);
    logEvent(analytics, 'cta_click');
  }

  const handlePlayerClick = () => {
    if (!hasInteracted) {
        handleInitialPlay();
    }
    // After initial interaction, clicks do nothing to prevent pausing.
  }

  return (
    <>
    <div className="relative w-full aspect-video">
      {videoEnded ? (
        <ScarcityCounter />
      ) : (
        <div className="group relative w-full h-full" onClick={handlePlayerClick}>
          <div id="youtube-player" className="w-full h-full rounded-lg overflow-hidden pointer-events-none" />
          
          {isMuted && hasInteracted === false && !showReturnDialog && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer">
                <VolumeX className="h-16 w-16 text-white" />
                <p className="mt-4 text-xl font-bold uppercase text-white">Clique para ativar o som</p>
            </div>
          )}

          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${calculatedProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {showCta && (
        <div className="mt-8 flex justify-center animate-pulse">
            <a href="https://pay.hotmart.com/E101943327K?checkoutMode=2" onClick={handleCtaClick} className="hotmart-fb hotmart__button-checkout font-headline text-lg font-bold uppercase">
                QUERO ACESSAR AGORA
            </a>
        </div>
      )}
    </div>
     <AlertDialog open={showReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você já começou a assistir!</AlertDialogTitle>
            <AlertDialogDescription>
              Vimos que você já iniciou o vídeo. Deseja continuar de onde parou ou começar novamente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={restartVideo}>Reiniciar Vídeo</Button>
            <Button onClick={continueVideo}>Continuar de Onde Parei</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VslPlayer;

    