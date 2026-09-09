const https = require('https');
const q = `[out:json];
(
  node["name"~"Sanctuary of Truth|ปราสาทสัจธรรม"](12.95,100.87,12.99,100.90);
  way["name"~"Sanctuary of Truth|ปราสาทสัจธรรม"](12.95,100.87,12.99,100.90);
);
out center;`;
https.get('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q), { headers: { 'User-Agent': 'PattayaCams/1.0' } }, res => {
  let r = ''; res.on('data', c => r += c);
  res.on('end', () => console.log('Sanctuary node:', r));
});
