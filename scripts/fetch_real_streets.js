const https = require('https');
const fs = require('fs');

// Query Overpass for exact way geometries in Pattaya
// We want:
// 1. Beach Road (Pattaya Sai 1)
// 2. Second Road (Pattaya Sai 2)
// 3. Pattaya-Naklua Road
// 4. Thappraya Road + Jomtien Beach Road

const query = `
[out:json][timeout:25];
(
  way["name"="ถนนพัทยาสายหนึ่ง"](12.92,100.86,12.96,100.90);
  way["name"="ถนนพัทยาสาย 1"](12.92,100.86,12.96,100.90);
  way["name"="ถนนพัทยาสาย 2"](12.92,100.86,12.96,100.90);
  way["name"="ถนนพัทยาสายสอง"](12.92,100.86,12.96,100.90);
  way["name"="ถนนพัทยานาเกลือ"](12.95,100.88,12.99,100.92);
  way["name"="ถนนทัพพระยา"](12.89,100.86,12.93,100.89);
  way["name"="ถนนหาดจอมเทียน"](12.86,100.86,12.91,100.90);
);
out geom;
`;

const postData = `data=${encodeURIComponent(query)}`;

const req = https.request('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'PattayaCams/1.0'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Total ways returned:', json.elements.length);
      fs.writeFileSync('scripts/overpass_streets.json', JSON.stringify(json, null, 2));
      console.log('Saved to scripts/overpass_streets.json');
    } catch (e) {
      console.error('Parse error or raw:', data.substring(0, 300));
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
