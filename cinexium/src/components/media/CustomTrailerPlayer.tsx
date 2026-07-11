'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';

export interface CustomTrailerPlayerRef {
  togglePlay: () => void;
}

interface CustomTrailerPlayerProps {
  videoId: string;
  onClose: () => void;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export const CustomTrailerPlayer = forwardRef<CustomTrailerPlayerRef, CustomTrailerPlayerProps>(({ videoId, onClose, onPlayingChange }, ref) => {
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // For double tap indicators
  const [showSeekAnim, setShowSeekAnim] = useState<'left' | 'right' | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number, side: 'left' | 'right' } | null>(null);

  const handlePlayerReady = (event: any) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
    event.target.setPlaybackQuality('highres'); // Try to force highest quality
    event.target.playVideo();
    setIsPlaying(true);
  };

  const handleStateChange = (event: any) => {
    // 1 = playing, 2 = paused, 0 = ended
    const playing = event.data === 1;
    setIsPlaying(playing);
    if (onPlayingChange) onPlayingChange(playing);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (err) {
            console.log('Orientation lock not supported', err);
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Error attempting to enable fullscreen:', err);
    }
  };





  useEffect(() => {
    if (isPlaying && player) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(player.getCurrentTime());
      }, 50);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, player]);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!player) return;
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  useImperativeHandle(ref, () => ({
    togglePlay
  }));

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    if (player) {
      player.seekTo(newTime, true);
      setProgress(newTime);
    }
  };

  const handleZoneClick = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    resetControlsTimeout();
    
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTapRef.current && lastTapRef.current.side === side && (now - lastTapRef.current.time) < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (player) {
        const currentTime = player.getCurrentTime();
        if (side === 'left') {
          player.seekTo(Math.max(0, currentTime - 10), true);
        } else {
          player.seekTo(Math.min(duration, currentTime + 10), true);
        }
        setShowSeekAnim(side);
        setTimeout(() => setShowSeekAnim(null), 500);
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, side };
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="absolute inset-0 bg-black z-10 flex flex-col justify-center overflow-hidden"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* YouTube Player */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <YouTube
          videoId={videoId}
          opts={{
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
              playsinline: 1,
              vq: 'hd1080'
            }
          }}
          onReady={handlePlayerReady}
          onStateChange={handleStateChange}
          className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2" 
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Overlay Click Zones for Double Tap */}
      <div className="absolute inset-0 flex z-20">
        <div 
          className="flex-1 h-full relative cursor-pointer" 
          onClick={(e) => handleZoneClick(e, 'left')}
        >
          {showSeekAnim === 'left' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10 animate-pulse rounded-r-full">
              <div className="flex items-center text-white/80 font-bold text-xl gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                10s
              </div>
            </div>
          )}
        </div>
        <div 
          className="w-1/4 h-full cursor-pointer flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        />
        <div 
          className="flex-1 h-full relative cursor-pointer" 
          onClick={(e) => handleZoneClick(e, 'right')}
        >
          {showSeekAnim === 'right' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10 animate-pulse rounded-l-full">
              <div className="flex items-center text-white/80 font-bold text-xl gap-2">
                10s
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 z-30 pointer-events-none flex flex-col justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Top bar */}
        <div className="p-4 flex justify-end pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Center Play/Pause Indicator (Optional, since we have zones) */}
        
        {/* Bottom bar */}
        <div className="p-4 flex flex-col gap-2 pointer-events-auto bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-primary-400">
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            
            <span className="text-white text-xs font-medium w-10">{formatTime(progress)}</span>
            
            <div className="flex-1 relative flex items-center h-4 group/progress">
              {/* Track background */}
              <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full pointer-events-none" />
              {/* Red trail */}
              <div 
                className="absolute left-0 h-1 bg-primary-500 rounded-full pointer-events-none" 
                style={{ 
                  width: `${duration > 0 ? (progress / duration) * 100 : 0}%` 
                }} 
              />
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={progress}
                onChange={handleSeek}
                className="relative z-10 w-full h-1 bg-transparent appearance-none [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 cursor-pointer"
              />
            </div>
            
            <span className="text-white text-xs font-medium w-10">{formatTime(duration)}</span>

            {isMobile ? (
              <button onClick={toggleFullscreen} className="text-white hover:text-primary-400">
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20V15h-5M20 9V4h-5M9 4V9h-5M20 15v5h-5M4 9h5V4M20 15h-5v5" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                )}
              </button>
            ) : (
              <button onClick={toggleMute} className="text-white hover:text-primary-400">
                {isMuted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
