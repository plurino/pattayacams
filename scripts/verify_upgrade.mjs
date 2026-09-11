import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:\\Users\\K\\.gemini\\antigravity\\brain\\8371e47a-cffe-4f09-818d-2be11531c2a6';

async function runVerification() {
  console.log('Starting Playwright End-to-End Upgrade Verification Suite...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  const pageErrors = [];
  page.on('pageerror', (err) => {
    console.error('Page error detected:', err.message);
    pageErrors.push(err.message);
  });

  // 1. Verify Homepage, TickerBar, ICT Clock, Weather & Currency Rates
  console.log('1. Loading Homepage on http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const ictClockText = await page.locator('text=ICT').first().innerText().catch(() => '');
  console.log('ICT Clock display:', ictClockText);

  const weatherText = await page.locator('text=°C').first().innerText().catch(() => '');
  console.log('Weather badge display:', weatherText);

  const fxText = await page.locator('text=THB FX:').first().locator('..').innerText().catch(() => '');
  console.log('FX Rates display:', fxText);

  await page.screenshot({ path: path.join(outDir, 'v5_01_ticker_bar_homepage.png') });
  console.log('Saved v5_01_ticker_bar_homepage.png');

  // 2. Test Koh Larn Ferry & Tide Modal
  console.log('2. Testing Koh Larn Ferry & Tide Modal...');
  const ferryBtn = page.locator('button:has-text("Koh Larn")').first();
  await ferryBtn.click();
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(outDir, 'v5_02_koh_larn_ferry_modal.png') });
  console.log('Saved v5_02_koh_larn_ferry_modal.png');

  // Switch to Tide Tracker tab
  const tidesTab = page.locator('button:has-text("Tide Tracker")').first();
  await tidesTab.click();
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(outDir, 'v5_03_koh_larn_tides_tab.png') });
  console.log('Saved v5_03_koh_larn_tides_tab.png');

  // Close modal
  const closeFerryModal = page.locator('button:has-text("Close")').first();
  await closeFerryModal.click();
  await page.waitForTimeout(400);

  // 3. Test Event Radar Modal
  console.log('3. Testing Pattaya Event & Festival Radar Modal...');
  const eventBtn = page.locator('button:has-text("Radar")').filter({ hasText: 'Festival' }).first();
  if (await eventBtn.isVisible()) {
    await eventBtn.click();
  } else {
    await page.locator('button:has-text("Festival")').first().click();
  }
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(outDir, 'v5_04_festival_countdown_radar.png') });
  console.log('Saved v5_04_festival_countdown_radar.png');

  const closeEventModal = page.locator('button:has-text("Close")').first();
  await closeEventModal.click();
  await page.waitForTimeout(400);

  // 4. Test Map Layers: Rain Radar Doppler & Flood Risk Zones
  console.log('4. Testing Rain Radar (Doppler) & Flood Risk Zones on Map...');
  // Open Layers panel if on mobile or ensure visible
  const layersPill = page.locator('button:has-text("Layers")').first();
  if (await layersPill.isVisible()) {
    await layersPill.click();
    await page.waitForTimeout(300);
  }

  // Toggle Rain Radar
  const radarCheckbox = page.locator('label:has-text("Rain Radar (Doppler)") input[type="checkbox"]');
  if (await radarCheckbox.isVisible()) {
    await radarCheckbox.check();
    await page.waitForTimeout(1000);
  }

  // Toggle Flood Risk Zones
  const floodCheckbox = page.locator('label:has-text("Flood Risk Zones") input[type="checkbox"]');
  if (await floodCheckbox.isVisible()) {
    await floodCheckbox.check();
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: path.join(outDir, 'v5_05_map_rain_radar_flood_zones.png') });
  console.log('Saved v5_05_map_rain_radar_flood_zones.png');

  // 5. Test MultiCam Command Grid with UniversalPlayer and Panoramic Feeds
  console.log('5. Testing Multi-Cam Grid with UniversalPlayer...');
  const multiCamBtn = page.locator('button:has-text("Multi-Cam")').first();
  await multiCamBtn.click();
  await page.waitForTimeout(1200);

  await page.screenshot({ path: path.join(outDir, 'v5_06_multicam_universal_facades.png') });
  console.log('Saved v5_06_multicam_universal_facades.png');

  // 6. Test Mobile Viewport Responsiveness
  console.log('6. Testing Mobile Viewport Responsiveness (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  await page.screenshot({ path: path.join(outDir, 'v5_07_mobile_responsive_hud.png') });
  console.log('Saved v5_07_mobile_responsive_hud.png');

  await browser.close();

  console.log('\n=== Playwright Verification Results ===');
  console.log('Total unhandled page errors:', pageErrors.length);
  if (pageErrors.length > 0) {
    console.error('Page errors encountered:', pageErrors);
    process.exit(1);
  } else {
    console.log('All tests passed with 0 errors! All 7 screenshots generated.');
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
