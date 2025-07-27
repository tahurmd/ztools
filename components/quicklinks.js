// Quick Links functionality (simplified)
function initQuickLinks() {
    updateLinksCount();
    initializeSearch();
}

// Update links count in header
function updateLinksCount() {
    const allCards = document.querySelectorAll('.link-card-wrapper');
    document.getElementById('linksCountBadge').textContent = `${allCards.length} links`;
    document.getElementById('displayedCount').textContent = allCards.length;
}

// Filter links by search input
function filterLinks() {
    const searchTerm = document.getElementById('linkSearch').value.toLowerCase();
    const allCards = document.querySelectorAll('.link-card-wrapper');
    const noResultsMsg = document.getElementById('noResultsMessage');
    
    let visibleCount = 0;
    
    allCards.forEach(card => {
        const name = card.getAttribute('data-name').toLowerCase();
        const tags = card.getAttribute('data-tags').toLowerCase();
        
        if (!searchTerm || name.includes(searchTerm) || tags.includes(searchTerm)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Update counts
    document.getElementById('displayedCount').textContent = visibleCount;
    document.getElementById('resultsBadge').textContent = visibleCount > 0 ? 'Click to access' : 'No matches';
    
    // Show/hide no results message
    if (visibleCount === 0 && searchTerm) {
        noResultsMsg.classList.remove('d-none');
    } else {
        noResultsMsg.classList.add('d-none');
    }
    
    // Update filtered badge
    const filteredBadge = document.getElementById('filteredBadge');
    if (searchTerm) {
        filteredBadge.classList.remove('d-none');
        filteredBadge.textContent = `${visibleCount} filtered`;
    } else {
        filteredBadge.classList.add('d-none');
    }
}

// Clear search
function clearSearch() {
    document.getElementById('linkSearch').value = '';
    filterLinks();
}

// Refresh quick links
function refreshQuickLinks() {
    const refreshBtn = event.target;
    const originalHtml = refreshBtn.innerHTML;
    
    refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise spinner-border spinner-border-sm me-1"></i>Refreshing...';
    refreshBtn.disabled = true;
    
    setTimeout(() => {
        clearSearch();
        updateLinksCount();
        
        refreshBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Updated!';
        setTimeout(() => {
            refreshBtn.innerHTML = originalHtml;
            refreshBtn.disabled = false;
        }, 1000);
    }, 1000);
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('linkSearch');
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            clearSearch();
            searchInput.blur();
        }
    });
}

// Make functions globally available
window.filterLinks = filterLinks;
window.clearSearch = clearSearch;
window.refreshQuickLinks = refreshQuickLinks;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('quicklinks-section')) {
        initQuickLinks();
    }
});
