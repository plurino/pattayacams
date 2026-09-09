const https = require('https');

function searchYT(q) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=CAMSAkAB`; // sp=CAMSAkAB filters for live streams!
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const matches = [];
        const regex = /"videoRenderer":{"videoId":"([a-zA-Z0-9_-]{11})","thumbnail":{"thumbnails":\[.*?\]},"title":{"runs":\[{"text":"(.*?)"}\]/g;
        let m;
        while ((m = regex.exec(d)) !== null) {
          matches.push({ videoId: m[1], title: m[2] });
        }
        resolve(matches);
      });
    }).on('error', () => resolve([]));
  });
}

async function main() {
  console.log('Searching for live Pattaya streams...');
  const queries = ['pattaya live cam', 'pattaya beach live', 'walking street pattaya live', 'jomtien beach live'];
  for (const q of queries) {
    const res = await searchYT(q);
    console.log(`Query "${q}": found ${res.length} live streams`);
    res.slice(0, 5).forEach(r => console.log(`  - [${r.videoId}] ${r.title}`));
  }
}

main();
