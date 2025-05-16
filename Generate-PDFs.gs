function saveTwoPagePDFs() {
    // — CONFIGURE THESE —
    const sheetName    = 'BKTA';                // <-- your sheet name
    const fileBaseName = SpreadsheetApp.getActive().getName();
    const ss           = SpreadsheetApp.getActive();
    const sh           = ss.getSheetByName(sheetName);
    if (!sh) throw new Error(`Sheet "${sheetName}" not found`);
    
    // 1) Get parent folder of this spreadsheet
    const thisFile     = DriveApp.getFileById(ss.getId());
    const parentFolder = DriveApp.getFileById(ss.getId()).getParents();
    const folderId = "19chei_ERIjgjFqGfnteUquSGtuRLLZMB";
    
    // 2) Compute upcoming Friday date
    const fridayDate   = getUpcomingFriday();
    const tz           = ss.getSpreadsheetTimeZone();
    const folderName   = `Shabbos - ${Utilities.formatDate(fridayDate, tz, 'yyyy-MM-dd')}`;
    
    // 3) Create (or reuse) the Shabbos folder
    let shabbosFolder;
    const foldersIter = folderId.getFoldersByName(folderName);
    if (foldersIter.hasNext()) {
      shabbosFolder = foldersIter.next();
    } else {
      shabbosFolder = folderId.createFolder(folderName);
    }
    
    // RANGES for formatting swaps
    const page1FmtRange = sh.getRange('B1:G4');
    const page2FmtRange = sh.getRange('B32:G35');
    
    // Cache originals
    const bg1 = page1FmtRange.getBackgrounds();
    const fg1 = page1FmtRange.getFontColors();
    const bg2 = page2FmtRange.getBackgrounds();
    const fg2 = page2FmtRange.getFontColors();
    
    // Insert manual page-break before row 31
    const pb = sh.insertPageBreak(31);
    
    // —–– Color version PDF
    page1FmtRange.setBackground('#030e4f').setFontColor('#d78e22');
    page2FmtRange.setBackground('#030e4f').setFontColor('#d78e22');
    const pdfColor = _exportSheetAsPDF(ss, sh.getSheetId(), `${fileBaseName}_Color`);
    shabbosFolder.createFile(pdfColor);
    
    // —–– B/W version PDF
    page1FmtRange.setBackground('#F2F2F2').setFontColor('#FFFFFF');
    page2FmtRange.setBackground('#F2F2F2').setFontColor('#FFFFFF');
    const pdfBW = _exportSheetAsPDF(ss, sh.getSheetId(), `${fileBaseName}_BW`);
    shabbosFolder.createFile(pdfBW);
    
    // Restore original formatting & remove page-break
    page1FmtRange.setBackgrounds(bg1).setFontColors(fg1);
    page2FmtRange.setBackgrounds(bg2).setFontColors(fg2);
    sh.removePageBreak(pb);
  }
  
  
  // Helper: export the given sheet as a letter-size, 2-page PDF
  function _exportSheetAsPDF(ss, sheetId, name) {
    const url = ss.getUrl()
                 .replace(/\/edit.*$/, '') +
                `export?exportFormat=pdf&format=pdf` +
                `&gid=${sheetId}` +
                `&size=letter` +
                `&portrait=true` +
                `&fitw=true` +
                `&top_margin=0.50` +
                `&bottom_margin=0.50` +
                `&left_margin=0.50` +
                `&right_margin=0.50` +
                `&sheetnames=false` +
                `&printtitle=false` +
                `&pagenumbers=true` +
                `&gridlines=false` +
                `&fzr=false`;
    const token = ScriptApp.getOAuthToken();
    const resp  = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return resp.getBlob().setName(`${name}.pdf`);
  }
  
  // Helper: returns a Date object for the next Friday
  function getUpcomingFriday() {
    const today = new Date();
    const dow   = today.getDay();        // Sunday=0 … Friday=5
    let diff    = (5 - dow + 7) % 7;     // days until Friday
    if (diff === 0) diff = 7;            // if today *is* Friday, go to *next* Friday
    today.setDate(today.getDate() + diff);
    return today;
  }
  