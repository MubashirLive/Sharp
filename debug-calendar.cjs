const { chromium } = require('playwright');

async function debugCalendar() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to Calendar page...');
  await page.goto('http://localhost:8080/calendar', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout;

  // Get page title and URL
  console.log('\nPage URL:', page.url());
  console.log('Page Title:', await page.title());

  // Get visible text content
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== PAGE TEXT (first 2000 chars) ===');
  console.log(bodyText.substring(0, 2000));

  // Get all buttons
  console.log('\n=== ALL BUTTONS ===');
  const buttons = await page.locator('button').all();
  for (const btn of buttons.slice(0, 30)) {
    const text = await btn.innerText().catch(() => '');
    const visible = await btn.isVisible().catch(() => false);
    if (text.trim()) {
      console.log(`  ${visible ? '✅' : '❌'} "${text.trim()}"`);
    }
  }

  // Get current HTML structure
  console.log('\n=== PAGE HTML (first 1000 chars) ===');
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  console.log(html.substring(0, 1000));

  // Take full screenshot
  await page.screenshot({ path: 'calendar-debug.png', fullPage: true });
  console.log('\nScreenshot saved: calendar-debug.png');

  await browser.close();
}

debugCalendar();