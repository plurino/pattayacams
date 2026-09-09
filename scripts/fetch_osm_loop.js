const https = require('https');

const query = `[out:json];
(
  way["name"="Pattaya Beach Road"](12.92,100.86,12.96,100.90);
  way["name"="ถนนเลียบชายหาด"](12.92,100.86,12.96,100.90);
  way["name"="Pattaya Sai 1"](12.92,100.86,12.96,100.90);
  way["name"="Pattayasaisong Road"](12.92,100.86,12.96,100.90);
  way["name"="ถนนพัทยาสายสอง"](12.92,100.86,12.96,100.90);
  way["name"="South Pattaya Road"](12.92,100.86,12.96,100.90);
  way["name"="ถนนพัทยาใต้"](12.92,100.86,12.96,100.90);
);
out geom;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

https.get(url, { headers: { 'User-Agent': 'PattayaCams/1.0' } }, (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(raw);
      console.log('Found elements:', data.elements.length);
      data.elements.forEach((el, idx) => {
        console.log(`Element ${idx}: id=${el.id}, name=${el.tags?.name || el.tags?.['name:en']}, points=${el.geometry?.length}`);
        if (el.geometry && el.geometry.length > 0) {
          console.log(`  Start: [${el.geometry[0].lon}, ${el.geometry[0].lat}]`);
          console.log(`  End: [${el.geometry[el.geometry.length-1].lon}, ${el.geometry[el.geometry.length-1].lat}]`);
        }
      });
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
}).on('error', (err) => console.error('Request error:', err.message));
