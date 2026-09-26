import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  // capture the outerHTML of root to see if it actually rendered something
  const rootHTML = await page.evaluate(() => document.getElementById('root').outerHTML);
  console.log('ROOT HTML LENGTH:', rootHTML.length);
  
  await browser.close();
})();
