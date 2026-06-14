const { chromium } = require('playwright');

async function verifyCalendar() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Starting verification of Calendar Events tab...\n');

  try {
    // Navigate to Calendar page
    console.log('1. Navigating to Calendar page...');
    await page.goto('http://localhost:8080/calendar', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout;
    console.log('   ✅ Page loaded');

    // Check for 6 tabs
    console.log('\n2. Checking 6-tab navigation...');
    const tabs = ['Events', 'Holiday', 'Exam/Test', 'Task', 'Homework', 'Attendance'];
    for (const tab of tabs) {
      const tabButton = await page.locator(`button:has-text("${tab}")`).first();
      const isVisible = await tabButton.isVisible().catch(() => false);
      console.log(`   ${isVisible ? '✅' : '❌'} ${tab} tab: ${isVisible ? 'visible' : 'not found'}`);
    }

    // Check Events tab filters
    console.log('\n3. Checking Events tab filters...');
    const filters = ['All Events', 'School-wide', 'Department', 'Wing', 'Class', 'Upcoming', 'Ended'];
    for (const filter of filters) {
      const filterBtn = await page.locator(`button:has-text("${filter}")`).first();
      const isVisible = await filterBtn.isVisible().catch(() => false);
      console.log(`   ${isVisible ? '✅' : '❌'} Filter "${filter}": ${isVisible ? 'visible' : 'not found'}`);
    }

    // Check Calendar grid
    console.log('\n4. Checking Calendar grid...');
    const calendarGrid = await page.locator('.grid').first();
    const gridVisible = await calendarGrid.isVisible().catch(() => false);
    console.log(`   ${gridVisible ? '✅' : '❌'} Calendar grid: ${gridVisible ? 'visible' : 'not found'}`);

    // Check action buttons (Announce Event)
    console.log('\n5. Checking action buttons...');
    const announceBtn = await page.locator('button:has-text("Announce Event")').first();
    const announceVisible = await announceBtn.isVisible().catch(() => false);
    console.log(`   ${announceVisible ? '✅' : '❌'} Announce Event button: ${announceVisible ? 'visible' : 'not found'}`);

    // Try opening Create Event form
    console.log('\n6. Testing Create Event form...');
    if (announceVisible) {
      await announceBtn.click();
      await page.waitForTimeout;

      // Check for new fields
      const fields = [
        { name: 'Date Type selector', selector: 'text=One Day' },
        { name: 'Title input', selector: 'input[placeholder*="Annual"]' },
        { name: 'Applies To (Scope)', selector: 'text=Applies To' },
        { name: 'Include Students toggle', selector: 'text=Include Students' },
        { name: 'Send Notification', selector: 'text=Send Notification' },
        { name: 'Preview button', selector: 'text=Preview & Publish' },
      ];

      for (const field of fields) {
        const el = await page.locator(field.selector).first();
        const isVisible = await el.isVisible().catch(() => false);
        console.log(`   ${isVisible ? '✅' : '❌'} ${field.name}: ${isVisible ? 'present' : 'missing'}`);
      }

      // Close dialog
      const closeBtn = await page.locator('[aria-label="Close"], button:has-text("Cancel")').first();
      await closeBtn.click().catch(() => {});
    }

    // Take screenshot
    console.log('\n7. Capturing screenshot...');
    await page.screenshot({ path: 'calendar-events-tab.png', fullPage: true });
    console.log('   ✅ Screenshot saved: calendar-events-tab.png');

    console.log('\n=== VERIFICATION COMPLETE ===');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await browser.close();
  }
}

verifyCalendar();