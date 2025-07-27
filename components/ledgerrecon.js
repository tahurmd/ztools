// Simple column name normalizer for basic matching
function normalizeColumnName(columnName) {
    return columnName
        .toLowerCase()
        .trim()
        .replace(/[_\s-]+/g, '') // Remove underscores, spaces, and hyphens
        .replace(/[^\w]/g, ''); // Remove any non-word characters
}

// Simple hack to find particular and voucher type columns
function findColumnHack(headers, targetType) {
    const normalized = headers.map(h => ({
        original: h,
        normalized: normalizeColumnName(h)
    }));
    
    if (targetType === 'particular') {
        // Look for particular, particulars, description, narration
        const found = normalized.find(h => 
            h.normalized.includes('particular') || 
            h.normalized.includes('description') || 
            h.normalized.includes('narration') ||
            h.normalized.includes('details')
        );
        return found ? found.original : null;
    }
    
    if (targetType === 'voucher') {
        // Look for voucher type, voucher_type, type
        const found = normalized.find(h => 
            h.normalized.includes('vouchertype') || 
            h.normalized.includes('type')
        );
        return found ? found.original : null;
    }
    
    return null;
}






// Global variables
let csvData = [];
let categorizedData = [];
let filteredData = [];

// Category definitions
const CATEGORIES = {
    PAYIN: 'PayIn',
    PAYOUT: 'PayOut', 
    DP_CHARGES: 'DP Charges',
    AMC_CHARGES: 'AMC Charges',
    MODIFICATION_CHARGES: 'Modification Charges',
    SECONDARY_ORDER: 'Secondary Order',
    DELAYED_PAYMENT: 'Delayed Payment Charges',
    GATEWAY_CHARGES: 'Payment Gateway Charges',
    OTHER_CREDIT: 'Other Entry Credit',
    OTHER_DEBIT: 'Other Entry Debit',
    UNCATEGORIZED: 'Uncategorized'
};

/**
 * File handling - simplified without status panel
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please upload a CSV file only.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            csvData = parseCSV(e.target.result);
            
            // Auto-process
            setTimeout(() => {
                processCsv();
            }, 500);
            
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

/**
 * Parse CSV data
 */
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim().replace(/['"]/g, '') : '';
        });
        
        if (row.particulars && 
            !row.particulars.toLowerCase().includes('opening balance') && 
            !row.particulars.toLowerCase().includes('closing balance')) {
            data.push(row);
        }
    }
    
    return data;
}

/**
 * Process CSV and categorize data
 */
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim().replace(/['"]/g, '') : '';
        });
        
        // Check for both possible header names for particulars
        const particulars = row.particulars || row.Particulars || row['particulars'] || row['Particulars'] || '';
        
        if (particulars && 
            !particulars.toLowerCase().includes('opening balance') && 
            !particulars.toLowerCase().includes('closing balance')) {
            data.push(row);
        }
    }
    
    return data;
}


/**
 * Determine category based on voucher type and particulars
 */
function determineCategory(record) {
    // Make header access case-insensitive
    const voucherType = (record['voucher_type'] || record['Voucher Type'] || '').trim();
    const particulars = (record['particulars'] || record['Particulars'] || '').trim().toLowerCase();
    const debit = parseFloat((record.debit || record.Debit || '0').toString().replace(/[₹,\s]/g, '')) || 0;
    const credit = parseFloat((record.credit || record.Credit || '0').toString().replace(/[₹,\s]/g, '')) || 0;
    
    // Rest of the function remains the same
    if (voucherType === "Bank Receipts") {
        return CATEGORIES.PAYIN;
    }
    
    if (voucherType === "Bank Payments") {
        return CATEGORIES.PAYOUT;
    }
    
    if (voucherType === "Journal Entry") {
        if (particulars.includes("dp charges")) return CATEGORIES.DP_CHARGES;
        if (particulars.includes("amc for")) return CATEGORIES.AMC_CHARGES;
        if (particulars.includes("modification for")) return CATEGORIES.MODIFICATION_CHARGES;
        if (particulars.includes("order placement")) return CATEGORIES.SECONDARY_ORDER;
        if (particulars.includes("delayed payment")) return CATEGORIES.DELAYED_PAYMENT;
        if (particulars.includes("payment gateway charges")) return CATEGORIES.GATEWAY_CHARGES;
        
        if (debit > 0) return CATEGORIES.OTHER_DEBIT;
        if (credit > 0) return CATEGORIES.OTHER_CREDIT;
    }
    
    return CATEGORIES.UNCATEGORIZED;
}


