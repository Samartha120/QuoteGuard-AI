import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });

  const footerData = await page.evaluate(() => {
    const footer = document.querySelector('.app-footer');
    const divider = document.querySelector('.footer-divider');
    const topRow = document.querySelector('.footer-top-row');

    if (!footer || !divider || !topRow) return 'Elements not found';

    const fRect = footer.getBoundingClientRect();
    const dRect = divider.getBoundingClientRect();
    const tRect = topRow.getBoundingClientRect();

    return {
      footer: { left: fRect.left, width: fRect.width, right: fRect.right },
      divider: { left: dRect.left, width: dRect.width, right: dRect.right },
      topRow: { left: tRect.left, width: tRect.width, right: tRect.right },
      computedFooter: {
        paddingLeft: window.getComputedStyle(footer).paddingLeft,
        marginLeft: window.getComputedStyle(footer).marginLeft,
        display: window.getComputedStyle(footer).display,
        alignItems: window.getComputedStyle(footer).alignItems,
      },
      computedDivider: {
        width: window.getComputedStyle(divider).width,
        marginLeft: window.getComputedStyle(divider).marginLeft,
      }
    };
  });

  console.log(JSON.stringify(footerData, null, 2));
  await browser.close();
})();
