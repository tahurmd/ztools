// Ledger Recon Variables
let ledgerData = [];

// Handle ledger file upload
function handleLedgerUpload() {
    const fileInput = document.getElementById('ledgerFile');
    const statusDiv = document.getElementById('ledgerUploadStatus');
    const file = fileInput.files[0];

    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        statusDiv.innerHTML = `<span class="text-info"><i class="bi bi-hourglass-split me-1"></i>Processing ${file.name}...</span>`;
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            trimHeaders: true,
            complete: function(results) {
                console.log('Raw CSV data:', results.data); // Debug log
                
                if (results.errors.length > 0) {
                    console.warn('CSV parsing warnings:', results.errors);
                }
                
                // Filter out opening/closing balance entries
                ledgerData = results.data.filter(row => {
                    const particulars = row.particulars?.trim() || '';
                    return particulars !== '' && 
                           particulars !== 'Opening Balance' && 
                           particulars !== 'Closing Balance';
                });
                
                console.log('Filtered ledger data:', ledgerData); // Debug log
                
                statusDiv.innerHTML = `<span class="text-success"><i class="bi bi-check-circle me-1"></i>${file.name} processed successfully (${ledgerData.length} transactions)</span>`;
                
                // Call the analysis function
                analyzeLedgerData();
            },
            error: function(error) {
                statusDiv.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Error: ${error.message}</span>`;
                console.error('Papa Parse Error:', error);
            }
        });
    } else {
        statusDiv.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Please select a valid CSV file</span>`;
    }
}

// Get transaction category based on voucher type and particulars - FIXED
function getTransactionCategory(particulars, voucherType) {
    if (voucherType === 'Bank Receipts') return 'payin';
    if (voucherType === 'Bank Payments') return 'payout';
    
    if (voucherType === 'Journal Entry') {
        const text = particulars.toLowerCase().trim();
        
        // EXCLUDE all Net settlement entries - FIXED to handle any format
        if (text.startsWith('net settlement')) {
            return 'excluded'; // Mark for exclusion
        }
        
        // DP Charges - matches various formats
        if (text.includes('dp charges') || text.includes('dp charge')) {
            return 'dpCharges';
        }
        
        // AMC Charges - matches various formats  
        if (text.includes('amc for demat') || text.includes('amc charges') || text.includes('annual maintenance')) {
            return 'amcCharges';
        }
        
        // Delayed Payment Charges - matches various formats
        if (text.includes('delayed payment') || text.includes('delay charges') || text.includes('delayed charges')) {
            return 'delayCharges';
        }
        
        // All other journal entries (excluding net settlement)
        return 'otherJournal';
    }
    
    return 'otherJournal';
}

// Analyze ledger data and categorize transactions
function analyzeLedgerData() {
    console.log('Starting analysis...'); // Debug log
    
    const categories = {
        payin: [],
        payout: [],
        dpCharges: [],
        amcCharges: [],
        delayCharges: [],
        otherJournal: []
    };

    let totals = {
        payin: 0,
        payout: 0,
        dpCharges: 0,
        amcCharges: 0,
        delayCharges: 0,
        otherJournal: 0
    };

    let excludedCount = 0; // Track excluded entries
    let netSettlementExcluded = []; // Track what was excluded for debugging

    ledgerData.forEach((row, index) => {
        const voucherType = row.voucher_type?.trim() || '';
        const particulars = row.particulars?.trim() || '';
        const debit = parseFloat(row.debit) || 0;
        const credit = parseFloat(row.credit) || 0;
        const date = row.posting_date?.trim() || '';

        const category = getTransactionCategory(particulars, voucherType);
        console.log(`Row ${index} - "${particulars}" categorized as: ${category}`); // Debug log
        
        // Skip excluded entries (Net settlement)
        if (category === 'excluded') {
            excludedCount++;
            netSettlementExcluded.push(particulars);
            console.log(`Row ${index} EXCLUDED: ${particulars}`);
            return; // Skip this transaction
        }
        
        const transaction = {
            date: date,
            particulars: particulars,
            amount: category === 'payin' ? credit : debit,
            voucherType: voucherType
        };

        categories[category].push(transaction);
        totals[category] += transaction.amount;
    });

    console.log('Final categories:', categories); // Debug log
    console.log('Final totals:', totals); // Debug log
    console.log(`Excluded ${excludedCount} "Net settlement" entries:`); // Debug log
    console.log('Excluded entries:', netSettlementExcluded); // Debug log

    // Update summary cards
    updateSummaryCards(totals);
    
    // Populate tables
    populateTables(categories);
    
    // Show results
    document.getElementById('summaryCards').style.display = 'block';
    document.getElementById('detailedSections').style.display = 'block';
}

