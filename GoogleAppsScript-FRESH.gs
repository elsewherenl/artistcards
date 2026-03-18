/**
 * FRESH START - Google Apps Script for Status Updates
 *
 * SETUP:
 * 1. Delete all existing deployments
 * 2. Paste this code
 * 3. Save (Ctrl/Cmd + S)
 * 4. Deploy → New deployment
 * 5. Type: Web app
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Deploy
 * 9. Copy the new URL to index.html
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    Logger.log('========== NEW REQUEST ==========');

    // Handle case where e might be undefined
    if (!e) {
      Logger.log('ERROR: Event object is undefined');
      return createResponse(false, 'No event object received');
    }

    Logger.log('Event object received');

    // Extract parameters (try both GET and POST methods)
    let artistName = null;
    let newStatus = null;
    let newRanking = null;

    // Method 1: URL parameters (GET)
    if (e.parameter) {
      artistName = e.parameter.artistName;
      newStatus = e.parameter.newStatus;
      newRanking = e.parameter.newRanking;
      Logger.log('Got params from e.parameter (GET)');
    }

    // Method 2: Form data (POST)
    if (!artistName && e.parameters) {
      artistName = e.parameters.artistName ? e.parameters.artistName[0] : null;
      newStatus = e.parameters.newStatus ? e.parameters.newStatus[0] : null;
      newRanking = e.parameters.newRanking ? e.parameters.newRanking[0] : null;
      Logger.log('Got params from e.parameters (POST)');
    }

    Logger.log('Artist: "' + artistName + '"');
    Logger.log('Status: "' + newStatus + '"');
    Logger.log('Ranking: "' + newRanking + '"');

    // Validate - need at least artist name and one update field
    if (!artistName || (!newStatus && !newRanking)) {
      Logger.log('ERROR: Missing parameters');
      Logger.log('artistName: ' + artistName);
      Logger.log('newStatus: ' + newStatus);
      Logger.log('newRanking: ' + newRanking);
      return createResponse(false, 'Missing required parameters. artistName=' + artistName + ', newStatus=' + newStatus + ', newRanking=' + newRanking);
    }

    // Open spreadsheet
    Logger.log('Opening spreadsheet...');
    const ss = SpreadsheetApp.openById('1gGSXIb3_cwnnbbVk73lYDeOiZwQjYk3OGgJ3V8MYRtc');
    const sheet = ss.getSheetByName('Live Longlist');

    if (!sheet) {
      Logger.log('ERROR: Sheet not found');
      return createResponse(false, 'Sheet "Live Longlist" not found');
    }

    Logger.log('Sheet found: ' + sheet.getName());

    // Get data
    const data = sheet.getDataRange().getValues();
    Logger.log('Total rows: ' + data.length);

    // Find artist by matching against Column C (Artist) - index 2
    let foundRow = -1;
    const searchName = artistName.toString().trim().toLowerCase();
    Logger.log('Searching for (lowercase): "' + searchName + '"');

    // Log first 5 artist names for debugging
    Logger.log('First 5 artists in Column C:');
    for (let i = 1; i < Math.min(6, data.length); i++) {
      Logger.log('  Row ' + (i + 1) + ': Column C="' + data[i][2] + '"');
    }

    // Search for artist - try Column C (Artist name)
    for (let i = 1; i < data.length; i++) {
      const artistCol = data[i][2]; // Column C - Artist

      if (artistCol) {
        const cellName = artistCol.toString().trim().toLowerCase();
        if (cellName === searchName) {
          foundRow = i + 1; // Convert to 1-based row number
          Logger.log('FOUND at row ' + foundRow + ' in Column C');
          Logger.log('Matched: "' + artistCol + '" === "' + artistName + '"');
          if (newStatus) Logger.log('Current value in Column N: ' + data[i][13]);
          if (newRanking) Logger.log('Current value in Column O: ' + data[i][14]);
          break;
        }
      }
    }

    if (foundRow === -1) {
      Logger.log('ERROR: Artist not found');
      Logger.log('Searched for: "' + artistName + '" (trimmed & lowercase: "' + searchName + '")');
      Logger.log('Total rows searched: ' + (data.length - 1));
      return createResponse(false, 'Artist "' + artistName + '" not found in spreadsheet');
    }

    const responseData = {
      artist: artistName,
      row: foundRow
    };

    // Update Column N (column 14 in 1-based indexing) for Status
    if (newStatus) {
      // Get the old status before updating
      const oldStatus = data[foundRow - 1][13] ? data[foundRow - 1][13].toString().trim() : '';
      Logger.log('Old status: "' + oldStatus + '"');
      Logger.log('Old status (lowercase): "' + oldStatus.toLowerCase() + '"');
      Logger.log('New status: "' + newStatus + '"');
      Logger.log('New status (lowercase): "' + newStatus.toLowerCase() + '"');
      Logger.log('Updating cell N' + foundRow + ' to: ' + newStatus);
      sheet.getRange(foundRow, 14).setValue(newStatus);
      responseData.newStatus = newStatus;

      // If changing from Prospect/Planned Outreach to Awaiting Response, update Outreach Date (Column W)
      const oldStatusLower = oldStatus.toLowerCase();
      const newStatusLower = newStatus.toLowerCase();

      Logger.log('Checking condition for outreach date update...');
      Logger.log('Is old status "prospect"? ' + (oldStatusLower === 'prospect'));
      Logger.log('Is old status "planned outreach"? ' + (oldStatusLower === 'planned outreach'));
      Logger.log('Is new status "awaiting response"? ' + (newStatusLower === 'awaiting response'));

      // Condition 1: Prospect/Planned Outreach → Awaiting Response = Update Outreach Date (Column W)
      if ((oldStatusLower === 'prospect' || oldStatusLower === 'planned outreach') &&
          newStatusLower === 'awaiting response') {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = String(today.getFullYear()).slice(-2);
        const dateString = day + '.' + month + '.' + year;

        Logger.log('✓ CONDITION 1 MET! Status changed from "' + oldStatus + '" to "Awaiting Response"');
        Logger.log('Updating cell W' + foundRow + ' (Outreach Date) to: ' + dateString);
        sheet.getRange(foundRow, 23).setValue(dateString); // Column W = 23
        responseData.outreachDate = dateString;
      }

      // Condition 2: Awaiting Response → Feature Planned = Update Date Responded (Column Y)
      if (oldStatusLower === 'awaiting response' && newStatusLower === 'feature planned') {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = String(today.getFullYear()).slice(-2);
        const dateString = day + '.' + month + '.' + year;

        Logger.log('✓ CONDITION 2 MET! Status changed from "Awaiting Response" to "Feature Planned"');
        Logger.log('Updating cell Y' + foundRow + ' (Date Responded) to: ' + dateString);
        sheet.getRange(foundRow, 25).setValue(dateString); // Column Y = 25
        responseData.dateResponded = dateString;
      }

      if ((oldStatusLower !== 'prospect' && oldStatusLower !== 'planned outreach' || newStatusLower !== 'awaiting response') &&
          (oldStatusLower !== 'awaiting response' || newStatusLower !== 'feature planned')) {
        Logger.log('✗ No date update conditions met');
      }
    }

    // Update Column O (column 15 in 1-based indexing) for Ranking
    if (newRanking) {
      Logger.log('Updating cell O' + foundRow + ' to: ' + newRanking);
      sheet.getRange(foundRow, 15).setValue(newRanking);
      responseData.newRanking = newRanking;
    }

    Logger.log('✓ SUCCESS');

    return createResponse(true, 'Updated successfully', responseData);

  } catch (error) {
    Logger.log('EXCEPTION: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return createResponse(false, 'Error: ' + error.toString());
  }
}

function createResponse(success, message, data) {
  const response = {
    success: success,
    message: message
  };

  if (data) {
    Object.assign(response, data);
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function - run this to verify it works
function testUpdate() {
  const testEvent = {
    parameter: {
      artistName: 'TEST_ARTIST_NAME', // Replace with real artist name from your sheet
      newStatus: 'Outreach'
    }
  };

  const result = handleRequest(testEvent);
  Logger.log('Test result: ' + result.getContent());
}
