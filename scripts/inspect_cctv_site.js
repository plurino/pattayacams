const https = require('https');

https.get('https://livestream.pattaya.go.th/', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const regex = /src="(\/_nuxt\/[^"]+\.js)"/g;
    let m;
    const scripts = [];
    while ((m = regex.exec(d)) !== null) {
      scripts.push(m[1]);
    }
    console.log('Scripts count:', scripts.length);
    scripts.forEach(s => console.log('Script:', s));
  });
});
