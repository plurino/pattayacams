const https = require('https');

https.get('https://livestream.pattaya.go.th/_nuxt/DaC2psRa.js', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    let idx = 0;
    while ((idx = d.indexOf('systemDevices/cameras', idx + 1)) !== -1) {
      console.log('--- Found systemDevices/cameras at', idx, '---');
      console.log(d.substring(Math.max(0, idx - 150), Math.min(d.length, idx + 250)));
    }
  });
});
