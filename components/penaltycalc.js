let marginData = {
    requiredMargin: 0,
    availableMargin: 0,
    shortfall: 0,
    shortfallPercentage: 0,
    isConsecutiveShortfall: false,
    basePenaltyRate: 0,
    basePenalty: 0,
    additionalPenalty: 0,
    totalPenalty: 0,
    gst: 0,
    finalAmount: 0
};

// Calculate margin penalty
function calculatePenalty() {
    const requiredMargin = parseFloat(document.getElementById('requiredMargin').value) || 0;
    const availableMargin = parseFloat(document.getElementById('availableMargin').value) || 0;
    const isConsecutiveShortfall = document.getElementById('consecutiveDaysCheck').checked;
    
    // Reset sections
    document.getElementById('shortfallSection').style.display = 'none';
    document.getElementById('penaltySection').style.display = 'none';
    
    if (requiredMargin <= 0) {
        return;
    }
    
    // Calculate shortfall
    const shortfall = Math.max(0, requiredMargin - availableMargin);
    
    if (shortfall <= 0) {
        // No shortfall, no penalty
        showNoShortfallMessage();
        return;
    }
    
    // Update margin data
    marginData.requiredMargin = requiredMargin;
    marginData.availableMargin = availableMargin;
    marginData.shortfall = shortfall;
    marginData.shortfallPercentage = (shortfall / requiredMargin) * 100;
    marginData.isConsecutiveShortfall = isConsecutiveShortfall;
    
    // Calculate penalties
    calculateBasePenalty();
    calculateAdditionalPenalties();
    calculateGST();
    
    // Display results
    displayShortfallSummary();
    displayPenaltyBreakdown();
    updatePenaltySummary();
    
    document.getElementById('shortfallSection').style.display = 'block';
    document.getElementById('penaltySection').style.display = 'block';
}

// Calculate base penalty rate
function calculateBasePenalty() {
    const shortfall = marginData.shortfall;
    const shortfallPercentage = marginData.shortfallPercentage;
    
    // Determine base penalty rate
    if (shortfall < 100000 && shortfallPercentage < 10) {
        marginData.basePenaltyRate = 0.5; // 0.5%
    } else {
        marginData.basePenaltyRate = 1.0; // 1.0%
    }
    
    marginData.basePenalty = (shortfall * marginData.basePenaltyRate) / 100;
}

// Calculate additional penalties (only consecutive days checkbox)
function calculateAdditionalPenalties() {
    let additionalPenalty = 0;
    
    // Consecutive days penalty (checkbox checked)
    if (marginData.isConsecutiveShortfall) {
        additionalPenalty += (marginData.shortfall * 5 / 100);
    }
    
    marginData.additionalPenalty = additionalPenalty;
    marginData.totalPenalty = marginData.basePenalty + additionalPenalty;
}

// Calculate GST
function calculateGST() {
    marginData.gst = marginData.totalPenalty * 0.18; // 18% GST
    marginData.finalAmount = marginData.totalPenalty + marginData.gst;
}

// Display shortfall summary
function displayShortfallSummary() {
    document.getElementById('shortfallAmount').textContent = formatCurrency(marginData.shortfall);
    document.getElementById('shortfallPercentage').textContent = marginData.shortfallPercentage.toFixed(2);
    
    // Update consecutive indicator
    const consecutiveIndicator = document.getElementById('consecutiveIndicator');
    if (marginData.isConsecutiveShortfall) {
        consecutiveIndicator.innerHTML = `
            <i class="bi bi-calendar-x text-danger fs-3"></i>
            <h6 class="text-danger mt-2">Extended Penalty</h6>
            <small class="text-danger">> 3 Days</small>
        `;
    } else {
        consecutiveIndicator.innerHTML = `
            <i class="bi bi-calendar-check text-muted fs-3"></i>
            <h6 class="text-muted mt-2">No Extended Penalty</h6>
            <small class="text-muted">≤ 3 Days</small>
        `;
    }
}

