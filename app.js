    // *** IMPORTANT: PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE ***
    // After deploying the Google Apps Script, paste the URL below
    const APPS_SCRIPT_URL = 'https://script.google.com/a/macros/elsewherecollective.nl/s/AKfycbz7hnoQatrVPElr51rj8XOcFxwdEAidIMVdR0tyXv0TEGrXFp8LXyXToCmaWAu6UCq6/exec';

    // Available status options
    const STATUS_OPTIONS = [
        'Prospect',
        'Planned Outreach',
        'Awaiting Response',
        'No Response',
        'Responded',
        'Spotlighted',
        'Negotiating',
        'Feature Planned',
        'Featured'
    ];

    // Set keyboard shortcut hint based on platform
    document.addEventListener('DOMContentLoaded', function() {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const searchInput = document.getElementById('searchInput');
        if (searchInput && !isMac) {
            // Update SVG for Windows/Linux (Ctrl+K)
            searchInput.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='20'%3E%3Crect x='2' y='3' width='46' height='14' rx='3' fill='none' stroke='%23999' stroke-width='1'/%3E%3Ctext x='25' y='14' font-family='Arial' font-size='9' fill='%23999' text-anchor='middle'%3ECtrl+K%3C/text%3E%3C/svg%3E\")";
            searchInput.style.paddingRight = '4rem';
        }

        // Dark mode initialization
        initDarkMode();
    });

    // Dark mode functionality
    function initDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const body = document.body;

        // Check for saved preference in localStorage
        const savedDarkMode = localStorage.getItem('darkMode');

        // If user has a saved preference, use it; otherwise check system preference
        if (savedDarkMode === 'enabled') {
            body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
        } else if (savedDarkMode === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // Auto-detect system preference if no saved preference
            body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
            localStorage.setItem('darkMode', 'enabled');
        } else {
            // Light mode - show moon icon
            darkModeToggle.textContent = '🌙';
        }

        // Toggle dark mode on button click
        darkModeToggle.addEventListener('click', function() {
            body.classList.toggle('dark-mode');

            if (body.classList.contains('dark-mode')) {
                darkModeToggle.textContent = '☀️';
                localStorage.setItem('darkMode', 'enabled');
            } else {
                darkModeToggle.textContent = '🌙';
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }

    // Lightbox gallery state
    let currentLightboxIndex = 0;
    let currentImageIndex = 0; // Index of image within current artist's gallery
    let lightboxImages = []; // Now array of arrays: [[img1, img2], [img3], ...]
    let lightboxCardElements = [];
    let lightboxArtistData = [];

    // Lightbox functions
    function openLightbox(artistIndex, imageIndex = 0) {
        currentLightboxIndex = artistIndex;
        currentImageIndex = imageIndex;
        updateLightboxImage();
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
    }

    function updateLightboxImage() {
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxCounter = document.getElementById('lightboxCounter');

        if (lightboxImages.length > 0 && lightboxImages[currentLightboxIndex]) {
            const artistImages = lightboxImages[currentLightboxIndex];

            // Ensure currentImageIndex is valid
            if (currentImageIndex >= artistImages.length) {
                currentImageIndex = 0;
            } else if (currentImageIndex < 0) {
                currentImageIndex = artistImages.length - 1;
            }

            lightboxImage.src = artistImages[currentImageIndex];

            // Update counter to show both artist position and image position
            if (artistImages.length > 1) {
                lightboxCounter.textContent = `Image ${currentImageIndex + 1}/${artistImages.length} • Artist ${currentLightboxIndex + 1}/${lightboxImages.length}`;
            } else {
                lightboxCounter.textContent = `Artist ${currentLightboxIndex + 1}/${lightboxImages.length}`;
            }

            // Update artist info
            const artistData = lightboxArtistData[currentLightboxIndex];
            if (artistData) {
                document.getElementById('lightboxArtist').textContent = artistData.artist || '-';
                document.getElementById('lightboxGenre').textContent = artistData.genre || '-';
                document.getElementById('lightboxStatus').textContent = artistData.status || '-';

                // Handle Similar Artists (Col V) - only show if filled in
                const similarArtistsContainer = document.getElementById('lightboxSimilarArtistsContainer');
                if (artistData.similarArtists && artistData.similarArtists.trim()) {
                    document.getElementById('lightboxSimilarArtists').textContent = artistData.similarArtists;
                    similarArtistsContainer.style.display = 'block';
                } else {
                    similarArtistsContainer.style.display = 'none';
                }
            }
        }
    }

    function navigateArtistImages(direction) {
        // Left/Right arrows navigate within artist's images
        const artistImages = lightboxImages[currentLightboxIndex];

        // If only one image, navigate to next/prev artist instead
        if (!artistImages || artistImages.length <= 1) {
            navigateToArtist(direction);
            return;
        }

        const newImageIndex = currentImageIndex + direction;

        // If we've reached the boundary, move to next/prev artist
        if (newImageIndex < 0) {
            // At first image, going left - move to previous artist
            navigateToArtist(-1);
            // Set to last image of previous artist
            const prevArtistImages = lightboxImages[currentLightboxIndex];
            currentImageIndex = prevArtistImages ? prevArtistImages.length - 1 : 0;
            updateLightboxImage();
            return;
        } else if (newImageIndex >= artistImages.length) {
            // At last image, going right - move to next artist
            navigateToArtist(1);
            return;
        }

        // Otherwise, navigate within current artist's images
        currentImageIndex = newImageIndex;
        updateLightboxImage();
    }

    function navigateToArtist(direction) {
        // Shift+Left/Right arrows navigate between artists
        currentLightboxIndex += direction;
        currentImageIndex = 0; // Reset to first image of new artist

        // Wrap around
        if (currentLightboxIndex < 0) {
            currentLightboxIndex = lightboxImages.length - 1;
        } else if (currentLightboxIndex >= lightboxImages.length) {
            currentLightboxIndex = 0;
        }

        updateLightboxImage();
    }

    function closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        currentImageIndex = 0; // Reset to first image

        // Scroll to the current card with glow effect
        if (lightboxCardElements[currentLightboxIndex]) {
            const card = lightboxCardElements[currentLightboxIndex];
            card.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Add glow effect
            card.classList.add('highlight-glow');

            // Remove glow after animation completes
            setTimeout(() => {
                card.classList.remove('highlight-glow');
            }, 2000);
        }
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        const lightbox = document.getElementById('lightbox');
        if (lightbox.classList.contains('active')) {
            if (event.key === 'Escape') {
                closeLightbox();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                if (event.shiftKey) {
                    navigateToArtist(-1); // Shift+Left = previous artist
                } else {
                    navigateArtistImages(-1); // Left = previous image
                }
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                if (event.shiftKey) {
                    navigateToArtist(1); // Shift+Right = next artist
                } else {
                    navigateArtistImages(1); // Right = next image
                }
            }
        } else {
            // Global keyboard shortcuts (when lightbox is not active)
            // Cmd/Ctrl + K to focus search
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                const searchInput = document.getElementById('searchInput');
                searchInput.focus();
                searchInput.select();
            }
            // Escape to clear all filters
            else if (event.key === 'Escape') {
                event.preventDefault();
                clearAllFilters();
            }
        }
    });

    // Function to clear filters progressively (used by keyboard shortcut)
    function clearAllFilters() {
        console.log('Clearing filters progressively via Escape key...');

        const searchInput = document.getElementById("searchInput");
        const genreSelect = document.getElementById("genreFilter");
        const whereFoundSelect = document.getElementById("whereFoundFilter");
        const followersSelect = document.getElementById("followersFilter");
        const sortBySelect = document.getElementById("sortByFilter");

        // Priority order: Clear one filter at a time
        // 1. Visual filter (similar artists display:none)
        let hasVisualFilter = false;
        document.querySelectorAll('.card').forEach(card => {
            if (card.style.display === 'none') {
                hasVisualFilter = true;
            }
        });

        if (hasVisualFilter) {
            console.log('Clearing visual filter (similar artists)');
            document.querySelectorAll('.card').forEach(card => {
                card.style.display = 'flex';
            });
            refreshUI();
            return;
        }

        // 2. Search term
        if (currentSearchTerm && currentSearchTerm.trim() !== '') {
            console.log('Clearing search term');
            currentSearchTerm = "";
            if (searchInput) searchInput.value = "";
            refreshUI();
            return;
        }

        // 3. Tag filter
        if (currentTagFilter !== null) {
            console.log('Clearing tag filter');
            currentTagFilter = null;
            refreshUI();
            return;
        }

        // 4. Status filter (if not "all")
        if (!currentStatusFilter.includes('all')) {
            console.log('Clearing status filter');
            currentStatusFilter = ['all'];
            document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
            const allButton = document.querySelector('.status-btn[data-status="all"]');
            if (allButton) allButton.classList.add('active');
            updateFeaturedSortOptions();
            refreshUI();
            return;
        }

        // 5. Genre filter
        if (genreSelect && genreSelect.value !== "All") {
            console.log('Clearing genre filter');
            genreSelect.value = "All";
            refreshUI();
            return;
        }

        // 6. Where Found filter
        if (whereFoundSelect && whereFoundSelect.value !== "All") {
            console.log('Clearing where found filter');
            whereFoundSelect.value = "All";
            refreshUI();
            return;
        }

        // 7. Followers filter
        if (followersSelect && followersSelect.value !== "All") {
            console.log('Clearing followers filter');
            followersSelect.value = "All";
            refreshUI();
            return;
        }

        // 8. Sort order (reset to default)
        if (sortBySelect && sortBySelect.value !== "rankingHighLow") {
            console.log('Resetting sort order');
            sortBySelect.value = "rankingHighLow";
            refreshUI();
            return;
        }

        // All filters already cleared
        console.log('All filters already cleared');

        // On mobile, hide filters after all cleared
        if (window.innerWidth <= 768) {
            const filtersEl = document.getElementById("filters");
            if (filtersEl) filtersEl.style.display = "none";
        }
    }

    // Status update functions
    function createStatusSelector(statusBadge, currentStatus, artistName) {
        // Remove any existing selectors
        const existingSelector = statusBadge.parentElement.querySelector('.status-selector');
        if (existingSelector) {
            existingSelector.remove();
            return;
        }

        // Create dropdown
        const selector = document.createElement('div');
        selector.className = 'status-selector active';

        // Add all status options
        STATUS_OPTIONS.forEach(status => {
            const option = document.createElement('div');
            option.className = 'status-option';
            option.textContent = status;

            // Highlight current status
            if (status.toLowerCase() === currentStatus.toLowerCase()) {
                option.style.background = 'rgba(214, 179, 112, 0.2)';
                option.style.fontWeight = '700';
            }

            option.addEventListener('click', (e) => {
                e.stopPropagation();
                updateArtistStatus(artistName, status, statusBadge, selector);
            });

            selector.appendChild(option);
        });

        statusBadge.parentElement.appendChild(selector);

        // Close selector when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeSelector(e) {
                if (!selector.contains(e.target) && e.target !== statusBadge) {
                    selector.remove();
                    document.removeEventListener('click', closeSelector);
                }
            });
        }, 10);
    }

    async function updateArtistStatus(artistName, newStatus, statusBadge, selector) {
        // Check if Apps Script URL is configured
        if (APPS_SCRIPT_URL === 'PASTE_YOUR_APPS_SCRIPT_URL_HERE') {
            alert('Please configure the Google Apps Script URL first!\n\nSee the setup instructions in GoogleAppsScript.gs');
            selector.remove();
            return;
        }

        // Add updating state
        statusBadge.classList.add('status-updating');
        statusBadge.textContent = 'Updating...';

        try {
            // Use GET with URL parameters for Google Apps Script compatibility
            const url = `${APPS_SCRIPT_URL}?artistName=${encodeURIComponent(artistName)}&newStatus=${encodeURIComponent(newStatus)}`;

            console.log('Sending request to:', url);
            console.log('Artist:', artistName);
            console.log('New Status:', newStatus);

            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });

            console.log('Response received:', response);
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            // Try to read the response
            let result;
            try {
                const text = await response.text();
                console.log('Response text:', text);
                result = JSON.parse(text);
                console.log('Parsed result:', result);
            } catch (e) {
                console.log('Could not parse response:', e);
                result = { success: true }; // Assume success if we can't parse
            }

            if (response.ok && result.success !== false) {
                // Update badge
                statusBadge.textContent = newStatus;
                statusBadge.className = `status-badge ${getStatusClass(newStatus)}`;
                statusBadge.classList.remove('status-updating');

                // Remove selector
                selector.remove();

                // Show success message
                showStatusMessage('✓ Status updated to: ' + newStatus, 'success');
            } else {
                throw new Error(result.message || 'Update failed - check Google Apps Script logs');
            }

        } catch (error) {
            console.error('Error updating status:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            statusBadge.classList.remove('status-updating');
            statusBadge.textContent = statusBadge.getAttribute('data-original-status');
            selector.remove();
            showStatusMessage('✗ Failed to update: ' + error.message, 'error');
        }
    }

    function showStatusMessage(message, type) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-family: 'Satoshi', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideDown 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Add animations for toast
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(0); opacity: 1; }
            to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    let currentStatusFilter = ['all'];
    let currentSearchTerm = '';
    let currentTagFilter = null;

    // Function to show/hide featured date sort options based on status filter
    function updateFeaturedSortOptions() {
        const featuredNewestOption = document.querySelector('#sortByFilter option[value="featuredNewest"]');
        const featuredOldestOption = document.querySelector('#sortByFilter option[value="featuredOldest"]');

        // Show featured date options only when filtering by "spotlighted" or "featured"
        const showFeaturedOptions = currentStatusFilter.includes('spotlighted') ||
                                     currentStatusFilter.includes('featured') ||
                                     currentStatusFilter.includes('feature planned');

        if (featuredNewestOption && featuredOldestOption) {
            if (showFeaturedOptions) {
                featuredNewestOption.style.display = '';
                featuredOldestOption.style.display = '';
            } else {
                featuredNewestOption.style.display = 'none';
                featuredOldestOption.style.display = 'none';

                // Reset sort if currently using featured sort
                const sortBySelect = document.getElementById('sortByFilter');
                if (sortBySelect.value === 'featuredNewest' || sortBySelect.value === 'featuredOldest') {
                    sortBySelect.value = 'rankingHighLow';
                }
            }
        }
    }

    function toggleFilters() {
    const filters = document.getElementById("filters");
    filters.style.display = filters.style.display === "none" || filters.style.display === "" ? "flex" : "none";
    }

    function parseCSV(csv) {
        const lines = csv.split('\n');
        const result = [];
        const headers = [];
        let current = '', inQuotes = false;
        for (let i = 0; i < lines[0].length; i++) {
        const char = lines[0][i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            headers.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else current += char;
        }
        headers.push(current.trim().replace(/^"|"$/g, ''));

        for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = [], row = {};
        current = ''; inQuotes = false;
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
            } else current += char;
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        headers.forEach((header, idx) => row[header] = values[idx] || '');
        if (row[headers[0]]) result.push(row);
        }
        return result;
    }

    function getStatusClass(status) {
        if (!status) return 'status-prospect';
        const normalized = status.toLowerCase().replace(/\s+/g, '');
        if (normalized === 'featureplanned') return 'status-feature planned';
        if (normalized === 'plannedoutreach') return 'status-planned-outreach';
        return `status-${normalized}`;
    }

    fetch("https://docs.google.com/spreadsheets/d/1gGSXIb3_cwnnbbVk73lYDeOiZwQjYk3OGgJ3V8MYRtc/export?format=csv&gid=636920357")
        .then(res => res.text())
        .then(csvData => {
        const data = parseCSV(csvData);
        const genreSelect = document.getElementById("genreFilter");
        const whereFoundSelect = document.getElementById("whereFoundFilter");
        const followersSelect = document.getElementById("followersFilter");
        const sortBySelect = document.getElementById("sortByFilter");

        // Store all data for re-filtering
        let fullData = data;

        // Debug: Log the data structure
        console.log("First row of data:", data[0]);
        console.log("All column headers:", Object.keys(data[0] || {}));

        // Populate genres
        const genres = [...new Set(data.map(row => row["Genre"]).filter(Boolean))];
        console.log("Found genres:", genres);
        genres.sort().forEach(genre => {
            const option = document.createElement("option");
            option.value = genre;
            option.textContent = genre;
            genreSelect.appendChild(option);
        });

        // Populate where found options
        const whereFoundOptions = [...new Set(data.map(row => row["Where Found"]).filter(Boolean))];
        console.log("Found where found options:", whereFoundOptions);
        whereFoundOptions.sort().forEach(whereFound => {
            const option = document.createElement("option");
            option.value = whereFound;
            option.textContent = whereFound;
            whereFoundSelect.appendChild(option);
        });

        // Status filter buttons - now supports multi-select with metaKey/ctrlKey
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const status = btn.dataset.status;
                let changed = false;
                if (event.metaKey || event.ctrlKey) {
                    // Multi-select: toggle this status in the array
                    if (status === 'all') {
                        currentStatusFilter = ['all'];
                    } else {
                        // Remove 'all' if present
                        currentStatusFilter = currentStatusFilter.filter(s => s !== 'all');
                        const idx = currentStatusFilter.indexOf(status);
                        if (idx > -1) {
                            currentStatusFilter.splice(idx, 1);
                        } else {
                            currentStatusFilter.push(status);
                        }
                        // If none selected, revert to 'all'
                        if (currentStatusFilter.length === 0) currentStatusFilter = ['all'];
                    }
                } else {
                    // Single select: only this status
                    currentStatusFilter = [status];
                }
                // Update button classes
                document.querySelectorAll('.status-btn').forEach(b => {
                    const s = b.dataset.status;
                    if (currentStatusFilter.includes(s)) b.classList.add('active');
                    else b.classList.remove('active');
                });
                updateFeaturedSortOptions();
                refreshUI();
            });
        });

        function filterData() {
            const genre = genreSelect.value;
            const whereFound = whereFoundSelect.value;
            const followersRange = followersSelect.value;

            return fullData.filter(row => {
                // Status filter
                const status = (row["Current Status"] || "").toLowerCase().trim();
                let statusMatch = false;
                if (currentStatusFilter.includes('all')) {
                    statusMatch = true;
                } else {
                    // Match if any selected status matches
                    statusMatch = currentStatusFilter.some(s => status === s.toLowerCase());
                }
                // Search filter - search in artist name, Instagram handle, and themes
                const artistFullName = (row["Artist"] || "").toLowerCase();
                const instagramHandle = (row["Instagram Name"] || "").toLowerCase();
                const artistTags = (row["Themes"] || "").toLowerCase();
                const searchTerm = currentSearchTerm.toLowerCase();
                const searchMatch = !currentSearchTerm ||
                                  artistFullName.includes(searchTerm) ||
                                  instagramHandle.includes(searchTerm) ||
                                  artistTags.includes(searchTerm);

                const genreMatch = genre === "All" || row["Genre"] === genre;
                const whereFoundMatch = whereFound === "All" || row["Where Found"] === whereFound;

                // Theme filter
                let tagMatch = true;
                if (currentTagFilter) {
                    const artistTags = (row["Themes"] || "").toString().trim();
                    if (artistTags) {
                        const tagsList = artistTags.split(',').map(tag => tag.trim());
                        tagMatch = tagsList.includes(currentTagFilter);
                    } else {
                        tagMatch = false;
                    }
                }

                // Followers filter
                let followers = 0;
                const raw = row["Instagram Followers - Do not delete"] || '';
                const str = raw.toLowerCase().replace(/,/g, '');
                if (str.includes('k')) followers = parseFloat(str.replace('k', '')) * 1000;
                else followers = parseInt(str) || 0;
                let followersMatch = true;
                if (followersRange === "under5k") followersMatch = followers < 5000;
                else if (followersRange === "5kto10k") followersMatch = followers >= 5000 && followers <= 10000;
                else if (followersRange === "10kplus") followersMatch = followers > 10000;

                return statusMatch && searchMatch && genreMatch && whereFoundMatch && tagMatch && followersMatch;
            });
        }

        function parseDate(dateString) {
            if (!dateString) return new Date("1900-01-01");
            
            // Handle DD.MM.YY format (like 01.08.25)
            if (dateString.includes(".") && dateString.length === 8) {
                const parts = dateString.split(".");
                if (parts.length === 3) {
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
                    let year = parseInt(parts[2]);
                    
                    // Convert 2-digit year to 4-digit (assuming 20xx for now)
                    if (year < 100) {
                        year = 2000 + year;
                    }
                    
                    return new Date(year, month, day);
                }
            }
            
            // Handle DD/MM/YYYY format (European)
            if (dateString.includes("/")) {
                const parts = dateString.split("/");
                if (parts.length === 3) {
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
                    const year = parseInt(parts[2]);
                    return new Date(year, month, day);
                }
            }
            
            // Handle DD-MM-YYYY format
            if (dateString.includes("-") && dateString.length === 10) {
                const parts = dateString.split("-");
                if (parts.length === 3 && parts[0].length === 2) {
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    const year = parseInt(parts[2]);
                    return new Date(year, month, day);
                }
            }
            
            // Try standard JavaScript parsing (handles YYYY-MM-DD, etc.)
            const standardDate = new Date(dateString);
            if (!isNaN(standardDate.getTime())) {
                return standardDate;
            }
            
            // Fallback if nothing works
            console.warn("Could not parse date:", dateString);
            return new Date("1900-01-01");
        }

        function sortData(data) {
            const sortBy = sortBySelect.value;
            return [...data].sort((a, b) => {
                if (sortBy === "rankingHighLow") {
                    // Highest to Lowest: 1 → 5 (best to worst)
                    const rankA = parseInt(a["Ranking"]) || 0;
                    const rankB = parseInt(b["Ranking"]) || 0;
                    return rankA - rankB; // Lower numbers (better rankings) first
                } else if (sortBy === "rankingLowHigh") {
                    // Lowest to Highest: 5 → 1 (worst to best)
                    const rankA = parseInt(a["Ranking"]) || 0;
                    const rankB = parseInt(b["Ranking"]) || 0;
                    return rankB - rankA; // Higher numbers (worse rankings) first
                } else if (sortBy === "newest") {
                    const dateA = parseDate(a["When Added"]);
                    const dateB = parseDate(b["When Added"]);
                    return dateB - dateA; // Newest first
                } else if (sortBy === "oldest") {
                    const dateA = parseDate(a["When Added"]);
                    const dateB = parseDate(b["When Added"]);
                    return dateA - dateB; // Oldest first
                } else if (sortBy === "nameAZ") {
                    const nameA = (a["Instagram Name"] || a["Artist"] || "").toLowerCase();
                    const nameB = (b["Instagram Name"] || b["Artist"] || "").toLowerCase();
                    return nameA.localeCompare(nameB);
                } else if (sortBy === "nameZA") {
                    const nameA = (a["Instagram Name"] || a["Artist"] || "").toLowerCase();
                    const nameB = (b["Instagram Name"] || b["Artist"] || "").toLowerCase();
                    return nameB.localeCompare(nameA);
                } else if (sortBy === "featuredNewest") {
                    const dateA = a["Spotlighted"] ? parseDate(a["Spotlighted"]) : null;
                    const dateB = b["Spotlighted"] ? parseDate(b["Spotlighted"]) : null;
                    if (!dateA && !dateB) return 0;
                    if (!dateA) return 1; // Items without dates go to end
                    if (!dateB) return -1;
                    return dateB - dateA; // Newest first
                } else if (sortBy === "featuredOldest") {
                    const dateA = a["Spotlighted"] ? parseDate(a["Spotlighted"]) : null;
                    const dateB = b["Spotlighted"] ? parseDate(b["Spotlighted"]) : null;
                    if (!dateA && !dateB) return 0;
                    if (!dateA) return 1; // Items without dates go to end
                    if (!dateB) return -1;
                    return dateA - dateB; // Oldest first
                }
                return 0;
            });
        }

        function renderCards(dataset) {
            const container = document.getElementById("cards");
            if (dataset.length === 0) {
            container.innerHTML = "<p class='no-results'>No artists match these filters.</p>";
            lightboxImages = [];
            lightboxCardElements = [];
            return;
            }
            container.innerHTML = "";

            // Reset gallery arrays
            lightboxImages = [];
            lightboxCardElements = [];
            lightboxArtistData = [];

            dataset.forEach((row, index) => {
            const card = document.createElement("div");
            card.className = "card";
            // Add unique ID to card based on artist name
            const artistNameForId = (row["Artist"] || row["Instagram Name"] || "").toLowerCase().replace(/\s+/g, '-');
            card.id = `artist-${artistNameForId}`;

            // Add status badge (now clickable)
            const status = row["Current Status"] || "Prospect";
            const artistName = row["Artist"] || row["Instagram Name"] || "Untitled";
            const statusBadge = document.createElement("div");
            statusBadge.className = `status-badge ${getStatusClass(status)}`;
            statusBadge.textContent = status;
            statusBadge.setAttribute('data-original-status', status);
            statusBadge.setAttribute('title', 'Click to change status');

            // Make status badge clickable
            statusBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                createStatusSelector(statusBadge, status, artistName);
            });

            card.appendChild(statusBadge);

            const name = document.createElement("div");
            name.className = "artist-name";
            name.textContent = row["Artist"] || row["Instagram Name"] || "Untitled";
            card.appendChild(name);

            const insta = document.createElement("a");
            insta.className = "insta-link";
            insta.href = row["Insta Handle"] || "#";
            insta.target = "_blank";
            const img = document.createElement("img");
            img.src = "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png";
            img.alt = "Instagram";
            img.className = "insta-logo";
            img.loading = "lazy";
            insta.appendChild(img);
            insta.append("Insta");
            card.appendChild(insta);

            // Collect all images for this artist
            const artistImages = [];
            const imageColumns = ["Image", "Image 2", "Image 3", "Image 4", "Image 5"];
            imageColumns.forEach(col => {
                if (row[col] && row[col].trim()) {
                    artistImages.push(row[col].trim());
                }
            });

            // Add to gallery arrays (even if no images, to keep indices aligned)
            lightboxImages.push(artistImages.length > 0 ? artistImages : [null]);
            lightboxCardElements.push(card);
            lightboxArtistData.push({
                artist: row["Artist"] || row["Instagram Name"] || "Unknown",
                genre: row["Genre"] || "-",
                status: row["Current Status"] || "-",
                similarArtists: row["Similar Artists"] || ""
            });

            if (artistImages.length > 0) {
                // Create image container to prevent overflow on hover
                const imageContainer = document.createElement("div");
                imageContainer.className = "image-container";
                let currentCardImageIndex = 0; // Track current image for this card

                const image = document.createElement("img");
                image.className = "image lazy-image";
                const imageUrl = artistImages[0]; // Show first image
                image.dataset.src = imageUrl; // Store URL in data attribute for lazy loading
                image.alt = row["Instagram Name"];
                image.loading = "lazy"; // Browser native lazy loading as fallback
                image.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f3efe9' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' fill='%23d6b370'%3ELoading...%3C/text%3E%3C/svg%3E"; // Placeholder
                image.onerror = function() {
                    console.log("Failed to load image:", imageUrl);
                    this.style.display = 'none';
                };

                // Function to update card image display
                const updateCardImage = (newIndex) => {
                    currentCardImageIndex = newIndex;
                    image.src = artistImages[currentCardImageIndex];
                    image.dataset.src = artistImages[currentCardImageIndex];

                    // Update indicator dots
                    const dots = imageContainer.querySelectorAll('.indicator-dot');
                    dots.forEach((dot, i) => {
                        if (i === currentCardImageIndex) {
                            dot.classList.add('active');
                        } else {
                            dot.classList.remove('active');
                        }
                    });
                };

                // Click image to open lightbox
                image.onclick = function(e) {
                    openLightbox(index, currentCardImageIndex);
                };

                // Add wheel event for scrolling through images
                if (artistImages.length > 1) {
                    imageContainer.addEventListener('wheel', function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        // Determine scroll direction
                        const delta = e.deltaY;

                        if (delta > 0) {
                            // Scroll down - next image
                            const nextIndex = (currentCardImageIndex + 1) % artistImages.length;
                            updateCardImage(nextIndex);
                        } else if (delta < 0) {
                            // Scroll up - previous image
                            const prevIndex = (currentCardImageIndex - 1 + artistImages.length) % artistImages.length;
                            updateCardImage(prevIndex);
                        }
                    }, { passive: false });
                }

                imageContainer.appendChild(image);

                // Add image indicators if multiple images
                if (artistImages.length > 1) {
                    const indicators = document.createElement("div");
                    indicators.className = "image-indicators";
                    for (let i = 0; i < artistImages.length; i++) {
                        const dot = document.createElement("span");
                        dot.className = "indicator-dot" + (i === 0 ? " active" : "");
                        dot.onclick = function(e) {
                            e.stopPropagation();
                            updateCardImage(i);
                        };
                        indicators.appendChild(dot);
                    }
                    imageContainer.appendChild(indicators);
                }

                card.appendChild(imageContainer);
            }

            const fields = [
                { label: "Genre", key: "Genre" },
                { label: "Followers", key: "Instagram Followers - Do not delete" },
                { label: "Where Found", key: "Where Found" },
                { label: "Current Status", key: "Current Status" },
            ];

            fields.forEach(({ label, key }) => {
                if (row[key]) {
                const el = document.createElement("div");
                el.className = "field-item";
                el.innerHTML = `<span class="label">${label}:</span> ${row[key]}`;
                card.appendChild(el);
                }
            });

            // Show "When Featured" date for Featured or Spotlighted status
            const cardStatus = (row["Current Status"] || "").toLowerCase().trim();
            if ((cardStatus === "featured" || cardStatus === "spotlighted") && row["Spotlighted"]) {
                const whenFeatured = document.createElement("div");
                whenFeatured.className = "field-item";
                whenFeatured.innerHTML = `<span class="label">When Featured:</span> ${row["Spotlighted"]}`;
                card.appendChild(whenFeatured);
            }

            const websiteFields = [
                { label: "Easy Commerce", key: "Website with easy commerce" },
                { label: "Gallery Rep", key: "Gallery Representation" }
            ];

            websiteFields.forEach(({ label, key }) => {
                if (row[key] && row[key].toString().trim()) {
                    const cellValue = row[key].toString().trim();
                    const el = document.createElement("div");
                    el.className = "field-item";
                    el.innerHTML = `<span class="label">${label}:</span> ${cellValue}`;
                    card.appendChild(el);
                }
            });

            // Handle website link from "Links" column
            if (row["Links"] && row["Links"].toString().trim()) {
                const websiteUrl = row["Links"].toString().trim();
                if (websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://')) {
                    // Extract clean domain name
                    let displayDomain = websiteUrl
                        .replace(/^https?:\/\//i, '') // Remove protocol
                        .replace(/^www\./i, '') // Remove www.
                        .split('/')[0] // Get only the domain (everything before first slash)
                        .split('?')[0]; // Remove query strings if any

                    const el = document.createElement("div");
                    el.className = "field-item";
                    el.innerHTML = `<span class="label">Website:</span> <a href="${websiteUrl}" target="_blank" class="website-link">${displayDomain}</a>`;
                    card.appendChild(el);
                }
            }

            // Add Instagram follow status fields - these will be after Gallery Rep
            const followFields = [
                { label: "Follow on IG", key: "Follow on IG" },
                { label: "Follows me on IG", key: "Follows Me on IG?" }
            ];

            followFields.forEach(({ label, key }) => {
                // If we found a value and it's "Yes" (case insensitive), display it
                if (row[key] && row[key].toString().toLowerCase().trim() === "yes") {
                    const el = document.createElement("div");
                    el.className = "field-item";
                    el.innerHTML = `<span class="label">${label}:</span> Y`;
                    card.appendChild(el);
                }
            });

            // Add Similar Artists if present
            if (row["Similar Artists"] && row["Similar Artists"].toString().trim()) {
                const el = document.createElement("div");
                el.className = "field-item";
                const similarArtistsText = row["Similar Artists"].toString().trim();

                // Split by comma and make each artist name clickable
                const artistNames = similarArtistsText.split(',').map(name => name.trim());
                const clickableNames = artistNames.map(name => {
                    const nameForId = name.toLowerCase().replace(/\s+/g, '-');
                    return `<span class="similar-artist-link" data-artist-id="artist-${nameForId}">${name}</span>`;
                }).join(', ');

                // Make the label clickable to show all similar artists
                const artistIdsArray = artistNames.map(name => name.toLowerCase().replace(/\s+/g, '-'));
                el.innerHTML = `<span class="label similar-artists-label-link" data-artist-ids='${JSON.stringify(artistIdsArray)}'>Similar Artists:</span> ${clickableNames}`;
                card.appendChild(el);
            }

            // Add Themes if present (Column W - "Themes" in data)
            if (row["Themes"] && row["Themes"].toString().trim()) {
                const el = document.createElement("div");
                el.className = "field-item";
                const themesText = row["Themes"].toString().trim();

                // Split by comma and make each theme clickable
                const themesList = themesText.split(',').map(theme => theme.trim());
                const clickableThemes = themesList.map(theme => {
                    return `<span class="tag-link" data-tag="${theme}">${theme}</span>`;
                }).join(', ');

                el.innerHTML = `<span class="label">Themes:</span> ${clickableThemes}`;
                card.appendChild(el);
            }

            // Always add notes section (even if empty) to maintain consistent card layout
            const notes = document.createElement("div");
            notes.className = "notes";
            if (row["Notes"] && row["Notes"].trim()) {
                notes.textContent = row["Notes"];
            }
            card.appendChild(notes);

            container.appendChild(card);
            });

            // Add click handlers for similar artist links
            document.querySelectorAll('.similar-artist-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('data-artist-id');
                    let targetCard = document.getElementById(targetId);

                    // If the card is not currently visible (due to filters), clear filters first
                    if (!targetCard) {
                        // Clear search
                        currentSearchTerm = '';
                        document.getElementById('searchInput').value = '';

                        // Reset to "All" status
                        currentStatusFilter = ['all'];
                        document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
                        document.querySelector('.status-btn[data-status="all"]').classList.add('active');

                        // Reset other filters
                        document.getElementById('genreFilter').value = 'All';
                        document.getElementById('whereFoundFilter').value = 'All';
                        document.getElementById('followersFilter').value = 'All';

                        // Clear tag filter
                        currentTagFilter = null;

                        // Update featured sort options
                        updateFeaturedSortOptions();

                        // Refresh the UI to show all artists
                        refreshUI();

                        // Wait for DOM to update, then try again
                        setTimeout(() => {
                            targetCard = document.getElementById(targetId);
                            if (targetCard) {
                                targetCard.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center'
                                });
                                // Add highlight effect
                                targetCard.style.boxShadow = '0 0 20px rgba(37, 82, 255, 0.5)';
                                setTimeout(() => {
                                    targetCard.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.05)';
                                }, 2000);
                            }
                        }, 100);
                    } else {
                        // Card is already visible, just scroll to it
                        targetCard.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        // Add highlight effect
                        targetCard.style.boxShadow = '0 0 20px rgba(37, 82, 255, 0.5)';
                        setTimeout(() => {
                            targetCard.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.05)';
                        }, 2000);
                    }
                });
            });

            // Add click handlers for "Similar Artists:" label (show all similar artists together)
            document.querySelectorAll('.similar-artists-label-link').forEach(labelLink => {
                labelLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Parse the artist IDs from data attribute
                    const artistIdsJson = this.getAttribute('data-artist-ids');
                    const artistIds = JSON.parse(artistIdsJson);

                    // Get the current artist's card to find their name
                    const currentCard = this.closest('.card');
                    const currentArtistId = currentCard.id.replace('artist-', '');

                    // Create an array of all artist IDs we want to show (current + similar)
                    const allIdsToShow = [currentArtistId, ...artistIds];

                    // Clear all other filters
                    currentSearchTerm = '';
                    document.getElementById('searchInput').value = '';
                    currentStatusFilter = ['all'];
                    document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
                    document.querySelector('.status-btn[data-status="all"]').classList.add('active');
                    document.getElementById('genreFilter').value = 'All';
                    document.getElementById('whereFoundFilter').value = 'All';
                    document.getElementById('followersFilter').value = 'All';
                    currentTagFilter = null;

                    // Update featured sort options
                    updateFeaturedSortOptions();

                    // Refresh UI first to show all artists
                    refreshUI();

                    // Wait for DOM update, then hide non-matching cards and highlight the group
                    setTimeout(() => {
                        // Hide all cards that are NOT in our group
                        document.querySelectorAll('.card').forEach(card => {
                            const cardId = card.id.replace('artist-', '');
                            if (!allIdsToShow.includes(cardId)) {
                                card.style.display = 'none';
                            } else {
                                card.style.display = 'flex';
                                // Highlight with gold color
                                card.style.boxShadow = '0 0 20px rgba(214, 179, 112, 0.6)';
                                setTimeout(() => {
                                    card.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.05)';
                                }, 3000);
                            }
                        });

                        // Scroll to the current artist's card (the one we clicked from)
                        const currentCardElement = document.getElementById(`artist-${currentArtistId}`);
                        if (currentCardElement) {
                            currentCardElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                    }, 100);
                });
            });

            // Add click handlers for tag links
            document.querySelectorAll('.tag-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const tag = this.getAttribute('data-tag');

                    // Set the tag filter
                    currentTagFilter = tag;

                    // Scroll to top of page to see filtered results
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });

                    // Refresh UI to apply tag filter
                    refreshUI();
                });
            });

            // Lazy load images using Intersection Observer
            initLazyLoading();
        }

        // Intersection Observer for lazy loading images
        function initLazyLoading() {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        if (src) {
                            img.src = src;
                            img.classList.remove('lazy-image');
                            img.classList.add('loaded');
                            observer.unobserve(img);
                        }
                    }
                });
            }, {
                root: null,
                rootMargin: '50px', // Start loading 50px before entering viewport
                threshold: 0.01
            });

            // Observe all lazy images
            document.querySelectorAll('.lazy-image').forEach(img => {
                imageObserver.observe(img);
            });
        }

        function updateStats(filtered) {
            const followersData = filtered
            .map(row => {
                const followers = row["Instagram Followers - Do not delete"];
                if (!followers) return 0;
                const str = followers.toString().toLowerCase().replace(/,/g, '');
                return str.includes('k')
                ? parseFloat(str.replace('k', '')) * 1000
                : parseInt(str) || 0;
            }).filter(n => n > 0);
            const avgFollowers = followersData.length > 0
            ? Math.round(followersData.reduce((a, b) => a + b, 0) / followersData.length)
            : 0;
            
            const genres = filtered.map(r => r["Genre"]).filter(Boolean)
            .reduce((acc, g) => (acc[g] = (acc[g] || 0) + 1, acc), {});
            const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

            document.getElementById("totalArtists").textContent = filtered.length;
            document.getElementById("avgFollowers").textContent = avgFollowers > 1000 ? (avgFollowers / 1000).toFixed(1) + 'k' : avgFollowers.toLocaleString();
            document.getElementById("statusCounts").textContent = filtered.length;
            document.getElementById("topGenre").textContent = topGenre;
        }

        function refreshUI() {
            const filtered = filterData();
            const sorted = sortData(filtered);
            renderCards(sorted);
            updateStats(filtered);
            updateURLWithCurrentState(); // Update URL with current filter state
        }

        // Save current filter state to URL
        function updateURLWithCurrentState() {
            const params = new URLSearchParams();

            // Add search term if present
            if (currentSearchTerm && currentSearchTerm.trim()) {
                params.set('search', currentSearchTerm);
            }

            // Add status filter if not 'all'
            if (!currentStatusFilter.includes('all')) {
                params.set('status', currentStatusFilter.join(','));
            }

            // Add genre filter if not 'All'
            const genre = genreSelect.value;
            if (genre && genre !== 'All') {
                params.set('genre', genre);
            }

            // Add where found filter if not 'All'
            const whereFound = whereFoundSelect.value;
            if (whereFound && whereFound !== 'All') {
                params.set('whereFound', whereFound);
            }

            // Add followers filter if not 'All'
            const followers = followersSelect.value;
            if (followers && followers !== 'All') {
                params.set('followers', followers);
            }

            // Add sort order if not default
            const sortBy = sortBySelect.value;
            if (sortBy && sortBy !== 'rankingHighLow') {
                params.set('sort', sortBy);
            }

            // Add tag filter if present
            if (currentTagFilter) {
                params.set('tag', currentTagFilter);
            }

            // Update URL without reloading the page
            const newURL = params.toString()
                ? `${window.location.pathname}?${params.toString()}${window.location.hash}`
                : `${window.location.pathname}${window.location.hash}`;
            window.history.replaceState({}, '', newURL);
        }

        // Load filter state from URL
        function loadStateFromURL() {
            const params = new URLSearchParams(window.location.search);

            // Load search term
            const search = params.get('search');
            if (search) {
                currentSearchTerm = search;
                searchInput.value = search;
            }

            // Load status filter
            const status = params.get('status');
            if (status) {
                currentStatusFilter = status.split(',');
                document.querySelectorAll('.status-btn').forEach(btn => {
                    if (currentStatusFilter.includes(btn.dataset.status)) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }

            // Load genre filter
            const genre = params.get('genre');
            if (genre) {
                genreSelect.value = genre;
            }

            // Load where found filter
            const whereFound = params.get('whereFound');
            if (whereFound) {
                whereFoundSelect.value = whereFound;
            }

            // Load followers filter
            const followers = params.get('followers');
            if (followers) {
                followersSelect.value = followers;
            }

            // Load sort order
            const sort = params.get('sort');
            if (sort) {
                sortBySelect.value = sort;
            }

            // Load tag filter
            const tag = params.get('tag');
            if (tag) {
                currentTagFilter = tag;
            }
        }

        // Search input listener
        const searchInput = document.getElementById("searchInput");
        searchInput.addEventListener("input", (e) => {
            currentSearchTerm = e.target.value;
            refreshUI();
        });

        genreSelect.addEventListener("change", refreshUI);
        whereFoundSelect.addEventListener("change", refreshUI);
        followersSelect.addEventListener("change", refreshUI);
        sortBySelect.addEventListener("change", refreshUI);

        // Load state from URL on initial load
        loadStateFromURL();

        updateFeaturedSortOptions(); // Update sort options visibility based on initial status
        refreshUI(); // Initial render

        // Back to Top button visibility
        const backToTopBtn = document.getElementById('backToTop');
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        // Handle hash navigation (from analytics page links)
        function handleHashNavigation() {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#artist-')) {
                setTimeout(() => {
                    const targetCard = document.getElementById(hash.substring(1));
                    if (targetCard) {
                        targetCard.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        // Add highlight effect
                        targetCard.style.boxShadow = '0 0 20px rgba(37, 82, 255, 0.5)';
                        setTimeout(() => {
                            targetCard.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.05)';
                        }, 2000);
                    }
                }, 500); // Wait for cards to render
            }
        }

        // Call on load and on hash change
        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);

        // Reset Filters button
        document.getElementById("resetFilters").addEventListener("click", () => {
        genreSelect.value = "All";
        whereFoundSelect.value = "All";
        followersSelect.value = "All";
        sortBySelect.value = "rankingHighLow";
        searchInput.value = "";
        currentSearchTerm = "";
        currentStatusFilter = ['all'];
        currentTagFilter = null;
        document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.status-btn[data-status="all"]').classList.add('active');
        updateFeaturedSortOptions();
        refreshUI();
        // On mobile, hide filters after reset
        if (window.innerWidth <= 768) {
            document.getElementById("filters").style.display = "none";
        }
        });
        
        // Hide filters on resize to mobile
        window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            document.getElementById("filters").style.display = "none";
        } else {
            document.getElementById("filters").style.display = "grid";
        }
        });
        
        // Initial state for filters on load (mobile hidden)
        if (window.innerWidth <= 768) {
        document.getElementById("filters").style.display = "none";
        }
        })
        .catch(err => {
        console.error("Error loading data:", err);
        console.error("Error details:", err.message);
        console.error("Stack trace:", err.stack);
        document.getElementById("summary").innerHTML = "<div style='text-align: center; color: red; padding: 2rem;'>Error loading artist data. Check console for details.</div>";
        });
