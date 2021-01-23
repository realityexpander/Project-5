const puppeteer = require('puppeteer');

// Puppeteer docs
// https://www.npmjs.com/package/puppeteer/v/1.11.0-next.1547527073587

// Set security cert
// https://github.com/puppeteer/puppeteer/issues/4752
// https://stackoverflow.com/questions/54545193/puppeteer-chromium-on-mac-chronically-prompting-accept-incoming-network-connect
// https://support.apple.com/en-gb/guide/keychain-access/kyca2686/mac
// RUN THIS LINE, but change the mac-XXXXX folder
// sudo codesign --force --deep -s Puppeteer -f ./node_modules/puppeteer/.local-chromium/mac-782078/chrome-mac/Chromium.app 

// test path in chromium
// $x('//{Xpath here}')

const username = 'aaa@bbb.com';
const password = 'iksdjfs';

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('https://instagram.com');

  await page.waitForSelector('input')

  const loginInputs = await page.$$('input')
  await loginInputs[0].type(username)
  await loginInputs[1].type(password)

  // const loginButton = (await page.$$('button'))[1] // login button
  const loginButton = await page.$x('//*[@id="loginForm"]/div/div[3]/button')
  await loginButton[0].click()


  // await browser.close();
})();