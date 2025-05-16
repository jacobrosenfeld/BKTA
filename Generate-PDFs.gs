function saveTwoPagePDFs() {
    const ss           = SpreadsheetApp.getActive();
    const orig         = ss.getSheetByName('BKTA');
    if (!orig) throw new Error('Sheet BKTA not found');
    const baseName     = 'BKTA Newsletter';
    const parentFolder = DriveApp.getFolderById('19chei_ERIjgjFqGfnteUquSGtuRLLZMB');
    const friday       = getUpcomingFriday();
    const tz           = ss.getSpreadsheetTimeZone();
    const subName      = 'Shabbos - ' + Utilities.formatDate(friday, tz, 'yyyy-MM-dd');
    let shabbosFolder  = parentFolder.getFoldersByName(subName).hasNext()
                          ? parentFolder.getFoldersByName(subName).next()
                          : parentFolder.createFolder(subName);
  
    // 1) Create temp sheets
    const tmp1 = ss.insertSheet('_tmp_page1');
    orig.getRange('B1:G30').copyTo(tmp1.getRange('A1'));
    const tmp2 = ss.insertSheet('_tmp_page2');
    orig.getRange('B32:G62').copyTo(tmp2.getRange('A1'));
  
    // 2) Cache original visibility and hide everything except temps
    const states = ss.getSheets().map(sh => ({name: sh.getName(), hidden: sh.isSheetHidden()}));
    ss.getSheets().forEach(sh => {
      if (sh.getName() !== tmp1.getName() && sh.getName() !== tmp2.getName()) {
        sh.hideSheet();
      } else {
        sh.showSheet();
      }
    });
  
    // Range which needs recoloring in each temp (first 4 rows)
    const colorRanges = [
      tmp1.getRange('A1:G4'),
      tmp2.getRange('A1:G4')
    ];
  
    // ––– Color PDF
    colorRanges.forEach(r => r.setBackground('#030e4f').setFontColor('#d78e22'));
    let blob = exportAllSheetsAsPDF(ss, baseName + '_Color');
    shabbosFolder.createFile(blob);
  
    // ––– B/W PDF
    colorRanges.forEach(r => r.setBackground('#F2F2F2').setFontColor('#FFFFFF'));
    blob = exportAllSheetsAsPDF(ss, baseName + '_BW');
    shabbosFolder.createFile(blob);
  
    // 5) Cleanup: restore sheet visibility, remove temps
    states.forEach(st => {
      const sh = ss.getSheetByName(st.name);
      st.hidden ? sh.hideSheet() : sh.showSheet();
    });
    ss.deleteSheet(tmp1);
    ss.deleteSheet(tmp2);
  }
  
  function exportAllSheetsAsPDF(ss, name) {
    const url = ss.getUrl().replace(/\/edit.*$/, '') +
      'export?exportFormat=pdf&format=pdf' +
      '&size=letter&portrait=true&fitw=true' +
      '&top_margin=0.50&bottom_margin=0.50&left_margin=0.50&right_margin=0.50' +
      '&sheetnames=false&printtitle=false&pagenumbers=true&gridlines=false&fzr=false';
    const token = ScriptApp.getOAuthToken();
    const res   = UrlFetchApp.fetch(url, {headers:{Authorization:'Bearer '+token}});
    return res.getBlob().setName(name+'.pdf');
  }
  
  function getUpcomingFriday() {
    const d = new Date(), day = d.getDay();
    let diff = (5 - day + 7) % 7; if (!diff) diff = 7;
    d.setDate(d.getDate() + diff);
    return d;
  }
  