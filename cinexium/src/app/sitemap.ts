import type { MetadataRoute } from 'next'
import { tmdb } from '@/lib/tmdb'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://cinexium.site'
  
  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/movies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/series`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  try {
    // Fetch popular items to include in the sitemap for dynamic discovery
    // Since TMDB has millions of items, we'll index the most popular ones to help crawlers discover content
    const popularMovies = await tmdb.getMovies('popular', 'hollywood')
    const popularSeries = await tmdb.getSeries('popular', 'hollywood')
    const anime = await tmdb.getSeries('popular', 'anime')
    
    // Add popular movies
    popularMovies.forEach((movie) => {
      entries.push({
        url: `${baseUrl}/movie/${movie.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    })

    // Add popular series
    popularSeries.forEach((series) => {
      entries.push({
        url: `${baseUrl}/series/${series.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    })

    // Add popular anime
    anime.forEach((series) => {
      entries.push({
        url: `${baseUrl}/series/${series.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    })

  } catch (error) {
    console.error('Error fetching dynamic sitemap routes:', error)
  }

  return entries
}
