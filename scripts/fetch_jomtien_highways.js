const https = require('https');
const fs = require('fs');

const q = `[out:json];
(
  way["highway"](12.860,100.865,12.902,100.895);
);
out tags geom;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q);

https.get(url, { headers: { 'User-Agent': 'PattayaCams/1.0' } }, res => {
  let r = '';
  res.on('data', c => r += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(r);
      console.log('Jomtien ways count:', d.elements.length);
      const coastal = d.elements.filter(w => {
        if (!w.geometry) return false;
        // coastal road is between 100.865 and 100.890 and runs northwest to southeast
        return w.tags?.highway && (w.tags?.name || w.tags?.['name:en']);
      });
      console.log('Named highways:', coastal.length);
      fs.writeFileSync('scripts/osm_jomtien_all.json', JSON.stringify(coastal, null, 2));
    } catch (e) {
      console.error(e);
    }
  });
});
