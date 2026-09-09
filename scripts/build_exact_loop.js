const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scripts/osm_main_roads.json', 'utf8'));
const ways = raw.elements;
const wayMap = new Map();
ways.forEach(w => wayMap.set(w.id, w));

// Beach Road southbound ways (North to South)
// 722363651 -> 350135618 -> 350135615 -> 312083840 -> 145284625
const beachWayIds = [722363651, 350135618, 350135615, 312083840, 145284625];
let beachCoords = [];

beachWayIds.forEach(id => {
  const w = wayMap.get(id);
  if (w && w.geometry) {
    console.log(`Beach way ${id}: start [${w.geometry[0].lon}, ${w.geometry[0].lat}] -> end [${w.geometry[w.geometry.length-1].lon}, ${w.geometry[w.geometry.length-1].lat}]`);
    w.geometry.forEach(pt => {
      beachCoords.push([Number(pt.lon.toFixed(6)), Number(pt.lat.toFixed(6))]);
    });
  }
});

// South Pattaya Road (Pattaya Tai) connecting Beach Road to Second Road
// South end of Beach Road is at ~12.9274, 100.8746
// South Pattaya Road way 726003978 connects from [100.8746867, 12.9274469] to [100.8754602, 12.9263337] (Second Road intersection)
const taiWay = wayMap.get(726003978);
console.log(`Tai way 726003978:`, taiWay ? taiWay.geometry : 'not found');

// Second Road northbound ways (South to North)
// From [100.8754602, 12.9263337] going north to Dolphin Roundabout
const secondWayIds = [
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

let secondCoords = [];
secondWayIds.forEach(id => {
  const w = wayMap.get(id);
  if (w && w.geometry) {
    console.log(`Second way ${id}: start [${w.geometry[0].lon}, ${w.geometry[0].lat}] -> end [${w.geometry[w.geometry.length-1].lon}, ${w.geometry[w.geometry.length-1].lat}]`);
    w.geometry.forEach(pt => {
      secondCoords.push([Number(pt.lon.toFixed(6)), Number(pt.lat.toFixed(6))]);
    });
  }
});

console.log(`Total beach points: ${beachCoords.length}, second points: ${secondCoords.length}`);
