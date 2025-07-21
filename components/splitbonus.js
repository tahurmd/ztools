let currentHoldings = 0;
let splitMultiplier = 1;
let bonusShares = 0;

// Toggle action input cards
function toggleActionInputs() {
    const splitChecked = document.getElementById('splitAction').checked;
    const bonusChecked = document.getElementById('bonusAction').checked;
    
    document.getElementById('splitRatioCard').style.display = splitChecked ? 'block' : 'none';
    document.getElementById('bonusRatioCard').style.display = bonusChecked ? 'block' : 'none';
    
    // Show/hide result section
    if (splitChecked || bonusChecked) {
        calculateSplitBonus();
    } else {
        document.getElementById('resultSection').style.display = 'none';
        document.getElementById('tradesBreakdown').style.display = 'none';
    }
}

// Calculate split and bonus
function calculateSplitBonus() {
    const currentQty = parseInt(document.getElementById('currentQty').value) || 0;
    const currentPrice = parseFloat(document.getElementById('currentPrice').value) || 0;
    const splitChecked = document.getElementById('splitAction').checked;
    const bonusChecked = document.getElementById('bonusAction').checked;

    if (currentQty === 0 || currentPrice === 0 || (!splitChecked && !bonusChecked)) {
        document.getElementById('resultSection').style.display = 'none';
        document.getElementById('tradesBreakdown').style.display = 'none';
        return;
    }

    currentHoldings = currentQty;
    let baseInvestment = currentQty * currentPrice; // Total invested
    let finalQty = currentQty;
    let addedShares = 0;
    let calculationSteps = [];
    let actionSummary = [];
    let perSharePrice = currentPrice;

    // Calculate split if selected
    if (splitChecked) {
        const splitNew = parseInt(document.getElementById('splitRatioNew').value) || 1;
        const splitOld = parseInt(document.getElementById('splitRatioOld').value) || 1;
        if (splitNew > 0 && splitOld > 0) {
            splitMultiplier = splitNew / splitOld;
            const splitResult = Math.floor(currentQty * splitMultiplier);
            const splitAdded = splitResult - currentQty;

            finalQty = splitResult;
            addedShares += splitAdded;

            // Update price after split
            perSharePrice = baseInvestment / finalQty;

            calculationSteps.push(`<strong>Step 1 - Split:</strong> ${currentQty} × (${splitNew}/${splitOld}) = ${splitResult} shares`);
            actionSummary.push(`<span class="badge bg-primary me-2">Split ${splitNew}:${splitOld}</span>Added ${splitAdded} shares`);
        }
    }

    // Calculate bonus if selected
    if (bonusChecked) {
        const bonusFree = parseInt(document.getElementById('bonusRatioFree').value) || 0;
        const bonusHeld = parseInt(document.getElementById('bonusRatioHeld').value) || 1;
        if (bonusFree > 0 && bonusHeld > 0) {
            const baseQty = finalQty; // after split
            bonusShares = Math.floor((baseQty * bonusFree) / bonusHeld);

            finalQty += bonusShares;
            addedShares += bonusShares;

            // Price does not change, just gets allocated to more shares
            perSharePrice = baseInvestment / finalQty;

            const stepNumber = calculationSteps.length + 1;
            calculationSteps.push(`<strong>Step ${stepNumber} - Bonus:</strong> ${baseQty} × (${bonusFree}/${bonusHeld}) = ${bonusShares} bonus shares`);
            actionSummary.push(`<span class="badge bg-success me-2">Bonus ${bonusFree}:${bonusHeld}</span>Added ${bonusShares} shares`);
        }
    }

    // Calculate percentage increase and multiplier
    const increasePercent = currentQty > 0 ? ((finalQty - currentQty) / currentQty * 100) : 0;
    const multiplier = currentQty > 0 ? (finalQty / currentQty) : 1;

    // Update result cards
    document.getElementById('finalQuantity').textContent = finalQty;
    document.getElementById('addedShares').textContent = addedShares;
    document.getElementById('increasePercent').textContent = increasePercent.toFixed(1) + '%';
    document.getElementById('multiplier').textContent = multiplier.toFixed(2) + 'x';
    document.getElementById('finalPrice').textContent = perSharePrice.toFixed(2);

    // Show results
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('tradesBreakdown').style.display = 'block';

    // Update trades breakdown
    updateTradesBreakdownWithPrice(currentQty, currentPrice, finalQty, perSharePrice, addedShares, splitChecked, bonusChecked);

    // Update calculation details
    document.getElementById('calculationDetails').innerHTML = calculationSteps.join('<br>');
    document.getElementById('actionSummary').innerHTML = actionSummary.join('<br>');
}


