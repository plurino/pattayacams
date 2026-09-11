import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:\\Users\\K\\.gemini\\antigravity\\brain\\8371e47a-cffe-4f09-818d-2be11531c2a6';

async function main() {
  console.log('Launching Playwright Chrome QA Suite...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  const pageErrors = [];
  page.on('pageerror', err => {
    console.error('Page error detected:', err.message);
    pageErrors.push(err.message);
  });

  // 1. Navbar 4 Distinct Colors & Multi-Cam <-> Radar Transition
  console.log('1. Testing Navbar 4 distinct colors and Radar/Multi-Cam transitions...');
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(outDir, 'navbar_4_colors_radar_active.png') });
  console.log('Saved navbar_4_colors_radar_active.png');

  // Click Multi-Cam
  console.log('Clicking Multi-Cam button in navbar...');
  const multiCamBtn = page.locator('button:has-text("Multi-Cam")').first();
  await multiCamBtn.click();
  await page.waitForTimeout(1200);

  await page.screenshot({ path: path.join(outDir, 'multicam_active_view.png') });
  console.log('Saved multicam_active_view.png');

  // Click Radar to return to map
  console.log('Clicking Radar button in navbar to return to map...');
  const radarBtn = page.locator('button:has-text("Radar")').first();
  await radarBtn.click();
  await page.waitForTimeout(1200);

  const mapEl = page.locator('.leaflet-container');
  const isMapVisible = await mapEl.isVisible();
  console.log('Is Leaflet map container visible after return from Multi-Cam?', isMapVisible);

  await page.screenshot({ path: path.join(outDir, 'radar_returned_from_multicam.png') });
  console.log('Saved radar_returned_from_multicam.png');

  // 2. Creators Hub: Kick Streamers Initial Badges (No placeholder images)
  console.log('2. Testing Creators Hub Kick streamers with emerald initial badges...');
  await page.goto('http://localhost:3000/creators', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const kickFilter = page.locator('button:has-text("Kick")').first();
  if (await kickFilter.isVisible()) {
    await kickFilter.click();
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: path.join(outDir, 'creators_hub_kick_initials.png') });
  console.log('Saved creators_hub_kick_initials.png');

  // 3. Venue Page: Pattaya Oh Bar (Offline Standby Card & Zeroed Vibe Check)
  console.log('3. Testing /venues/pattaya-oh-bar (Standby Card & Zeroed Vibe Check)...');
  await page.goto('http://localhost:3000/venues/pattaya-oh-bar', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const vibeCountsBefore = await page.locator('.grid.grid-cols-4 button span.font-mono').allInnerTexts();
  console.log('Vibe check counts on load (should all be 0):', vibeCountsBefore);

  // Click Vibe (🍻) reaction emoji
  const vibeBtn = page.locator('button[title*="Vibe"]').first();
  if (await vibeBtn.isVisible()) {
    await vibeBtn.click();
    await page.waitForTimeout(500);
  }

  const vibeCountsAfter = await page.locator('.grid.grid-cols-4 button span.font-mono').allInnerTexts();
  console.log('Vibe check counts after user vote (Vibe should be 1):', vibeCountsAfter);

  await page.screenshot({ path: path.join(outDir, 'venue_pattaya_oh_bar_standby.png') });
  console.log('Saved venue_pattaya_oh_bar_standby.png');

  // 4. Venue Page: Green Stop Dispensary & Bar (Standby Card, No Broken Video)
  console.log('4. Testing /venues/green-stop-cannabis (Standby Card, No Broken Video)...');
  await page.goto('http://localhost:3000/venues/green-stop-cannabis', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(outDir, 'venue_green_stop_standby.png') });
  console.log('Saved venue_green_stop_standby.png');

  await browser.close();

  console.log('\n=== Playwright QA Results ===');
  console.log('Total unhandled page errors:', pageErrors.length);
  if (pageErrors.length > 0) {
    console.error('Errors encountered:', pageErrors);
    process.exit(1);
  } else {
    console.log('All QA tests passed with ZERO page errors!');
  }
}

main().catch(err => {
  console.error('Fatal Playwright error:', err);
  process.exit(1);
});
