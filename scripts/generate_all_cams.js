const fs = require('fs');
const path = require('path');

const seedFile = path.join(__dirname, '..', 'public', 'data', 'cctv_cams.json');
const seedCams = JSON.parse(fs.readFileSync(seedFile, 'utf8'));

// Zones and coordinate ranges for realistic expansion
const zones = [
  { zone: 'central_beach', name: 'Beach Road & Central', name_th: 'ถนนเลียบชายหาดและพัทยากลาง', latMin: 12.930, latMax: 12.948, lngMin: 100.880, lngMax: 100.888 },
  { zone: 'soi_6', name: 'Soi 6 District', name_th: 'ซอย 6 พัทยา', latMin: 12.942, latMax: 12.946, lngMin: 100.884, lngMax: 100.890 },
  { zone: 'soi_buakhao', name: 'Soi Buakhao Corridor', name_th: 'ซอยบัวขาว', latMin: 12.925, latMax: 12.938, lngMin: 100.885, lngMax: 100.892 },
  { zone: 'walking_street', name: 'Walking Street & Bali Hai', name_th: 'วอล์คกิ้งสตรีทและแหลมบาลีฮาย', latMin: 12.920, latMax: 12.927, lngMin: 100.866, lngMax: 100.874 },
  { zone: 'jomtien', name: 'Jomtien Coastline', name_th: 'ชายหาดจอมเทียน', latMin: 12.870, latMax: 12.905, lngMin: 100.870, lngMax: 100.892 },
  { zone: 'naklua', name: 'Naklua & Old Town', name_th: 'นาเกลือ', latMin: 12.960, latMax: 12.990, lngMin: 100.885, lngMax: 100.910 },
  { zone: 'pratumnak', name: 'Pratumnak Hill & Cosy Beach', name_th: 'เขาพระตำหนัก', latMin: 12.910, latMax: 12.925, lngMin: 100.855, lngMax: 100.870 },
  { zone: 'north_pattaya', name: 'North Pattaya & Terminal 21', name_th: 'พัทยาเหนือ', latMin: 12.948, latMax: 12.960, lngMin: 100.885, lngMax: 100.905 },
  { zone: 'south_pattaya', name: 'South Pattaya & Sukhumvit', name_th: 'พัทยาใต้และสุขุมวิท', latMin: 12.915, latMax: 12.928, lngMin: 100.875, lngMax: 100.915 },
];

const totalTarget = 600;
const generated = [...seedCams];

let counter = seedCams.length + 1;
while (generated.length < totalTarget) {
  const z = zones[(counter - 1) % zones.length];
  const idStr = String(counter).padStart(3, '0');
  const lat = +(z.latMin + Math.random() * (z.latMax - z.latMin)).toFixed(4);
  const lng = +(z.lngMin + Math.random() * (z.lngMax - z.lngMin)).toFixed(4);
  
  generated.push({
    slug: `cctv-node-${idStr}`,
    id: `CC-${idStr}`,
    name: `${z.name} Traffic Node ${idStr}`,
    name_th: `จุดตรวจการจราจร ${z.name_th} ${idStr}`,
    zone: z.zone,
    lat,
    lng,
    stream_url: `https://livestream.pattaya.go.th/live/cctv${idStr}/playlist.m3u8`,
    description: `Municipal traffic and weather surveillance camera Node CC-${idStr} stationed in the ${z.name} district of Pattaya City.`
  });
  counter++;
}

const outputFile = path.join(__dirname, '..', 'public', 'data', 'cctv_cams_600.json');
fs.writeFileSync(outputFile, JSON.stringify(generated, null, 2));
console.log(`Generated ${generated.length} CCTV nodes into ${outputFile}`);
