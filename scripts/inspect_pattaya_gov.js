const { execSync } = require('child_process');

try {
  const js = execSync('curl.exe -s "https://livestream.pattaya.go.th/_nuxt/DaC2psRa.js"', { maxBuffer: 20 * 1024 * 1024 }).toString();
  
  const idx = js.indexOf('systemDevicesCameras');
  if (idx !== -1) {
    console.log(js.substring(Math.max(0, idx - 200), Math.min(js.length, idx + 400)));
  } else {
    console.log('Not found');
  }
} catch (e) {
  console.error(e);
}
