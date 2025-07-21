// Store a fresh, empty marginData every calculation
function getFreshMarginData() {
    return {
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
    }
}

let marginData = getFreshMarginData();

function calculatePenalty() {
    // Always start with a fresh data object so we never use stale data
    marginData = getFreshMarginData();

    // Always reset all sections for every new calculation attempt
    hideAllSections();

    // Read inputs
    const requiredMargin   = parseFloat(document.getElementById('requiredMargin').value) || 0;
    const availableMargin  = parseFloat(document.getElementById('availableMargin').value) || 0;
    const isConsecutiveShortfall = document.getElementById('consecutiveDaysCheck').checked;

    if (requiredMargin <= 0) {
        // Nothing to compute, exit
        return;
    }

    // Main shortfall logic
    const shortfall = Math.max(0, requiredMargin - availableMargin);

    if (shortfall <= 0) {
        // Show user a non-intrusive success panel; keep the rest of the UI
        showNoShortfallMessage(requiredMargin, availableMargin);
        return;
    }

    // Populate margin data for calculation
    marginData.requiredMargin      = requiredMargin;
    marginData.availableMargin     = availableMargin;
    marginData.shortfall           = shortfall;
    marginData.shortfallPercentage = (shortfall / requiredMargin) * 100;
    marginData.isConsecutiveShortfall = isConsecutiveShortfall;

    // Do the calculations & show output
    calculateBasePenalty();
    calculateAdditionalPenalties();
    calculateGST();
    displayShortfallSummary();
    displayPenaltyBreakdown();
    updatePenaltySummary();

    // Show those sections
    document.getElementById('shortfallSection').style.display = 'block';
    document.getElementById('penaltySection').style.display = 'block';
}

// Helper to hide all result/summary sections at the start of every calculation
function hideAllSections() {
    document.getElementById('shortfallSection').style.display = 'none';
    document.getElementById('penaltySection').style.display = 'none';
    // Restore default output (if your .innerHTML is swapped by showNoShortfallMessage)
    const container = document.getElementById('shortfallSection');
    if (container.dataset.originalContent) {
        container.innerHTML = container.dataset.originalContent;
    }
}

// Show a success message only, don't overwrite the whole markup structure!
function showNoShortfallMessage(requiredMargin, availableMargin) {
    // Only display a message inside the default UI
    document.getElementById('shortfallSection').style.display = 'block';
    document.getElementById('penaltySection').style.display = 'none';
    let msgBox = document.getElementById('noShortfallMsg');
    if (!msgBox) {
        msgBox = document.createElement('div');
        msgBox.id = 'noShortfallMsg';
        msgBox.innerHTML = `
            <div class="alert alert-success my-4 text-center">
                <i class="bi bi-check-circle me-2"></i>
                <b>No Margin Shortfall</b> <br>
                Your available margin (<span class="fw-bold">₹${formatCurrency(availableMargin)}</span>) 
                meets or exceeds the required margin (<span class="fw-bold">₹${formatCurrency(requiredMargin)}</span>).
                No penalty applicable.
            </div>
        `;
        let section = document.getElementById('shortfallSection');
        section.innerHTML = '';
        section.appendChild(msgBox);
    } else {
        msgBox.style.display = 'block';
    }
}

