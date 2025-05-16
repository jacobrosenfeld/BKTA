function saveTwoPagePDFs() {
    // —–– CONFIGURE THESE —––
    const sheetName    = 'BKTA';
    const fileBaseName = 'BKTA Newsletter';
    const ss           = SpreadsheetApp.getActiveSpreadsheet();
    const sh           = ss.getSheetByName(sheetName);
    if (!sh) throw new Error(`Sheet "${sheetName}" not found`);
    
    // 1) Use your specific “parent” folder ID
    const parentFolderId = '19chei_ERIjgjFqGfnteUquSGtuRLLZMB';
    const parentFolder   = DriveApp.getFolderById(parentFolderId);
    
    // 2) Compute upcoming Friday’s date
    const fridayDate = getUpcomingFriday();
    const tz         = ss.getSpreadsheetTimeZone();
    const folderName = `Shabbos - ${Utilities.formatDate(fridayDate, tz, 'yyyy-MM-dd')}`;
    
    // 3) Create or reuse the “Shabbos - YYYY-MM-DD” subfolder
    let shabbosFolder;
    const it = parentFolder.getFoldersByName(folderName);
    if (it.hasNext()) {
      shabbosFolder = it.next();
    } else {
      shabbosFolder = parentFolder.createFolder(folderName);
    }
    
    // // 4) Ranges for formatting swap
    // const page1Fmt = sh.getRange('B1:G4');
    // const page2Fmt = sh.getRange('B32:G35');
    // const bg1 = page1Fmt.getBackgrounds(), fg1 = page1Fmt.getFontColors();
    // const bg2 = page2Fmt.getBackgrounds(), fg2 = page2Fmt.getFontColors();
    
    // // 5) Force two pages
    // const pb = sh.insertPageBreak(31);
    
    // // —–– Color PDF
    // page1Fmt.setBackground('#030e4f').setFontColor('#d78e22');
    // page2Fmt.setBackground('#030e4f').setFontColor('#d78e22');
    // const pdfColor = _exportSheetAsPDF(ss, sh.getSheetId(), `${fileBaseName}_Color`);
    // shabbosFolder.createFile(pdfColor);
    
    // // —–– B/W PDF
    // page1Fmt.setBackground('#F2F2F2').setFontColor('#FFFFFF');
    // page2Fmt.setBackground('#F2F2F2').setFontColor('#FFFFFF');
    // const pdfBW = _exportSheetAsPDF(ss, sh.getSheetId(), `${fileBaseName}_BW`);
    // shabbosFolder.createFile(pdfBW);
    
    // // 6) Restore original formatting & cleanup
    // page1Fmt.setBackgrounds(bg1).setFontColors(fg1);
    // page2Fmt.setBackgrounds(bg2).setFontColors(fg2);
    // sh.removePageBreak(pb);
  }
  
  
  function _exportSheetAsPDF(ss, sheetId, name) {
    const baseUrl = ss.getUrl().replace(/\/edit.*$/, '');
    const opts = [
      `export?exportFormat=pdf&format=pdf`,
      `&gid=${sheetId}`,
      '&range=BKTA!A1:G35',
      `&size=letter`,
      `&portrait=true`,
      `&fitw=true`,
      `&top_margin=0.50`,
      `&bottom_margin=0.50`,
      `&left_margin=0.50`,
      `&right_margin=0.50`,
      `&sheetnames=false`,
      `&printtitle=false`,
      `&pagenumbers=true`,
      `&gridlines=false`,
      `&fzr=false`
    ].join('');
    
    const url   = baseUrl + opts;
    const token = ScriptApp.getOAuthToken();
    const resp  = UrlFetchApp.fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    return resp.getBlob().setName(`${name}.pdf`);
  }
  
  
  function getUpcomingFriday() {
    const today = new Date();
    const dow   = today.getDay();            // Sunday=0 … Friday=5
    let diff    = (5 - dow + 7) % 7;         // days till Friday
    if (diff === 0) diff = 7;                // if today is Friday, go to next Friday
    today.setDate(today.getDate() + diff);
    return today;
  }
  