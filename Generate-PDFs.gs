function saveRangePDF() {
    // —–– CONFIGURE THESE —––
    const sheetName      = 'BKTA';
    const parentFolderId = '19chei_ERIjgjFqGfnteUquSGtuRLLZMB';
    const ss             = SpreadsheetApp.getActiveSpreadsheet();
    const sheet          = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" not found.`);
    
    // grab parsha from J2
    const parshaName = sheet.getRange('J2').getDisplayValue().trim();
    
    // compute or create Shabbos subfolder (and file base name)
    const parent = DriveApp.getFolderById(parentFolderId);
    const friday = getUpcomingFriday();
    const tz     = ss.getSpreadsheetTimeZone();
    // this is now both folder name AND base file name
    const subName = `Shabbos - ${Utilities.formatDate(friday, tz, 'yyyy-MM-dd')} - ${parshaName}`;
    
    let folder = parent.getFoldersByName(subName).hasNext()
                   ? parent.getFoldersByName(subName).next()
                   : parent.createFolder(subName);
    
    // export the range B1:G62 as a fit-to-width PDF blob
    const blob = exportRangeAsPDF(
      ss.getId(),
      sheet.getSheetId(),
      `${sheetName}!B1:G62`
    );
    
    // version control on subName.pdf → subName_v2.pdf → …
    let version  = 1;
    let fileName = `${subName}.pdf`;
    while ( folder.getFilesByName(fileName).hasNext() ) {
      version++;
      fileName = `${subName}_v${version}.pdf`;
    }
    blob.setName(fileName);
    
    // save into the Shabbos folder
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
  