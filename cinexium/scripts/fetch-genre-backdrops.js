const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const movieGenreMap = {
  'action': '28',
  'comedy': '35',
  'drama': '18',
  'sci-fi': '878',
  'horror': '27',
  'romance': '10749',
  'thriller': '53',
  'animation': '16',
  'documentary': '99'
};

const tvGenreMap = {
  'action': '10759',
  'comedy': '35',
  'drama': '18',
  'sci-fi': '10765',
  'horror': '9648',
  'romance': '18',
  'thriller': '80',
  'animation': '16',
  'documentary': '99'
};

const genres = ['All', 'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 'Thriller', 'Animation', 'Documentary'];
const regions = ['hollywood', 'bollywood', 'anime'];
const types = ['movie', 'tv'];

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return resolve(false);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function fetchUniqueResult(type, baseRegionFilter, regionFilter, usedIds) {
  const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
  const sortFilter = `&sort_by=popularity.desc&vote_count.gte=100`;
  
  // Try region-specific with genre
  let url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=en-US&page=1${regionFilter}${sortFilter}`;
  let data = await fetchJSON(url);
  let results = data.results || [];
  let bestResult = results.find(r => r.backdrop_path && !usedIds.has(r.id));
  
  // Try page 2 if page 1 is exhausted
  if (!bestResult && results.length > 0) {
    url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=en-US&page=2${regionFilter}${sortFilter}`;
    data = await fetchJSON(url);
    results = data.results || [];
    bestResult = results.find(r => r.backdrop_path && !usedIds.has(r.id));
  }
  
  // Fallback to the SAME REGION (no genre filter) if no unique result found for that genre
  if (!bestResult) {
    url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=en-US&page=1${baseRegionFilter}${sortFilter}`;
    data = await fetchJSON(url);
    results = data.results || [];
    bestResult = results.find(r => r.backdrop_path && !usedIds.has(r.id));
  }
  
  // Fallback to page 2 of the SAME REGION if page 1 is exhausted
  if (!bestResult) {
    url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=en-US&page=2${baseRegionFilter}${sortFilter}`;
    data = await fetchJSON(url);
    results = data.results || [];
    bestResult = results.find(r => r.backdrop_path && !usedIds.has(r.id));
  }
  
  return bestResult;
}

async function main() {
  for (const type of types) {
    const genreMap = type === 'tv' ? tvGenreMap : movieGenreMap;
    
    for (const region of regions) {
      const usedIds = new Set();
      
      for (const genreName of genres) {
        const lowerGenre = genreName.toLowerCase();
        const genreId = lowerGenre === 'all' ? undefined : genreMap[lowerGenre];
        
        let baseRegionFilter = '';
        let regionFilter = '';
        if (region === 'bollywood') {
          baseRegionFilter = '&with_original_language=hi';
          regionFilter = baseRegionFilter + (genreId ? `&with_genres=${genreId}` : '');
        } else if (region === 'anime') {
          baseRegionFilter = '&with_original_language=ja&with_genres=16';
          regionFilter = genreId ? `${baseRegionFilter},${genreId}` : baseRegionFilter;
        } else {
          baseRegionFilter = '&with_original_language=en&without_genres=16';
          regionFilter = genreId ? `${baseRegionFilter}&with_genres=${genreId}` : baseRegionFilter;
        }

        try {
          const bestResult = await fetchUniqueResult(type, baseRegionFilter, regionFilter, usedIds);
          
          if (bestResult && bestResult.backdrop_path) {
            usedIds.add(bestResult.id);
            const dir = path.join('public', 'genres', type, region);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            
            const filename = path.join(dir, `${genreName.toLowerCase()}.jpg`);
            const imageUrl = `https://image.tmdb.org/t/p/w500${bestResult.backdrop_path}`;
            
            await downloadImage(imageUrl, filename);
            console.log(`Downloaded ${filename} (${bestResult.title || bestResult.name})`);
          } else {
            console.log(`No backdrop found for ${type} ${region} ${genreName}`);
          }
        } catch (e) {
          console.error(`Error for ${type} ${region} ${genreName}:`, e.message);
        }
      }
    }
  }
}

main();
