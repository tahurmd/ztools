// =============================================================================
// RSS FEED WITH PARSER PACKAGE AND TAB NOTIFICATIONS - REDESIGNED
// =============================================================================
// This module creates a responsive RSS feed reader that:
// 1. Fetches RSS feeds from 3 Zerodha sources using RSS Parser package
// 2. Displays content in a tabbed interface with Bootstrap styling
// 3. Sends notifications only for posts that arrive after the page is opened
// 4. Auto-refreshes every 5 minutes to check for updates
// 5. Uses Cloudflare Worker for reliable CORS handling
// 6. Features notification controls and timestamp in the header
// =============================================================================

// =============================================================================
/* GLOBAL VARIABLES & STATE MANAGEMENT */
// =============================================================================

// Main data storage for all RSS items from all feeds
let allRssItems = [];

// Auto-refresh timer reference for cleanup
let autoRefreshInterval;

// Track last seen content to detect across-page sessions (kept but not used for notifications)
let lastSeenTimestamp = localStorage.getItem('lastRSSUpdate') || 0;

// Store original page title to restore after notifications
let originalTitle = document.title;

// Track if current tab is visible (for cross-tab notification logic)
let isPageVisible = true;

// New: watermark for current session; only notify for items newer than this
let sessionStartTimestamp = 0;

// =============================================================================
/* RSS PARSER CONFIGURATION */
// =============================================================================

// Initialize RSS Parser with browser headers to avoid CORS issues
const parser = new RSSParser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
});

// =============================================================================
/* FEED CONFIGURATION */
// =============================================================================

const FEEDS = {
    bulletins: {
        url: 'https://zerodha.com/marketintel/bulletin/?format=xml',
        label: 'Bulletins',
        icon: 'bi-megaphone',
        color: 'success'
    },
    disclosures: {
        url: 'https://zerodha.com/marketintel/disclosures/?format=xml',
        label: 'Disclosures',
        icon: 'bi-file-earmark-text',
        color: 'primary'
    },
    circulars: {
        url: 'https://zerodha.com/marketintel/circulars/?format=xml',
        label: 'Circulars',
        icon: 'bi-file-text',
        color: 'warning'
    }
};

// =============================================================================
/* MAIN INITIALIZATION FUNCTION */
// =============================================================================

function initRSSFeed() {
    requestNotificationPermission();
    setupPageVisibilityHandling();
    createLayout();
    loadFeeds();
    startAutoRefresh();
}

// =============================================================================
/* NOTIFICATION PERMISSION MANAGEMENT */
// =============================================================================

async function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        try {
            await Notification.requestPermission();
        } catch (_) {}
        updateNotificationStatus();
    }
}

// =============================================================================
/* TAB VISIBILITY DETECTION */
// =============================================================================

function setupPageVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
        if (isPageVisible) {
            document.title = originalTitle;
        }
    });
}

// =============================================================================
/* HTML LAYOUT CREATION - REDESIGNED WITH HEADER CONTROLS */
// =============================================================================

