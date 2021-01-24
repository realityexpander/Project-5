const puppeteer = require('puppeteer');
const secrets = require('./secrets');
// const { USERNAME:username, PASSWORD:password} = require('./secrets'); // using rename destructuring
const Sheet = require('./sheet');
const { deleteOldProfilesFromSheet } = require("./deleteOldProfilesFromSheet");

// Puppeteer docs
// https://www.npmjs.com/package/puppeteer/v/1.11.0-next.1547527073587

// Set security cert (to avoid annoying permissions pop-up for chromium)
// https://github.com/puppeteer/puppeteer/issues/4752
// https://stackoverflow.com/questions/54545193/puppeteer-chromium-on-mac-chronically-prompting-accept-incoming-network-connect
// https://support.apple.com/en-gb/guide/keychain-access/kyca2686/mac
// RUN THIS LINE, but change the mac-##### folder
// sudo codesign --force --deep -s Puppeteer -f ./node_modules/puppeteer/.local-chromium/mac-782078/chrome-mac/Chromium.app 

// GCP
// Credentials
// https://console.cloud.google.com/apis/credentials?project=returnz-tester-215418


// Notes on use of various Paths in chromium
//   Use path in chromium
//     $x('//{Xpath here}')
//   Use with QuerySelector in chromium
//     $('{selector}')
//   Use with QuerySelectorAll in chromium
//     $$('{selector')
//   Click element in chromium
//     $('article a').click()

// console.log(username, password) // destructured


(async () => {

  const PROFILE_SHEET = 1;
  const META_SHEET = 0;

  console.log("starting function scrapeInstagram v2")
  
  const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: true});
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'); // prevents puppeteer headless not working
  // await page.setViewport({ width: 1920, height: 969 })

  console.log("Navigating to instagram")
  await page.goto('https://instagram.com');

  console.log("Waiting for selector 'input'")
  // await page.waitForFunction('document.querySelector("input")'); // alternate way to wait for selector
  await page.waitForSelector('input')

  console.log("Entering credentials'")
  const loginInputs = await page.$$('input')
  await loginInputs[0].type(secrets.USERNAME)
  await loginInputs[1].type(secrets.PASSWORD)

  // const loginButton = await page.$x('//*[@id="loginForm"]/div/div[3]/button') // using xSelector
  // await loginButton[0]

  console.log("waiting for button 'login'")
  const loginButton = (await page.$$('button'))[1] 
  await loginButton.click()
  
  // wait for navigation to complete
  console.log("waiting for navigation")
  await page.waitForNavigation()

  // wait for search bar
  // await page.waitForSelector('#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.LWmhU._0aCwM > input')
  
  const sheet = new Sheet()
  await sheet.load()

  // get profile account usernames from the Meta sheet
  const USERNAMES = (await sheet.getRows(META_SHEET)).map(row => row.username)
  console.log("Scraping:", {USERNAMES})

  // Scrape the USERNAMES array into profiles
  const profiles = []
  for (let username of USERNAMES) {
    await page.goto(`https://instagram.com/${username}`)

    console.log("waiting for profile nav for ", username)
    await page.waitForSelector('[data-testid="user-avatar"]')
    
    // Get profile image
    const profileSourceImg = await page.$eval('[data-testid="user-avatar"]', el => el.src)
    // const profileSourceImg = await page.$eval('img', el => el.getAttribute('src')) // alt way

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
      // headerCountsObj[headerCountsArr[i].split(' ')[1]] = headerCountsArr[i].split(' ')[0] // alt way
      const [count, fieldName] = headerCountsArr[i].split(' ')
      headerCountsObj[fieldName] = count
    }

    // Get profile name
    const profileName = await page.$eval('header h1', el => el.textContent)
      .catch( (e) => { console.log('No description for profile:', username); return false } )

    // Get  description
    // const profileDescription = await page.$eval('header > section > div > span', el => el.textContent) // alt way
    const profileDescription = await page.$eval('.-vDIg span', el => el.textContent)
      .catch( (e) => { console.log('No description for profile:', username); return false } )

    // Get link (may be missing)
    // const profileLink = await page.$eval('section > main > div header section div a', el => el.textContent) // alt way
    const profileLink = await page.$eval('.-vDIg a', el => el.textContent)
      .catch( (e) => { console.log('No link for profile:', username); return false } ) 

    const profile = {
      username, 
      profileName, 
      profileDescription, 
      posts: headerCountsObj.posts, 
      followers: headerCountsObj.followers, 
      following: headerCountsObj.following, 
      profileSourceImg, 
      profileLink
    }

    profiles.push(profile)
    console.log({profile})
  }

  // Delete old profiles that were just scraped
  await deleteOldProfilesFromSheet(sheet, PROFILE_SHEET, USERNAMES)

  // Add all Rows
  await sheet.addRows(profiles, PROFILE_SHEET)

  await browser.close();
  console.log(`Profiles scraped:${profiles.length}`)
})();

