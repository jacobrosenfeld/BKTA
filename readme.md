# BKTA Files

Files for Beis Knessess of Teaneck Apartments

[github-sync.gs](github-sync.gs) is a script to sync scripts from Github to Google Scripts. ((See full repo here)[https://github.com/jacobrosenfeld/apps-script-github-sync/])

[Generate-PDFs.gs](Generate-PDFs.gs) saves our newsletter from a Google Sheet to PDF and has some automations included.
Automations:
* Subfolder creation
    - The script creates a subfolder based on this Friday's date and this weeks parsha (the parsha is pulled from a cell in the sheet) in the parent folder.
* Naming script
    - Similarly the script will automatically name the file based on the date and parsha (the parsha is pulled from a cell in the sheet).
* Versioning
    - Within the subfolder created the script will check for a base version and subsequent numbered versions and will append the correct _v# to the file name.
* Color coded file names
    - We generate a color and B&W version of the newsletter (digital distribution vs. printing) so it will detect the color in the sheet and append _BW to the file name if it is the B&W version and will ensure version controls are maintained. 

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M4M314FOFQ)