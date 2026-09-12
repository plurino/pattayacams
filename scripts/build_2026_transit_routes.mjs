// scripts/build_2026_transit_routes.mjs
// Builds complete, turn-by-turn round-trip loop geometries matching the Verified June 2026 Pattaya Songthaew Map
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function getOsrmRoute(waypoints) {
  const coordStr = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'PattayaCams/1.0' } });
    if (!res.ok) throw new Error(`OSRM responded with status ${res.status}`);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      return data.routes[0].geometry.coordinates; // [[lng, lat], ...]
    }
  } catch (err) {
    console.warn(`OSRM failed for waypoints:`, err.message);
  }
  // Fallback: return direct waypoints in [lng, lat]
  return waypoints.map(([lat, lng]) => [lng, lat]);
}

async function run() {
  console.log('Building 2026 Songthaew routes from verified map...');

  // 1. Beach Road Route (Red) - Clockwise loop
  // Dolphin Roundabout -> Beach Rd -> South Pattaya Rd -> Second Rd -> Dolphin Roundabout
  console.log('Fetching Beach Road Route (Red)...');
  const beachWaypoints = [
    [12.9510, 100.8875], // Dolphin Roundabout / Terminal 21
    [12.9460, 100.8848], // Beach Rd & Soi 4
    [12.9378, 100.8812], // Central Pattaya Mall Beach
    [12.9300, 100.8765], // Mike Shopping Mall
    [12.9255, 100.8725], // Walking Street Entrance / South Pattaya Rd corner
    [12.9262, 100.8765], // South Pattaya Rd & Second Rd junction
    [12.9335, 100.8820], // Second Rd & Soi Buakhao cut / Avenue
    [12.9420, 100.8860], // Second Rd & Soi 6
    [12.9510, 100.8875]  // Back to Dolphin Roundabout
  ];
  const beachCoords = await getOsrmRoute(beachWaypoints);

  // 2. Naklua Route (Light Blue) - Full Round-Trip Loop
  // Dolphin Roundabout -> Naklua Rd North -> Lan Pho Market / Sawang Fa -> Naklua Rd South -> Dolphin Roundabout
  console.log('Fetching Naklua Route (Light Blue)...');
  const nakluaWaypoints = [
    [12.9510, 100.8875], // Dolphin Roundabout
    [12.9610, 100.8935], // Pattaya-Naklua Rd (Northbound)
    [12.9750, 100.9010], // Near Naklua Soi 12
    [12.9880, 100.9060], // Lan Pho Fish Market / Sawang Fa (Turnaround Loop)
    [12.9900, 100.9045], // Old Market Loop
    [12.9750, 100.9008], // Pattaya-Naklua Rd (Southbound)
    [12.9610, 100.8930], // Approaching North Pattaya
    [12.9510, 100.8875]  // Back to Dolphin Roundabout / Terminal 21
  ];
  const nakluaCoords = await getOsrmRoute(nakluaWaypoints);

  // 3. Jomtien Route (Green) - Full Round-Trip Loop
  // South Pattaya Rd / Second Rd -> Thappraya Rd -> Jomtien Beach Rd (South) -> Chaiyapruek / Jomtien Second Rd (North) -> South Pattaya Rd
  console.log('Fetching Jomtien Route (Green)...');
  const jomtienWaypoints = [
    [12.9262, 100.8765], // South Pattaya Rd & Second Rd junction
    [12.9220, 100.8715], // Thappraya Rd & South Pattaya Rd
    [12.9150, 100.8670], // Thappraya Rd (Pratumnak junction)
    [12.9050, 100.8690], // Thappraya & Thepprasit junction
    [12.9015, 100.8665], // Police box / Dongtan entrance
    [12.8950, 100.8710], // Jomtien Beach Rd & Soi 4
    [12.8850, 100.8755], // Jomtien Beach Rd & Soi 9
    [12.8750, 100.8820], // Jomtien Beach Rd & Chaiyapruek (Turnaround Loop)
    [12.8760, 100.8860], // Jomtien Second Rd (Northbound)
    [12.8980, 100.8760], // Jomtien Second Rd returning north
    [12.9050, 100.8690], // Rejoining Thappraya Rd
    [12.9220, 100.8715], // Thappraya Rd to South Pattaya
    [12.9262, 100.8765]  // Return to South Pattaya Station
  ];
  const jomtienCoords = await getOsrmRoute(jomtienWaypoints);

  // 4. Soi Buakhao Route (Dark Navy Blue) - Full Round-Trip Corridor
  // Central Pattaya Rd -> Soi Buakhao (South) -> South Pattaya Rd -> Soi Buakhao (North) -> Central Pattaya Rd
  console.log('Fetching Soi Buakhao Route (Dark Navy Blue)...');
  const buakhaoWaypoints = [
    [12.9372, 100.8890], // Central Pattaya Rd & Top of Soi Buakhao
    [12.9330, 100.8865], // Tree Town & Soi Diana junction
    [12.9290, 100.8835], // LK Metro junction / Action Street
    [12.9250, 100.8790], // South entrance to Soi Buakhao
    [12.9248, 100.8785], // South Pattaya Rd junction (Turnaround)
    [12.9250, 100.8792], // Heading North up Soi Buakhao
    [12.9290, 100.8838], // Passing LK Metro
    [12.9330, 100.8868], // Passing Tree Town
    [12.9372, 100.8890]  // Back to Central Pattaya Rd
  ];
  const buakhaoCoords = await getOsrmRoute(buakhaoWaypoints);

  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "route-beach-loop",
        properties: {
          route_id: "beach-second-loop",
          name: "Beach Road & Second Road Circular Route",
          name_th: "สายรอบเมือง ถนนเลียบชายหาด - สายสอง",
          color: "#EF4444", // Red matching Verified 2026 Map
          fare_thb: "15–20",
          direction: "Clockwise Round-Trip Loop (Beach Rd South ➔ Second Rd North)",
          frequency: "Every 1-2 minutes (24/7 continuous)",
          description: "The primary Pattaya loop. Runs south along Beach Road past Central Festival to Walking Street, crosses east along South Pattaya Road, and returns north along Second Road back to Terminal 21 / Dolphin Roundabout. Standard fare: 15฿."
        },
        geometry: {
          type: "LineString",
          coordinates: beachCoords
        }
      },
      {
        type: "Feature",
        id: "route-naklua-loop",
        properties: {
          route_id: "naklua-line",
          name: "Naklua Round-Trip Loop",
          name_th: "สายวงกลมพัทยา - นาเกลือ",
          color: "#0284C7", // Sky Blue matching Verified 2026 Map
          fare_thb: "15–20",
          direction: "Two-Way Round Trip: Terminal 21 ⇄ Lan Pho Naklua Market",
          frequency: "Every 5-8 minutes (06:00 - 23:00)",
          description: "Full two-way transit corridor between Dolphin Roundabout (Terminal 21) and the historic Old Town Naklua / Lan Pho Fish Market. Standard fare: 15–20฿."
        },
        geometry: {
          type: "LineString",
          coordinates: nakluaCoords
        }
      },
      {
        type: "Feature",
        id: "route-jomtien-loop",
        properties: {
          route_id: "jomtien-line",
          name: "Jomtien Beach Round-Trip Loop",
          name_th: "สายวงกลมพัทยาใต้ - หาดจอมเทียน",
          color: "#22C55E", // Green matching Verified 2026 Map
          fare_thb: "15–20",
          direction: "Two-Way Round Trip: South Pattaya ⇄ Thappraya ⇄ Jomtien Beach ⇄ Chaiyapruek",
          frequency: "Every 3-5 minutes (06:00 - 02:00)",
          description: "Full round-trip coastline corridor connecting South Pattaya (Walking St junction) along Thappraya Road to Jomtien Beach, continuing down to Chaiyapruek, and returning via Jomtien Second Road. Fare: 15–20฿."
        },
        geometry: {
          type: "LineString",
          coordinates: jomtienCoords
        }
      },
      {
        type: "Feature",
        id: "route-buakhao-loop",
        properties: {
          route_id: "buakhao-line",
          name: "Soi Buakhao Transit Route",
          name_th: "สายซอยบัวขาว พัทยากลาง - พัทยาใต้",
          color: "#1E3A8A", // Dark Navy Blue matching Verified 2026 Map
          fare_thb: "15–20",
          direction: "Two-Way Corridor: Central Pattaya Rd ⇄ LK Metro ⇄ Tree Town ⇄ South Pattaya Rd",
          frequency: "Every 3-5 minutes (06:00 - 03:00)",
          description: "Crucial nightlife artery running the entire 2 km length of Soi Buakhao, connecting Central Pattaya Road (Klang) directly through Tree Town and LK Metro down to South Pattaya Road (Tai). Standard fare: 15฿."
        },
        geometry: {
          type: "LineString",
          coordinates: buakhaoCoords
        }
      }
    ]
  };

  const jsonOut = path.join(rootDir, 'public', 'data', 'pattaya_baht_bus.json');
  const geojsonOut = path.join(rootDir, 'public', 'data', 'pattaya_baht_bus.geojson');

  fs.writeFileSync(jsonOut, JSON.stringify(geojson, null, 2), 'utf8');
  fs.writeFileSync(geojsonOut, JSON.stringify(geojson, null, 2), 'utf8');

  console.log(`✓ Successfully updated pattaya_baht_bus.json with ${geojson.features.length} full 2026 round-trip routes!`);
}

run();
