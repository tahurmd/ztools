// Split & Bonus Pro Calculator Variables
let transactions = [];

// Add new transaction - FIXED to add only one entry
function addTransaction(type) {
    if (type === 'BUY') {
        transactions.push({type: 'BUY', qty: '', price: ''});
    } else if (type === 'SELL') {
        transactions.push({type: 'SELL', qty: '', price: ''});
    } else if (type === 'SPLIT') {
        transactions.push({type: 'SPLIT', ratioNew: 2, ratioOld: 1});
    } else if (type === 'BONUS') {
        transactions.push({type: 'BONUS', ratioFree: 1, ratioHeld: 4});
    }
    renderTransactions();
}

// Remove transaction
function removeTransaction(idx) {
    transactions.splice(idx, 1);
    renderTransactions();
}

// Update transaction field
function updateTransactionField(idx, field, value) {
    if (['qty', 'price', 'ratioNew', 'ratioOld', 'ratioFree', 'ratioHeld'].includes(field)) {
        transactions[idx][field] = Number(value) || '';
        renderTransactions();
    }
}

// Main render function
function renderTransactions() {
    let qty = 0, invested = 0, avg = 0;
    let totalBuy = 0, totalSell = 0, totalSplits = 0, totalBonus = 0;
    const rows = [];

    transactions.forEach((transaction, idx) => {
        let details = '';
        let qtyChange = 0;

        if (transaction.type === 'BUY') {
            if (transaction.qty && transaction.price) {
                invested += transaction.qty * transaction.price;
                qty += transaction.qty;
                totalBuy += transaction.qty;
                qtyChange = `+${transaction.qty}`;
                details = `Buy ${transaction.qty} shares @ ₹${transaction.price.toFixed(2)}`;
            } else {
                qtyChange = '+0';
                details = 'Buy transaction (enter qty & price)';
            }
        } 
        else if (transaction.type === 'SELL') {
            if (transaction.qty && qty > 0) {
                const sellQty = Math.min(transaction.qty, qty);
                invested -= sellQty * avg;
                qty -= sellQty;
                totalSell += sellQty;
                qtyChange = `-${sellQty}`;
                details = `Sell ${transaction.qty} shares @ ₹${transaction.price.toFixed(2)}`;
            } else {
                qtyChange = '-0';
                details = 'Sell transaction (enter qty & price)';
            }
        } 
        else if (transaction.type === 'SPLIT') {
            if (transaction.ratioNew && transaction.ratioOld && qty > 0) {
                const multiplier = transaction.ratioNew / transaction.ratioOld;
                qty = Math.floor(qty * multiplier);
                totalSplits++;
                qtyChange = `×${transaction.ratioNew}:${transaction.ratioOld}`;
                details = `Stock split ${transaction.ratioNew}:${transaction.ratioOld} (multiplier: ${multiplier.toFixed(2)}x)`;
            } else {
                qtyChange = '×0';
                details = `Stock split ${transaction.ratioNew}:${transaction.ratioOld}`;
            }
        } 
        else if (transaction.type === 'BONUS') {
            if (transaction.ratioFree && transaction.ratioHeld && qty > 0) {
                // Bonus shares are added at ZERO price
                const bonusShares = Math.floor(qty * (transaction.ratioFree / transaction.ratioHeld));
                qty += bonusShares;
                totalBonus += bonusShares;
                qtyChange = `+${bonusShares}`;
                details = `Bonus ${transaction.ratioFree}:${transaction.ratioHeld} (received ${bonusShares} shares at ₹0)`;
                // invested amount remains unchanged for bonus shares
            } else {
                qtyChange = '+0';
                details = `Bonus ${transaction.ratioFree}:${transaction.ratioHeld}`;
            }
        }

        avg = qty > 0 ? invested / qty : 0;

        rows.push({
            idx: idx + 1,
            type: transaction.type,
            transaction: transaction,
            qty: qty,
            avg: avg,
            invested: invested,
            details: details,
            qtyChange: qtyChange
        });
    });

    // Render table
    renderTable(rows);
    
    // Render status panel
    renderStatusPanel(totalBuy, totalSell, qty, avg, totalSplits, totalBonus);
    
    // Show summary if there are transactions
    if (transactions.length > 0) {
        renderSummary(totalBuy, totalSell, qty, avg, invested);
        const summaryElement = document.getElementById('summarySection');
        if (summaryElement) summaryElement.style.display = 'block';
    } else {
        // Hide summary if no transactions
        const summaryElement = document.getElementById('summarySection');
        if (summaryElement) summaryElement.style.display = 'none';
    }
}

