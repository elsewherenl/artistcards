# Artist Prospecting Tool - Setup Instructions

## Overview
The Artist Prospecting page includes several powerful features:

- **Status Updates**: Click on any status badge to change an artist's status (saves directly to Google Sheet)
- **Multiple Images**: Display up to 5 images per artist with a beautiful gallery interface
- **Themes**: Organize and filter artists by themes (previously called "Tags")
- **Search & Filters**: Find artists by name, themes, genre, status, and more
- **Dark Mode**: Toggle between light and dark themes

## Setup Steps

### Step 1: Deploy the Google Apps Script

1. **Open your Google Sheet**
   - Go to: https://docs.google.com/spreadsheets/d/1gGSXIb3_cwnnbbVk73lYDeOiZwQjYk3OGgJ3V8MYRtc/edit

2. **Open the Apps Script Editor**
   - Click on **Extensions** → **Apps Script**
   - This will open a new tab with the script editor

3. **Paste the Script**
   - Delete any existing code in the editor
   - Open the file `GoogleAppsScript.gs` (in the same folder as index.html)
   - Copy ALL the code from that file
   - Paste it into the Apps Script editor

4. **Save the Script**
   - Click the **disk icon** or press `Cmd+S` (Mac) / `Ctrl+S` (Windows)
   - Give your project a name (e.g., "Artist Status Updater")

5. **Deploy as Web App**
   - Click **Deploy** → **New deployment**
   - Click the gear icon ⚙️ next to "Select type"
   - Choose **Web app**
   - Configure the deployment:
     - **Description**: "Status Update API" (or any name you like)
     - **Execute as**: **Me** (your email)
     - **Who has access**: **Anyone**
       - ⚠️ Don't worry - this is safe! The script validates all data and only allows status updates
   - Click **Deploy**

6. **Authorize the Script**
   - A popup will appear asking for authorization
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
     - This is normal - Google shows this for custom scripts
   - Click **Allow**

7. **Copy the Web App URL**
   - After deployment, you'll see a "Web app" URL
   - It will look like: `https://script.google.com/macros/s/AKfycbz.../exec`
   - **Copy this entire URL** - you'll need it in the next step

### Step 2: Configure index.html

1. **Open index.html** in a text editor

2. **Find the Apps Script URL line**
   - Search for: `const APPS_SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_URL_HERE';`
   - It should be near line 1122

3. **Paste your URL**
   - Replace `PASTE_YOUR_APPS_SCRIPT_URL_HERE` with the URL you copied
   - Keep the quotes!
   - Example:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz.../exec';
   ```

4. **Save the file**

### Step 3: Test It!

1. **Open index.html** in your browser (or refresh if already open)

2. **Click on any status badge** on an artist card
   - A dropdown menu should appear with all available statuses

3. **Select a new status**
   - The badge should show "Updating..."
   - Then update to the new status
   - You'll see a green success message at the top

4. **Verify in Google Sheets**
   - Go back to your Google Sheet
   - Find the artist you just updated
   - The "Current Status" column should show the new status!

## Available Statuses

- Prospect
- Planned Outreach
- Outreach
- Responded
- Spotlighted
- Negotiating
- Featured
- Feature Planned

## Multiple Images Per Artist

Artists can now have multiple images displayed in both card view and lightbox gallery mode.

### Setup in Google Sheets

1. **Image Columns**
   - Column with "Image" header: First/primary image
   - Column with "Image 2" header: Second image
   - Column with "Image 3" header: Third image
   - Additional columns: "Image 4", "Image 5" (optional)

2. **Add Image URLs**
   - Simply paste image URLs into these columns for each artist
   - Leave blank if an artist doesn't have multiple images

### How It Works

**On Artist Cards:**
- The primary image (from "Image" column) displays by default
- Small indicator dots appear at the bottom if multiple images exist
- **Click dots**: Preview different images on the card
- **Click image**: Opens full-screen lightbox gallery
- Indicator dots update to show which image is currently displayed

**In Lightbox Gallery:**
- **Left/Right arrows** (or keyboard): Navigate through the current artist's images
- **At the last image**: Right arrow automatically moves to the next artist
- **At the first image**: Left arrow automatically moves to the previous artist
- **Shift+Left/Right**: Jump directly between different artists
- **Counter at top**: Shows current position (e.g., "Image 2/3 • Artist 5/20")

### Navigation Summary

| Action | On Cards | In Lightbox |
|--------|----------|-------------|
| Click image | Opens lightbox | N/A |
| Click dots | Switch to that image | N/A |
| Left/Right arrows | N/A | Navigate artist's images |
| Shift+Left/Right | N/A | Jump between artists |
| Esc key | N/A | Close lightbox |

## Themes

Organize and filter artists by themes/keywords.

### Setup in Google Sheets

- **Column W**: "Themes" (make sure the column header is exactly "Themes")
- Add comma-separated themes for each artist

### Features

- **Clickable themes**: Click any theme to filter and show only artists with that theme
- **Search**: Type theme names in the search bar to find artists
- **Multiple themes**: Separate themes with commas in the sheet (e.g., "Abstract, Colorful, Nature")

### Usage

1. In your Google Sheet, add comma-separated themes to the "Themes" column
2. On the website, they will appear as "Themes:" with clickable links below "Similar Artists"
3. Click a theme to filter artists by that theme
4. Search bar says "Search artists by name or themes..."

## Troubleshooting

### "Please configure the Google Apps Script URL first!"
- You haven't replaced the placeholder URL in index.html yet
- Follow Step 2 above

### Status doesn't update in the sheet
- Check that you deployed the script correctly
- Make sure the URL in index.html is correct
- Check the Apps Script execution logs:
  1. Go to Apps Script editor
  2. Click **Executions** (clock icon on left sidebar)
  3. Look for errors

### "Script not found" or 404 error
- The Apps Script URL might be incorrect
- Try re-deploying the script and getting a fresh URL

### Status updates but to wrong row
- Make sure the "Artist" or "Instagram Name" in your sheet exactly matches what's shown on the card
- Check for extra spaces or typos

## How It Works

1. You click a status badge
2. JavaScript creates a dropdown menu
3. You select a new status
4. JavaScript sends the artist name and new status to your Google Apps Script
5. The script finds the matching row in your sheet
6. Updates the "Current Status" column
7. Returns success (or error) to the webpage

## Security Notes

- The script only allows status updates - it cannot delete or modify other data
- Even though the web app is set to "Anyone", it still requires proper data format
- Your Google credentials are never exposed to the webpage
- The Apps Script runs with YOUR permissions, so only you can actually modify the sheet

## Need Help?

If something isn't working:
1. Check the browser console (F12) for errors
2. Check the Apps Script execution logs
3. Make sure the sheet name is correct (default is "Sheet1")
4. Verify column names match exactly: "Artist", "Instagram Name", "Current Status"
