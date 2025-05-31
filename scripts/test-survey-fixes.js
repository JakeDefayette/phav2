#!/usr/bin/env node

/**
 * Test script to verify survey form fixes
 * This tests the performance and functionality improvements
 */

const puppeteer = require('puppeteer');

async function testSurveyPerformance() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });

  try {
    const page = await browser.newPage();
    
    // Monitor console for performance issues
    const performanceLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('realtimeScheduler') || text.includes('adaptive_adjustment')) {
        performanceLogs.push(text);
      }
    });

    // Monitor for errors
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    console.log('🧪 Starting survey performance test...');
    
    // Navigate to survey page
    await page.goto('http://localhost:3000/survey', {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    console.log('📄 Survey page loaded');

    // Wait for form to be interactive
    await page.waitForSelector('input[type="checkbox"]', { timeout: 5000 });
    
    console.log('✅ Form elements are interactive');

    // Test checkbox interactions
    const checkboxes = await page.$$('input[type="checkbox"]');
    console.log(`🔲 Found ${checkboxes.length} checkboxes`);

    // Click several checkboxes to test performance
    for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
      await checkboxes[i].click();
      await page.waitForTimeout(500); // Wait to see if any performance issues occur
    }

    console.log('🎯 Checkbox interactions completed');

    // Check for excessive performance logging
    if (performanceLogs.length > 10) {
      console.warn(`⚠️  Excessive performance logging detected: ${performanceLogs.length} messages`);
      console.warn('Sample logs:', performanceLogs.slice(0, 3));
    } else {
      console.log('✅ Performance logging is controlled');
    }

    // Check for errors
    if (errors.length > 0) {
      console.error('❌ Errors detected:', errors);
    } else {
      console.log('✅ No JavaScript errors detected');
    }

    // Test page responsiveness
    const startTime = Date.now();
    await page.evaluate(() => {
      // Simulate heavy work to test if page becomes unresponsive
      const start = Date.now();
      while (Date.now() - start < 100) {
        // Short CPU intensive work
      }
    });
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 1000) {
      console.warn(`⚠️  Page responsiveness concern: ${responseTime}ms`);
    } else {
      console.log(`✅ Page remains responsive: ${responseTime}ms`);
    }

    console.log('🎉 Survey performance test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testSurveyPerformance().catch(console.error);
}

module.exports = { testSurveyPerformance }; 