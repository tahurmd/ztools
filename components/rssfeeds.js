// =============================================================================
// RSS FEED WITH PARSER PACKAGE AND TAB NOTIFICATIONS
// =============================================================================
// This module creates a responsive RSS feed reader that:
// 1. Fetches RSS feeds from 3 Zerodha sources using RSS Parser package
// 2. Displays content in a tabbed interface with Bootstrap styling
// 3. Sends notifications when new content is available (even in different tabs)
// 4. Auto-refreshes every 5 minutes to check for updates
// =============================================================================

// =============================================================================
// GLOBAL VARIABLES & STATE MANAGEMENT
// =============================================================================

// Main data storage for all RSS items from all feeds
let allRssItems = [];

// Auto-refresh timer reference for cleanup
let autoRefreshInterval;

// Track last seen content to detect new items (persisted in localStorage)
let lastSeenTimestamp = localStorage.getItem('lastRSSUpdate') || 0;

// Store original page title to restore after notifications
let originalTitle = document.title;

// Track if current tab is visible (for cross-tab notification logic)
let isPageVisible = true;

// =============================================================================
// RSS PARSER CONFIGURATION
// =============================================================================

// Initialize RSS Parser with browser headers to avoid CORS issues
const parser = new RSSParser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
});

// =============================================================================
// FEED CONFIGURATION
// =============================================================================

// Define the 3 Zerodha RSS feeds with their display properties
const FEEDS = {
    bulletins: {
        url: 'https://zerodha.com/marketintel/bulletin/?format=xml',
        label: 'Bulletins',           // Display name
        icon: 'bi-megaphone',         // Bootstrap icon class
        color: 'success'              // Bootstrap color theme
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
// MAIN INITIALIZATION FUNCTION
// =============================================================================

// Entry point - called when DOM is ready
function initRSSFeed() {
    // Step 1: Request browser notification permission
    requestNotificationPermission();
    
    // Step 2: Setup tab visibility detection for cross-tab notifications
    setupPageVisibilityHandling();
    
    // Step 3: Create the HTML layout structure
    createLayout();
    
    // Step 4: Load RSS feeds from all sources
    loadFeeds();
    
    // Step 5: Start auto-refresh timer
    startAutoRefresh();
}

// =============================================================================
// NOTIFICATION PERMISSION MANAGEMENT
// =============================================================================

// Request permission for browser notifications (required for cross-tab alerts)
async function requestNotificationPermission() {
    // Check if browser supports notifications and permission is not set
    if ('Notification' in window && Notification.permission === 'default') {
        // Ask user for permission
        const permission = await Notification.requestPermission();
        
        // Update UI to reflect permission status
        updateNotificationStatus();
        
        console.log('Notification permission:', permission);
    }
}

// =============================================================================
// TAB VISIBILITY DETECTION
// =============================================================================

// Setup listener to detect when user switches tabs (for cross-tab notifications)
function setupPageVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
        // Update visibility state based on document.hidden API
        isPageVisible = !document.hidden;
        
        // When user returns to tab, clear any notification indicators
        if (isPageVisible) {
            // Restore original page title (remove notification count)
            document.title = originalTitle;
        }
    });
}

// =============================================================================
// HTML LAYOUT CREATION
// =============================================================================

