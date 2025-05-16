function saveRangePDF() {
    // —–– CONFIGURE THESE —––
    const sheetName      = 'BKTA';
    const parentFolderId = '19chei_ERIjgjFqGfnteUquSGtuRLLZMB';
    const fileBaseName   = 'BKTA Newsletter';
    
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" not found.`);
    
    // grab parsha & date
    const parshaName = sheet.getRange('J2').getDisplayValue().trim();
    const friday     = getUpcomingFriday();
    const tz         = ss.getSpreadsheetTimeZone();
    const dateStr    = Utilities.formatDate(friday, tz, 'yyyy-MM-dd');
    
    // make/find the Shabbos folder
    const parent     = DriveApp.getFolderById(parentFolderId);
    const folderName = `Shabbos - ${dateStr} - ${parshaName}`;
    const folder     = parent.getFoldersByName(folderName).hasNext()
                         ? parent.getFoldersByName(folderName).next()
                         : parent.createFolder(folderName);
    
    // export only B1:G62 of BKTA
    const blob = exportRangeAsPDF(
      ss.getId(),
      sheet.getSheetId(),
      `${sheetName}!B1:G62`
    );
    
    // --- new: detect if this is a B/W layout by checking B1's fill ---
    const rawColor = sheet.getRange('B1').getBackground().toLowerCase();
    const isBW     = rawColor === '#c0c0c0';
    
    // build versioned filename
    const baseFile = `${fileBaseName} - ${parshaName} - ${dateStr}`;
    let version    = 1;
    let fileName   = `${baseFile}${isBW ? '_BW' : ''}.pdf`;
    
    // if file exists, bump to _v2, _v3, ...
    while ( folder.getFilesByName(fileName).hasNext() ) {
      version++;
      fileName = `${baseFile}_v${version}${isBW ? '_BW' : ''}.pdf`;
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
    // if (diff === 0) diff = 7;          // if today IS Friday, pick next
    d.setDate(d.getDate() + diff);
    return d;
  }
  