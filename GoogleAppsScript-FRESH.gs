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
  if (e && e.parameter && e.parameter.action === 'syncInstagram') {
    return syncInstagramToSheet();
  }
  if (e && e.parameter && e.parameter.action === 'updateApproach') {
    return updateApproachCell(e);
  }
  return handleRequest(e);
}

function updateApproachCell(e) {
  try {
    const artistName = e.parameter.artistName;
    const col = parseInt(e.parameter.col);
    const value = e.parameter.value;

    if (!artistName || !col) {
      return createResponse(false, 'Missing artistName or col');
    }

    const ss = SpreadsheetApp.openById('1gGSXIb3_cwnnbbVk73lYDeOiZwQjYk3OGgJ3V8MYRtc');
    const sheet = ss.getSheetByName('Live Longlist');
    if (!sheet) return createResponse(false, 'Sheet not found');

    const data = sheet.getDataRange().getValues();
    const searchName = artistName.toString().trim().toLowerCase();
    let foundRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][2] && data[i][2].toString().trim().toLowerCase() === searchName) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow === -1) {
      return createResponse(false, 'Artist "' + artistName + '" not found');
    }

    sheet.getRange(foundRow, col).setValue(value);
    Logger.log('Updated row ' + foundRow + ' col ' + col + ' = ' + value);
    return createResponse(true, 'Updated', { row: foundRow, col, value });

  } catch (err) {
    return createResponse(false, 'Error: ' + err.toString());
  }
}

function doPost(e) {
  return handleRequest(e);
}


// ------------------------------------------------
// Instagram Sync
// ------------------------------------------------

const INSTAGRAM_ACCESS_TOKEN = 'EAAXk5I8jmXABR1nTKki0wLOdI6i2mYe1vWmeXxnZCCSvrqcYwlUbPRRKiT10GrDk3PPnwffZC88jZCBy8Sbtd4D2OOHSAEc64GoEJThPiaMrwt0OPYei5BVeEVeloJMTX5pd5Ae2vP939JzqPmbeGZA7iZCXxQHZBlMY9dCYfKqtuBxepGLZB9K3IWw9GVhwtRH';
const INSTAGRAM_BUSINESS_ID = '17841474859984348';

