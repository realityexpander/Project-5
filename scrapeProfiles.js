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

// const USERNAMES = ['jackiektrevino', 'jakepaul', 'aaronjack', 'realityexpander'];
const USERNAMES = ['realityexpander'];

(async () => {
  const browser = await puppeteer.launch({headless: false});
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
  
  // Scrape the USERNAMES array
  for (let username of USERNAMES) {
    await page.goto(`https://instagram.com/${username}`)
    await page.waitForSelector('[data-testid="user-avatar"]')
    
    // Get profile image
    const profileSourceImg = await page.$eval('[data-testid="user-avatar"]', el => el.src)
    // const profileSourceImg = await page.$eval('img', el => el.getAttribute('src'))

    // Get post count
    const postCount = await page.$eval('header li:nth-child(1)', el => el.textContent.split(' ')[0])

    // Get followers count
    const followersCount = await page.$eval('header li:nth-child(2)', el => el.textContent.split(' ')[0])

    // Get following count
    const followingCount = await page.$eval('header li:nth-child(3)', el => el.textContent.split(' ')[0])

    // Get counts as array
    const headerCountsArr = await page.$$eval('header li', els => els.map( el => el.textContent) )

    // Map header array to  header object
    let headerCountsObj = {}
    for(let i in headerCountsArr) {
      headerCountsObj[headerCountsArr[i].split(' ')[1]] = headerCountsArr[i].split(' ')[0]
    }

    // Get profile name
    const profileName = await page.$eval('header h1', el => el.textContent)
      .catch( (e) => { console.log('No description for profile:', username, `\nError:${e}`); return false } )

    // Get  description
    // const profileDescription = await page.$eval('header > section > div > span', el => el.textContent)
    const profileDescription = await page.$eval('.-vDIg span', el => el.textContent)
      .catch( (e) => { console.log('No description for profile:', username, `\nError:${e}`); return false } )

    // Get link (may be missing)
    // const profileLink = await page.$eval('section > main > div header section div a', el => el.textContent)
    const profileLink = await page.$eval('.-vDIg a', el => el.textContent)
      .catch( (e) => { console.log('No link for profile:', username, `\nError:${e}`); return false } ) 

    // console.log({profileSourceImg}, {postCount}, {followersCount}, {followingCount}, {profileDescription}, {profileLink})
    // console.log({headerCountsObj})

    const profile = {profileSourceImg, headerCountsObj, profileName, profileDescription, profileLink}
    console.log({profile})
  }

  // await browser.close();
  console.log("Finished.")
})();