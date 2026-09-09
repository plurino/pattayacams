const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scripts/osm_transit_ways.json', 'utf8'));
const ways = raw.elements;

const thapprayaWays = ways.filter(w => (w.tags?.name && w.tags.name.includes('ทัพพระยา')) || (w.tags?.['name:en'] && w.tags['name:en'].toLowerCase().includes('thap')));

console.log('Thappraya ways count:', thapprayaWays.length);
thapprayaWays.sort((a, b) => (b.geometry?.length || 0) - (a.geometry?.length || 0));
thapprayaWays.slice(0, 10).forEach(w => {
  console.log(`ID: ${w.id} | name: ${w.tags?.name} | pts: ${w.geometry?.length} | start: [${w.geometry[0].lon}, ${w.geometry[0].lat}] -> end: [${w.geometry[w.geometry.length-1].lon}, ${w.geometry[w.geometry.length-1].lat}]`);
});
