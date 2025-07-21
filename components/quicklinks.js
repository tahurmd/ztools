
// Load links immediately when component loads
function dashboardInit() {
    loadAllLinks();
}

function loadAllLinks() {
    const links = [
        // Internal Tools
        
        {
            title: 'SGB Intrest Calender',
            description: 'SGB Intrest Calender friom Tradingqna',
            icon: 'bi-newspaper',
            color: 'info',
            type: 'external',
            url: 'https://tradingqna.com/t/interest-payment-dates-for-sovereign-gold-bonds-sgbs/145120'
        },
        {
            title: 'NSE India',
            description: 'National Stock Exchange of India',
            icon: 'bi-graph-up-arrow',
            color: 'primary',
            type: 'external',
            url: 'https://www.nseindia.com/'
        },
        {
            title: 'BSE India',
            description: 'Bombay Stock Exchange',
            icon: 'bi-bar-chart-line',
            color: 'success',
            type: 'external',
            url: 'https://www.bseindia.com/'
        },
     
        {
            title: 'Economic Times',
            description: 'Business news and updates',
            icon: 'bi-journal-text',
            color: 'warning',
            type: 'external',
            url: 'https://economictimes.indiatimes.com/'
        },
        {
            title: 'RBI India',
            description: 'Reserve Bank of India',
            icon: 'bi-bank2',
            color: 'secondary',
            type: 'external',
            url: 'https://www.rbi.org.in/'
        },
        {
            title: 'TradingView',
            description: 'Charts and trading ideas',
            icon: 'bi-graph-up',
            color: 'dark',
            type: 'external',
            url: 'https://www.tradingview.com/'
        },
        {
            title: 'CVLKRA',
            description: 'Investment platform',
            icon: 'bi-arrow-up-circle',
            color: 'success',
            type: 'external',
            url: 'https://groww.in/'
        }
    ];
    
    const container = document.getElementById('quick-links-container');
    if (!container) return;
    
    let html = '';
    
    links.forEach(link => {
        const buttonText = link.type === 'internal' ? 'Open Tool' : 'Visit Site';
        const buttonIcon = link.type === 'internal' ? 'bi-arrow-right' : 'bi-box-arrow-up-right';
        
        html += `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
                <div class="card h-100 border-${link.color} quick-link-card" style="border-width: 2px;">
                    <div class="card-body d-flex flex-column text-center">
                        <div class="mb-3">
                            <i class="bi ${link.icon} text-${link.color}" style="font-size: 2.5rem;"></i>
                        </div>
                        <h6 class="card-title">${link.title}</h6>
                        <p class="card-text text-muted small flex-grow-1">${link.description}</p>
                        <button class="btn btn-${link.color} btn-sm mt-auto" 
                                onclick="handleClick('${link.type}', '${link.page || ''}', '${link.url || ''}')">
                            <i class="bi ${buttonIcon} me-1"></i>
                            ${buttonText}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function handleClick(type, page, url) {
    if (type === 'internal' && page) {
        if (typeof loadPage === 'function') {
            loadPage(page);
        } else {
            alert('Navigation not available');
        }
    } else if (type === 'external' && url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

// Auto-load on component insert
setTimeout(dashboardInit, 100);
