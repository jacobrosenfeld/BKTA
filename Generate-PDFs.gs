function saveRangePDF() {
    // —–– CONFIGURE THESE —––
    const sheetName      = 'BKTA';
    const parentFolderId = '19chei_ERIjgjFqGfnteUquSGtuRLLZMB';
    const fileBaseName   = 'BKTA Newsletter';
    
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" not found.`);
    
    // Parsha & date
    const parshaName = sheet.getRange('J2').getDisplayValue().trim();
    const friday     = getUpcomingFriday();
    const tz         = ss.getSpreadsheetTimeZone();
    const dateStr    = Utilities.formatDate(friday, tz, 'yyyy-MM-dd');
    
    // Shabbos subfolder
    const parent = DriveApp.getFolderById(parentFolderId);
    const folderName = `Shabbos - ${dateStr} - ${parshaName}`;
    const folder = parent.getFoldersByName(folderName).hasNext()
      ? parent.getFoldersByName(folderName).next()
      : parent.createFolder(folderName);
    
    // Export the range
    const blob = exportRangeAsPDF(
      ss.getId(),
      sheet.getSheetId(),
      `${sheetName}!B1:G62`
    );
    
    // Detect B/W mode by B1 background
    const isBW   = sheet.getRange('B1').getBackground().toLowerCase() === '#F2F2F2';
    const base   = `${fileBaseName} - ${parshaName} - ${dateStr}`;
    
    // Determine version from existing color files
    const maxVer = getMaxVersion(folder, base);
    let version, fileName;
    
    if (!isBW) {
      // Color: next version
      version  = maxVer + 1;
      const vs = version === 1 ? '' : `_v${version}`;
      fileName = `${base}${vs}.pdf`;
    } else {
      // B/W: match max version (or 1 if none)
      version  = maxVer || 1;
      const vs = version === 1 ? '' : `_v${version}`;
      fileName = `${base}${vs}_BW.pdf`;
    }
    
    // Ensure unique (in case someone re-ran)
    while (folder.getFilesByName(fileName).hasNext()) {
      version++;
      const vs = version === 1 ? '' : `_v${version}`;
      fileName = isBW
        ? `${base}${vs}_BW.pdf`
        : `${base}${vs}.pdf`;
    }
    
    // Save it
    blob.setName(fileName);
    folder.createFile(blob);
  }
  
  
  // —–– HELPERS —––
  
  function exportRangeAsPDF(ssId, gid, range) {
    const url =  
      `https://docs.google.com/spreadsheets/d/${ssId}/export?` +
      [
        'exportFormat=pdf',
        'format=pdf',
        'size=letter',
        'portrait=true',
        'fitw=true',
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
  
  function getUpcomingFriday() {
    const d   = new Date();
    const dow = d.getDay();            // Sunday=0 … Friday=5
    let diff  = (5 - dow + 7) % 7;
    // if (diff === 0) diff = 7;          // if today IS Friday, pick next
    d.setDate(d.getDate() + diff);
    return d;
  }
  
  function getMaxVersion(folder, base) {
    let max = 0;
    const files = folder.getFiles();
    const esc   = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re    = new RegExp(`^${esc}(?:_v(\\d+))?(?:_BW)?\\.pdf$`);
    
    while (files.hasNext()) {
      const name = files.next().getName();
      const m = name.match(re);
      if (m) {
        const v = m[1] ? parseInt(m[1], 10) : 1;
        if (v > max) max = v;
      }
    }
    return max;
  }
  