// Display penalty breakdown
function displayPenaltyBreakdown() {
    const tbody = document.getElementById('penaltyBreakdown');
    tbody.innerHTML = '';
    
    // Required vs Available margin
    addBreakdownRow(tbody, 'Required Margin', `₹${formatCurrency(marginData.requiredMargin)}`, 'text-primary');
    addBreakdownRow(tbody, 'Available Margin', `₹${formatCurrency(marginData.availableMargin)}`, 'text-success');
    addBreakdownRow(tbody, 'Shortfall Amount', `₹${formatCurrency(marginData.shortfall)}`, 'text-danger fw-bold');
    
    tbody.innerHTML += '<tr><td colspan="2"><hr class="my-2"></td></tr>';
    
    // Penalty calculation details
    const penaltyReason = marginData.shortfall < 100000 && marginData.shortfallPercentage < 10 
        ? 'Shortfall < ₹1 lakh AND < 10% of margin' 
        : 'Shortfall ≥ ₹1 lakh OR ≥ 10% of margin';
    
    addBreakdownRow(tbody, 'Base Penalty Rate', `${marginData.basePenaltyRate}%`, 'text-warning');
    addBreakdownRow(tbody, 'Penalty Criteria', penaltyReason, 'text-muted small');
    addBreakdownRow(tbody, 'Base Penalty Amount', `₹${formatCurrency(marginData.basePenalty)}`, 'text-warning');
    
    // Additional penalties (consecutive days checkbox)
    if (marginData.isConsecutiveShortfall) {
        const consecutivePenalty = (marginData.shortfall * 5 / 100);
        addBreakdownRow(tbody, 'Consecutive Days Penalty (> 3 days @ 5%)', `₹${formatCurrency(consecutivePenalty)}`, 'text-danger');
    }
    
    tbody.innerHTML += '<tr><td colspan="2"><hr class="my-2"></td></tr>';
    
    // Totals
    addBreakdownRow(tbody, 'Total Penalty (Before GST)', `₹${formatCurrency(marginData.totalPenalty)}`, 'text-danger fw-bold');
    addBreakdownRow(tbody, 'GST (18%)', `₹${formatCurrency(marginData.gst)}`, 'text-info');
    addBreakdownRow(tbody, 'Final Amount Payable', `₹${formatCurrency(marginData.finalAmount)}`, 'text-danger fw-bold fs-5');
}

// Add breakdown row helper
function addBreakdownRow(tbody, label, value, className = '') {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="fw-bold">${label}:</td>
        <td class="text-end ${className}">${value}</td>
    `;
    tbody.appendChild(row);
}

// Update penalty summary cards
function updatePenaltySummary() {
    document.getElementById('basePenalty').textContent = formatCurrency(marginData.totalPenalty);
    document.getElementById('gstAmount').textContent = formatCurrency(marginData.gst);
    document.getElementById('finalPenalty').textContent = formatCurrency(marginData.finalAmount);
}

// Show no shortfall message
function showNoShortfallMessage() {
    const shortfallSection = document.getElementById('shortfallSection');
    shortfallSection.innerHTML = `
        <div class="col-12">
            <div class="alert alert-success">
                <h6 class="alert-heading">
                    <i class="bi bi-check-circle me-2"></i>No Margin Shortfall
                </h6>
                <p class="mb-0">Your available margin (₹${formatCurrency(parseFloat(document.getElementById('availableMargin').value) || 0)}) meets or exceeds the required margin (₹${formatCurrency(parseFloat(document.getElementById('requiredMargin').value) || 0)}). No penalty applicable.</p>
            </div>
        </div>
    `;
    shortfallSection.style.display = 'block';
}

// Format currency helper
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN').format(amount.toFixed(2));
}

// Reset margin calculator
function resetMarginCalculator() {
    if (confirm('Are you sure you want to reset the calculator?')) {
        document.getElementById('requiredMargin').value = '';
        document.getElementById('availableMargin').value = '';
        document.getElementById('consecutiveDaysCheck').checked = false;
        
        document.getElementById('shortfallSection').style.display = 'none';
        document.getElementById('penaltySection').style.display = 'none';
        
        // Reset margin data
        marginData = {
            requiredMargin: 0,
            availableMargin: 0,
            shortfall: 0,
            shortfallPercentage: 0,
            isConsecutiveShortfall: false,
            basePenaltyRate: 0,
            basePenalty: 0,
            additionalPenalty: 0,
            totalPenalty: 0,
            gst: 0,
            finalAmount: 0
        };
    }
}

// Load sample data for testing
function loadSampleMarginData() {
    document.getElementById('requiredMargin').value = '500000';
    document.getElementById('availableMargin').value = '400000';
    document.getElementById('consecutiveDaysCheck').checked = true;
    calculatePenalty();
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (document.getElementById('reports-section').style.display === 'none') return;
    
    // Ctrl+L to load sample data
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        loadSampleMarginData();
    }
    
    // Ctrl+R to reset calculator
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetMarginCalculator();
    }
});
