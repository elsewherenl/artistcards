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

    // Method 1: URL parameters (GET)
    if (e.parameter) {
      artistName = e.parameter.artistName;
      newStatus = e.parameter.newStatus;
      Logger.log('Got params from e.parameter (GET)');
    }

    // Method 2: Form data (POST)
    if (!artistName && e.parameters) {
      artistName = e.parameters.artistName ? e.parameters.artistName[0] : null;
      newStatus = e.parameters.newStatus ? e.parameters.newStatus[0] : null;
      Logger.log('Got params from e.parameters (POST)');
    }

    Logger.log('Artist: "' + artistName + '"');
    Logger.log('Status: "' + newStatus + '"');

    // Validate
    if (!artistName || !newStatus) {
      Logger.log('ERROR: Missing parameters');
      return createResponse(false, 'Missing artistName or newStatus');
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

    // Find artist in Column C (index 2)
    let foundRow = -1;
    const searchName = artistName.toString().trim().toLowerCase();
    Logger.log('Searching for (lowercase): "' + searchName + '"');

    // Log first 5 artist names for debugging
    Logger.log('First 5 artists in Column C:');
    for (let i = 1; i < Math.min(6, data.length); i++) {
      Logger.log('  Row ' + (i + 1) + ': "' + data[i][2] + '"');
    }

    for (let i = 1; i < data.length; i++) {
      const cellValue = data[i][2]; // Column C
      if (cellValue) {
        const cellName = cellValue.toString().trim().toLowerCase();
        if (cellName === searchName) {
          foundRow = i + 1; // Convert to 1-based row number
          Logger.log('FOUND at row ' + foundRow);
          Logger.log('Matched: "' + cellValue + '" === "' + artistName + '"');
          Logger.log('Current value in Column N: ' + data[i][13]);
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

    // Update Column N (column 14 in 1-based indexing)
    Logger.log('Updating cell N' + foundRow + ' to: ' + newStatus);
    sheet.getRange(foundRow, 14).setValue(newStatus);
    Logger.log('✓ SUCCESS');

    return createResponse(true, 'Updated successfully', {
      artist: artistName,
      newStatus: newStatus,
      row: foundRow
    });

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
