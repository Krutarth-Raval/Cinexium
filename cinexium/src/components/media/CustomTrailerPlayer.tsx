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
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  
  // For double tap indicators
  const [showSeekAnim, setShowSeekAnim] = useState<'left' | 'right' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number, side: 'left' | 'right' } | null>(null);

  const handlePlayerReady = (event: any) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
    event.target.setPlaybackQuality('hd1080');
    
    try {
      const available = event.target.getAvailableQualityLevels();
      if (available && available.length > 0) {
        setQualities(available);
      }
    } catch (e) {}
    
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
      setIsMobile(window.innerWidth < 1024);
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
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
          if (screen.orientation && (screen.orientation as any).lock) {
            try {
              await (screen.orientation as any).lock('landscape');
            } catch (err) {
              console.log('Orientation lock not supported', err);
            }
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

  const toggleFitMode = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFitMode(prev => prev === 'cover' ? 'contain' : 'cover');
  };

  const changeQuality = (e: React.MouseEvent, quality: string) => {
    e.stopPropagation();
    if (player) {
      player.setPlaybackQuality(quality);
      setCurrentQuality(quality);
      setShowQualityMenu(false);
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
      ref={containerRef}
      className="absolute inset-0 bg-black z-10 flex flex-col justify-center overflow-hidden"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      onClick={() => setShowQualityMenu(false)}
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
          className={!isMobile && fitMode === 'cover' 
            ? "absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2" 
            : "absolute inset-0 w-full h-full"
          }
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
          <div className="flex items-center gap-3">
            {!isMobile && (
              <button onClick={togglePlay} className="text-white hover:text-primary-400">
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
            )}
            
            <span className="text-white text-xs font-medium tabular-nums">{formatTime(progress)}</span>
            
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
            
            <span className="text-white text-xs font-medium tabular-nums">{formatTime(duration)}</span>

            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); }} 
                className="text-white hover:bg-white/10 text-xs font-bold uppercase tracking-wider px-2 py-1 border border-white/30 rounded transition-colors"
              >
                {(() => {
                  switch (currentQuality) {
                    case 'highres': return '1080p+';
                    case 'hd1080': return '1080p';
                    case 'hd720': return '720p';
                    case 'large': return '480p';
                    case 'medium': return '360p';
                    case 'small': return '240p';
                    case 'tiny': return '144p';
                    case 'auto': return 'Auto';
                    default: return currentQuality;
                  }
                })()}
              </button>
              
              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-24 bg-black/90 border border-white/10 rounded-lg overflow-hidden flex flex-col z-50">
                  {(qualities.length > 0 ? qualities : ['hd1080', 'hd720', 'large', 'medium', 'auto']).map(q => (
                    <button 
                      key={q} 
                      onClick={(e) => changeQuality(e, q)}
                      className={`text-xs text-left px-3 py-2 hover:bg-white/10 ${currentQuality === q ? 'text-primary-500 font-bold' : 'text-white'}`}
                    >
                      {(() => {
                        switch (q) {
                          case 'highres': return '1080p+';
                          case 'hd1080': return '1080p';
                          case 'hd720': return '720p';
                          case 'large': return '480p';
                          case 'medium': return '360p';
                          case 'small': return '240p';
                          case 'tiny': return '144p';
                          case 'auto': return 'Auto';
                          default: return q;
                        }
                      })()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isMobile && (
              <button onClick={toggleFitMode} className="text-white hover:text-primary-400" title={fitMode === 'cover' ? "Contain" : "Cover"}>
                {fitMode === 'cover' ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z"/></svg>
                )}
              </button>
            )}

            {isMobile && (
              <button onClick={toggleFullscreen} className="text-white hover:text-primary-400" title="Rotate to Fullscreen">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="4" y="6" width="6" height="12" rx="1"/>
                  <rect x="14" y="12" width="10" height="6" rx="1"/>
                </svg>
              </button>
            )}

            {!isMobile && (
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
