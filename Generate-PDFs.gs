function saveTwoPagePDFs() {
    const ss             = SpreadsheetApp.getActiveSpreadsheet();
    const sheet1Name     = 'BKTA';
    const sheet2Name     = 'BKTA_DT';
    const fileBaseName   = 'BKTA Newsletter';
    const parentFolderId = '19chei_ERIjgjFqGfnteUquSGtuRLLZMB';
    
    const sheet1 = ss.getSheetByName(sheet1Name);
    const sheet2 = ss.getSheetByName(sheet2Name);
    if (!sheet1 || !sheet2) throw new Error(`Both sheets "${sheet1Name}" and "${sheet2Name}" must exist.`);
    
    // 1) Create temp sheets and copy only B1:G30
    const tmp1 = ss.insertSheet('_TMP_PG1');
    sheet1.getRange('B1:G30').copyTo(tmp1.getRange('A1'));
    const tmp2 = ss.insertSheet('_TMP_PG2');
    sheet2.getRange('B1:G30').copyTo(tmp2.getRange('A1'));
    
    // 2) Hide all except temps
    const all  = ss.getSheets();
    const vis  = all.map(sh=>({sh, hidden: sh.isSheetHidden()}));
    all.forEach(sh=>{
      if (sh!==tmp1 && sh!==tmp2) sh.hideSheet();
      else                    sh.showSheet();
    });
    
    // 3) Cache & recolor rows 1–4 in each temp
    const r1   = tmp1.getRange('A1:G4');
    const r2   = tmp2.getRange('A1:G4');
    const bg1  = r1.getBackgrounds(), fg1 = r1.getFontColors();
    const bg2  = r2.getBackgrounds(), fg2 = r2.getFontColors();
    
    const parentFolder = DriveApp.getFolderById(parentFolderId);
    const fridayDate   = getUpcomingFriday();
    const tz           = ss.getSpreadsheetTimeZone();
    const folderName   = `Shabbos - ${Utilities.formatDate(fridayDate, tz,'yyyy-MM-dd')}`;
    const shabbosFolder= parentFolder.getFoldersByName(folderName).hasNext()
                          ? parentFolder.getFoldersByName(folderName).next()
                          : parentFolder.createFolder(folderName);
    
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
    
    // 4) Cleanup: restore formatting & visibility, delete temps
    r1.setBackgrounds(bg1).setFontColors(fg1);
    r2.setBackgrounds(bg2).setFontColors(fg2);
    vis.forEach(v=> v.hidden ? v.sh.hideSheet() : v.sh.showSheet());
    ss.deleteSheet(tmp1);
    ss.deleteSheet(tmp2);
  }
  
  function _exportVisibleAsPDF(ss, name) {
    // fit to page = scale=4
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
    
    const token = ScriptApp.getOAuthToken();
    const res   = UrlFetchApp.fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.getBlob().setName(`${name}.pdf`);
  }
  
  function getUpcomingFriday() {
    const d = new Date(), day = d.getDay();
    let diff = (5 - day + 7) % 7; if (diff === 0) diff = 7;
    d.setDate(d.getDate() + diff);
    return d;
  }
  