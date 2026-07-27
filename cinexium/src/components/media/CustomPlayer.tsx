'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface Source {
  url: string;
  quality: string;
  isM3U8: boolean;
}

interface CustomPlayerProps {
  sources: Source[];
  title: string;
  onBack: () => void;
  onFallback: () => void;
}

export default function CustomPlayer({ sources, title, onBack, onFallback }: CustomPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  
  let controlsTimeout: NodeJS.Timeout;

  useEffect(() => {
    const defaultSource = sources.find(s => s.quality === 'auto') || sources[0];
    if (!defaultSource) return;

    if (Hls.isSupported() && defaultSource.isM3U8) {
      const hls = new Hls();
      hls.loadSource(defaultSource.url);
      if (videoRef.current) hls.attachMedia(videoRef.current);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
           console.error("HLS Fatal Error", data);
           onFallback(); // Use vidlink fallback if stream fails completely
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari native HLS
      videoRef.current.src = defaultSource.url;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(console.error);
      });
    }
  }, [sources, onFallback]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const skipTime = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => setShowControls(false), 3000);
  };

  const changeQuality = (quality: string) => {
    const source = sources.find(s => s.quality === quality);
    if (source && hlsRef.current) {
      const currentTime = videoRef.current?.currentTime || 0;
      hlsRef.current.loadSource(source.url);
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        videoRef.current.play();
      }
      setCurrentQuality(quality);
      setIsSettingsOpen(false);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden font-sans select-none"
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Double Click Skip Zones */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-1/4 z-10"
        onDoubleClick={() => skipTime(-10)}
      />
      <div 
        className="absolute top-0 bottom-0 right-0 w-1/4 z-10"
        onDoubleClick={() => skipTime(10)}
      />

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none transition-opacity duration-300 flex flex-col justify-between ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Top Bar */}
        <div className="p-4 flex items-center gap-4 pointer-events-auto">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-white text-shadow truncate">{title}</h1>
          <button onClick={onFallback} className="ml-auto text-xs font-bold px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white/70">
            Stream Failed?
          </button>
        </div>

        {/* Big Center Play Button (only when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-20 h-20 bg-primary-600/80 rounded-full flex items-center justify-center pl-2">
                 <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
             </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="p-4 pt-10 pointer-events-auto">
          {/* Progress Bar */}
          <div className="flex items-center gap-4 mb-4">
             <span className="text-white text-sm font-medium w-12 text-right">{formatTime(progress)}</span>
             <input
                type="range"
                min={0}
                max={duration || 100}
                value={progress}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:h-2 transition-all"
             />
             <span className="text-white text-sm font-medium w-12">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
             <div className="flex items-center gap-6">
                <button onClick={togglePlay} className="text-white hover:text-primary-400 transition transform hover:scale-110">
                  {isPlaying ? (
                     <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  ) : (
                     <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>
                <div className="hidden sm:flex gap-4">
                   <button onClick={() => skipTime(-10)} className="text-white hover:text-primary-400 transition" title="Rewind 10s">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
                   </button>
                   <button onClick={() => skipTime(10)} className="text-white hover:text-primary-400 transition" title="Forward 10s">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" /></svg>
                   </button>
                </div>
             </div>

             <div className="flex items-center gap-4 relative">
                <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-white hover:text-primary-400 transition" title="Settings">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <button onClick={toggleFullscreen} className="text-white hover:text-primary-400 transition" title="Fullscreen">
                   {isFullscreen ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20v-6h-6m12 6v-6h6m-12-6V2h-6m12 6V2h6" /></svg>
                   ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                   )}
                </button>

                {/* Settings Menu Popup */}
                {isSettingsOpen && (
                  <div className="absolute bottom-12 right-0 w-48 bg-black/90 border border-white/10 rounded-xl p-2 flex flex-col shadow-2xl backdrop-blur-md">
                     <div className="px-3 py-2 text-xs font-bold text-white/50 uppercase">Quality</div>
                     {sources.map(s => (
                        <button 
                           key={s.quality}
                           onClick={() => changeQuality(s.quality)}
                           className={`text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${currentQuality === s.quality ? 'bg-primary-600/30 text-primary-400 font-bold' : 'text-white hover:bg-white/10'}`}
                        >
                           {s.quality}
                           {currentQuality === s.quality && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                     ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
