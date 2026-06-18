const { chromium } = require('playwright');
const path = require('path');

async function run() {
  console.log('--- Starting Swiggy Page DOM Diagnostic ---');
  const userSessionDir = path.join(__dirname, '.browser-session');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const targetUrl = 'https://careers.swiggy.com/#/careers?src=linkedin&p=eyJwYWdlVHlwZSI6ImpkIiwiY3ZTb3VyY2UiOiJsaW5rZWRpbiIsInJlcUlkIjoyNTMyNywicmVxdWVzdGVyIjp7ImlkIjoibGlua2VkaW4iLCJjb2RlIjpudWxsLCJuYW1lIjoiIn19&reqid=25327';
  console.log(`Navigating to Swiggy careers...`);
  
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000); // Wait for SPA hydration
  
  // Print page URL and title
  console.log(`Title: ${await page.title()}`);
  console.log(`URL:   ${page.url()}`);
  
  // Check for frames
  const frames = page.frames();
  console.log(`\nFound ${frames.length} frames:`);
  frames.forEach((f, idx) => {
    console.log(`  Frame ${idx}: URL="${f.url()}" Name="${f.name()}"`);
  });
  
  // Dump text elements containing "View Jobs" or "Software" in main page and all frames
  for (let idx = 0; idx < frames.length; idx++) {
    const frame = frames[idx];
    console.log(`\nScanning Frame ${idx}...`);
    try {
      const matches = await frame.evaluate(() => {
        const results = [];
        // Helper to find all elements with text
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
        let node;
        while (node = walker.nextNode()) {
          const text = node.textContent?.trim() || '';
          if (text.toLowerCase().includes('view jobs') || text.toLowerCase().includes('software dev engineer')) {
            results.push({
              tag: node.tagName.toLowerCase(),
              text: text.substring(0, 80),
              id: node.id || '',
              cls: node.className || '',
              childCount: node.children.length
            });
          }
        }
        return results;
      });
      console.log(`Found ${matches.length} elements containing targets in Frame ${idx}:`);
      matches.slice(0, 15).forEach((m, mIdx) => {
        console.log(`  Match ${mIdx}: <${m.tag} id="${m.id}" class="${m.cls}"> text="${m.text}"`);
      });
    } catch (e) {
      console.log(`  Failed to evaluate frame ${idx}: ${e.message}`);
    }
  }
  
  await browser.close();
}

run().catch(console.error);
