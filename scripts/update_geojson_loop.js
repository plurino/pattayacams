const fs = require('fs');

const rawRoads = JSON.parse(fs.readFileSync('scripts/osm_main_roads.json', 'utf8'));
const wayMap = new Map();
rawRoads.elements.forEach(w => wayMap.set(w.id, w));

// Build Beach Road southbound:
// 145284625 -> 350135615 -> 722363651 -> 312083840 -> 350135618
const beachOrder = [145284625, 350135615, 722363651, 312083840, 350135618];
let loopCoords = [];

beachOrder.forEach(id => {
  const w = wayMap.get(id);
  if (w && w.geometry) {
    w.geometry.forEach(pt => {
      loopCoords.push([Number(pt.lon.toFixed(6)), Number(pt.lat.toFixed(6))]);
    });
  }
});

// Connect South Pattaya Road (Pattaya Tai):
const tai = wayMap.get(726003978);
if (tai && tai.geometry) {
  tai.geometry.forEach(pt => {
    loopCoords.push([Number(pt.lon.toFixed(6)), Number(pt.lat.toFixed(6))]);
  });
}

// Second Road northbound:
const secondOrder = [
  35129327,
  945012936,
  945012934,
  1219573624,
  945012935,
  724142652,
  724142653,
  945940628,
  945051119,
  722272214
];

secondOrder.forEach(id => {
  const w = wayMap.get(id);
  if (w && w.geometry) {
    w.geometry.forEach(pt => {
      loopCoords.push([Number(pt.lon.toFixed(6)), Number(pt.lat.toFixed(6))]);
    });
  }
});

// Remove adjacent duplicate coordinates
const cleanLoop = [];
loopCoords.forEach(pt => {
  if (cleanLoop.length === 0) {
    cleanLoop.push(pt);
  } else {
    const last = cleanLoop[cleanLoop.length - 1];
    if (last[0] !== pt[0] || last[1] !== pt[1]) {
      cleanLoop.push(pt);
    }
  }
});

// Close loop back to first point
cleanLoop.push(cleanLoop[0]);

console.log(`Clean loop points: ${cleanLoop.length}`);

// Load existing geojson
const geojsonPath = 'public/data/pattaya_baht_bus.geojson';
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

geojson.features[0].geometry.coordinates = cleanLoop;

// Adjust Naklua line end point so it doesn't end in the water
const nakluaCoords = geojson.features[2].geometry.coordinates;
nakluaCoords[nakluaCoords.length - 1] = [100.9035, 12.9820];

fs.writeFileSync(geojsonPath, JSON.stringify(geojson, null, 2));
console.log('Successfully updated pattaya_baht_bus.geojson!');
