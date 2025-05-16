function saveTwoPagePDFs() {
    const ss             = SpreadsheetApp.getActiveSpreadsheet();
    const sheet1Name     = 'BKTA';
    const sheet2Name     = 'BKTA_DT';
    const fileBaseName   = 'BKTA Newsletter';
    const parentFolderId = '19chei_ERIjgjFqGfnteUquSGtuRLLZMB';
  
    // 1) Grab both sheets
    const sheet1 = ss.getSheetByName(sheet1Name);
    const sheet2 = ss.getSheetByName(sheet2Name);
    if (!sheet1 || !sheet2) {
      throw new Error(`Sheets "${sheet1Name}" and "${sheet2Name}" must both exist.`);
    }
  
    // 2) Compute Shabbos folder
    const parentFolder = DriveApp.getFolderById(parentFolderId);
    const fridayDate   = getUpcomingFriday();
    const tz           = ss.getSpreadsheetTimeZone();
    const folderName   = `Shabbos - ${Utilities.formatDate(fridayDate, tz, 'yyyy-MM-dd')}`;
    const shabbosFolder = parentFolder
      .getFoldersByName(folderName)
      .hasNext()
        ? parentFolder.getFoldersByName(folderName).next()
        : parentFolder.createFolder(folderName);
  
    // 3) Hide everything except your two sheets
    const allSheets = ss.getSheets();
    const visState  = allSheets.map(s => ({ sheet: s, hidden: s.isSheetHidden() }));
    allSheets.forEach(s => {
      if (s.getSheetName() === sheet1Name || s.getSheetName() === sheet2Name) {
        s.showSheet();
      } else {
        s.hideSheet();
      }
    });
  
    // 4) Ranges to recolor on each sheet
    const r1 = sheet1.getRange('B1:G4');
    const r2 = sheet2.getRange('B1:G4');
    const bg1 = r1.getBackgrounds(), fg1 = r1.getFontColors();
    const bg2 = r2.getBackgrounds(), fg2 = r2.getFontColors();
  
    // —–– Color PDF
    r1.setBackground('#030e4f').setFontColor('#d78e22');
    r2.setBackground('#030e4f').setFontColor('#d78e22');
    let blob = _exportVisibleAsPDF(ss, `${fileBaseName}_Color`);
    shabbosFolder.createFile(blob);
  
    // —–– B/W PDF
    r1.setBackground('#F2F2F2').setFontColor('#FFFFFF');
    r2.setBackground('#F2F2F2').setFontColor('#FFFFFF');
    blob = _exportVisibleAsPDF(ss, `${fileBaseName}_BW`);
    shabbosFolder.createFile(blob);
  
    // 5) Restore formatting and sheet visibility
    r1.setBackgrounds(bg1).setFontColors(fg1);
    r2.setBackgrounds(bg2).setFontColors(fg2);
    visState.forEach(v => {
      v.hidden ? v.sheet.hideSheet() : v.sheet.showSheet();
    });
  }
  
  
  function _exportVisibleAsPDF(ss, name) {
    // scale=4 = fit-to-page; leaving out &gid prints all visible sheets in order
    const url = `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?` +
      [
        'exportFormat=pdf',
        'format=pdf',
        'size=letter',
        'portrait=true',
        'fitw=true',
        'scale=4',
        'top_margin=0.5',
        'bottom_margin=0.5',
        'left_margin=0.5',
        'right_margin=0.5',
        'sheetnames=false',
        'printtitle=false',
        'pagenumbers=true',
        'gridlines=false',
        'fzr=false'
      ].join('&');
  
    const resp = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
    });
    return resp.getBlob().setName(`${name}.pdf`);
  }
  
  
  function getUpcomingFriday() {
    const d = new Date(), dow = d.getDay();
    let diff = (5 - dow + 7) % 7;
    if (diff === 0) diff = 7;
    d.setDate(d.getDate() + diff);
    return d;
  }
  