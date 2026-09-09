const https = require('https');

async function searchPattaya(q) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const matches = [];
        const regex = /"videoRenderer":{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":{"runs":\[{"text":"(.*?)"}\]}.*?"ownerText":{"runs":\[{"text":"(.*?)"/g;
        let m;
        while ((m = regex.exec(d)) !== null) {
          matches.push({ id: m[1], title: m[2], channel: m[3] });
        }
        resolve(matches);
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  const queries = [
    'pattaya live stream cam 24/7',
    'pattaya webcam live',
    'pattaya soi 6 live',
    'tree town live cam pattaya',
    'walking street live 4k pattaya'
  ];
  for (const q of queries) {
    const list = await searchPattaya(q);
    console.log(`=== ${q} ===`);
    list.slice(0, 5).forEach(x => console.log(`[${x.id}] ${x.channel}: ${x.title}`));
  }
}

run();
