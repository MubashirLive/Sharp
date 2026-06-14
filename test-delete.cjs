const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log('Navigating to login...');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });

  // Take screenshot of login
  await page.screenshot({ path: 'test-login.png' });
  console.log('Login page:', await page.title());

  // Look for PIN input
  const pinInput = await page.$('input[maxlength="1"]');
  if (pinInput) {
    console.log('PIN input found, entering demo credentials...');
    // Try to find the mobile/ID input
    const mobileInput = await page.$('input[placeholder*="Mobile"]');
    if (mobileInput) {
      await mobileInput.fill('9999999999');
    }
    // Enter PIN digits
    const inputs = await page.$$('input[maxlength="1"]');
    console.log('PIN inputs found:', inputs.length);
    for (let i = 0; i < Math.min(6, inputs.length); i++) {
      await inputs[i].fill('1');
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    const continueBtn = await page.$('button:has-text("Continue")');
    if (continueBtn) await continueBtn.click();
    await page.waitForTimeout;
  }

  await page.screenshot({ path: 'test-after-login.png' });
  console.log('After login URL:', page.url());

  // Navigate to school page
  await page.goto('http://localhost:8080/school', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-school.png' });
  console.log('School page URL:', page.url());

  // Click on Wings tab
  const wingsTab = await page.$('button:has-text("Wings")');
  if (wingsTab) {
    await wingsTab.click();
    await page.waitForTimeout;
    await page.screenshot({ path: 'test-wings.png' });
    console.log('Wings tab clicked');

    // Click Edit
    const editBtn = await page.$('button:has-text("Edit")');
    if (editBtn) {
      await editBtn.click();
      await page.waitForTimeout;
      await page.screenshot({ path: 'test-edit-mode.png' });
      console.log('Edit mode entered');

      // Find delete buttons
      const deleteBtns = await page.$$('button[title*="Delete"]');
      console.log('Delete buttons found:', deleteBtns.length);

      for (let i = 0; i < Math.min(3, deleteBtns.length); i++) {
        const isDisabled = await deleteBtns[i].getAttribute('disabled');
        const parent = await deleteBtns[i].evaluate(el => el.closest('.rounded-xl')?.querySelector('span')?.textContent || 'unknown');
        console.log(`Delete button ${i}: disabled=${isDisabled}, wing="${parent}"`);
      }

      // Click the first enabled delete button
      for (const btn of deleteBtns) {
        const isDisabled = await btn.getAttribute('disabled');
        if (!isDisabled) {
          const wingName = await btn.evaluate(el => el.closest('.rounded-xl')?.querySelector('span')?.textContent || 'unknown');
          console.log('Clicking delete for wing:', wingName);
          await btn.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'test-delete-dialog.png' });

          // Check dialog
          const dialog = await page.$('[role="dialog"]');
          if (dialog) {
            const title = await dialog.$('[role="dialog"] h2, [role="dialog"] [class*="title"]');
            const dialogText = await dialog.textContent();
            console.log('DIALOG TEXT:', dialogText?.substring(0, 200));
          }
          break;
        }
      }
    }
  } else {
    console.log('Wings tab NOT found');
  }

  console.log('Errors:', errors.slice(0, 5));

  await browser.close();
  console.log('Test complete');
})();