// Create the entire RSS feed interface using Bootstrap components
function createLayout() {
    // Get the container element from the main page
    const container = document.getElementById('quick-links-container');
    if (!container) return;

    // Build the complete HTML structure
    container.innerHTML = `
        <div class="col-12">
            <div class="card border-0 shadow-sm">
                
                <!-- =============================================================
                     HEADER SECTION - Title, count, refresh button
                     ============================================================= -->
                <div class="card-header bg-secondary text-white py-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <!-- Left side: Title and description -->
                        <div>
                            <h4 class="mb-1">
                                <i class="bi bi-rss fs-3 me-3"></i>Zerodha Market Intel
                            </h4>
                            <p class="mb-0 opacity-75">Latest 10 updates from each category</p>
                        </div>
                        
                        <!-- Right side: Status badges and refresh button -->
                        <div class="d-flex align-items-center gap-3">
                            <div class="d-flex align-items-center gap-2">
                                <!-- Total item count badge -->
                                <span class="badge bg-light text-primary fw-bold" id="total-count">0 items</span>
                                <!-- New items indicator badge (hidden by default) -->
                                <span class="badge bg-warning text-dark d-none" id="new-badge">NEW</span>
                            </div>
                            <!-- Manual refresh button -->
                            <button class="btn btn-light btn-sm px-3" onclick="refreshFeeds()">
                                <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <!-- =============================================================
                     CATEGORY NAVIGATION TABS
                     ============================================================= -->
                <div class="card-body p-0">
                    <nav class="nav nav-tabs nav-fill border-bottom-0" id="category-tabs">
                        <!-- All Updates tab (default active) -->
                        <button class="nav-link active fw-semibold" onclick="showCategory('all')">
                            <i class="bi bi-grid me-2"></i>All Updates 
                            <span class="badge bg-secondary ms-2" id="count-all">0</span>
                        </button>
                        <!-- Bulletins tab -->
                        <button class="nav-link fw-semibold" onclick="showCategory('bulletins')">
                            <i class="bi bi-megaphone me-2"></i>Bulletins 
                            <span class="badge bg-success ms-2" id="count-bulletins">0</span>
                        </button>
                        <!-- Disclosures tab -->
                        <button class="nav-link fw-semibold" onclick="showCategory('disclosures')">
                            <i class="bi bi-file-earmark-text me-2"></i>Disclosures 
                            <span class="badge bg-primary ms-2" id="count-disclosures">0</span>
                        </button>
                        <!-- Circulars tab -->
                        <button class="nav-link fw-semibold" onclick="showCategory('circulars')">
                            <i class="bi bi-file-text me-2"></i>Circulars 
                            <span class="badge bg-warning ms-2" id="count-circulars">0</span>
                        </button>
                    </nav>

                    <!-- =============================================================
                         MAIN CONTENT AREA - Where RSS items are displayed
                         ============================================================= -->
                    <div class="p-4" style="min-height: 500px; max-height: 700px; overflow-y: auto;">
                        <div id="feed-content">
                            <!-- Initial loading state -->
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary mb-3" role="status"></div>
                                <p class="text-muted">Loading latest market intel...</p>
                            </div>
                        </div>
                    </div>

                    <!-- =============================================================
                         FOOTER - Last updated time and notification controls
                         ============================================================= -->
                    <div class="card-footer bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <!-- Left side: Last updated timestamp -->
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>
                                <span id="last-updated">Never updated</span>
                            </small>
                            
                            <!-- Right side: Notification toggle and auto-refresh status -->
                            <div class="d-flex align-items-center gap-3">
                                <!-- Notification enable/disable toggle switch -->
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="notificationToggle" 
                                           onchange="toggleNotifications()" checked>
                                    <label class="form-check-label small" for="notificationToggle">
                                        <i class="bi bi-bell me-1"></i>
                                        <span id="notification-status">Notifications</span>
                                    </label>
                                </div>
                                <!-- Auto-refresh status indicator -->
                                <small class="text-success">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Auto-refresh: ON
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize notification status display
    updateNotificationStatus();
}

// =============================================================================
// RSS FEED LOADING & PARSING
// =============================================================================

// Main function to load and parse all RSS feeds
async function loadFeeds() {
    const contentDiv = document.getElementById('feed-content');
    
    try {
        // Step 1: Show loading spinner while fetching feeds
        contentDiv.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <p class="text-muted">Loading latest market intel...</p>
            </div>
        `;

        // Step 2: Create promises for all 3 feeds (parallel loading for better performance)
        const feedPromises = Object.entries(FEEDS).map(async ([category, config]) => {
            try {
                // Use CORS proxy to bypass cross-origin restrictions
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(config.url)}`;
                const response = await fetch(proxyUrl);
                const data = await response.json();
                
                // Check if proxy returned RSS content
                if (data.contents) {
                    // Parse RSS XML using RSS Parser library
                    const feed = await parser.parseString(data.contents);
                    
                    // Transform feed items into our standard format, limit to 10 latest items
                    return feed.items.slice(0, 10).map(item => ({
                        title: item.title || 'No title',
                        link: item.link || '#',
                        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                        description: item.contentSnippet || item.content || '',
                        category: category,
                        categoryLabel: config.label,
                        categoryIcon: config.icon,
                        categoryColor: config.color,
                        // Convert date to timestamp for easy sorting
                        timestamp: new Date(item.pubDate || item.isoDate || Date.now()).getTime()
                    }));
                }
                return [];
            } catch (error) {
                // Log individual feed errors but don't break the entire process
                console.warn(`Failed to load ${category}:`, error);
                return [];
            }
        });

        // Step 3: Wait for all feeds to complete loading
        const results = await Promise.all(feedPromises);
        
        // Step 4: Store previous items to detect new content
        const previousItems = [...allRssItems];
        
        // Step 5: Combine all feeds and sort by date (newest first)
        allRssItems = results
            .flat()                                    // Combine all arrays into one
            .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending
        
        // Step 6: Update UI with new data
        updateCounts();           // Update category count badges
        displayContent('all');    // Show all items by default
        updateLastUpdated();      // Update "last updated" timestamp
        
        // Step 7: Check for new items and send notifications (only after first load)
        if (previousItems.length > 0) {
            checkForNewItems(previousItems);
        }
        
    } catch (error) {
        // Handle complete failure to load any feeds
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
// NEW CONTENT DETECTION & NOTIFICATION SYSTEM
// =============================================================================

// Compare current items with previous load to detect new content
function checkForNewItems(previousItems) {
    if (!allRssItems.length) return;
    
    // Create a set of previous timestamps for fast lookup
    const previousTimestamps = new Set(previousItems.map(item => item.timestamp));
    
    // Find items that weren't in the previous load (new items)
    const newItems = allRssItems.filter(item => !previousTimestamps.has(item.timestamp));
    
    // If new items found, trigger all notification methods
    if (newItems.length > 0) {
        // Step 1: Show visual "NEW" badge in header
        const badge = document.getElementById('new-badge');
        if (badge) {
            badge.classList.remove('d-none');
            // Auto-hide badge after 10 seconds
            setTimeout(() => badge.classList.add('d-none'), 10000);
        }
        
        // Step 2: Send browser notification (if user enabled notifications)
        if (document.getElementById('notificationToggle')?.checked) {
            sendBrowserNotification(newItems);
        }
        
        // Step 3: Update page title with count (if user is on different tab)
        if (!isPageVisible) {
            updatePageTitle(newItems.length);
        }
        
        // Step 4: Show toast notification (visible when user returns to tab)
        showToastNotification(newItems);
        
        // Step 5: Update localStorage to remember we've seen these items
        const latestTimestamp = Math.max(...allRssItems.map(item => item.timestamp));
        localStorage.setItem('lastRSSUpdate', latestTimestamp.toString());
    }
}

// =============================================================================
// BROWSER NOTIFICATION (CROSS-TAB)
// =============================================================================

// Send system notification that appears even when user is on different tab
function sendBrowserNotification(newItems) {
    // Check if user granted notification permission
    if (Notification.permission !== 'granted') return;
    
    const count = newItems.length;
    const latestItem = newItems[0];
    
    // Create system notification
    const notification = new Notification('📈 Zerodha Market Intel Update', {
        body: count === 1 
            ? `${latestItem.categoryLabel}: ${latestItem.title.substring(0, 100)}...`
            : `${count} new updates available`,
        icon: '/favicon.ico',        // App icon
        badge: '/favicon.ico',       // Small badge icon
        tag: 'zerodha-update',       // Prevents multiple identical notifications
        requireInteraction: false,  // Auto-closes
        silent: false               // Plays notification sound
    });
    
    // Handle notification click - bring user back to the feed
    notification.onclick = function() {
        window.focus();              // Focus the browser window
        notification.close();       // Close the notification
        
        // If all new items are from same category, switch to that tab
        const categories = [...new Set(newItems.map(item => item.category))];
        if (categories.length === 1) {
            showCategory(categories[0]);
        }
    };
    
    // Auto-close notification after 8 seconds
    setTimeout(() => notification.close(), 8000);
}

// =============================================================================
// PAGE TITLE NOTIFICATION (TAB INDICATOR)
// =============================================================================

// Update browser tab title to show new item count
function updatePageTitle(newCount) {
    document.title = `(${newCount}) New Updates - ${originalTitle}`;
}

// =============================================================================
// TOAST NOTIFICATION (IN-PAGE)
// =============================================================================

// Show Bootstrap toast notification (only visible when on the tab)
function showToastNotification(newItems) {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <strong>📈 New Market Intel!</strong><br>
                    <small>${newItems.length} new update${newItems.length > 1 ? 's' : ''} from ${newItems[0].categoryLabel}</small>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Show the toast
    toastContainer.innerHTML = toastHtml;
    const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
    toast.show();
}

// =============================================================================
// NOTIFICATION TOGGLE MANAGEMENT
// =============================================================================

// Handle notification enable/disable toggle
function toggleNotifications() {
    const toggle = document.getElementById('notificationToggle');
    const status = document.getElementById('notification-status');
    
    if (toggle.checked) {
        // User wants to enable notifications
        if (Notification.permission === 'default') {
            // Permission not yet requested - ask for it
            Notification.requestPermission().then(permission => {
                if (permission !== 'granted') {
                    // Permission denied - uncheck the toggle
                    toggle.checked = false;
                }
                updateNotificationStatus();
            });
        } else if (Notification.permission === 'denied') {
            // Permission previously denied - show help message
            alert('Notifications are blocked. Please enable them in your browser settings.');
            toggle.checked = false;
        }
    }
    
    // Update the status display
    updateNotificationStatus();
}

// Update notification status text and styling based on permission state
function updateNotificationStatus() {
    const toggle = document.getElementById('notificationToggle');
    const status = document.getElementById('notification-status');
    
    if (!toggle || !status) return;
    
    const permission = Notification.permission;
    const isEnabled = toggle.checked;
    
    // Update display based on permission and toggle state
    if (permission === 'granted' && isEnabled) {
        // Notifications enabled and working
        status.innerHTML = '<i class="bi bi-bell-fill me-1"></i>Notifications ON';
        status.className = 'form-check-label small text-success';
    } else if (permission === 'denied') {
        // Notifications blocked by browser
        status.innerHTML = '<i class="bi bi-bell-slash me-1"></i>Notifications Blocked';
        status.className = 'form-check-label small text-danger';
        toggle.checked = false;
    } else {
        // Notifications disabled or permission not granted
        status.innerHTML = '<i class="bi bi-bell me-1"></i>Notifications OFF';
        status.className = 'form-check-label small text-muted';
    }
}

// =============================================================================
// CATEGORY COUNT MANAGEMENT
// =============================================================================

// Update the count badges in category tabs
function updateCounts() {
    // Calculate counts for each category
    const counts = {
        all: allRssItems.length,
        bulletins: allRssItems.filter(item => item.category === 'bulletins').length,
        disclosures: allRssItems.filter(item => item.category === 'disclosures').length,
        circulars: allRssItems.filter(item => item.category === 'circulars').length
    };
    
    // Update each count badge in the UI
    Object.entries(counts).forEach(([category, count]) => {
        const element = document.getElementById(`count-${category}`);
        if (element) element.textContent = count;
    });
    
    // Update total count in header
    document.getElementById('total-count').textContent = `${counts.all} items`;
}

// =============================================================================
// CONTENT DISPLAY & FILTERING
// =============================================================================

// Display RSS items based on selected category filter
function displayContent(category) {
    const contentDiv = document.getElementById('feed-content');
    
    // Filter items based on selected category
    let itemsToShow = category === 'all' 
        ? allRssItems                                              // Show all items
        : allRssItems.filter(item => item.category === category);  // Show only selected category
    
    // Handle empty state
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
    
    // Generate HTML for each RSS item
    const now = new Date();
    const itemsHtml = itemsToShow.map((item, index) => {
        const pubDate = new Date(item.pubDate);
        const isToday = pubDate.toDateString() === now.toDateString();
        const timeAgo = getTimeAgo(pubDate);
        
        // Create card for each RSS item
        return `
            <div class="border rounded-3 p-3 mb-3 bg-white shadow-sm hover-shadow">
                <!-- Item header: category badge and date info -->
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <!-- Category badge with icon -->
                    <span class="badge bg-${item.categoryColor} px-3 py-2">
                        <i class="${item.categoryIcon} me-1"></i>${item.categoryLabel}
                    </span>
                    <!-- Date and time information -->
                    <div class="text-end">
                        <small class="text-muted d-block">${pubDate.toLocaleDateString('en-IN')}</small>
                        <small class="text-info">${timeAgo}</small>
                        ${isToday ? '<span class="badge bg-danger ms-2">Today</span>' : ''}
                    </div>
                </div>
                
                <!-- Item title (clickable link) -->
                <h6 class="mb-2">
                    <a href="${item.link}" target="_blank" class="text-decoration-none text-dark fw-semibold">
                        ${item.title}
                    </a>
                </h6>
                
                <!-- Item description (truncated) -->
                ${item.description ? `
                    <p class="text-muted small mb-2 lh-sm">
                        ${item.description.substring(0, 200)}${item.description.length > 200 ? '...' : ''}
                    </p>
                ` : ''}
                
                <!-- Item footer: full date and read more button -->
                <div class="d-flex justify-content-between align-items-center">
                    <!-- Full publication date and time -->
                    <small class="text-muted">
                        <i class="bi bi-calendar3 me-1"></i>
                        ${pubDate.toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </small>
                    <!-- Read more button -->
                    <a href="${item.link}" target="_blank" class="btn btn-outline-${item.categoryColor} btn-sm">
                        <i class="bi bi-arrow-right me-1"></i>Read More
                    </a>
                </div>
            </div>
        `;
    }).join('');
    
    // Update the content area with generated HTML
    contentDiv.innerHTML = itemsHtml;
}

// =============================================================================
// CATEGORY TAB NAVIGATION
// =============================================================================

// Handle category tab clicks to filter content
function showCategory(category) {
    // Remove active class from all tabs
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Display filtered content
    displayContent(category);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Convert date to human-readable "time ago" format
function getTimeAgo(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    // Return appropriate time format based on age
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays}d ago`;
}

// Update "last updated" timestamp in footer
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
// MANUAL REFRESH FUNCTION
// =============================================================================

// Handle manual refresh button click
async function refreshFeeds() {
    const refreshBtn = event.target;
    const originalHtml = refreshBtn.innerHTML;
    
    // Show loading state on button
    refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise spinner-border spinner-border-sm me-1"></i>Updating...';
    refreshBtn.disabled = true;
    
    // Reload feeds
    await loadFeeds();
    
    // Restore button to normal state
    refreshBtn.innerHTML = originalHtml;
    refreshBtn.disabled = false;
}

// =============================================================================
// AUTO-REFRESH SYSTEM
// =============================================================================

// Start automatic refresh timer (runs every 5 minutes)
function startAutoRefresh() {
    autoRefreshInterval = setInterval(() => {
        loadFeeds();  // Automatically reload feeds
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
}

// =============================================================================
// GLOBAL FUNCTION EXPORTS (for onclick handlers)
// =============================================================================

// Make functions available globally for HTML onclick attributes
window.showCategory = showCategory;
window.refreshFeeds = refreshFeeds;
window.toggleNotifications = toggleNotifications;

// =============================================================================
// INITIALIZATION & CLEANUP
// =============================================================================

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initRSSFeed);

// Cleanup auto-refresh timer when page is closed
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});

// =============================================================================
// END OF RSS FEED MODULE
// =============================================================================
