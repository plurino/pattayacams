const { execSync } = require('child_process');

try {
  const url = "https://www.google.com/search?q=Oh+bar+Pattaya+kgmid%3D%2Fg%2F11g7z6hwsx&hl=en";
  const res = execSync(`curl.exe -s -L "${url}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`, { maxBuffer: 10 * 1024 * 1024 }).toString();
  
  const m1 = res.match(/12\.[0-9]{4,6}/g);
  const m2 = res.match(/100\.[0-9]{4,6}/g);
  console.log('Latitudes found:', [...new Set(m1 || [])].slice(0, 5));
  console.log('Longitudes found:', [...new Set(m2 || [])].slice(0, 5));

  // Also check if address or plus code is in the response
  const addrMatch = res.match(/[0-9]+\/[0-9]+[^<]+(Soi Buakhao|Made in Thailand)[^<]*/i);
  console.log('Address:', addrMatch ? addrMatch[0] : 'None');
} catch (e) {
  console.error(e);
}
