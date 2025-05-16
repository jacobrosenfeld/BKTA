// This function will run when the spreadsheet is opened
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Create a new menu
  ui.createMenu('Save Newsletter') // change to customize your script menu
      .addItem('Export to PDF', 'fetchAndRunScript')  // Add an item to the menu - change button name if you want
      .addToUi();  // Add the menu to the user interface
}

function fetchAndRunScript() {
    const githubToken = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
    const repoOwner = PropertiesService.getScriptProperties().getProperty('GITHUB_USER');
    const repoName = PropertiesService.getScriptProperties().getProperty('GITHUB_REPO');
    const filePath = PropertiesService.getScriptProperties().getProperty('GITHUB_FILE_PATH');
    const API_KEY = PropertiesService.getScriptProperties().getProperty('api_key');
    const API_URL = PropertiesService.getScriptProperties().getProperty('api_url');
    const branch = 'main'; // or the branch you want to pull from

    // Log the values being used to construct the URL
    Logger.log('GitHub User: ' + repoOwner);
    Logger.log('GitHub Repo: ' + repoName);
    Logger.log('File Path: ' + filePath);
    Logger.log('Branch: ' + branch);

    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`;
    
    // Log the constructed URL
    Logger.log('Constructed URL: ' + url);
    
    const options = {
        method: 'get',
        headers: {
            'Authorization': 'Bearer ' + githubToken,
            'Accept': 'application/vnd.github.v3.raw',
            'X-GitHub-Api-Version': '2022-11-28'
        },
        muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    
    // Log the full response and its content
    Logger.log('Full Response: ' + response);
    Logger.log('Response Code: ' + response.getResponseCode());
    Logger.log('Response Content: ' + response.getContentText());
    
    if (response.getResponseCode() === 200) {
        const scriptContent = response.getContentText();
        Logger.log('Fetched Script Content: ' + scriptContent);
        eval(scriptContent); // Execute the fetched script
        saveTwoPagePDFs(); // Call the function from the fetched script
    } else {
        // Log the error response content
        Logger.log('Error fetching script: ' + response.getContentText());
    }
}