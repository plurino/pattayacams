const https = require('https');
const q = `[out:json];
(
  node["name"~"ลานโพธิ์|Lan Pho|Lanpho"](12.95,100.88,12.99,100.92);
  way["name"~"ลานโพธิ์|Lan Pho|Lanpho"](12.95,100.88,12.99,100.92);
);
out center;`;
https.get('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q), { headers: { 'User-Agent': 'PattayaCams/1.0' } }, res => {
  let r = ''; res.on('data', c => r += c);
  res.on('end', () => console.log('Lan Pho node:', r));
});
