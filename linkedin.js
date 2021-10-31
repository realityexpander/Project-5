const puppeteer = require('puppeteer');
const secrets = require('./li-secrets');
// const { USERNAME:username, PASSWORD:password} = require('./secrets'); // using rename destructuring
const Sheet = require('./linkedInSheet');
const { deleteOldProfilesFromSheet } = require("./deleteOldProfilesFromSheet");
const { exit } = require('process');
const fs = require('fs')

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
// Functions
// https://console.cloud.google.com/functions/list?project=returnz-tester-215418
// Logs
// https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_function%22%0Aresource.labels.function_name%3D%22instagram-profile-scraper%22%0Aresource.labels.region%3D%22us-central1%22;timeRange=PT1H?project=returnz-tester-215418
// Cron Jobs
// https://console.cloud.google.com/cloudscheduler?project=returnz-tester-215418

// LinkedIn Scraper Sheet
// https://docs.google.com/spreadsheets/d/1wbXRXOo7jmVbuVmU7C7BAZ6ZC62gjMAhj02RUAsvccU/edit#gid=0

// https://codedec.com/tutorials/how-to-get-page-title-and-url-in-puppeteer/


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

module.exports = function() {
  run()
}();

async function run() {

  const PERSON_LINK_URL_COLUMN = 'person_linkedin_url'
  const PERSON_LINK_SHORT_URL_COLUMN = 'person_linkedin_short_url'

  console.log("Starting function scrapeLinkedIn v1.0")

  let data = fs.readFileSync("./li-secrets.json").toString() 
  let secrets = JSON.parse(data)
  console.log(`LinkedIn login username: ${secrets.USERNAME}`)
  console.log(`Google Sheets ID: ${secrets.GOOGLE_SHEET_ID}`)

  data = fs.readFileSync("./gcp-credentials.json").toString()
  let credentials = JSON.parse(data)
  console.log(`Webscraper client email (sheet->share with this): ${credentials.client_email}`)

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox', 
      '--disable-dev-shm-usage',
    ], 
    headless: true
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'); // prevents puppeteer headless not working
  // await page.setViewport({ width: 1920, height: 969 })
  page.setDefaultNavigationTimeout(7000)

  // Login
  console.log("Navigating to Linkedin...")
  await page.goto('https://linkedin.com/login');

  console.log("Waiting for selector 'input'...")
  // await page.waitForFunction('document.querySelector("input")'); // alternate way to wait for selector
  await page.waitForSelector('input')

  console.log("Entering credentials...")
  const loginUsername = await page.$$('input#username')
  console.log(`username=${secrets.USERNAME}`)
  await loginUsername[0].type(secrets.USERNAME)

  const loginPassword = await page.$$('input#password')
  console.log(`password=${secrets.PASSWORD.substring(0,3)}...`)
  await loginPassword[0].type(secrets.PASSWORD)

  // const loginButton = await page.$x('//*[@id="loginForm"]/div/div[3]/button') // using xSelector
  // await loginButton[0]

  console.log("waiting for button 'sign in'...")
  const loginButton = (await page.$$('button'))[0] 
  await loginButton.click()
  console.log("Successfully logged in.")

  console.log("Loading Sheet...")
  const sheet = new Sheet(secrets.GOOGLE_SHEET_ID)
  await sheet.load(credentials)
  console.log("Sheet successfully loaded.")

  // get profile account links from the sheet
  let rows = await sheet.getRows(0)
  console.log("Num Links Scraping:", rows.length)
  console.log("----------BEGIN SCRAPING---------------")

  // Scrape the LinkedInProfiles array into profiles
  let profilesSuccessCount = 0
  let profilesErrorCount = 0
  let currentProfileCount = 1
  let totalProfileCount = rows.length
  let errorProfiles = []
  for (let row of rows) {
  // let row = rows[0] {
    let link = row[PERSON_LINK_URL_COLUMN]
    console.log(`${currentProfileCount}/${totalProfileCount} - Waiting for profile nav for ${row.person_first_name} ${row.person_last_name}:`, link)
    try {
      await page.goto(link)
      await page.waitForSelector('h1.text-heading-xlarge')

      const url = page.url();
      console.log("  Page URL: "+url); 
      const title = await page.title();
      console.log("  Page Title: "+title);

      // save the url
      row[PERSON_LINK_SHORT_URL_COLUMN] = url;
      await row.save();

      profilesSuccessCount++;
    } catch(e) {
      console.log('  ERROR: Bad link for profile:', link, e);

      const profile = {
        firstname: row.person_first_name, 
        lastname: row.person_last_name,
        link: row[PERSON_LINK_URL_COLUMN]
      }
      errorProfiles.push(profile)
      profilesErrorCount++;
    }

  //   // Get profile name
  //   const profileName = await page.$eval('header h1', el => el.textContent)
  //     .catch( (e) => { console.log('No description for profile:', link); return false } )
    
    // Wait a bit
    await page.waitForTimeout(3000);
    currentProfileCount++;
  }

  await browser.close();

  console.log("----------END SCRAPING---------------");
  console.log(`Number of Successful Profiles scraped: ${profilesSuccessCount}`)
  console.log(`Number of Problem profiles: ${profilesErrorCount}`)
  console.log('Problem profiles:')
  console.log(JSON.stringify(errorProfiles, null, 2))
};

