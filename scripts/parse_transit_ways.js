const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scripts/osm_transit_ways.json', 'utf8'));
const ways = raw.elements;

console.log('Total ways:', ways.length);

const nakluaWays = ways.filter(w => (w.tags?.name && w.tags.name.includes('นาเกลือ')) || (w.tags?.['name:en'] && w.tags['name:en'].toLowerCase().includes('naklua')));
console.log('Naklua ways:', nakluaWays.length);

const thapprayaWays = ways.filter(w => (w.tags?.name && w.tags.name.includes('ทัพพระยา')) || (w.tags?.['name:en'] && w.tags['name:en'].toLowerCase().includes('thap')));
console.log('Thappraya ways:', thapprayaWays.length);

const jomtienBeachWays = ways.filter(w => (w.tags?.name && w.tags.name.includes('จอมเทียน')) || (w.tags?.['name:en'] && w.tags['name:en'].toLowerCase().includes('jomtien')));
console.log('Jomtien Beach ways:', jomtienBeachWays.length);

// Print main ways sorted by latitude
nakluaWays.sort((a, b) => (a.geometry?.[0]?.lat || 0) - (b.geometry?.[0]?.lat || 0));
nakluaWays.slice(0, 10).forEach(w => {
  console.log(`Naklua: ${w.id} ${w.tags?.name} pts: ${w.geometry?.length} start: [${w.geometry[0].lon}, ${w.geometry[0].lat}] end: [${w.geometry[w.geometry.length-1].lon}, ${w.geometry[w.geometry.length-1].lat}]`);
});