// Update trades breakdown table
function updateTradesBreakdownWithPrice(currentQty, currentPrice, finalQty, finalPrice, addedShares, hasSplit, hasBonus) {
    const tbody = document.getElementById('tradesBreakdownBody');
    tbody.innerHTML = '';
    let tradeCounter = 1;
    // Original purchase trade
    const originalTrade = document.createElement('tr');
    originalTrade.innerHTML = `
        <td><span class="badge bg-secondary">${tradeCounter++}</span></td>
        <td><i class="bi bi-cart-plus me-2 text-primary"></i>Original Purchase</td>
        <td><span class="fw-bold">${currentQty}</span> @ <span class="text-primary">₹${Number(currentPrice).toFixed(2)}</span></td>
        <td><span class="badge bg-light text-dark">HELD</span></td>
        <td class="text-muted">Shares purchased by user</td>
    `;
    tbody.appendChild(originalTrade);

    if (hasSplit) {
        const splitNew = parseInt(document.getElementById('splitRatioNew').value) || 1;
        const splitOld = parseInt(document.getElementById('splitRatioOld').value) || 1;
        const splitAdded = Math.floor(currentQty * (splitNew / splitOld)) - currentQty;
        const splitQty = Math.floor(currentQty * (splitNew / splitOld));

        const splitTrade = document.createElement('tr');
        splitTrade.className = 'table-info';
        splitTrade.innerHTML = `
            <td><span class="badge bg-primary">${tradeCounter++}</span></td>
            <td><i class="bi bi-scissors me-2 text-primary"></i>Stock Split</td>
            <td><span class="fw-bold text-primary">+${splitAdded}</span></td>
            <td><span class="badge bg-primary">SPLIT ${splitNew}:${splitOld}</span></td>
            <td class="text-muted">Free shares from split (new total: ${splitQty})</td>
        `;
        tbody.appendChild(splitTrade);
    }

    if (hasBonus && bonusShares > 0) {
        const bonusFree = parseInt(document.getElementById('bonusRatioFree').value) || 0;
        const bonusHeld = parseInt(document.getElementById('bonusRatioHeld').value) || 1;
        const baseQty = hasSplit ? Math.floor(currentQty * (parseInt(document.getElementById('splitRatioNew').value) / (parseInt(document.getElementById('splitRatioOld').value) || 1)) ) : currentQty;

        const bonusTrade = document.createElement('tr');
        bonusTrade.className = 'table-success';
        bonusTrade.innerHTML = `
            <td><span class="badge bg-success">${tradeCounter++}</span></td>
            <td><i class="bi bi-gift me-2 text-success"></i>Bonus Issue</td>
            <td><span class="fw-bold text-success">+${bonusShares}</span></td>
            <td><span class="badge bg-success">BONUS ${bonusFree}:${bonusHeld}</span></td>
            <td class="text-muted">Free shares from bonus (base: ${baseQty})</td>
        `;
        tbody.appendChild(bonusTrade);
    }

    // Final holdings row (show price)
    const finalTrade = document.createElement('tr');
    finalTrade.className = 'table-warning';
    finalTrade.innerHTML = `
        <td><span class="badge bg-warning text-dark">★</span></td>
        <td><i class="bi bi-star me-2 text-warning"></i><strong>Final Holdings</strong></td>
        <td><span class="fw-bold fs-5 text-warning">${finalQty}</span> @ <span class="text-info">₹${Number(finalPrice).toFixed(2)}</span></td>
        <td><span class="badge bg-warning text-dark">TOTAL</span></td>
        <td class="text-muted"><strong>Final quantity and per share price</strong></td>
    `;
    tbody.appendChild(finalTrade);
}


// Reset calculator
function resetSplitCalculator() {
    if (confirm('Are you sure you want to reset the calculator?')) {
        // Reset checkboxes
        document.getElementById('splitAction').checked = false;
        document.getElementById('bonusAction').checked = false;
        
        // Reset inputs
        document.getElementById('currentQty').value = '';
        document.getElementById('splitRatioNew').value = '';
        document.getElementById('splitRatioOld').value = '';
        document.getElementById('bonusRatioFree').value = '';
        document.getElementById('bonusRatioHeld').value = '';

        document.getElementById('increasePercent').value = '0';
        document.getElementById('multiplier').value = '1.00x';
        
        // Hide cards
        document.getElementById('splitRatioCard').style.display = 'none';
        document.getElementById('bonusRatioCard').style.display = 'none';
        document.getElementById('resultSection').style.display = 'none';
        document.getElementById('tradesBreakdown').style.display = 'none';
        
        // Reset variables
        currentHoldings = 0;
        splitMultiplier = 1;
        bonusShares = 0;
    }
}

// Load sample data for demonstration
function loadSampleSplitData() {
    // Select both actions
    document.getElementById('splitAction').checked = true;
    document.getElementById('bonusAction').checked = true;
    
    // Set sample values
    document.getElementById('currentQty').value = 100;
    document.getElementById('splitRatioNew').value = 2;
    document.getElementById('splitRatioOld').value = 1;
    document.getElementById('bonusRatioFree').value = 1;
    document.getElementById('bonusRatioHeld').value = 3;
    
    // Show input cards
    toggleActionInputs();
    
    // Calculate
    calculateSplitBonus();
}

// Add keyboard shortcuts for split calculator
document.addEventListener('keydown', function(e) {
    // Only work when products section is visible
    if (document.getElementById('products-section').style.display === 'none') return;
    
    // Ctrl+L to load sample data
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        loadSampleSplitData();
    }
    
    // Ctrl+R to reset calculator
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetSplitCalculator();
    }
});


//////
// Stock Split Calculator Variables
