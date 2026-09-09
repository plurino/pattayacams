const https = require('https');
const fs = require('fs');

const q = `[out:json];
(
  way["highway"](12.975,100.900,12.985,100.915);
);
out tags geom;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q);

https.get(url, { headers: { 'User-Agent': 'PattayaCams/1.0' } }, res => {
  let r = '';
  res.on('data', c => r += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(r);
      console.log('Lan Pho ways count:', d.elements.length);
      fs.writeFileSync('scripts/osm_lan_pho.json', JSON.stringify(d, null, 2));
      d.elements.filter(e => e.tags?.name).forEach(e => {
        console.log(`${e.id} | ${e.tags.name} | ${e.tags['name:en']} | pts: ${e.geometry?.length}`);
      });
    } catch (err) {
      console.error(err);
    }
  });
});