// Render transactions table
function renderTable(rows) {
    const tableElement = document.getElementById('transactionsTable');
    if (!tableElement) return; // Safety check
    
    let html = '';
    
    if (transactions.length === 0) {
        html = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-plus-circle" style="font-size: 2rem;"></i>
                    <div class="mt-2">No transactions added yet</div>
                    <small>Click "Add Buy", "Add Sell", "Add Split", or "Add Bonus" to get started</small>
                </td>
            </tr>
        `;
    } else {
        transactions.forEach((transaction, idx) => {
            const row = rows[idx];
            html += `
                <tr>
                    <td>${row.idx}</td>
                    <td>
                        <span class="badge ${getBadgeClass(transaction.type)}">${transaction.type}</span>
                    </td>
                    <td>
                        ${renderQuantityInput(transaction, idx)}
                    </td>
                    <td>
                        ${renderPriceInput(transaction, idx)}
                    </td>
                    <td>
                        <span class="fw-bold">${row.qty.toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                        <span class="text-primary">₹${row.avg.toFixed(2)}</span>
                    </td>
                    <td>
                        <small>${row.details}</small>
                    </td>
                    <td>
                        <button class="btn btn-outline-danger btn-sm" 
                                onclick="removeTransaction(${idx})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    tableElement.innerHTML = html;
}

// Render quantity/ratio input based on transaction type
function renderQuantityInput(transaction, idx) {
    if (transaction.type === 'BUY' || transaction.type === 'SELL') {
        return `<input type="number" class="form-control form-control-sm" 
                       value="${transaction.qty}" min="0" 
                       onchange="updateTransactionField(${idx}, 'qty', this.value)"
                       placeholder="Quantity">`;
    } else if (transaction.type === 'SPLIT') {
        return `
            <div class="d-flex align-items-center">
                <input type="number" class="form-control form-control-sm" 
                       value="${transaction.ratioNew}" min="1" style="width: 60px"
                       onchange="updateTransactionField(${idx}, 'ratioNew', this.value)">
                <span class="mx-1">:</span>
                <input type="number" class="form-control form-control-sm" 
                       value="${transaction.ratioOld}" min="1" style="width: 60px"
                       onchange="updateTransactionField(${idx}, 'ratioOld', this.value)">
            </div>
        `;
    } else if (transaction.type === 'BONUS') {
        return `
            <div class="d-flex align-items-center">
                <input type="number" class="form-control form-control-sm" 
                       value="${transaction.ratioFree}" min="1" style="width: 60px"
                       onchange="updateTransactionField(${idx}, 'ratioFree', this.value)">
                <span class="mx-1">:</span>
                <input type="number" class="form-control form-control-sm" 
                       value="${transaction.ratioHeld}" min="1" style="width: 60px"
                       onchange="updateTransactionField(${idx}, 'ratioHeld', this.value)">
            </div>
        `;
    }
}

// Render price input based on transaction type
function renderPriceInput(transaction, idx) {
    if (transaction.type === 'BUY' || transaction.type === 'SELL') {
        return `<input type="number" class="form-control form-control-sm" 
                       value="${transaction.price}" min="0" step="0.01"
                       onchange="updateTransactionField(${idx}, 'price', this.value)"
                       placeholder="Price">`;
    } else if (transaction.type === 'BONUS') {
        return '<span class="badge bg-success">₹0.00</span>';
    } else {
        return '<span class="text-muted">—</span>';
    }
}

// Get badge class for transaction type
function getBadgeClass(type) {
    switch (type) {
        case 'BUY': return 'bg-primary';
        case 'SELL': return 'bg-danger';
        case 'SPLIT': return 'bg-secondary';
        case 'BONUS': return 'bg-success';
        default: return 'bg-light';
    }
}

// Render status panel
function renderStatusPanel(totalBuy, totalSell, finalQty, avgPrice, totalSplits, totalBonus) {
    const statusElement = document.getElementById('statusPanel');
    if (!statusElement) return; // Safety check
    
    const finalValue = finalQty * avgPrice;
    
    const statusHtml = `
        <div class="col-md-2">
            <div class="card bg-primary text-white">
                <div class="card-body text-center py-3">
                    <i class="bi bi-cart-plus" style="font-size: 1.5rem;"></i>
                    <h5 class="mt-2">${totalBuy}</h5>
                    <small>Total Bought</small>
                </div>
            </div>
        </div>
        <div class="col-md-2">
            <div class="card bg-danger text-white">
                <div class="card-body text-center py-3">
                    <i class="bi bi-cart-dash" style="font-size: 1.5rem;"></i>
                    <h5 class="mt-2">${totalSell}</h5>
                    <small>Total Sold</small>
                </div>
            </div>
        </div>
        <div class="col-md-2">
            <div class="card bg-success text-white">
                <div class="card-body text-center py-3">
                    <i class="bi bi-box" style="font-size: 1.5rem;"></i>
                    <h5 class="mt-2">${finalQty}</h5>
                    <small>Final Holdings</small>
                </div>
            </div>
        </div>
        <div class="col-md-2">
            <div class="card bg-info text-white">
                <div class="card-body text-center py-3">
                    <i class="bi bi-currency-rupee" style="font-size: 1.5rem;"></i>
                    <h5 class="mt-2">₹${avgPrice.toFixed(2)}</h5>
                    <small>Avg Price</small>
                </div>
            </div>
        </div>
        <div class="col-md-2">
            <div class="card bg-warning text-white">
                <div class="card-body text-center py-3">
                    <i class="bi bi-gift" style="font-size: 1.5rem;"></i>
                    <h5 class="mt-2">${totalBonus}</h5>
                    <small>Bonus Shares</small>
                </div>
            </div>
        </div>
        <div class="col-md-2">
            <div class="card bg-dark text-white">
                <div class="card-body text-center py-3">
                    <i class="bi bi-cash-stack" style="font-size: 1.5rem;"></i>
                    <h5 class="mt-2">₹${finalValue.toFixed(0)}</h5>
                    <small>Holding Value</small>
                </div>
            </div>
        </div>
    `;
    
    statusElement.innerHTML = statusHtml;
}

// Render summary
function renderSummary(totalBuy, totalSell, finalQty, avgPrice, totalInvested) {
    const investmentElement = document.getElementById('investmentSummary');
    const corporateElement = document.getElementById('corporateActionsSummary');
    
    if (investmentElement) {
        const investmentSummary = `
            <ul class="list-unstyled">
                <li><strong>Total Shares Bought:</strong> ${totalBuy}</li>
                <li><strong>Total Shares Sold:</strong> ${totalSell}</li>
                <li><strong>Net Investment:</strong> ₹${totalInvested.toFixed(2)}</li>
                <li><strong>Current Holdings:</strong> ${finalQty} shares</li>
                <li><strong>Average Buy Price:</strong> ₹${avgPrice.toFixed(2)}</li>
            </ul>
        `;
        investmentElement.innerHTML = investmentSummary;
    }
    
    if (corporateElement) {
        const corporateActionsSummary = `
            <ul class="list-unstyled">
                <li><strong>Split Events:</strong> ${transactions.filter(t => t.type === 'SPLIT').length}</li>
                <li><strong>Bonus Events:</strong> ${transactions.filter(t => t.type === 'BONUS').length}</li>
                <li><strong>Total Bonus Shares:</strong> ${totalBonus || 0}</li>
                <li><strong>Total Value at Avg Cost:</strong> ₹${(finalQty * avgPrice).toFixed(2)}</li>
            </ul>
        `;
        corporateElement.innerHTML = corporateActionsSummary;
    }
}

// Reset function - FIXED
function resetSplitBonusPro() {
    if (confirm('Are you sure you want to reset all transactions?')) {
        transactions = [];
        renderTransactions();
    }
}

// Load sample data
function loadSampleSplitBonusProData() {
    transactions = [
        {type: 'BUY', qty: 100, price: 100},
        {type: 'SELL', qty: 20, price: 120},
        {type: 'SPLIT', ratioNew: 2, ratioOld: 1},
        {type: 'BONUS', ratioFree: 1, ratioHeld: 4},
        {type: 'BUY', qty: 50, price: 60}
    ];
    renderTransactions();
}

// Initialize on load - FIXED with proper DOM check
function splitBonusProInit() {
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
        renderTransactions();
    }, 100);
}

// Alternative initialization that waits for DOM
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the split bonus pro section
    if (document.getElementById('splitbonuspro-section')) {
        splitBonusProInit();
    }
});

// Make functions globally available
window.addTransaction = addTransaction;
window.removeTransaction = removeTransaction;
window.updateTransactionField = updateTransactionField;
window.resetSplitBonusPro = resetSplitBonusPro;
window.loadSampleSplitBonusProData = loadSampleSplitBonusProData;
window.splitBonusProInit = splitBonusProInit;

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    const section = document.getElementById('splitbonuspro-section');
    if (!section || section.style.display === 'none') return;
    
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        loadSampleSplitBonusProData();
    }
    
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetSplitBonusPro();
    }
});
