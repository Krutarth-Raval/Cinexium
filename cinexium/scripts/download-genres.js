const fs = require('fs');
const https = require('https');
const path = require('path');

const regions = ['hollywood', 'bollywood', 'anime'];
const genres = ['All', 'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 'Thriller', 'Animation', 'Documentary'];

let count = 0;
async function download() {
  for (const region of regions) {
    for (const genre of genres) {
      count++;
      const filename = path.join('public', 'genres', `${region}-${genre.toLowerCase()}.jpg`);
      const url = `https://picsum.photos/seed/${count}/600/400`;
      
      await new Promise((resolve) => {
        https.get(url, (res) => {
          if (res.statusCode === 302 || res.statusCode === 301) {
            https.get(res.headers.location, (res2) => {
              const file = fs.createWriteStream(filename);
              res2.pipe(file);
              file.on('finish', () => { file.close(); resolve(); });
            });
          } else {
            const file = fs.createWriteStream(filename);
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
          }
        });
      });
      console.log('Downloaded', filename);
    }
  }
}
download();
