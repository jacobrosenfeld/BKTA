function saveRangePDF() {
    // —–– CONFIGURE THESE —––
    const sheetName      = 'BKTA';
    const parentFolderId = '19chei_ERIjgjFqGfnteUquSGtuRLLZMB';
    const fileBaseName   = 'BKTA Newsletter';
    
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" not found.`);
    
    // grab parsha from J2
    const parshaName = sheet.getRange('J2').getDisplayValue().trim();
    
    // compute upcoming Friday & date string
    const friday  = getUpcomingFriday();
    const tz      = ss.getSpreadsheetTimeZone();
    const dateStr = Utilities.formatDate(friday, tz, 'yyyy-MM-dd');
    
    // build subfolder (unchanged)
    const parent  = DriveApp.getFolderById(parentFolderId);
    const folderName = `Shabbos - ${dateStr} - ${parshaName}`;
    const folder  = parent.getFoldersByName(folderName).hasNext()
                      ? parent.getFoldersByName(folderName).next()
                      : parent.createFolder(folderName);
    
    // export the range B1:G62
    const blob = exportRangeAsPDF(
      ss.getId(),
      sheet.getSheetId(),
      `${sheetName}!B1:G62`
    );
    
    // build the versioned filename
    const baseFile = `${fileBaseName} - ${parshaName} - ${dateStr}`;
    let version    = 1;
    let fileName   = `${baseFile}.pdf`;
    
    while ( folder.getFilesByName(fileName).hasNext() ) {
      version++;
      fileName = `${baseFile}_v${version}.pdf`;
    }
    
    blob.setName(fileName);
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
        'fitw=true',                                 // fit-to-width
        `range=${encodeURIComponent(range)}`,        // e.g. BKTA!B1:G62
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
    if (diff === 0) diff = 7;          // if today IS Friday, pick next
    d.setDate(d.getDate() + diff);
    return d;
  }
  