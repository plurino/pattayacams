const fs = require('fs');
const https = require('https');
const q = `[out:json];
way["highway"~"primary|secondary|tertiary|trunk"](12.925,100.865,12.955,100.890);
out tags geom;`;
https.get('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q), { headers: { 'User-Agent': 'PattayaCams/1.0' } }, res => {
  let r = ''; res.on('data', c => r += c);
  res.on('end', () => {
    try {
      const d = JSON.parse(r);
      console.log('Total major ways:', d.elements.length);
      d.elements.forEach(e => {
        console.log(`${e.id} | ${e.tags.name} | ${e.tags['name:en']} | hw: ${e.tags.highway} | pts: ${e.geometry?.length}`);
      });
      fs.writeFileSync('scripts/osm_main_roads.json', JSON.stringify(d, null, 2));
    } catch (err) {
      console.error(err);
    }
  });
});