function createLayout() {
    const container = document.getElementById('rssfeeds-section');
    if (!container) return;

    container.innerHTML = `
        <div class="col-12">
            <div class="card border-0 shadow-sm">
                <!-- HEADER WITH NOTIFICATION BUTTON AND TIMESTAMP -->
                <div class="card-header bg-secondary text-white py-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <!-- Left side: Title and description -->
                        <div>
                            <h4 class="mb-1">
                                <i class="bi bi-rss fs-3 me-3"></i>Zerodha Updates
                            </h4>
                            <p class="mb-0 opacity-75">Latest 10 updates from each category</p>
                        </div>
                        
                        <!-- Right side: Controls moved from footer to header -->
                        <div class="d-flex align-items-center gap-4">
                            <!-- Status indicators -->
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-light text-primary fw-bold" id="total-count">0 items</span>
                                <span class="badge bg-warning text-dark d-none" id="new-badge">NEW</span>
                            </div>
                            
                            <!-- Last updated timestamp -->
                            <div class="text-light opacity-75">
                                <i class="bi bi-clock me-1"></i>
                                <span id="last-updated" class="small">Never updated</span>
                            </div>
                            
                            <!-- Notification toggle -->
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="notificationToggle" 
                                       onchange="toggleNotifications()" checked>
                                <label class="form-check-label small text-light" for="notificationToggle">
                                    <i class="bi bi-bell me-1"></i>
                                    <span id="notification-status">Notifications</span>
                                </label>
                            </div>
                            
                            <!-- Refresh button -->
                            <button class="btn btn-light btn-sm px-3" onclick="refreshFeeds(this)">
                                <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card-body p-0">
                    <!-- CATEGORY NAVIGATION TABS -->
                    <nav class="nav nav-tabs nav-fill border-bottom-0" id="category-tabs">
                        <button class="nav-link active fw-semibold" onclick="showCategory(this, 'all')">
                            <i class="bi bi-grid me-2"></i>All Updates 
                            <span class="badge bg-secondary ms-2" id="count-all">0</span>
                        </button>
                        <button class="nav-link fw-semibold" onclick="showCategory(this, 'bulletins')">
                            <i class="bi bi-megaphone me-2"></i>Bulletins 
                            <span class="badge bg-success ms-2" id="count-bulletins">0</span>
                        </button>
                        <button class="nav-link fw-semibold" onclick="showCategory(this, 'disclosures')">
                            <i class="bi bi-file-earmark-text me-2"></i>Disclosures 
                            <span class="badge bg-primary ms-2" id="count-disclosures">0</span>
                        </button>
                        <button class="nav-link fw-semibold" onclick="showCategory(this, 'circulars')">
                            <i class="bi bi-file-text me-2"></i>Circulars 
                            <span class="badge bg-warning ms-2" id="count-circulars">0</span>
                        </button>
                    </nav>

                    <!-- MAIN CONTENT AREA -->
                    <div class="p-4" style="min-height: 500px; max-height: 700px; overflow-y: auto;">
                        <div id="feed-content">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary mb-3" role="status"></div>
                                <p class="text-muted">Loading latest market intel...</p>
                            </div>
                        </div>
                    </div>

                    <!-- SIMPLIFIED FOOTER -->
                    <div class="card-footer bg-light">
                        <div class="text-center">
                            <small class="text-success">
                                <i class="bi bi-arrow-clockwise me-1"></i>Auto-refresh: ON (every 5 minutes)
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    updateNotificationStatus();
}

// =============================================================================
/* RSS FEED LOADING & PARSING - FIXED FOR CLOUDFLARE WORKER */
// =============================================================================

async function loadFeeds() {
    const contentDiv = document.getElementById('feed-content');
    if (!contentDiv) return;

    try {
        contentDiv.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <p class="text-muted">Loading latest market intel...</p>
            </div>
        `;

        const feedPromises = Object.entries(FEEDS).map(async ([category, config]) => {
            try {
                // Using YOUR Cloudflare Worker - FIXED: Direct XML response
                const proxyUrl = `https://ztool-cors-header-proxy.mdtahur23.workers.dev/?url=${encodeURIComponent(config.url)}`;
                const response = await fetch(proxyUrl, { cache: 'no-store' });
                if (!response.ok) throw new Error(`Proxy error ${response.status}`);
                
                // FIXED: Use .text() for XML content from your worker (not .json())
                const xmlText = await response.text();
                if (!xmlText || xmlText.trim() === '' || !xmlText.includes('<')) {
                    throw new Error('Invalid or empty XML response');
                }

                const feed = await parser.parseString(xmlText);

                return feed.items.slice(0, 10).map(item => ({
                    id: item.guid || item.link || `${(item.title || '').slice(0,200)}|${item.pubDate || item.isoDate || ''}`,
                    title: item.title || 'No title',
                    link: item.link || '#',
                    pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                    description: item.contentSnippet || item.content || '',
                    category: category,
                    categoryLabel: config.label,
                    categoryIcon: config.icon,
                    categoryColor: config.color,
                    timestamp: new Date(item.pubDate || item.isoDate || Date.now()).getTime()
                }));
            } catch (error) {
                console.warn(`Failed to load ${category}:`, error);
                return [];
            }
        });

        const results = await Promise.all(feedPromises);

        // Combine and sort
        allRssItems = results.flat().sort((a, b) => b.timestamp - a.timestamp);

        // Update UI
        updateCounts();
        displayContent('all');
        updateLastUpdated();

        // Compute latest timestamp in current data
        const latestTs = allRssItems.length ? Math.max(...allRssItems.map(i => i.timestamp)) : 0;

        // If first successful load this session, set the watermark and do not notify
        const isFirstLoadThisSession = sessionStartTimestamp === 0;
        if (isFirstLoadThisSession) {
            sessionStartTimestamp = latestTs;
            if (latestTs) localStorage.setItem('lastRSSUpdate', String(latestTs));
            return;
        }

        // Subsequent loads: notify only for items newer than the session watermark
        const newItemsSinceOpen = allRssItems.filter(i => i.timestamp > sessionStartTimestamp);

        if (newItemsSinceOpen.length > 0) {
            const badge = document.getElementById('new-badge');
            if (badge) {
                badge.classList.remove('d-none');
                setTimeout(() => badge.classList.add('d-none'), 10000);
            }

            const toggle = document.getElementById('notificationToggle');
            if (toggle?.checked) {
                sendBrowserNotification(newItemsSinceOpen);
            }

            if (!isPageVisible) {
                updatePageTitle(newItemsSinceOpen.length);
            }

            showToastNotification(newItemsSinceOpen);

            // Advance watermark so we don't notify again for the same items
            sessionStartTimestamp = latestTs;
            if (latestTs) localStorage.setItem('lastRSSUpdate', String(latestTs));
        }

    } catch (error) {
        console.error('Error loading feeds:', error);
        contentDiv.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
                <h5 class="text-danger">Failed to load feeds</h5>
                <p class="text-muted">Please check your internet connection and try again</p>
                <button class="btn btn-outline-primary mt-2" onclick="loadFeeds()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Try Again
                </button>
            </div>
        `;
    }
}

// =============================================================================
/* BROWSER NOTIFICATION (CROSS-TAB) - FIXED */
// =============================================================================

function sendBrowserNotification(newItems) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const count = newItems.length;
    const latestItem = newItems[0]; // FIXED: get the first item

    const notification = new Notification('📈 Zerodha Market Intel Update', {
        body: count === 1 
            ? `${latestItem.categoryLabel}: ${latestItem.title.substring(0, 100)}...`
            : `${count} new updates available`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'zerodha-update',
        requireInteraction: false,
        silent: false
    });

    notification.onclick = function() {
        try { window.focus(); } catch(_) {}
        notification.close();
        const categories = [...new Set(newItems.map(item => item.category))];
        if (categories.length === 1) {
            const tabBtn = document.querySelector(`.nav-link[onclick*="'${categories[0]}'"]`);
            if (tabBtn) showCategory(tabBtn, categories[0]); // FIXED: pass the category string
        }
    };

    setTimeout(() => notification.close(), 8000);
}

// =============================================================================
/* PAGE TITLE NOTIFICATION (TAB INDICATOR) */
// =============================================================================

function updatePageTitle(newCount) {
    document.title = `(${newCount}) New Updates - ${originalTitle}`;
}

// =============================================================================
/* TOAST NOTIFICATION (IN-PAGE) - FIXED */
// =============================================================================

function showToastNotification(newItems) {
    // Handle multiple categories case - FIXED
    const categories = [...new Set(newItems.map(item => item.categoryLabel))];
    const categoryText = categories.length === 1 
        ? categories[0] 
        : `${categories.length} categories`;

    const toastHtml = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert" data-bs-autohide="true" data-bs-delay="6000">
            <div class="d-flex">
                <div class="toast-body">
                    <strong>📈 New Market Intel!</strong><br>
                    <small>${newItems.length} new update${newItems.length > 1 ? 's' : ''} from ${categoryText}</small>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = toastHtml.trim();
    const toastEl = wrapper.firstElementChild;
    toastContainer.appendChild(toastEl);

    if (window.bootstrap?.Toast) {
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    } else {
        toastEl.style.display = 'block';
        setTimeout(() => toastEl.remove(), 6000);
    }
}

// =============================================================================
/* NOTIFICATION TOGGLE MANAGEMENT */
// =============================================================================

function toggleNotifications() {
    const toggle = document.getElementById('notificationToggle');
    if (!('Notification' in window)) {
        toggle.checked = false;
        updateNotificationStatus();
        return;
    }

    if (toggle.checked) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission !== 'granted') {
                    toggle.checked = false;
                }
                updateNotificationStatus();
            });
        } else if (Notification.permission === 'denied') {
            alert('Notifications are blocked. Please enable them in your browser settings.');
            toggle.checked = false;
            updateNotificationStatus();
        } else {
            updateNotificationStatus();
        }
    } else {
        updateNotificationStatus();
    }
}

function updateNotificationStatus() {
    const toggle = document.getElementById('notificationToggle');
    const status = document.getElementById('notification-status');
    if (!toggle || !status) return;

    if (!('Notification' in window)) {
        status.innerHTML = '<i class="bi bi-bell-slash me-1"></i>Notifications Unsupported';
        status.className = 'small text-light opacity-75';
        return;
    }

    const permission = Notification.permission;
    const isEnabled = toggle.checked;

    if (permission === 'granted' && isEnabled) {
        status.innerHTML = '<i class="bi bi-bell-fill me-1"></i>Notifications ON';
        status.className = 'small text-light';
    } else if (permission === 'denied') {
        status.innerHTML = '<i class="bi bi-bell-slash me-1"></i>Notifications Blocked';
        status.className = 'small text-warning';
        toggle.checked = false;
    } else {
        status.innerHTML = '<i class="bi bi-bell me-1"></i>Notifications OFF';
        status.className = 'small text-light opacity-75';
    }
}

// =============================================================================
/* CATEGORY COUNT MANAGEMENT */
// =============================================================================

function updateCounts() {
    const counts = {
        all: allRssItems.length,
        bulletins: allRssItems.filter(item => item.category === 'bulletins').length,
        disclosures: allRssItems.filter(item => item.category === 'disclosures').length,
        circulars: allRssItems.filter(item => item.category === 'circulars').length
    };
    
    Object.entries(counts).forEach(([category, count]) => {
        const element = document.getElementById(`count-${category}`);
        if (element) element.textContent = count;
    });
    
    const total = document.getElementById('total-count');
    if (total) total.textContent = `${counts.all} items`;
}

// =============================================================================
/* CONTENT DISPLAY & FILTERING - REDESIGNED CARDS */
// =============================================================================

function displayContent(category) {
    const contentDiv = document.getElementById('feed-content');
    if (!contentDiv) return;

    const itemsToShow = category === 'all' 
        ? allRssItems
        : allRssItems.filter(item => item.category === category);
    
    if (itemsToShow.length === 0) {
        contentDiv.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
                <h5 class="text-muted">No items found</h5>
                <p class="text-muted">Try refreshing or check another category</p>
            </div>
        `;
        return;
    }
    
    const now = new Date();
    const itemsHtml = itemsToShow.map(item => {
        const pubDate = new Date(item.pubDate);
        const isToday = pubDate.toDateString() === now.toDateString();
        const timeAgo = getTimeAgo(pubDate);
        
        return `
            <div class="card mb-4 border-0 shadow-sm position-relative overflow-hidden" style="transition: all 0.3s ease; border-left: 4px solid var(--bs-${item.categoryColor}) !important;">
                
                <!-- TOP BAR: Category badge, timestamp and today indicator -->
                <div class="card-header bg-light border-0 py-2 px-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-${item.categoryColor} bg-opacity-10 text-${item.categoryColor} border border-${item.categoryColor} border-opacity-25 px-3 py-2 fw-semibold">
                            <i class="${item.categoryIcon} me-2"></i>${item.categoryLabel}
                        </span>
                        <div class="d-flex align-items-center gap-2">
                            <small class="text-muted fw-medium">
                                <i class="bi bi-clock me-1"></i>${timeAgo}
                            </small>
                            ${isToday ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i class="bi bi-calendar-check me-1"></i>Today</span>' : ''}
                        </div>
                    </div>
                </div>

                <!-- MAIN CONTENT -->
                <div class="card-body px-3 py-3">
                    
                    <!-- Title with better typography -->
                    <h5 class="card-title mb-3 fw-bold lh-base">
                        <a href="${item.link}" target="_blank" class="text-decoration-none text-dark stretched-link position-relative" style="z-index: 2;">
                            ${item.title}
                        </a>
                    </h5>
                    
                    <!-- Description with improved styling -->
                    ${item.description ? `
                        <p class="card-text text-muted mb-3 lh-sm" style="font-size: 0.95rem;">
                            ${item.description.substring(0, 180)}${item.description.length > 180 ? '...' : ''}
                        </p>
                    ` : ''}
                    
                    <!-- Bottom section: Full date and action button -->
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top border-light">
                        <div class="d-flex flex-column">
                            <small class="text-muted fw-medium">
                                <i class="bi bi-calendar3 me-1 text-${item.categoryColor}"></i>
                                ${pubDate.toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </small>
                            <small class="text-muted" style="font-size: 0.8rem;">
                                ${pubDate.toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </small>
                        </div>
                        <a href="${item.link}" target="_blank" class="btn btn-${item.categoryColor} btn-sm px-3 py-2 position-relative" style="z-index: 3;">
                            <i class="bi bi-arrow-right me-1"></i>Read More
                        </a>
                    </div>
                </div>

                <!-- Subtle hover effect overlay -->
                <div class="position-absolute top-0 start-0 w-100 h-100 bg-${item.categoryColor} bg-opacity-5 opacity-0" style="transition: opacity 0.3s ease; pointer-events: none;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0'"></div>
            </div>
        `;
    }).join('');
    
    contentDiv.innerHTML = itemsHtml;
    
    // Add hover effects to cards
    addCardHoverEffects();
}

