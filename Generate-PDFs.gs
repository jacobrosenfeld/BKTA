function saveRangePDF() {
    // —–– CONFIGURE THESE —––
    const sheetName      = 'BKTA';
    const baseName       = 'BKTA Newsletter';
    const parentFolderId = '19chei_ERIjgjFqGfnteUquSGtuRLLZMB';
    
    // grab sheet & Drive folder
    const ss     = SpreadsheetApp.getActiveSpreadsheet();
    const sheet  = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" not found.`);
    const parent = DriveApp.getFolderById(parentFolderId);
    
    // grab the parsha name from J2
    const parshaName = sheet.getRange('J2').getDisplayValue().trim();
    
    // compute or create Shabbos subfolder
    const friday = getUpcomingFriday();
    const tz     = ss.getSpreadsheetTimeZone();
    const subName   = `Shabbos - ${Utilities.formatDate(friday, tz,'yyyy-MM-dd')} - ${parshaName}`;
    let folder   = parent.getFoldersByName(subName).hasNext()
                     ? parent.getFoldersByName(subName).next()
                     : parent.createFolder(subName);
    
    // build & fetch the PDF blob for B1:G62
    const rangeRef = `${sheetName}!B1:G61`;
    const blob     = exportRangeAsPDF(ss.getId(), sheet.getSheetId(), rangeRef);
    
    // versioning: baseName.pdf → baseName_v2.pdf → …
    let version = 1;
    let fileName = `${baseName}.pdf`;
    while ( folder.getFilesByName(fileName).hasNext() ) {
      version++;
      fileName = `${baseName}_v${version}.pdf`;
    }
    blob.setName(fileName);
    
    // save!
    folder.createFile(blob);
  }

  
  // helper: builds the export URL & returns a PDF blob
  function exportRangeAsPDF(ssId, gid, range) {
    const url =  
      `https://docs.google.com/spreadsheets/d/${ssId}/export?` +
      [
        'exportFormat=pdf',
        'format=pdf',
        'size=letter',
        'portrait=true',
        'fitw=true',                      // fit-to-width
        `range=${encodeURIComponent(range)}`,
        `gid=${gid}`,
        'top_margin=0.50',
        'bottom_margin=0.50',
        'left_margin=0.50',
        'right_margin=0.50',
        'sheetnames=false',
        'printtitle=false',
        'pagenumbers=true',
        'gridlines=false',
        'fzr=false'
      ].join('&');
  
    const token = ScriptApp.getOAuthToken();
    const resp  = UrlFetchApp.fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return resp.getBlob();
  }
  
  
  // helper: next Friday’s date
  function getUpcomingFriday() {
    const d   = new Date();
    const dow = d.getDay();            // Sunday=0 … Friday=5
    let diff  = (5 - dow + 7) % 7;     
    // if (diff === 0) diff = 7;          // if today IS Friday, pick next
    d.setDate(d.getDate() + diff);
    return d;
    
  }
  