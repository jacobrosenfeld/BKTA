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
    Logger.log(`Shabbos folder: ${shabbosFolder.getName()} (${shabbosFolder.getId()})`);
  
  function _exportSheetAsPDF(ss, sheetId, name) {
    const baseUrl = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?';
    const opts = [
      `export?exportFormat=pdf&format=pdf`,
      `&gid=${sheetId}`,
      '&range=BKTA!B1:G61',
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
  