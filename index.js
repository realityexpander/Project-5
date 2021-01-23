const puppeteer = require('puppeteer');
const secrets = require('./secrets');
const { USERNAME:username, PASSWORD:password} = require('./secrets'); // using rename destructuring

// Puppeteer docs
// https://www.npmjs.com/package/puppeteer/v/1.11.0-next.1547527073587

// Set security cert
// https://github.com/puppeteer/puppeteer/issues/4752
// https://stackoverflow.com/questions/54545193/puppeteer-chromium-on-mac-chronically-prompting-accept-incoming-network-connect
// https://support.apple.com/en-gb/guide/keychain-access/kyca2686/mac
// RUN THIS LINE, but change the mac-XXXXX folder
// sudo codesign --force --deep -s Puppeteer -f ./node_modules/puppeteer/.local-chromium/mac-782078/chrome-mac/Chromium.app 

// Use path in chromium
// $x('//{Xpath here}')

// Use with QuerySelector in chromium
// $('{selector}')

// User with QuerySelectorAll in chromium
// $$('{selector')

// Click element in chromium
// $('article a').click()

// console.log(username, password) // destructured

(async () => {
  const browser = await puppeteer.launch({headless:  false});
  const page = await browser.newPage();
  await page.goto('https://instagram.com');

  await page.waitForSelector('input')

  const loginInputs = await page.$$('input')
  await loginInputs[0].type(secrets.USERNAME)
  await loginInputs[1].type(secrets.PASSWORD)

  // const loginButton = await page.$x('//*[@id="loginForm"]/div/div[3]/button') // using xSelector
  // await loginButton[0]

  const loginButton = (await page.$$('button'))[1] 
  await loginButton.click()
  
  // wait for navigation to complete
  await page.waitForNavigation()

  // wait for search bar
  // await page.waitForSelector('#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.LWmhU._0aCwM > input')

  // const USERNAME = 'realityexpanderdev'
  const USERNAME = 'jackiektrevino'
  await page.goto(`https://instagram.com/${USERNAME}`)

  // click first image
  await page.waitForSelector('article a')
  await (await page.$('article a')).click()

  // wait for Like button in the dialog
  // await page.waitForSelector('article button [aria-label="Like"]')
  await page.waitForSelector('body > div._2dDPU.CkGkG > div.zZYga > div > article > div.eo2As > section.ltpMr.Slqrh > span.fr66n > button > div > span > svg')
  
  // Click like button
  await (await page.$$('button svg'))[2].click()
  // await (await page.$('article button [aria-label="Like"]')).click()

  

  // await browser.close();
})();