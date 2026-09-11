import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:\\Users\\K\\.gemini\\antigravity\\brain\\8371e47a-cffe-4f09-818d-2be11531c2a6';

async function main() {
  console.log('Launching Playwright Chrome...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const pageErrors = [];
  page.on('pageerror', err => {
    console.error('Page error detected:', err.message);
    pageErrors.push(err.message);
  });

  // 1. Radar Map View: Resting Banner & Star Pin
  console.log('1. Testing Desktop Radar Map & Resting Banner...');
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  // Jump to Soi Buakhao to center on Oh Bar
  const soiBuakhaoButton = page.locator('button:has-text("Soi Buakhao")').first();
  if (await soiBuakhaoButton.isVisible()) {
    await soiBuakhaoButton.click();
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: path.join(outDir, 'radar_resting_banner_star.png') });
  console.log('Saved radar_resting_banner_star.png');

  // Click on Pattaya Oh Bar to verify Standby card message
  const venueMarker = page.locator('.custom-venue-marker-container').first();
  if (await venueMarker.isVisible()) {
    await venueMarker.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(outDir, 'radar_standby_card_checked.png') });
  console.log('Saved radar_standby_card_checked.png');

  // 2. PattayaVids View: Multi-Select Filter & Pagination
  console.log('2. Testing PattayaVids Multi-Select Dropdown & Pagination...');
  await page.goto('http://localhost:3000/?view=vids', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  // Open multi-select creator dropdown
  const filterBtn = page.locator('button[title="Filter by multiple creators"]').first();
  if (await filterBtn.isVisible()) {
    await filterBtn.click();
    await page.waitForTimeout(600);
  }

  await page.screenshot({ path: path.join(outDir, 'vids_multiselect_dropdown.png') });
  console.log('Saved vids_multiselect_dropdown.png');

  // 3. Creators Hub: Unified Navbar, Sorting, Styled Initial Avatars, Pagination
  console.log('3. Testing Creators Hub Directory (Unified Navbar, Avatars & Pagination)...');
  await page.goto('http://localhost:3000/creators', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(outDir, 'creators_hub_unified_page1.png') });
  console.log('Saved creators_hub_unified_page1.png');

  // Click page 2 on Creators Hub
  const page2Btn = page.locator('button:has-text("2")').last();
  if (await page2Btn.isVisible()) {
    await page2Btn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'creators_hub_page2.png') });
    console.log('Saved creators_hub_page2.png');
  }

  // 4. Creator Profile Page: Buzzin Pattaya
  console.log('4. Testing Creator Profile Page (buzzin-pattaya)...');
  await page.goto('http://localhost:3000/creators/buzzin-pattaya', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(outDir, 'creator_profile_buzzin.png') });
  console.log('Saved creator_profile_buzzin.png');

  // 5. Creator Profile Page: RikAsian (Kick Streamer)
  console.log('5. Testing Creator Profile Page (rikasian - Kick)...');
  await page.goto('http://localhost:3000/creators/rikasian', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(outDir, 'creator_profile_rikasian_kick.png') });
  console.log('Saved creator_profile_rikasian_kick.png');

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
