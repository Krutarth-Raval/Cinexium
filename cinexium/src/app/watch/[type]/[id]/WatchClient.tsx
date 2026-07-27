'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WatchClientProps {
  mediaId: string;
  mediaType: 'movie' | 'tv';
  title: string;
  seasons?: any[];
  region?: string;
}

export default function WatchClient({ mediaId, mediaType, title, seasons = [], region }: WatchClientProps) {
  const router = useRouter();

  const [selectedSeason, setSelectedSeason] = useState<number>(
    seasons && seasons.length > 0 ? (seasons.find(s => s.season_number > 0)?.season_number || 1) : 1
  );
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Reset loading when episode changes
  useEffect(() => {
    setIframeLoading(true);
  }, [selectedSeason, selectedEpisode]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Fetch episodes for TV
  useEffect(() => {
    if (mediaType === 'tv' && selectedSeason !== null) {
      const fetchEpisodes = async () => {
        try {
          const res = await fetch(`/api/media/${mediaId}/seasons/${selectedSeason}`);
          if (res.ok) {
            const data = await res.json();
            setEpisodes(data.episodes || []);
            if (data.episodes && data.episodes.length > 0) {
              const epExists = data.episodes.find((e: any) => e.episode_number === selectedEpisode);
              if (!epExists) setSelectedEpisode(data.episodes[0].episode_number);
            }
          }
        } catch (error) {
          console.error(error);
        }
      };
      fetchEpisodes();
    }
  }, [mediaType, mediaId, selectedSeason]);

  const validSeasons = seasons?.filter(s => s.season_number > 0) || [];
  const [iframeUrl, setIframeUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const generateUrl = async () => {
      setIframeLoading(true);

      let finalUrl = '';
      if (region === 'anime') {
        finalUrl = mediaType === 'movie'
          ? `https://vidsrc.to/embed/movie/${mediaId}`
          : `https://vidsrc.to/embed/tv/${mediaId}/${selectedSeason}/${selectedEpisode}`;
      } else {
        finalUrl = mediaType === 'movie'
          ? `https://vidlink.pro/movie/${mediaId}?player=jw&title=false&primaryColor=a855f7&iconColor=ffffff`
          : `https://vidlink.pro/tv/${mediaId}/${selectedSeason}/${selectedEpisode}?player=jw&title=false&primaryColor=a855f7&iconColor=ffffff`;
      }
      
      if (isMounted) {
        setIframeUrl(finalUrl);
      }
    };

    generateUrl();
    return () => { isMounted = false; };
  }, [mediaType, mediaId, selectedSeason, selectedEpisode, title, region]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col md:flex-row overflow-hidden">

      {/* Main Content Area */}
      <div className="flex-1 relative w-full h-full flex flex-col">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 to-transparent z-50 flex items-center gap-4 pointer-events-none transition-opacity duration-300">
          <button onClick={() => router.back()} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors pointer-events-auto backdrop-blur-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl md:text-2xl font-bold truncate text-shadow pointer-events-auto">
            {mediaType === 'tv' ? `${title} (S${selectedSeason} E${selectedEpisode})` : title}
          </h1>
          {mediaType === 'tv' && (
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="ml-auto pointer-events-auto p-2 px-4 bg-primary-600 hover:bg-primary-500 rounded-full text-sm font-bold shadow-lg">Episodes</button>
          )}
        </div>

        {/* Video Player Iframe */}
        <div className="flex-1 w-full h-full bg-black relative flex items-center justify-center">
          {/* Iframe Loading Spinner */}
          {iframeLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black pointer-events-none">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
              <p className="font-bold text-white/50 animate-pulse text-lg tracking-wide">Connecting to Secure Server...</p>
            </div>
          )}

          {iframeUrl ? (
            <iframe
              key={iframeUrl}
              src={iframeUrl}
              onLoad={() => setIframeLoading(false)}
              className={`w-full h-full border-0 outline-none relative z-20 transition-opacity duration-500 ${iframeLoading ? 'opacity-0' : 'opacity-100'}`}
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              referrerPolicy={region === 'anime' ? "origin" : "same-origin"}
              sandbox={region === 'anime' ? "allow-scripts allow-same-origin allow-forms allow-presentation" : undefined}
            />
          ) : null}
        </div>
      </div>

      {/* Sidebar for TV Episodes */}
      {mediaType === 'tv' && (
        <div className={`absolute md:relative right-0 top-0 bottom-0 w-80 bg-[#12141c]/95 backdrop-blur-xl border-l border-white/5 shadow-2xl z-[9999] transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} pt-20 md:pt-0`}>
          {/* Close button for mobile */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 p-2 bg-white/10 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="p-4 border-b border-white/5 md:mt-20">
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Select Season</h3>
            <select
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-primary-500"
              value={selectedSeason}
              onChange={(e) => {
                setSelectedSeason(Number(e.target.value));
              }}
            >
              {validSeasons.map((season) => (
                <option key={season.id} value={season.season_number}>
                  {season.name || `Season ${season.season_number}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {episodes.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setSelectedEpisode(ep.episode_number);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={`text-left p-3 rounded-xl transition-all flex flex-col gap-1 border ${selectedEpisode === ep.episode_number
                        ? 'bg-primary-600/20 text-white border-primary-500/50 shadow-inner'
                        : 'text-gray-400 hover:bg-white/5 border-transparent hover:text-white'
                      }`}
                  >
                    <span className="font-bold text-sm">
                      E{ep.episode_number} - {ep.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex justify-center p-8 text-white/40">Loading episodes...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
