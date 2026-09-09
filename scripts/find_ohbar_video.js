const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log('Redirecting to:', res.headers.location);
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const html = await fetchUrl('https://www.youtube.com/@PattayaOhBar/live');
    const canonMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
    if (canonMatch) {
      console.log('Canonical Live Video ID:', canonMatch[1]);
    }
    const idMatches = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
    if (idMatches) {
      console.log('Matched video IDs (first 5):', idMatches.slice(0, 5));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