// Update summary cards
function updateSummaryCards(totals) {
    document.getElementById('totalPayin').textContent = `₹${formatAmount(totals.payin)}`;
    document.getElementById('totalPayout').textContent = `₹${formatAmount(totals.payout)}`;
    document.getElementById('totalDpCharges').textContent = `₹${formatAmount(totals.dpCharges)}`;
    document.getElementById('totalAmcCharges').textContent = `₹${formatAmount(totals.amcCharges)}`;
    document.getElementById('totalDelayCharges').textContent = `₹${formatAmount(totals.delayCharges)}`;
    document.getElementById('totalOtherJournal').textContent = `₹${formatAmount(totals.otherJournal)}`;
}

// Populate all tables
function populateTables(categories) {
    populateTable('payinTableBody', 'payinCount', categories.payin);
    populateTable('payoutTableBody', 'payoutCount', categories.payout);
    populateTable('dpChargesTableBody', 'dpChargesCount', categories.dpCharges);
    populateTable('amcChargesTableBody', 'amcChargesCount', categories.amcCharges);
    populateTable('delayChargesTableBody', 'delayChargesCount', categories.delayCharges);
    populateTable('otherJournalTableBody', 'otherJournalCount', categories.otherJournal);
}

// Populate individual table
function populateTable(tableBodyId, countId, data) {
    const tbody = document.getElementById(tableBodyId);
    const countElement = document.getElementById(countId);
    
    if (!tbody || !countElement) {
        console.error(`Elements not found: ${tableBodyId} or ${countId}`);
        return;
    }
    
    tbody.innerHTML = '';
    countElement.textContent = data.length;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No transactions found</td></tr>';
        return;
    }
    
    // Sort by date (newest first)
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(item.date)}</td>
            <td><small>${escapeHtml(item.particulars)}</small></td>
            <td class="text-end fw-bold">₹${formatAmount(item.amount)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Format amount for display
function formatAmount(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return dateStr;
    }
}

// Escape HTML for security
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Reset function
function resetLedgerRecon() {
    if (confirm('Are you sure you want to reset the ledger analysis?')) {
        ledgerData = [];
        document.getElementById('ledgerFile').value = '';
        document.getElementById('ledgerUploadStatus').textContent = 'Select a CSV file to analyze';
        document.getElementById('summaryCards').style.display = 'none';
        document.getElementById('detailedSections').style.display = 'none';
    }
}

// Initialize ledger recon
function ledgerReconInit() {
    console.log('Ledger Recon initialized');
}

// Export summary function
function exportLedgerSummary() {
    if (ledgerData.length === 0) {
        alert('No data to export. Please upload a CSV file first.');
        return;
    }
    
    // Create summary data for export
    const summaryData = [
        ['Category', 'Count', 'Total Amount'],
        ['PAYIN (Bank Receipts)', document.getElementById('payinCount').textContent, document.getElementById('totalPayin').textContent],
        ['PAYOUT (Bank Payments)', document.getElementById('payoutCount').textContent, document.getElementById('totalPayout').textContent],
        ['DP Charges', document.getElementById('dpChargesCount').textContent, document.getElementById('totalDpCharges').textContent],
        ['AMC Charges', document.getElementById('amcChargesCount').textContent, document.getElementById('totalAmcCharges').textContent],
        ['Delayed Payment Charges', document.getElementById('delayChargesCount').textContent, document.getElementById('totalDelayCharges').textContent],
        ['Other Journal Entries', document.getElementById('otherJournalCount').textContent, document.getElementById('totalOtherJournal').textContent]
    ];
    
    const csvContent = Papa.unparse(summaryData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'ledger_recon_summary.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Make functions globally available
window.handleLedgerUpload = handleLedgerUpload;
window.resetLedgerRecon = resetLedgerRecon;
window.ledgerReconInit = ledgerReconInit;
window.exportLedgerSummary = exportLedgerSummary;

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (document.getElementById('ledgerrecon-section')?.style.display === 'none') return;
    
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportLedgerSummary();
    }
    
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetLedgerRecon();
    }
});
