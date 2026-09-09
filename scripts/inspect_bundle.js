const https = require('https');

https.get('https://livestream.pattaya.go.th/_nuxt/DaC2psRa.js', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Bundle size:', d.length);
    
    // Look for api endpoints
    const apis = d.match(/\/api\/v1\/[a-zA-Z0-9_\-\/]+/g) || [];
    console.log('API endpoints found:', [...new Set(apis)]);

    // Look for video/hls/m3u8/rtsp/stream keywords
    const streams = d.match(/[a-zA-Z0-9_\-\/:]+\.(m3u8|mp4|flv)/g) || [];
    console.log('Stream files found:', streams);

    // Look for camera endpoints
    const camKeywords = d.match(/[a-zA-Z0-9_\-\/]*camera[a-zA-Z0-9_\-\/]*/gi) || [];
    console.log('Camera keywords sample:', [...new Set(camKeywords)].slice(0, 15));

    // Look for fetch or $fetch calls
    const fetchMatches = d.match(/(\$fetch|useFetch|useAsyncData)\(['"`]([^'"`]+)['"`]/g) || [];
    console.log('Fetch calls:', [...new Set(fetchMatches)].slice(0, 15));
  });
});
