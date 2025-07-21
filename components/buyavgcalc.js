let tradeCounter = 2;

// Simplified calculate totals function
function calculateTotals() {
    const tradeRows = document.querySelectorAll('#tradesTableBody tr');
    let totalQty = 0;
    let totalAmount = 0;
    
    tradeRows.forEach((row) => {
        const qtyInput = row.querySelector('.trade-qty');
        const priceInput = row.querySelector('.trade-price');
        const totalSpan = row.querySelector('.trade-total');
        
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const tradeTotal = qty * price;
        
        // Update individual trade total
        totalSpan.textContent = `₹${tradeTotal.toFixed(2)}`;
        
        if (qty > 0 && price > 0) {
            totalQty += qty;
            totalAmount += tradeTotal;
        }
    });
    
    // Calculate average price
    const avgPrice = totalQty > 0 ? totalAmount / totalQty : 0;
    
    // Update summary cards
    document.getElementById('totalQuantity').textContent = totalQty;
    document.getElementById('avgPrice').textContent = avgPrice.toFixed(2);
    document.getElementById('totalInvestment').textContent = totalAmount.toFixed(2);
}

// Add new trade row
function addTradeRow() {
    tradeCounter++;
    const tableBody = document.getElementById('tradesTableBody');
    
    const newRow = document.createElement('tr');
    newRow.id = `trade-${tradeCounter}`;
    newRow.className = 'new-row';
    newRow.innerHTML = `
        <td class="align-middle">
            <span class="badge bg-primary">${tradeCounter}</span>
        </td>
        <td>
            <input type="number" class="form-control trade-qty" 
                   placeholder="Enter quantity" 
                   min="1" step="1" onchange="calculateTotals()">
        </td>
        <td>
            <div class="input-group">
                <span class="input-group-text">₹</span>
                <input type="number" class="form-control trade-price" 
                       placeholder="Enter price" 
                       step="0.01" onchange="calculateTotals()">
            </div>
        </td>
        <td class="align-middle">
            <span class="fw-bold text-success trade-total">₹0.00</span>
        </td>
        <td class="align-middle">
            <button class="btn btn-outline-danger btn-sm" 
                    onclick="removeTradeRow(${tradeCounter})">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    updateTradeNumbers();
    
    // Focus on the quantity input of the new row
    setTimeout(() => {
        newRow.querySelector('.trade-qty').focus();
    }, 100);
}

// Remove trade row
function removeTradeRow(tradeId) {
    const row = document.getElementById(`trade-${tradeId}`);
    if (row) {
        // Don't allow removing if only one row remains
        const totalRows = document.querySelectorAll('#tradesTableBody tr').length;
        if (totalRows <= 1) {
            alert('At least one trade row must remain.');
            return;
        }
        
        // Add fade out animation
        row.style.opacity = '0';
        row.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            row.remove();
            updateTradeNumbers();
            calculateTotals();
        }, 300);
    }
}

// Update trade numbers after adding/removing rows
function updateTradeNumbers() {
    const rows = document.querySelectorAll('#tradesTableBody tr');
    rows.forEach((row, index) => {
        const badge = row.querySelector('.badge');
        badge.textContent = index + 1;
        row.id = `trade-${index + 1}`;
        
        // Update remove button onclick
        const removeBtn = row.querySelector('.btn-outline-danger');
        if (removeBtn) {
            removeBtn.setAttribute('onclick', `removeTradeRow(${index + 1})`);
            // Disable remove button for first row
            removeBtn.disabled = (index === 0);
        }
    });
}

// Reset calculator
function resetCalculator() {
    if (confirm('Are you sure you want to reset all trades? This action cannot be undone.')) {
        // Reset table to initial 2 rows
        const tableBody = document.getElementById('tradesTableBody');
        tableBody.innerHTML = `
            <tr id="trade-1">
                <td class="align-middle">
                    <span class="badge bg-primary">1</span>
                </td>
                <td>
                    <input type="number" class="form-control trade-qty" 
                           placeholder="Enter quantity" 
                           min="1" step="1" onchange="calculateTotals()">
                </td>
                <td>
                    <div class="input-group">
                        <span class="input-group-text">₹</span>
                        <input type="number" class="form-control trade-price" 
                               placeholder="Enter price" 
                               step="0.01" onchange="calculateTotals()">
                    </div>
                </td>
                <td class="align-middle">
                    <span class="fw-bold text-success trade-total">₹0.00</span>
                </td>
                <td class="align-middle">
                    <button class="btn btn-outline-danger btn-sm" 
                            onclick="removeTradeRow(1)" disabled>
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
            <tr id="trade-2">
                <td class="align-middle">
                    <span class="badge bg-primary">2</span>
                </td>
                <td>
                    <input type="number" class="form-control trade-qty" 
                           placeholder="Enter quantity" 
                           min="1" step="1" onchange="calculateTotals()">
                </td>
                <td>
                    <div class="input-group">
                        <span class="input-group-text">₹</span>
                        <input type="number" class="form-control trade-price" 
                               placeholder="Enter price" 
                               step="0.01" onchange="calculateTotals()">
                    </div>
                </td>
                <td class="align-middle">
                    <span class="fw-bold text-success trade-total">₹0.00</span>
                </td>
                <td class="align-middle">
                    <button class="btn btn-outline-danger btn-sm" 
                            onclick="removeTradeRow(2)">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        
        // Reset counter
        tradeCounter = 2;
        
        // Reset totals
        calculateTotals();
    }
}

// Add keyboard shortcuts for calculator
document.addEventListener('keydown', function(e) {
    // Only work when users section is visible
    if (document.getElementById('users-section').style.display === 'none') return;
    
    // Ctrl+N to add new trade
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        addTradeRow();
    }
    
    // Ctrl+R to reset calculator
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetCalculator();
    }
});

// Initialize calculator on page load
document.addEventListener('DOMContentLoaded', function() {
    // Auto-calculate on any input change
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('trade-qty') || e.target.classList.contains('trade-price')) {
            calculateTotals();
        }
    });
});