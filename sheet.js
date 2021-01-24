const { GoogleSpreadsheet } = require('google-spreadsheet');


// Instagram Scraper sheet
// https://docs.google.com/spreadsheets/d/1n1OfB9i01R2QllRsGW-QfEa5yeF6qPybk0WZ7I8XcHU/edit#gid=0

// NPM docs google-spreadsheet
// https://www.npmjs.com/package/google-spreadsheet



class Sheet {
    constructor() {
        this.doc = new GoogleSpreadsheet('1n1OfB9i01R2QllRsGW-QfEa5yeF6qPybk0WZ7I8XcHU');
    }
    
    async load() {
        await this.doc.useServiceAccountAuth(require('./credentials.json'))
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