// All your other calculation functions (no logic change)
function calculateBasePenalty() {
    const shortfall = marginData.shortfall;
    const shortfallPercentage = marginData.shortfallPercentage;

    marginData.basePenaltyRate = (shortfall < 100000 && shortfallPercentage < 10) ? 0.5 : 1.0;
    marginData.basePenalty = (shortfall * marginData.basePenaltyRate) / 100;
}
function calculateAdditionalPenalties() {
    let additionalPenalty = 0;
    if (marginData.isConsecutiveShortfall) {
        additionalPenalty += (marginData.shortfall * 5 / 100);
    }
    marginData.additionalPenalty = additionalPenalty;
    marginData.totalPenalty = marginData.basePenalty + additionalPenalty;
}
function calculateGST() {
    marginData.gst = marginData.totalPenalty * 0.18;
    marginData.finalAmount = marginData.totalPenalty + marginData.gst;
}
function displayShortfallSummary() {
    document.getElementById('shortfallAmount').textContent = formatCurrency(marginData.shortfall);
    document.getElementById('shortfallPercentage').textContent = marginData.shortfallPercentage.toFixed(2);

    // Update the consecutive indicator if applicable
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
function displayPenaltyBreakdown() {
    const tbody = document.getElementById('penaltyBreakdown');
    tbody.innerHTML = '';
    addBreakdownRow(tbody, 'Required Margin', `₹${formatCurrency(marginData.requiredMargin)}`, 'text-primary');
    addBreakdownRow(tbody, 'Available Margin', `₹${formatCurrency(marginData.availableMargin)}`, 'text-success');
    addBreakdownRow(tbody, 'Shortfall Amount', `₹${formatCurrency(marginData.shortfall)}`, 'text-danger fw-bold');
    tbody.innerHTML += '<tr><td colspan="2"><hr class="my-2"></td></tr>';
    const penaltyReason = (marginData.shortfall < 100000 && marginData.shortfallPercentage < 10)
        ? 'Shortfall < ₹1 lakh AND < 10% of margin'
        : 'Shortfall ≥ ₹1 lakh OR ≥ 10% of margin';
    addBreakdownRow(tbody, 'Base Penalty Rate', `${marginData.basePenaltyRate}%`, 'text-warning');
    addBreakdownRow(tbody, 'Penalty Criteria', penaltyReason, 'text-muted small');
    addBreakdownRow(tbody, 'Base Penalty Amount', `₹${formatCurrency(marginData.basePenalty)}`, 'text-warning');
    if (marginData.isConsecutiveShortfall) {
        const consecutivePenalty = (marginData.shortfall * 5 / 100);
        addBreakdownRow(tbody, 'Consecutive Days Penalty (> 3 days @ 5%)', `₹${formatCurrency(consecutivePenalty)}`, 'text-danger');
    }
    tbody.innerHTML += '<tr><td colspan="2"><hr class="my-2"></td></tr>';
    addBreakdownRow(tbody, 'Total Penalty (Before GST)', `₹${formatCurrency(marginData.totalPenalty)}`, 'text-danger fw-bold');
    addBreakdownRow(tbody, 'GST (18%)', `₹${formatCurrency(marginData.gst)}`, 'text-info');
    addBreakdownRow(tbody, 'Final Amount Payable', `₹${formatCurrency(marginData.finalAmount)}`, 'text-danger fw-bold fs-5');
}
function addBreakdownRow(tbody, label, value, className = '') {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="fw-bold">${label}:</td>
        <td class="text-end ${className}">${value}</td>
    `;
    tbody.appendChild(row);
}
function updatePenaltySummary() {
    document.getElementById('basePenalty').textContent = formatCurrency(marginData.totalPenalty);
    document.getElementById('gstAmount').textContent = formatCurrency(marginData.gst);
    document.getElementById('finalPenalty').textContent = formatCurrency(marginData.finalAmount);
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN').format((+amount).toFixed(2));
}

function resetMarginCalculator() {
    if (confirm('Are you sure you want to reset the calculator?')) {
        document.getElementById('requiredMargin').value = '';
        document.getElementById('availableMargin').value = '';
        document.getElementById('consecutiveDaysCheck').checked = false;
        hideAllSections();
        marginData = getFreshMarginData();
    }
}
function loadSampleMarginData() {
    document.getElementById('requiredMargin').value = '500000';
    document.getElementById('availableMargin').value = '400000';
    document.getElementById('consecutiveDaysCheck').checked = true;
    calculatePenalty();
}
document.addEventListener('keydown', function(e) {
    if (document.getElementById('reports-section').style.display === 'none') return;
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        loadSampleMarginData();
    }
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetMarginCalculator();
    }
});

// Optional: Store default markup to restore after "no shortfall" message
document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById('shortfallSection');
    if (sec && !sec.dataset.originalContent) {
        sec.dataset.originalContent = sec.innerHTML;
    }
});