function syncInstagramToSheet() {
  try {
    const ss = SpreadsheetApp.openById('1gGSXIb3_cwnnbbVk73lYDeOiZwQjYk3OGgJ3V8MYRtc');
    const sheet = ss.getSheetByName('IG Analytics');

    if (!sheet) {
      return createResponse(false, 'Sheet "IG Analytics" not found');
    }

    // Fetch posts from Instagram API
    const mediaUrl = `https://graph.facebook.com/v24.0/${INSTAGRAM_BUSINESS_ID}/media?fields=id,media_type,timestamp,like_count,comments_count&limit=50&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const mediaRes = JSON.parse(UrlFetchApp.fetch(mediaUrl).getContentText());

    if (!mediaRes.data) {
      return createResponse(false, 'No media returned from Instagram API');
    }

    // Fetch insights for each post
    const posts = mediaRes.data.map(post => {
      try {
        const insightUrl = `https://graph.facebook.com/v24.0/${post.id}/insights?metric=reach,saved,views&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
        const insights = JSON.parse(UrlFetchApp.fetch(insightUrl).getContentText());
        const metrics = {};
        if (insights.data) {
          insights.data.forEach(m => { metrics[m.name] = m.values[0]?.value ?? null; });
        }
        return { ...post, ...metrics };
      } catch (e) {
        return post;
      }
    });

    // Read sheet data (row 1 = headers)
    // Columns: A=Post Date, B=Post Title, C=Artist, D=Post Type, E=Reach, F=Views, G=Likes, H=Likes/Reach, I=Notes
    const data = sheet.getDataRange().getValues();
    let updated = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      const rowDate = data[i][0]; // Column A

      if (!rowDate) continue;

      // Normalise sheet date to dd/mm/yy
      const sheetDateStr = formatSheetDate(rowDate);
      if (!sheetDateStr) continue;

      // Match on date only — never post twice in one day
      const match = posts.find(post => formatApiDate(post.timestamp) === sheetDateStr);

      if (match) {
        // Write Reach (E), Views (F), Likes (G)
        if (match.reach !== undefined && match.reach !== null) sheet.getRange(i + 1, 5).setValue(match.reach);
        if (match.views !== undefined && match.views !== null) sheet.getRange(i + 1, 6).setValue(match.views);
        if (match.like_count !== undefined && match.like_count !== null) sheet.getRange(i + 1, 7).setValue(match.like_count);
        updated++;
      } else {
        skipped++;
      }
    }

    // Append follower count to IG Followers sheet
    try {
      const profileUrl = `https://graph.facebook.com/v24.0/${INSTAGRAM_BUSINESS_ID}?fields=followers_count&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
      const profile = JSON.parse(UrlFetchApp.fetch(profileUrl).getContentText());
      const followersSheet = ss.getSheetByName('IG Followers');
      if (followersSheet && profile.followers_count !== undefined) {
        const today = new Date();
        const d = String(today.getDate()).padStart(2, '0');
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const y = String(today.getFullYear()).slice(-2);
        const dateStr = `${d}/${m}/${y}`;
        followersSheet.appendRow([dateStr, profile.followers_count]);
        Logger.log(`Appended follower count: ${dateStr} = ${profile.followers_count}`);
      }
    } catch (e) {
      Logger.log('Follower sync error: ' + e.toString());
    }

    return createResponse(true, `Sync complete. ${updated} rows updated, ${skipped} rows skipped.`, { updated, skipped });

  } catch (err) {
    Logger.log('syncInstagramToSheet error: ' + err.toString());
    return createResponse(false, 'Error: ' + err.toString());
  }
}

function formatSheetDate(val) {
  // Handles Date objects or strings like "21/05/26"
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = String(val.getFullYear()).slice(-2);
    return `${d}/${m}/${y}`;
  }
  const str = val.toString().trim();
  // Already in dd/mm/yy format
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(str)) return str;
  return null;
}

function formatApiDate(isoTimestamp) {
  // "2026-05-21T10:00:00+0000" → "21/05/26"
  const d = new Date(isoTimestamp);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
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
function debugInstagramSync() {
  const ss = SpreadsheetApp.openById('1gGSXIb3_cwnnbbVk73lYDeOiZwQjYk3OGgJ3V8MYRtc');
  const sheet = ss.getSheetByName('IG Analytics');
  const data = sheet.getDataRange().getValues();

  Logger.log('=== SHEET DATES (first 5 rows) ===');
  for (let i = 1; i < Math.min(6, data.length); i++) {
    const val = data[i][0];
    Logger.log('Row ' + (i+1) + ': raw=' + JSON.stringify(val) + ' type=' + typeof val + ' formatted=' + formatSheetDate(val));
  }

  const mediaUrl = `https://graph.facebook.com/v24.0/${INSTAGRAM_BUSINESS_ID}/media?fields=id,timestamp&limit=50&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
  const mediaRes = JSON.parse(UrlFetchApp.fetch(mediaUrl).getContentText());

  Logger.log('=== API DATES (all posts) ===');
  mediaRes.data.forEach(p => {
    Logger.log('ID=' + p.id + ' timestamp=' + p.timestamp + ' formatted=' + formatApiDate(p.timestamp));
  });
}

function createWeeklyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncInstagramToSheet') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('syncInstagramToSheet')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();

  Logger.log('Weekly trigger created.');
}

// ------------------------------------------------
// Token Expiry Check
// ------------------------------------------------

const TOKEN_EXPIRY_DATE = new Date('2026-08-26'); // 60 days from 27/06/26
const ALERT_EMAIL = 'alexwillmartin@gmail.com';

function checkTokenExpiry() {
  const today = new Date();
  const daysUntilExpiry = Math.floor((TOKEN_EXPIRY_DATE - today) / (1000 * 60 * 60 * 24));

  Logger.log('Days until token expiry: ' + daysUntilExpiry);

  if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
    const subject = `⚠️ Elsewhere Dashboard: Instagram token expires in ${daysUntilExpiry} days`;
    const body = `Your Instagram API access token will expire on 25/08/26 (in ${daysUntilExpiry} days).

To refresh it, follow these steps:

1. Go to developers.facebook.com/tools/explorer
2. Select your "elsewhere dashboard" app
3. Click "Generate Access Token" and log in with Instagram
4. Make sure these permissions are checked:
   - instagram_basic
   - instagram_manage_insights
   - pages_show_list
   - pages_read_engagement
5. Copy the short-lived token
6. Run this in terminal to get a 60-day token:

curl "https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=1659045188704624&client_secret=4fd4c1e515f442708c4a4d26b7d76c18&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"

7. Copy the new access_token value
8. Paste it into instagram.js (line 13) and GoogleAppsScript-FRESH.gs (line 34)
9. Redeploy the Apps Script

— Elsewhere Dashboard`;

    MailApp.sendEmail(ALERT_EMAIL, subject, body);
    Logger.log('Token expiry warning email sent.');
  }
}

function createTokenExpiryTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'checkTokenExpiry') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('checkTokenExpiry')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  Logger.log('Token expiry daily trigger created.');
}

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
