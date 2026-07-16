// ==============================================
// Elsewhere Collective - Instagram API
// All API calls are proxied through Apps Script
// so the access token never appears in this file.
// ==============================================

const PROXY_URL = 'https://script.google.com/macros/s/AKfycbz7hnoQatrVPElr51rj8XOcFxwdEAidIMVdR0tyXv0TEGrXFp8LXyXToCmaWAu6UCq6/exec';

async function proxyRequest(params) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${PROXY_URL}?${qs}`);
    if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
    return await res.json();
}

async function getProfile() {
    return await proxyRequest({ action: 'igProfile' });
}

async function getMedia() {
    const allMedia = [];
    let after = null;

    while (true) {
        const params = { action: 'igMedia' };
        if (after) params.after = after;
        const data = await proxyRequest(params);
        if (data.data) allMedia.push(...data.data);
        after = data.paging?.cursors?.after || null;
        if (!after || !data.paging?.next) break;
    }

    return { data: allMedia };
}

async function getMediaInsights(mediaId) {
    return await proxyRequest({ action: 'igInsights', mediaId });
}

async function getFollowerDemographics() {
    return await proxyRequest({ action: 'igDemographics' });
}


// ------------------------------------------------
// Page initialisation
// ------------------------------------------------

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7hnoQatrVPElr51rj8XOcFxwdEAidIMVdR0tyXv0TEGrXFp8LXyXToCmaWAu6UCq6/exec';

let allPosts = [];
let activeFilter = 'ALL';
let activeSort = 'date_desc';

async function syncToSheet() {
    const btn = document.getElementById('syncBtn');
    const status = document.getElementById('syncStatus');
    btn.disabled = true;
    btn.textContent = 'Syncing…';
    status.textContent = '';
    try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=syncInstagram`);
        const data = await res.json();
        if (data.success) {
            status.textContent = `✓ ${data.message}`;
            status.style.color = 'green';
        } else {
            status.textContent = `✗ ${data.message}`;
            status.style.color = '#c0392b';
        }
    } catch (err) {
        status.textContent = '✗ Failed to reach Apps Script';
        status.style.color = '#c0392b';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sync to Sheet';
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

let igLightboxIndex = 0;
let igLightboxOrder = []; // ordered list of allPosts indices currently visible

function openIgLightbox(postIndex) {
    // Build the ordered list from whatever posts are currently rendered
    igLightboxOrder = Array.from(
        document.querySelectorAll('.post-image-wrap[onclick]')
    ).map(el => parseInt(el.getAttribute('onclick').match(/\d+/)[0]));

    igLightboxIndex = igLightboxOrder.indexOf(postIndex);
    if (igLightboxIndex === -1) igLightboxIndex = 0;

    _showIgLightboxAt(igLightboxIndex);
    document.getElementById('igLightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function _showIgLightboxAt(idx) {
    const postIndex = igLightboxOrder[idx];
    const post = allPosts[postIndex];
    if (!post) return;

    const imageUrl = post.media_type === 'VIDEO' ? (post.thumbnail_url || '') : (post.media_url || '');
    const reach = post.reach ?? null;
    const views = post.views ?? null;
    const likes = post.like_count ?? null;
    const engRate = (reach && likes) ? ((likes / reach) * 100).toFixed(1) + '%' : '—';

    document.getElementById('igLightboxImage').src = imageUrl;
    document.getElementById('igLightboxDate').textContent = formatDate(post.timestamp);
    document.getElementById('igLightboxCaption').textContent = post.caption || '(no caption)';
    document.getElementById('igLightboxReach').textContent = reach !== null ? reach.toLocaleString() : '—';
    document.getElementById('igLightboxViews').textContent = views !== null ? views.toLocaleString() : '—';
    document.getElementById('igLightboxLikes').textContent = likes !== null ? likes.toLocaleString() : '—';
    document.getElementById('igLightboxEng').textContent = engRate;
    document.getElementById('igLightboxLink').href = post.permalink;
    document.getElementById('igLightboxCounter').textContent = `${idx + 1} / ${igLightboxOrder.length}`;
}

function navigateIgLightbox(direction) {
    igLightboxIndex = (igLightboxIndex + direction + igLightboxOrder.length) % igLightboxOrder.length;
    _showIgLightboxAt(igLightboxIndex);
}

function closeIgLightbox() {
    document.getElementById('igLightbox').classList.remove('active');
    document.body.style.overflow = '';
}

function toggleCaption(el) {
    const expanded = el.classList.toggle('expanded');
    const btn = el.nextElementSibling;
    if (btn && btn.classList.contains('post-caption-toggle')) {
        btn.textContent = expanded ? 'Show less' : 'Read more';
    }
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderPosts(posts) {
    const grid = document.getElementById('instagram-grid');
    document.getElementById('ig-media-count').textContent = posts.length;

    if (posts.length === 0) {
        grid.innerHTML = '<div class="ig-loading">No posts match this filter.</div>';
        return;
    }

    grid.innerHTML = posts.map((post, i) => {
        const postIndex = allPosts.indexOf(post);
        const imageUrl = post.media_type === 'VIDEO' ? (post.thumbnail_url || '') : (post.media_url || '');
        const badge = post.media_type === 'VIDEO' ? 'Video' : post.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Photo';
        const caption = post.caption ? escapeHtml(post.caption) : '(no caption)';
        const reach = post.reach ?? null;
        const views = post.views ?? null;
        const likes = post.like_count ?? null;
        const shares = post.shares ?? null;
        const saves = post.saved ?? null;
        const engRate = (reach && likes) ? ((likes / reach) * 100).toFixed(1) + '%' : '—';
        const permalink = escapeHtml(post.permalink);

        return `
        <div class="post-card" data-type="${post.media_type}">
            <div class="post-image-wrap" onclick="openIgLightbox(${postIndex})">
                ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="Post" loading="lazy">` : '<div style="width:100%;height:100%;background:#eee;"></div>'}
                <span class="post-type-badge">${badge}</span>
            </div>
            <div class="post-meta">
                <div class="post-date">${formatDate(post.timestamp)}</div>
                <div class="post-caption" onclick="toggleCaption(this)">${caption}</div>
                <button class="post-caption-toggle" onclick="toggleCaption(this.previousElementSibling)">Read more</button>
                <div class="post-stats">
                    <div class="post-stat">
                        <span class="post-stat-value">${likes !== null ? likes.toLocaleString() : '—'}</span>
                        <span class="post-stat-label">Likes</span>
                    </div>
                    <div class="post-stat">
                        <span class="post-stat-value">${reach !== null ? reach.toLocaleString() : '—'}</span>
                        <span class="post-stat-label">Reach</span>
                    </div>
                    <div class="post-stat">
                        <span class="post-stat-value">${views !== null ? views.toLocaleString() : '—'}</span>
                        <span class="post-stat-label">Views</span>
                    </div>
                    <div class="post-stat">
                        <span class="post-stat-value">${shares !== null ? shares.toLocaleString() : '—'}</span>
                        <span class="post-stat-label">Shares</span>
                    </div>
                    <div class="post-stat">
                        <span class="post-stat-value">${saves !== null ? saves.toLocaleString() : '—'}</span>
                        <span class="post-stat-label">Saves</span>
                    </div>
                    <div class="post-stat">
                        <span class="post-stat-value">${post.comments_count !== null ? post.comments_count : '—'}</span>
                        <span class="post-stat-label">Comments</span>
                    </div>
                    <div class="post-stat">
                        <span class="post-stat-value">${engRate}</span>
                        <span class="post-stat-label">Eng. Rate</span>
                    </div>
                </div>
            </div>
            <a class="post-link" href="${permalink}" target="_blank" rel="noopener">View on Instagram ↗</a>
        </div>`;
    }).join('');
}

function sortPosts(posts) {
    const sorted = [...posts];
    switch (activeSort) {
        case 'date_asc':  return sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        case 'date_desc': return sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        case 'reach':     return sorted.sort((a, b) => (b.reach ?? 0) - (a.reach ?? 0));
        case 'views':     return sorted.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        case 'likes':     return sorted.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
        case 'engagement':
            return sorted.sort((a, b) => {
                const rateA = a.reach ? (a.like_count ?? 0) / a.reach : 0;
                const rateB = b.reach ? (b.like_count ?? 0) / b.reach : 0;
                return rateB - rateA;
            });
        default: return sorted;
    }
}

function applyFilterAndSort() {
    const query = document.getElementById('igSearch').value.trim().toLowerCase();
    let posts = activeFilter === 'ALL' ? allPosts : allPosts.filter(p => p.media_type === activeFilter);
    if (query) {
        posts = posts.filter(p => (p.caption || '').toLowerCase().includes(query));
    }
    posts = sortPosts(posts);
    renderPosts(posts);
    updateAvgStats(posts);
}

function updateAvgStats(posts) {
    const src = posts || allPosts;
    const withInsights = src.filter(p => p.reach != null && p.reach > 0);
    if (withInsights.length === 0) return;
    const avgReach = Math.round(withInsights.reduce((s, p) => s + p.reach, 0) / withInsights.length);
    const avgViews = Math.round(withInsights.filter(p => p.views != null).reduce((s, p) => s + (p.views || 0), 0) / withInsights.length);
    const avgEng = (withInsights.reduce((s, p) => s + ((p.like_count || 0) / p.reach), 0) / withInsights.length * 100).toFixed(1) + '%';
    document.getElementById('ig-avg-reach').textContent = avgReach.toLocaleString();
    document.getElementById('ig-avg-views').textContent = avgViews.toLocaleString();
    document.getElementById('ig-avg-eng').textContent = avgEng;
    document.getElementById('ig-media-count').textContent = src.length;
}

async function loadInstagram() {
    const grid = document.getElementById('instagram-grid');
    try {
        const [profile, media] = await Promise.all([
            getProfile(),
            getMedia()
        ]);

        document.getElementById('ig-followers').textContent = profile.followers_count.toLocaleString();
        document.getElementById('ig-media-count').textContent = profile.media_count;

        allPosts = media.data || [];
        applyFilterAndSort();

        // Fetch insights for all posts in parallel, then re-render with data
        const insightsResults = await Promise.allSettled(
            allPosts.map(post => getMediaInsights(post.id))
        );

        insightsResults.forEach((result, i) => {
            if (result.status === 'fulfilled' && result.value.data) {
                result.value.data.forEach(metric => {
                    allPosts[i][metric.name] = metric.values[0]?.value ?? null;
                });
            }
        });

        applyFilterAndSort();
    } catch (err) {
        grid.innerHTML = `<div class="ig-error">Failed to load posts: ${err.message}</div>`;
        console.error(err);
    }

    loadFollowerDemographics();
}

const AGE_ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

async function loadFollowerDemographics() {
    const ageGenderCanvas = document.getElementById('followerAgeGenderChart');
    const locationContainer = document.getElementById('followerLocationChart');
    if (!ageGenderCanvas && !locationContainer) return;

    try {
        const res = await getFollowerDemographics();
        if (!res.success) throw new Error(res.message || 'Unknown error');
        renderFollowerAgeGender(res.data.age || [], res.data.gender || []);
        renderFollowerLocations(res.data.country || [], res.data.city || []);
    } catch (err) {
        if (locationContainer) {
            locationContainer.innerHTML = `<div class="ig-error">Failed to load demographics: ${err.message}</div>`;
        }
        console.error(err);
    }
}

function renderFollowerAgeGender(ageData, genderData) {
    const canvas = document.getElementById('followerAgeGenderChart');
    if (!canvas) return;

    if (ageData.length === 0) {
        canvas.parentElement.innerHTML = '<div style="text-align:center;color:#666;">No age/gender data available yet</div>';
        return;
    }

    // Sum age buckets across genders in case the API breaks age down per-gender combo
    const ageTotals = {};
    ageData.forEach(d => {
        ageTotals[d.dimension] = (ageTotals[d.dimension] || 0) + Number(d.value);
    });

    const labels = AGE_ORDER.filter(a => ageTotals[a] !== undefined);
    const values = labels.map(a => ageTotals[a]);

    const isDark = document.body.classList.contains('dark-mode');
    const barColor = isDark ? '#C4D4BE' : '#A8B5A0';
    const textColor = isDark ? 'rgba(243,239,233,0.6)' : '#666';

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Followers',
                data: values,
                backgroundColor: barColor,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: textColor }, grid: { display: false } },
                y: { ticks: { color: textColor }, grid: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' } }
            }
        }
    });

    // Gender breakdown as a simple summary line under the chart
    const totalByGender = {};
    genderData.forEach(d => { totalByGender[d.dimension] = Number(d.value); });
    const totalGender = Object.values(totalByGender).reduce((s, v) => s + v, 0);
    const subtitle = canvas.closest('.chart-container')?.querySelector('.chart-subtitle');
    if (subtitle && totalGender > 0) {
        const parts = Object.entries(totalByGender)
            .sort((a, b) => b[1] - a[1])
            .map(([g, v]) => `${g} ${Math.round((v / totalGender) * 100)}%`);
        subtitle.textContent = `Current snapshot — ${parts.join(' · ')}`;
    }
}

function renderFollowerLocations(countryData, cityData) {
    const container = document.getElementById('followerLocationChart');
    if (!container) return;

    const top = [...cityData].sort((a, b) => b.value - a.value).slice(0, 6);

    if (top.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:#666;">No location data available yet</div>';
        return;
    }

    const maxCount = Math.max(...top.map(d => d.value));
    container.innerHTML = '';

    top.forEach(({ dimension, value }) => {
        const widthPercent = Math.round((value / maxCount) * 100);
        const barItem = document.createElement('div');
        barItem.className = 'bar-item';
        barItem.innerHTML = `
            <div class="bar-label">${escapeHtml(dimension)}</div>
            <div class="bar genre-bar" style="width: ${widthPercent}%;"></div>
            <div class="bar-value">${Number(value).toLocaleString()}</div>
        `;
        container.appendChild(barItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Dark mode is initialized once by analytics.js (initDarkMode()), which is
    // also loaded on this page — a second listener here would double-fire on
    // click and cancel itself out.

    // Filter buttons
    document.querySelectorAll('.ig-filter-btn[data-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ig-filter-btn[data-type]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.type;
            applyFilterAndSort();
        });
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            activeSort = e.target.value;
            applyFilterAndSort();
        });
    }

    const searchInput = document.getElementById('igSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => applyFilterAndSort());
    }

    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('igLightbox').classList.contains('active')) return;
        if (e.key === 'Escape') closeIgLightbox();
        if (e.key === 'ArrowLeft') navigateIgLightbox(-1);
        if (e.key === 'ArrowRight') navigateIgLightbox(1);
    });

    loadInstagram();
});
