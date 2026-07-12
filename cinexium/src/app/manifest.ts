import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cinexium',
    short_name: 'Cinexium',
    description: 'Discover trending movies and TV series, explore ratings, build your ultimate watchlist, and connect with cinema fans worldwide.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f1115',
    theme_color: '#151519',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
