function saveTwoPagePDFs() {
    // — CONFIGURE THESE —
    const sheetName    = 'Sheet1';                // <-- your sheet name
    const folderId     = DriveApp.getFileById(
                          SpreadsheetApp.getActive().getId()
                        ).getParents().next().getId();  // same folder as the sheet
    const fileBaseName = SpreadsheetApp.getActive().getName();
    
    const ss    = SpreadsheetApp.getActive();
    const sh    = ss.getSheetByName(sheetName);
    if (!sh) throw new Error(`Sheet "${sheetName}" not found`);
    
    // RANGES
    const page1Range = sh.getRange('B1:G4');
    const page2Range = sh.getRange('B32:G35');
    
    // 1) Cache originals
    const bg1 = page1Range.getBackgrounds();
    const fg1 = page1Range.getFontColors();
    const bg2 = page2Range.getBackgrounds();
    const fg2 = page2Range.getFontColors();
    
    // 2) Insert page-break before row 31
    const pb = sh.insertPageBreak(31);
    
    // 3) Color version
    page1Range.setBackground('#030e4f').setFontColor('#d78e22');
    page2Range.setBackground('#030e4f').setFontColor('#d78e22');
    const pdfColor = _exportSheetAsPDF(ss, sh.getSheetId(), `${fileBaseName}_Color`);
    DriveApp.getFolderById(folderId).createFile(pdfColor);
    
    // 4) B/W version
    page1Range.setBackground('#F2F2F2').setFontColor('#FFFFFF');
    page2Range.setBackground('#F2F2F2').setFontColor('#FFFFFF');
    const pdfBW = _exportSheetAsPDF(ss, sh.getSheetId(), `${fileBaseName}_BW`);
    DriveApp.getFolderById(folderId).createFile(pdfBW);
    
    // 5) Restore originals & clean up
    page1Range.setBackgrounds(bg1).setFontColors(fg1);
    page2Range.setBackgrounds(bg2).setFontColors(fg2);
    sh.removePageBreak(pb);
  }
  
  
  // helper to call the built-in export endpoint
  function _exportSheetAsPDF(ss, sheetId, name) {
    const url   = ss.getUrl()
                    .replace(/\/edit.*$/, '') +
                  `export?exportFormat=pdf&format=pdf` +
                  `&gid=${sheetId}` +
                  `&size=letter` +        // or A4
                  `&portrait=true` +
                  `&fitw=true` +          // fit to width
                  `&top_margin=0.50` +
                  `&bottom_margin=0.50` +
                  `&left_margin=0.50` +
                  `&right_margin=0.50` +
                  `&sheetnames=false` +
                  `&printtitle=false` +
                  `&pagenumbers=true` +
                  `&gridlines=false` +
                  `&fzr=false`;           // do not repeat frozen rows
                  
    const token = ScriptApp.getOAuthToken();
    const resp  = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return resp.getBlob().setName(`${name}.pdf`);
  }
  