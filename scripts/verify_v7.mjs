import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const brainDir = 'C:\\Users\\K\\.gemini\\antigravity\\brain\\8371e47a-cffe-4f09-818d-2be11531c2a6';

async function verify() {
  console.log('Launching Chrome browser...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001/...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Capture Map with 24/7 Live Cams layer in HUD
  console.log('Capturing v7_01_map_live_cams_layer.png...');
  await page.screenshot({ path: path.join(brainDir, 'v7_01_map_live_cams_layer.png') });

  // 2. Open Weather Modal and test 24-Hour Hourly Forecast
  console.log('Testing Weather Modal...');
  const weatherTicker = await page.locator('text=/\\d+°C/').first();
  if (await weatherTicker.isVisible()) {
    await weatherTicker.click();
    await page.waitForTimeout(1000);
    console.log('Capturing v7_02_weather_24h_hourly.png...');
    await page.screenshot({ path: path.join(brainDir, 'v7_02_weather_24h_hourly.png') });

    // Close weather modal
    const closeBtn = await page.locator('button:has-text("Close")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 3. Click on a 24/7 Live Cam marker (or simulate click on Beach Road Live Cam)
  console.log('Testing Beach Road Live Cam Drawer...');
  const beachCamMarker = await page.locator('.custom-livecam-marker-container').first();
  if (await beachCamMarker.isVisible()) {
    await beachCamMarker.click();
    await page.waitForTimeout(1000);
    console.log('Capturing v7_03_beach_road_live_cam_drawer.png...');
    await page.screenshot({ path: path.join(brainDir, 'v7_03_beach_road_live_cam_drawer.png') });

    // Close drawer
    const drawerCloseBtn = await page.locator('button[title="Close Drawer"]').first();
    if (await drawerCloseBtn.isVisible()) {
      await drawerCloseBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 4. Test CCTV Drawer (Turn on City CCTV Cams and click a cyan marker)
  console.log('Testing CCTV Drawer Streamlining...');
  const cctvCheckbox = await page.locator('input[type="checkbox"]').nth(2); // 3rd checkbox is City CCTV Cams
  if (await cctvCheckbox.isVisible()) {
    await cctvCheckbox.check();
    await page.waitForTimeout(800);
    const cctvMarker = await page.locator('.custom-cctv-marker-container').first();
    if (await cctvMarker.isVisible()) {
      await cctvMarker.click();
      await page.waitForTimeout(1000);
      console.log('Capturing v7_04_cctv_drawer_streamlined.png...');
      await page.screenshot({ path: path.join(brainDir, 'v7_04_cctv_drawer_streamlined.png') });
    }
  }

  // 5. Test Standalone CCTV Page
  console.log('Navigating to http://localhost:3001/cams/rc-708/...');
  await page.goto('http://localhost:3001/cams/rc-708/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('Capturing v7_05_cctv_page_streamlined.png...');
  await page.screenshot({ path: path.join(brainDir, 'v7_05_cctv_page_streamlined.png') });

  // 6. Test Multi Cam Grid with 24/7 Live Cams
  console.log('Navigating back and testing Multi Cam Grid...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const multiCamBtn = await page.locator('button:has-text("Multi Cam")').first();
  if (await multiCamBtn.isVisible()) {
    await multiCamBtn.click();
    await page.waitForTimeout(1000);
    console.log('Capturing v7_06_multicam_live_cams_option.png...');
    await page.screenshot({ path: path.join(brainDir, 'v7_06_multicam_live_cams_option.png') });
  }

  console.log('Verification completed successfully!');
  await browser.close();
}

verify().catch(console.error);
