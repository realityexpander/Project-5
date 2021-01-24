
async function deleteOldProfilesFromSheet(sheet, sheetIndex, usernamesToDelete) {
  // Delete old profiles that were just scraped
  let finished = true;
  do {
    const oldProfiles = await sheet.getRows(sheetIndex); // sheet must be refreshed after each delete
    finished = true;
    for (let oldProfile of oldProfiles) {
      if (usernamesToDelete.includes(oldProfile.username)) {
        await oldProfile.delete();
        console.log("Old Profile Deleted:", oldProfile.username);
        finished = false;
        break;
      }
    }
  } while (!finished);
}

exports.deleteOldProfilesFromSheet = deleteOldProfilesFromSheet;
