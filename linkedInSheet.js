const { GoogleSpreadsheet } = require('google-spreadsheet');


// LinkedIn Scraper sheet
// https://docs.google.com/spreadsheets/d/1wbXRXOo7jmVbuVmU7C7BAZ6ZC62gjMAhj02RUAsvccU/edit#gid=0

// Make sure to share sheet with: webscraper@returnz-tester-215418.iam.gserviceaccount.com

// NPM docs google-spreadsheet
// https://www.npmjs.com/package/google-spreadsheet



class Sheet {
    constructor(google_sheet_id) {
        this.doc = new GoogleSpreadsheet(google_sheet_id);
    }
    
    async load(credentials) {
      if(!credentials) {
        let credentials = require('./credentials.json')
      }
      await this.doc.useServiceAccountAuth(credentials)
      await this.doc.loadInfo(); // loads document properties and worksheets
    }

    async addRows(rows, sheetIndex) {
        const sheet = this.doc.sheetsByIndex[sheetIndex];
        await sheet.addRows(rows)
    }

    async getRows(sheetIndex) {
        const sheet = this.doc.sheetsByIndex[sheetIndex];
        const rows = await sheet.getRows()
        return rows
    }

    async addSheet(title, headerValues) {
        const newSheet = await this.doc.addSheet({ title, headerValues }); 
        return this.doc.sheetsByIndex.length - 1  // returns index of this newly added sheet
    }
}

module.exports = Sheet