/**
 * Update all results displays
 */
function updateResults() {
    generateSummary();
    displayDetailedRecords();
    setupFilters();
    
    document.getElementById('summaryCard').style.display = 'block';
    document.getElementById('detailedCard').style.display = 'block';
}

/**
 * Generate summary table - excludes uncategorized and total outflow
 */
function generateSummary() {
    const summary = {};
    Object.values(CATEGORIES).forEach(cat => summary[cat] = 0);
    
    let totalInflow = 0;
    let categorizedCount = 0;
    
    categorizedData.forEach(record => {
        const category = record.category;
        const debit = parseFloat((record.debit || '0').toString().replace(/[₹,\s]/g, '')) || 0;
        const credit = parseFloat((record.credit || '0').toString().replace(/[₹,\s]/g, '')) || 0;
        
        let amount = 0;
        if (category === CATEGORIES.PAYIN || category === CATEGORIES.OTHER_CREDIT) {
            amount = credit > 0 ? credit : debit;
            totalInflow += amount;
        } else if (category !== CATEGORIES.UNCATEGORIZED) {
            amount = debit > 0 ? debit : credit;
        }
        
        summary[category] += amount;
        if (category !== CATEGORIES.UNCATEGORIZED) categorizedCount++;
    });
    
    // Update summary table - EXCLUDE UNCATEGORIZED
    const summaryTable = document.getElementById('summaryTable');
    summaryTable.innerHTML = '';
    
    Object.entries(summary).forEach(([category, amount]) => {
        // Skip uncategorized entries and only show categories with amounts > 0
        if (amount > 0 && category !== CATEGORIES.UNCATEGORIZED) {
            const row = summaryTable.insertRow();
            const isCredit = category === CATEGORIES.PAYIN || category === CATEGORIES.OTHER_CREDIT;
            row.innerHTML = `
                <td><strong>${category}</strong></td>
                <td class="text-end ${isCredit ? 'text-success' : 'text-danger'}">
                    <strong>₹${formatNumber(amount)}</strong>
                </td>
            `;
        }
    });
    
    // Update statistics - ONLY TOTAL INFLOW AND CATEGORIZED COUNT
    document.getElementById('totalInflow').textContent = `₹${formatNumber(totalInflow)}`;
    document.getElementById('categorizedCount').textContent = categorizedCount;
}

/**
 * Display detailed records table
 */
