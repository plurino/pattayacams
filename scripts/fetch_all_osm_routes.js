const https = require('https');
const fs = require('fs');

// Query OSM for Naklua road, Thappraya road, and Jomtien Beach road
const q = `[out:json];
(
  way["highway"]["name"~"นาเกลือ|Naklua"](12.948,100.880,12.985,100.910);
  way["highway"]["name"~"ทัพพระยา|Thap Phraya|Thappraya"](12.890,100.860,12.930,100.885);
  way["highway"]["name"~"หาดจอมเทียน|Jomtien Beach"](12.860,100.870,12.905,100.900);
);
out geom;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q);

https.get(url, { headers: { 'User-Agent': 'PattayaCams/1.0' } }, res => {
  let r = '';
  res.on('data', c => r += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(r);
      console.log('Total transit ways retrieved:', data.elements.length);
      fs.writeFileSync('scripts/osm_transit_ways.json', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Parse error:', e);
    }
  });
}).on('error', console.error);
