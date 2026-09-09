const { execSync } = require('child_process');

const channels = [
  '@PattayaOhBar',
  '@LiveLoveThailand',
  '@Pattaya4KWalker',
  '@WalkEast',
  '@EverythingPattaya'
];

channels.forEach(ch => {
  try {
    const html = execSync(`curl.exe -s -L "https://www.youtube.com/${ch}" -A "Mozilla/5.0"`, { maxBuffer: 10 * 1024 * 1024 }).toString();
    const id = html.match(/"externalId":"([^"]+)"/) || html.match(/\/channel\/(UC[\w-]{22})/);
    const live = html.includes('"status":"LIVE"') || html.includes('"isLive":true');
    console.log(`${ch}: ID=${id ? id[1] : 'null'}, isLive=${live}`);
  } catch (e) {
    console.log(`${ch}: Error`);
  }
});