function displayDetailedRecords() {
    const tbody = document.getElementById('detailedTable');
    tbody.innerHTML = '';
    
    filteredData.forEach(record => {
        const row = tbody.insertRow();
        const categoryColor = getCategoryColor(record.category);
        
        row.innerHTML = `
            <td>${record.serialNumber}</td>
            <td>${record.posting_date || '-'}</td>
            <td style="max-width: 200px;" class="text-truncate" title="${record.particulars}">
                ${record.particulars || '-'}
            </td>
            <td>${record.voucher_type || '-'}</td>
            <td class="text-end ${parseFloat(record.debit || 0) > 0 ? 'text-danger' : ''}">
                ${record.debit && parseFloat(record.debit) > 0 ? '₹' + formatNumber(parseFloat(record.debit)) : '-'}
            </td>
            <td class="text-end ${parseFloat(record.credit || 0) > 0 ? 'text-success' : ''}">
                ${record.credit && parseFloat(record.credit) > 0 ? '₹' + formatNumber(parseFloat(record.credit)) : '-'}
            </td>
            <td>
                <span class="badge ${categoryColor}">${record.category}</span>
            </td>
            <td>
                <button class="btn btn-outline-secondary btn-sm" onclick="viewRecord(${record.serialNumber})" title="View">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;
    });
    
    document.getElementById('recordsBadge').textContent = `${filteredData.length} records`;
}

/**
 * Get appropriate badge color for category
 */
function getCategoryColor(category) {
    const colors = {
        [CATEGORIES.PAYIN]: 'bg-success',
        [CATEGORIES.PAYOUT]: 'bg-danger',
        [CATEGORIES.DP_CHARGES]: 'bg-warning text-dark',
        [CATEGORIES.AMC_CHARGES]: 'bg-info',
        [CATEGORIES.MODIFICATION_CHARGES]: 'bg-secondary',
        [CATEGORIES.SECONDARY_ORDER]: 'bg-primary',
        [CATEGORIES.DELAYED_PAYMENT]: 'bg-dark',
        [CATEGORIES.GATEWAY_CHARGES]: 'bg-info',
        [CATEGORIES.OTHER_CREDIT]: 'bg-success',
        [CATEGORIES.OTHER_DEBIT]: 'bg-danger',
        [CATEGORIES.UNCATEGORIZED]: 'bg-warning text-dark'
    };
    return colors[category] || 'bg-secondary';
}

/**
 * Setup filter dropdowns
 */
function setupFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    const categories = [...new Set(categorizedData.map(r => r.category))];
    categories.sort().forEach(category => {
        categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
    });
}

/**
 * Apply filters to the data
 */
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const searchText = document.getElementById('searchBox').value.toLowerCase();
    const dateFilter = document.getElementById('dateFilter').value;
    
    filteredData = categorizedData.filter(record => {
        if (categoryFilter && record.category !== categoryFilter) return false;
        if (searchText && !record.particulars.toLowerCase().includes(searchText)) return false;
        if (dateFilter && record.posting_date !== dateFilter) return false;
        return true;
    });
    
    displayDetailedRecords();
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('searchBox').value = '';
    document.getElementById('dateFilter').value = '';
    filteredData = [...categorizedData];
    displayDetailedRecords();
}

/**
 * Clear all data
 */
function clearData() {
    csvData = [];
    categorizedData = [];
    filteredData = [];
    
    document.getElementById('csvFileInput').value = '';
    document.getElementById('summaryCard').style.display = 'none';
    document.getElementById('detailedCard').style.display = 'none';
    document.getElementById('exportBtn').disabled = true;
}

/**
 * Reset all data with confirmation
 */
function resetLedgerRecon() {
    if (confirm('Reset all data?')) {
        clearData();
    }
}

/**
 * Export only summary report (not full transactions)
 */
function exportResults() {
    if (categorizedData.length === 0) {
        alert('No data to export. Please process a CSV file first.');
        return;
    }
    
    // Generate summary data (excluding uncategorized)
    const summary = {};
    Object.values(CATEGORIES).forEach(cat => summary[cat] = 0);
    
    let totalInflow = 0;
    
    categorizedData.forEach(record => {
        const category = record.category;
        const debit = parseFloat((record.debit || '0').toString().replace(/[₹,\s]/g, '')) || 0;
        const credit = parseFloat((record.credit || '0').toString().replace(/[₹,\s]/g, '')) || 0;
        
        let amount = 0;
        if (category === CATEGORIES.PAYIN || category === CATEGORIES.OTHER_CREDIT) {
            amount = credit > 0 ? credit : debit;
            totalInflow += amount;
        } else if (category !== CATEGORIES.UNCATEGORIZED) {
            amount = debit > 0 ? debit : credit;
        }
        
        summary[category] += amount;
    });
    
    // Create CSV content for summary only
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Category,Amount\n";
    
    // Add summary rows (excluding uncategorized and zero amounts)
    Object.entries(summary).forEach(([category, amount]) => {
        if (amount > 0 && category !== CATEGORIES.UNCATEGORIZED) {
            csvContent += `"${category}",${amount.toFixed(2)}\n`;
        }
    });
    
    // Add total inflow row
    csvContent += `"Total Inflow",${totalInflow.toFixed(2)}\n`;
    
    // Download the summary file
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `ledger_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    
    console.log('Summary export completed successfully');
}

/**
 * View individual record details
 */
function viewRecord(serialNumber) {
    const record = categorizedData.find(r => r.serialNumber === serialNumber);
    if (record) {
        alert(`Record Details:\n\nDate: ${record.posting_date}\nParticulars: ${record.particulars}\nVoucher: ${record.voucher_type}\nDebit: ${record.debit || 'N/A'}\nCredit: ${record.credit || 'N/A'}\nCategory: ${record.category}`);
    }
}

/**
 * Format numbers with Indian number system
 */
function formatNumber(num) {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

/**
 * Keyboard shortcuts handler
 */
document.addEventListener('keydown', function(event) {
    // Only trigger if ledger section is active
    const ledgerSection = document.getElementById('ledgerrecon-section');
    if (!ledgerSection || ledgerSection.style.display === 'none') return;
    
    if (event.ctrlKey) {
        switch(event.key.toLowerCase()) {
            case 'u':
                event.preventDefault();
                document.getElementById('csvFileInput').click();
                break;
            case 'p':
                event.preventDefault();
                processCsv();
                break;
            case 'e':
                event.preventDefault();
                if (!document.getElementById('exportBtn').disabled) {
                    exportResults();
                }
                break;
            case 'r':
                event.preventDefault();
                resetLedgerRecon();
                break;
        }
    }
});

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Ledger Reconciliation Tool initialized');
});
