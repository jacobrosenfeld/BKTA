function saveTwoPagePDFs() {
    // —–– CONFIGURE THESE —––
    const ss             = SpreadsheetApp.getActiveSpreadsheet();
    const sheet1Name     = 'BKTA';
    const sheet2Name     = 'BKTA_DT';
    const fileBaseName   = 'BKTA Newsletter';
    const parentFolderId = '19chei_ERIjgjFqGfnteUquSGtuRLLZMB';
    
    // grab your two sheets
    const sheet1 = ss.getSheetByName(sheet1Name);
    const sheet2 = ss.getSheetByName(sheet2Name);
    if (!sheet1 || !sheet2) {
      throw new Error(`Both sheets "${sheet1Name}" and "${sheet2Name}" must exist.`);
    }
    
    // compute or create the Shabbos subfolder
    const parentFolder = DriveApp.getFolderById(parentFolderId);
    const fridayDate   = getUpcomingFriday();
    const tz           = ss.getSpreadsheetTimeZone();
    const folderName   = `Shabbos - ${Utilities.formatDate(fridayDate, tz, 'yyyy-MM-dd')}`;
    let shabbosFolder  = parentFolder.getFoldersByName(folderName).hasNext()
                           ? parentFolder.getFoldersByName(folderName).next()
                           : parentFolder.createFolder(folderName);
    
    // record and then hide all sheets except our two
    const allSheets = ss.getSheets();
    const visState  = allSheets.map(s => ({ sheet: s, hidden: s.isSheetHidden() }));
    allSheets.forEach(s => {
      if (s.getSheetName() === sheet1Name || s.getSheetName() === sheet2Name) {
        s.showSheet();
      } else {
        s.hideSheet();
      }
    });
    
    // ranges to recolor on each sheet
    const range1 = sheet1.getRange('B1:G4');
    const range2 = sheet2.getRange('B32:G35');
    
    // cache originals
    const bg1 = range1.getBackgrounds(), fg1 = range1.getFontColors();
    const bg2 = range2.getBackgrounds(), fg2 = range2.getFontColors();
    
    // —–– Color version
    range1.setBackground('#030e4f').setFontColor('#d78e22');
    range2.setBackground('#030e4f').setFontColor('#d78e22');
    let blob = exportVisibleSheetsAsPDF(ss, `${fileBaseName}_Color`);
    shabbosFolder.createFile(blob);
    
    // —–– B/W version
    range1.setBackground('#F2F2F2').setFontColor('#FFFFFF');
    range2.setBackground('#F2F2F2').setFontColor('#FFFFFF');
    blob = exportVisibleSheetsAsPDF(ss, `${fileBaseName}_BW`);
    shabbosFolder.createFile(blob);
    
    // restore formatting
    range1.setBackgrounds(bg1).setFontColors(fg1);
    range2.setBackgrounds(bg2).setFontColors(fg2);
    
    // restore sheet visibility
    visState.forEach(v => {
      v.hidden ? v.sheet.hideSheet() : v.sheet.showSheet();
    });
  }
  
  
  function exportVisibleSheetsAsPDF(ss, name) {
    const baseUrl = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?';
    const params = [
      'exportFormat=pdf&format=pdf',
      '&size=letter',
      '&portrait=true',
      '&fitw=true',
      '&top_margin=0.50',
      '&bottom_margin=0.50',
      '&left_margin=0.50',
      '&right_margin=0.50',
      '&sheetnames=false',
      '&printtitle=false',
      '&pagenumbers=true',
      '&gridlines=false',
      '&fzr=false'
    ].join('');
    
    const url   = baseUrl + params;
    const token = ScriptApp.getOAuthToken();
    const resp  = UrlFetchApp.fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return resp.getBlob().setName(`${name}.pdf`);
  }
  
  
  function getUpcomingFriday() {
    const today = new Date();
    const dow   = today.getDay();           // Sunday=0 … Friday=5
    let diff    = (5 - dow + 7) % 7;        // days until Friday
    if (diff === 0) diff = 7;               // if today *is* Friday, pick next
    today.setDate(today.getDate() + diff);
    return today;
  }
  