// Add interactive hover effects to cards
function addCardHoverEffects() {
    const cards = document.querySelectorAll('#feed-content .card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
            const overlay = this.querySelector('.position-absolute');
            if (overlay) overlay.style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)';
            const overlay = this.querySelector('.position-absolute');
            if (overlay) overlay.style.opacity = '0';
        });
    });
}

// =============================================================================
/* CATEGORY TAB NAVIGATION */
// =============================================================================

function showCategory(el, category) {
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.classList.remove('active');
    });
    if (el && el.classList) el.classList.add('active');
    displayContent(category);
}

// =============================================================================
/* UTILITY FUNCTIONS */
// =============================================================================

function getTimeAgo(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays}d ago`;
}

function updateLastUpdated() {
    const element = document.getElementById('last-updated');
    if (element) {
        element.textContent = `Updated ${new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }
}

// =============================================================================
/* MANUAL REFRESH FUNCTION */
// =============================================================================

async function refreshFeeds(btn) {
    const refreshBtn = btn;
    const originalHtml = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise spinner-border spinner-border-sm me-1"></i>Updating...';
    refreshBtn.disabled = true;
    await loadFeeds();
    refreshBtn.innerHTML = originalHtml;
    refreshBtn.disabled = false;
}

// =============================================================================
/* AUTO-REFRESH SYSTEM */
// =============================================================================

function startAutoRefresh() {
    autoRefreshInterval = setInterval(() => {
        loadFeeds();
    }, 5 * 60 * 1000);
}

// =============================================================================
/* GLOBAL FUNCTION EXPORTS (for onclick handlers) */
// =============================================================================

window.showCategory = showCategory;
window.refreshFeeds = refreshFeeds;
window.toggleNotifications = toggleNotifications;

// =============================================================================
/* INITIALIZATION & CLEANUP */
// =============================================================================

document.addEventListener('DOMContentLoaded', initRSSFeed);

window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});

// =============================================================================
// END OF RSS FEED MODULE
// =============================================================================
