// scratch/build_2026_transit_routes.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = 'c:\\Users\\K\\pattayaCams';

function getBaseCoordinates() {
  const raw = execSync('git show HEAD~1:public/data/pattaya_baht_bus.json', { cwd: rootDir }).toString();
  const data = JSON.parse(raw);
  const map = {};
  data.features.forEach(f => {
    map[f.id] = f.geometry.coordinates;
  });
  return map;
}

function run() {
  console.log('Restoring and building verified 2026 transit routes without side-soi detours...');
  const baseCoords = getBaseCoordinates();

  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "route-beach-loop",
        properties: {
          route_id: "beach-second-loop",
          name: "Beach Road Route",
          name_th: "สายถนนเลียบชายหาด - ถนนพัทยาสายสอง",
          color: "#EF4444", // Red matching Verified 2026 Map
          fare_thb: "15–20",
          direction: "One-Way Clockwise Loop (Beach Rd Southbound ➔ Second Rd Northbound)",
          frequency: "Every 1-2 minutes (24/7 continuous)",
          description: "The easiest route for first-time visitors, running along Beach Road and Second Road through central Pattaya.",
          streets: "Pattaya Beach Road, South Pattaya Road, Pattaya Second Road"
        },
        geometry: {
          type: "LineString",
          coordinates: baseCoords['route-circular-loop']
        }
      },
      {
        type: "Feature",
        id: "route-naklua-line",
        properties: {
          route_id: "naklua-line",
          name: "Naklua Route",
          name_th: "สายวงเวียนปลาโลมา - ตลาดลานโพธิ์นาเกลือ",
          color: "#0284C7", // Sky Blue matching Verified 2026 Map
          fare_thb: "15–20",
          direction: "Two-Way Corridor: Terminal 21 / Dolphin Roundabout ⇄ Naklua Market",
          frequency: "Every 5-8 minutes (06:00 - 22:00)",
          description: "Connects central Pattaya with the Naklua area and local attractions such as Naklua Market.",
          streets: "Pattaya-Naklua Road"
        },
        geometry: {
          type: "LineString",
          coordinates: baseCoords['route-naklua-line']
        }
      },
      {
        type: "Feature",
        id: "route-jomtien-line",
        properties: {
          route_id: "jomtien-line",
          name: "Jomtien Route",
          name_th: "สายพัทยาใต้ - ชายหาดจอมเทียน",
          color: "#22C55E", // Green matching Verified 2026 Map
          fare_thb: "15–20",
          direction: "Two-Way Corridor: South Pattaya (Second Rd) ⇄ Thappraya Rd ⇄ Jomtien Beach",
          frequency: "Every 3-5 minutes (06:00 - 02:00)",
          description: "Runs south from Pattaya toward Jomtien Beach, making it easy to reach the beach area.",
          streets: "South Pattaya Road, Thappraya Road, Jomtien Beach Road"
        },
        geometry: {
          type: "LineString",
          coordinates: baseCoords['route-jomtien-line']
        }
      },
      {
        type: "Feature",
        id: "route-buakhao-line",
        properties: {
          route_id: "buakhao-line",
          name: "Soi Buakhao Route",
          name_th: "สายซอยบัวขาว (พัทยากลาง - พัทยาใต้)",
          color: "#2563EB", // Vibrant Navy Blue matching Verified 2026 Map
          fare_thb: "15–20",
          direction: "Two-Way Corridor: Central Pattaya Rd (Klang) ⇄ Soi Buakhao ⇄ South Pattaya Rd (Tai)",
          frequency: "Every 2-3 minutes (24/7 continuous)",
          description: "Connects Pattaya Klang and Pattaya Tai through the Soi Buakhao area, popular with long-stay visitors and local residents.",
          streets: "Soi Buakhao"
        },
        geometry: {
          type: "LineString",
          coordinates: baseCoords['route-buakhao-line']
        }
      }
    ]
  };

  const jsonOut = path.join(rootDir, 'public', 'data', 'pattaya_baht_bus.json');
  const geojsonOut = path.join(rootDir, 'public', 'data', 'pattaya_baht_bus.geojson');

  fs.writeFileSync(jsonOut, JSON.stringify(geojson, null, 2), 'utf8');
  fs.writeFileSync(geojsonOut, JSON.stringify(geojson, null, 2), 'utf8');

  // Also copy to scripts/build_2026_transit_routes.mjs
  const scriptDest = path.join(rootDir, 'scripts', 'build_2026_transit_routes.mjs');
  fs.copyFileSync(new URL(import.meta.url), scriptDest);

  console.log(`✓ Successfully updated ${jsonOut} and ${geojsonOut}!`);
  geojson.features.forEach(f => {
    console.log(`  - [${f.properties.color}] ${f.properties.name} (${f.geometry.coordinates.length} pts): ${f.properties.streets}`);
  });
}

run();
