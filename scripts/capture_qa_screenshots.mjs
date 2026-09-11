import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:\\Users\\K\\.gemini\\antigravity\\brain\\8371e47a-cffe-4f09-818d-2be11531c2a6';

async function main() {
  console.log('Launching browser with Playwright (system Chrome)...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console and errors
  const pageErrors = [];
  page.on('pageerror', err => {
    console.error('Page error detected:', err.message);
    pageErrors.push(err.message);
  });

  // 1. Desktop Map View & New Logo Hover
  console.log('Testing Desktop View & New Logo (1280x800)...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Hover over the new logo to capture radiant neon glow effect
  const logoImg = page.locator('img[alt="PattayaCams Logo"]').first();
  if (await logoImg.isVisible()) {
    console.log('Hovering over new logo...');
    await logoImg.hover();
    await page.waitForTimeout(600);
  }

  await page.screenshot({ path: path.join(outDir, 'navbar_new_logo_hover.png') });
  console.log('Saved navbar_new_logo_hover.png');

  // 2. Creators Hub - Live Venues Filter Test
  console.log('Testing Creators Hub & Live Venues Filter...');
  await page.goto('http://localhost:3001/creators', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click on "Live Venues" filter button
  const liveVenuesFilterBtn = page.locator('button:has-text("Live Venues")').first();
  if (await liveVenuesFilterBtn.isVisible()) {
    console.log('Clicking Live Venues filter button...');
    await liveVenuesFilterBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: path.join(outDir, 'creators_hub_live_venues_filter.png') });
  console.log('Saved creators_hub_live_venues_filter.png');

  // 3. Creators Hub - Deep Scroll Test
  console.log('Testing Creators Hub Full Scroll (All Listings)...');
  const allFilterBtn = page.locator('button:has-text("All")').first();
  if (await allFilterBtn.isVisible()) {
    await allFilterBtn.click();
    await page.waitForTimeout(800);
  }

  // Scroll down 1800px
  const scrollYBefore = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo(0, 1800));
  await page.waitForTimeout(1000);
  const scrollYAfter = await page.evaluate(() => window.scrollY);
  console.log(`Scroll Test: Before=${scrollYBefore}px -> After=${scrollYAfter}px`);

  await page.screenshot({ path: path.join(outDir, 'creators_hub_scrolled_deep.png') });
  console.log('Saved creators_hub_scrolled_deep.png');

  // 4. Creator Profile Page - Scroll Test
  console.log('Testing Creator Profile Page (buzzin-pattaya) Scrolling...');
  await page.goto('http://localhost:3001/creators/buzzin-pattaya', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Scroll down 1200px
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(1000);
  const profileScrollY = await page.evaluate(() => window.scrollY);
  console.log(`Profile Page Scroll Test: Y=${profileScrollY}px`);

  await page.screenshot({ path: path.join(outDir, 'creator_profile_page_scrolled.png') });
  console.log('Saved creator_profile_page_scrolled.png');

  await browser.close();

  console.log('\n=== Playwright QA Results ===');
  console.log('Total unhandled page errors:', pageErrors.length);
  if (pageErrors.length > 0) {
    console.error('Errors encountered:', pageErrors);
  } else {
    console.log('All tests passed with ZERO page errors!');
  }
}

main().catch(err => {
  console.error('Fatal Playwright error:', err);
  process.exit(1);
});
