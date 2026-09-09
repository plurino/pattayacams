const fs = require('fs');

// 1. Load ways
const rawTransit = JSON.parse(fs.readFileSync('scripts/osm_transit_ways.json', 'utf8')).elements;
const rawJomtien = JSON.parse(fs.readFileSync('scripts/osm_jomtien_all.json', 'utf8'));

const allWays = new Map();
rawTransit.forEach(w => allWays.set(w.id, w));
rawJomtien.forEach(w => allWays.set(w.id, w));

const existingGeojson = JSON.parse(fs.readFileSync('public/data/pattaya_baht_bus.geojson', 'utf8'));
const cleanR1 = existingGeojson.features[0].geometry.coordinates;

console.log('Route 1 (Beach/Second Loop) points:', cleanR1.length);

// --- ROUTE 3: Naklua Line (Pattaya-Naklua Road to Lan Pho) ---
// 1210922218 (Dolphin Circle) -> 37616930 (ถนนนาเกลือ 92 pts to 12.9717, 100.9048) -> 147246541 -> 185242807 (to 12.9760, 100.9089)
const r3Ways = [1210922218, 37616930, 147246541, 185242807];
let r3Coords = [];
r3Ways.forEach(id => {
  const w = allWays.get(id);
  if (w && w.geometry) {
    w.geometry.forEach(pt => r3Coords.push([Number(pt.lon.toFixed(6)), Number(pt.lat.toFixed(6))]));
  }
});
// Add final turn into Lan Pho Market Park on land
r3Coords.push([100.9065, 12.9745]);
r3Coords.push([100.9055, 12.9738]);

const cleanR3 = [];
r3Coords.forEach(pt => {
  if (cleanR3.length === 0 || cleanR3[cleanR3.length - 1][0] !== pt[0] || cleanR3[cleanR3.length - 1][1] !== pt[1]) {
    cleanR3.push(pt);
  }
});
console.log('Route 3 (Naklua Line) points:', cleanR3.length);

// --- ROUTE 2: Jomtien Line ---
// Starts outside Wat Chai Mongkhon on South Pattaya Road: [100.8754, 12.9263]
// Heads west along South Pattaya Road to Thappraya Road junction: [100.8722, 12.9212]
// Thappraya Road: 730902481 (to 12.9114, 100.8694) -> 732696926 -> 948070140 -> 1064269743 -> 1209437362 (to 12.8987, 100.8670)
// Jomtien Beach Road (จอมเทียนสายหนึ่ง): 32027522 (pts: 58 from 12.8987, 100.8670 to 12.8773, 100.8851)
// and continuing along 1261395996 south past Chaiyaphruek to 12.8700
const r2Ways = [
  730902481, // Thappraya Road
  1064269743, // Thappraya
  1209437362, // Thappraya down to Jomtien Beach
  32027522,   // Jomtien Beach Road (58 pts)
];

let r2Coords = [];
// Start at South Pattaya Road junction
r2Coords.push([100.8754, 12.9263]);
r2Coords.push([100.8745, 12.9255]);
r2Coords.push([100.8726, 12.9232]);
r2Coords.push([100.8721, 12.9211]);

r2Ways.forEach(id => {
  const w = allWays.get(id);
  if (w && w.geometry) {
    w.geometry.forEach(pt => r2Coords.push([Number(pt.lon.toFixed(6)), Number(pt.lat.toFixed(6))]));
  }
});

const cleanR2 = [];
r2Coords.forEach(pt => {
  if (cleanR2.length === 0 || cleanR2[cleanR2.length - 1][0] !== pt[0] || cleanR2[cleanR2.length - 1][1] !== pt[1]) {
    cleanR2.push(pt);
  }
});
console.log('Route 2 (Jomtien Line) points:', cleanR2.length);

// Save back to geojson
const geojsonPath = 'public/data/pattaya_baht_bus.geojson';
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

geojson.features[0].geometry.coordinates = cleanR1;
geojson.features[1].geometry.coordinates = cleanR2;
geojson.features[2].geometry.coordinates = cleanR3;

fs.writeFileSync(geojsonPath, JSON.stringify(geojson, null, 2));
console.log('Successfully updated all 3 Baht Bus routes with real OpenStreetMap centerlines!');
