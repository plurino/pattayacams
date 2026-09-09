const https = require('https');
const fs = require('fs');

const q = `[out:json];
(
  way["highway"]["name"~"ชายหาด|Beach"](12.925,100.870,12.953,100.890);
  way["highway"]["name"~"สายสอง|Second|Saisong"](12.925,100.870,12.953,100.890);
  way["highway"]["name"~"พัทยาใต้|South Pattaya"](12.924,100.870,12.930,100.880);
);
out geom;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q);

https.get(url, { headers: { 'User-Agent': 'PattayaCams/1.0' } }, (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(raw);
      console.log('Elements found:', data.elements.length);
      data.elements.forEach(e => {
        console.log(`ID: ${e.id}, Name: ${e.tags?.name || e.tags?.['name:en']}, Points: ${e.geometry?.length}`);
        if (e.geometry) {
          console.log(`   first: [${e.geometry[0].lon}, ${e.geometry[0].lat}] -> last: [${e.geometry[e.geometry.length-1].lon}, ${e.geometry[e.geometry.length-1].lat}]`);
        }
      });
      fs.writeFileSync('scripts/osm_loop_raw.json', JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
    }
  });
});
