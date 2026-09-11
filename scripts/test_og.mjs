import fs from 'fs';

async function testChannel(handle) {
  try {
    const res = await fetch(`https://www.youtube.com/${handle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const html = await res.text();
    const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    console.log(`${handle} og:image:`, ogMatch ? ogMatch[1] : 'none');
  } catch (err) {
    console.error(handle, err.message);
  }
}

async function run() {
  await testChannel('@Buzzinpattaya');
  await testChannel('@WalkEast');
  await testChannel('@Pattaya4KWalker');
  await testChannel('@NDtviThailand');
  await testChannel('@EverythingPattaya');
}

run();
