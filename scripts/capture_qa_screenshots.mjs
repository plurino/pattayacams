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

  // 1. Desktop Map View & Quick Jump
  console.log('Testing Desktop Map View (1280x800)...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click on a zone pill to test Quick Jump and verify no _leaflet_pos error
  const soiBuakhaoButton = page.locator('button:has-text("Soi Buakhao")').first();
  if (await soiBuakhaoButton.isVisible()) {
    console.log('Clicking Soi Buakhao Quick Jump...');
    await soiBuakhaoButton.click();
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: path.join(outDir, 'desktop_map_hotpink.png') });
  console.log('Saved desktop_map_hotpink.png');

  // 2. Mobile Viewport Navbar (390x844)
  console.log('Testing Mobile Viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);

  // Open mobile zones dropdown
  const zonesDropdown = page.locator('button:has-text("Zones")').first();
  if (await zonesDropdown.isVisible()) {
    console.log('Opening mobile zones dropdown...');
    await zonesDropdown.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: path.join(outDir, 'mobile_navbar_responsive.png') });
  console.log('Saved mobile_navbar_responsive.png');

  // 3. PattayaVids View
  console.log('Testing PattayaVids View...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:3001/?view=vids', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(outDir, 'pattayavids_no_duplicates.png') });
  console.log('Saved pattayavids_no_duplicates.png');

  // 4. Creators Directory & Scroll Test
  console.log('Testing Creators Directory & Scrolling...');
  await page.goto('http://localhost:3001/creators', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Scroll down halfway
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(outDir, 'creators_directory_scrolled.png') });
  console.log('Saved creators_directory_scrolled.png');

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
