// // Split & Bonus Pro Calculator with FIFO (No Visualization)
// let transactions = [];
// let fifoLots = [];
// let totalRealizedPnl = 0;

// // FIFO Lot structure
// class FifoLot {
//     constructor(qty, price, source = 'BUY', lotId = null) {
//         this.qty = qty;
//         this.price = price;
//         this.originalQty = qty;
//         this.lotId = lotId || Date.now() + Math.random();
//         this.source = source;
//     }
// }

// // Add new transaction with validation
// function addTransaction(type) {
//     if (transactions.length === 0 && type !== 'BUY') {
//         alert('❌ Error: First transaction must be a BUY transaction!');
//         return;
//     }

//     if (type === 'BUY') {
//         transactions.push({type: 'BUY', qty: '', price: '', id: generateId()});
//     } else if (type === 'SELL') {
//         transactions.push({type: 'SELL', qty: '', price: '', id: generateId()});
//     } else if (type === 'SPLIT') {
//         transactions.push({type: 'SPLIT', ratioNew: 2, ratioOld: 1, id: generateId()});
//     } else if (type === 'BONUS') {
//         transactions.push({type: 'BONUS', ratioFree: 1, ratioHeld: 4, id: generateId()});
//     }
//     renderTransactions();
// }

// function generateId() {
//     return Date.now() + Math.random();
// }

// function removeTransaction(idx) {
//     transactions.splice(idx, 1);
//     renderTransactions();
// }

// function updateTransactionField(idx, field, value) {
//     if (['qty', 'price', 'ratioNew', 'ratioOld', 'ratioFree', 'ratioHeld'].includes(field)) {
//         transactions[idx][field] = Number(value) || '';
//         renderTransactions();
//     }
// }

// // Process all transactions with FIFO logic
// function processTransactions() {
//     fifoLots = [];
//     totalRealizedPnl = 0;
//     let processedResults = [];

//     transactions.forEach((transaction, idx) => {
//         let result = processTransaction(transaction, idx);
//         processedResults.push(result);
//     });

//     return processedResults;
// }

// function processTransaction(transaction, idx) {
//     let result = {
//         idx: idx + 1,
//         type: transaction.type,
//         transaction: transaction,
//         qty: getCurrentHoldings(),
//         details: '',
//         pnl: 0,
//         amount: 0
//     };

//     if (transaction.type === 'BUY') {
//         if (transaction.qty && transaction.price) {
//             let newLot = new FifoLot(transaction.qty, transaction.price, 'BUY', transaction.id);
//             fifoLots.push(newLot);
//             result.amount = transaction.qty * transaction.price;
//             result.details = `Buy ${transaction.qty} shares @ ₹${transaction.price.toFixed(2)}`;
//         } else {
//             result.details = 'Buy transaction (enter qty & price)';
//         }
//     }
//     else if (transaction.type === 'SELL') {
//         if (transaction.qty && transaction.price) {
//             let sellResult = processSell(transaction.qty, transaction.price);
//             result.pnl = sellResult.pnl;
//             result.amount = transaction.qty * transaction.price;
//             result.details = `Sell ${transaction.qty} shares @ ₹${transaction.price.toFixed(2)} (P&L: ${sellResult.pnl >= 0 ? '+' : ''}₹${sellResult.pnl.toFixed(2)})`;
//         } else {
//             result.details = 'Sell transaction (enter qty & price)';
//         }
//     }
//     else if (transaction.type === 'SPLIT') {
//         if (transaction.ratioNew && transaction.ratioOld) {
//             let multiplier = transaction.ratioNew / transaction.ratioOld;
//             processSplit(multiplier);
//             result.details = `Stock split ${transaction.ratioNew}:${transaction.ratioOld} (${multiplier.toFixed(2)}x)`;
//         } else {
//             result.details = `Stock split ${transaction.ratioNew}:${transaction.ratioOld}`;
//         }
//     }
//     else if (transaction.type === 'BONUS') {
//         if (transaction.ratioFree && transaction.ratioHeld) {
//             let bonusShares = processBonus(transaction.ratioFree, transaction.ratioHeld);
//             result.details = `Bonus ${transaction.ratioFree}:${transaction.ratioHeld} (received ${bonusShares} shares at ₹0)`;
//         } else {
//             result.details = `Bonus ${transaction.ratioFree}:${transaction.ratioHeld}`;
//         }
//     }

//     result.qty = getCurrentHoldings();
//     return result;
// }

// function processSell(sellQty, sellPrice) {
//     let remainingSellQty = sellQty;
//     let totalPnl = 0;

//     for (let i = 0; i < fifoLots.length && remainingSellQty > 0; i++) {
//         let lot = fifoLots[i];
//         if (lot.qty > 0) {
//             let qtyToSell = Math.min(lot.qty, remainingSellQty);
//             let lotPnl = qtyToSell * (sellPrice - lot.price);
            
//             totalPnl += lotPnl;
//             lot.qty -= qtyToSell;
//             remainingSellQty -= qtyToSell;
//         }
//     }

//     fifoLots = fifoLots.filter(lot => lot.qty > 0);
//     totalRealizedPnl += totalPnl;
    
//     return { pnl: totalPnl };
// }

// function processSplit(multiplier) {
//     fifoLots.forEach(lot => {
//         let newQty = Math.floor(lot.qty * multiplier);
//         lot.originalQty = lot.originalQty * multiplier;
//         lot.qty = newQty;
//         lot.price = lot.price / multiplier;
//     });
// }

// function processBonus(ratioFree, ratioHeld) {
//     let totalBonusShares = 0;
    
//     fifoLots.forEach(lot => {
//         let bonusForThisLot = Math.floor((lot.qty * ratioFree) / ratioHeld);
//         if (bonusForThisLot > 0) {
//             let bonusLot = new FifoLot(bonusForThisLot, 0, 'BONUS');
//             fifoLots.push(bonusLot);
//             totalBonusShares += bonusForThisLot;
//         }
//     });
    
//     return totalBonusShares;
// }

// function getCurrentHoldings() {
//     return fifoLots.reduce((total, lot) => total + lot.qty, 0);
// }

// function getWeightedAveragePrice() {
//     let totalValue = fifoLots.reduce((total, lot) => total + (lot.qty * lot.price), 0);
//     let totalQty = getCurrentHoldings();
//     return totalQty > 0 ? totalValue / totalQty : 0;
// }

// function getTotalBuyQuantity() {
//     let totalBuy = 0;
    
//     transactions.forEach(t => {
//         if (t.type === 'BUY' && t.qty) {
//             totalBuy += t.qty;
//         }
//     });
    
//     let bonusShares = fifoLots.filter(lot => lot.source === 'BONUS').reduce((sum, lot) => sum + lot.originalQty, 0);
    
//     let splitMultiplier = 1;
//     transactions.forEach(t => {
//         if (t.type === 'SPLIT' && t.ratioNew && t.ratioOld) {
//             splitMultiplier *= (t.ratioNew / t.ratioOld);
//         }
//     });
    
//     return totalBuy + bonusShares;
// }

// // Main render function
// function renderTransactions() {
//     let processedResults = processTransactions();
    
//     renderTable(processedResults);
//     renderStatusPanel();
    
//     if (transactions.length > 0) {
//         document.getElementById('pnlSummary').style.display = 'block';
//         renderPnlSummary();
//     } else {
//         document.getElementById('pnlSummary').style.display = 'none';
//     }
// }

// // Render transactions table with proper alignment
// function renderTable(rows) {
//     const tableElement = document.getElementById('transactionsTable');
//     if (!tableElement) return;
    
//     let html = '';
    
//     if (transactions.length === 0) {
//         html = `
//             <tr>
//                 <td colspan="9" class="text-center text-muted py-4">
//                     <i class="bi bi-plus-circle" style="font-size: 2rem;"></i>
//                     <div class="mt-2">No transactions added yet</div>
//                     <small>Press <kbd>B</kbd> to add Buy or click "Add Buy" (first transaction must be a buy)</small>
//                 </td>
//             </tr>
//         `;
//     } else {
//         transactions.forEach((transaction, idx) => {
//             const row = rows[idx];
//             html += `
//                 <tr>
//                     <td class="text-center">${row.idx}</td>
//                     <td class="text-center">
//                         <span class="badge ${getBadgeClass(transaction.type)}">${transaction.type}</span>
//                     </td>
//                     <td class="text-center">${renderQuantityInput(transaction, idx)}</td>
//                     <td class="text-center">${renderPriceInput(transaction, idx)}</td>
//                     <td class="text-end">
//                         ${row.amount ? '₹' + row.amount.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '—'}
//                     </td>
//                     <td class="text-end">
//                         ${row.pnl !== 0 ? 
//                             `<span class="${row.pnl >= 0 ? 'text-success' : 'text-danger'}">${row.pnl >= 0 ? '+' : ''}₹${row.pnl.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>` 
//                             : '—'}
//                     </td>
//                     <td class="text-center">
//                         <span class="fw-bold">${row.qty.toLocaleString('en-IN')}</span>
//                     </td>
//                     <td class="text-start"><small>${row.details}</small></td>
//                     <td class="text-center">
//                         <button class="btn btn-outline-danger btn-sm" 
//                                 onclick="removeTransaction(${idx})">
//                             <i class="bi bi-trash"></i>
//                         </button>
//                     </td>
//                 </tr>
//             `;
//         });
//     }
    
//     tableElement.innerHTML = html;
// }

// // Enhanced input rendering
// function renderQuantityInput(transaction, idx) {
//     if (transaction.type === 'BUY' || transaction.type === 'SELL') {
//         return `<input type="number" class="form-control form-control-sm text-center" 
//                        value="${transaction.qty}" min="0" 
//                        onchange="updateTransactionField(${idx}, 'qty', this.value)"
//                        onkeydown="handleTabNavigation(event, ${idx}, 'price')"
//                        placeholder="Qty" style="width: 80px;">`;
//     } else if (transaction.type === 'SPLIT') {
//         return `
//             <div class="d-flex align-items-center justify-content-center">
//                 <input type="number" class="form-control form-control-sm text-center" 
//                        value="${transaction.ratioNew}" min="1" style="width: 45px"
//                        onchange="updateTransactionField(${idx}, 'ratioNew', this.value)">
//                 <span class="mx-1">:</span>
//                 <input type="number" class="form-control form-control-sm text-center" 
//                        value="${transaction.ratioOld}" min="1" style="width: 45px"
//                        onchange="updateTransactionField(${idx}, 'ratioOld', this.value)">
//             </div>
//         `;
//     } else if (transaction.type === 'BONUS') {
//         return `
//             <div class="d-flex align-items-center justify-content-center">
//                 <input type="number" class="form-control form-control-sm text-center" 
//                        value="${transaction.ratioFree}" min="1" style="width: 45px"
//                        onchange="updateTransactionField(${idx}, 'ratioFree', this.value)">
//                 <span class="mx-1">:</span>
//                 <input type="number" class="form-control form-control-sm text-center" 
//                        value="${transaction.ratioHeld}" min="1" style="width: 45px"
//                        onchange="updateTransactionField(${idx}, 'ratioHeld', this.value)">
//             </div>
//         `;
//     }
// }

// function renderPriceInput(transaction, idx) {
//     if (transaction.type === 'BUY' || transaction.type === 'SELL') {
//         return `<input type="number" class="form-control form-control-sm text-center" 
//                        value="${transaction.price}" min="0" step="0.01"
//                        onchange="updateTransactionField(${idx}, 'price', this.value)"
//                        onkeydown="handleTabNavigation(event, ${idx}, 'qty')"
//                        placeholder="Price" style="width: 80px;">`;
//     } else if (transaction.type === 'BONUS') {
//         return '<span class="badge bg-success">₹0.00</span>';
//     } else {
//         return '<span class="text-muted">—</span>';
//     }
// }

// // Tab navigation between qty and price
// function handleTabNavigation(event, idx, nextField) {
//     if (event.key === 'Tab') {
//         event.preventDefault();
//         const nextRow = nextField === 'qty' ? idx + 1 : idx;
//         const nextInput = document.querySelector(`#transactionsTable tr:nth-child(${nextRow + 1}) input[placeholder="${nextField === 'qty' ? 'Qty' : 'Price'}"]`);
//         if (nextInput) {
//             nextInput.focus();
//             nextInput.select();
//         }
//     }
// }

// function getBadgeClass(type) {
//     switch (type) {
//         case 'BUY': return 'bg-primary';
//         case 'SELL': return 'bg-danger';
//         case 'SPLIT': return 'bg-secondary';
//         case 'BONUS': return 'bg-success';
//         default: return 'bg-light';
//     }
// }

// // Compact status panel
// function renderStatusPanel() {
//     const statusElement = document.getElementById('tradewiseStatusPanel');
//     if (!statusElement) return;
    
//     let totalBuy = getTotalBuyQuantity();
//     let totalSell = transactions.filter(t => t.type === 'SELL' && t.qty).reduce((sum, t) => sum + t.qty, 0);
//     let currentHoldings = getCurrentHoldings();
//     let avgPrice = getWeightedAveragePrice();
//     let totalInvested = fifoLots.reduce((sum, lot) => sum + (lot.qty * lot.price), 0);
    
//     const statusHtml = `
//         <div class="col-md-2">
//             <div class="card bg-primary text-white">
//                 <div class="card-body text-center py-2">
//                     <i class="bi bi-cart-plus" style="font-size: 1.2rem;"></i>
//                     <h6 class="mt-1 mb-0">${totalBuy.toLocaleString('en-IN')}</h6>
//                     <small style="font-size: 0.75rem;">Total Acquired</small>
//                 </div>
//             </div>
//         </div>
//         <div class="col-md-2">
//             <div class="card bg-danger text-white">
//                 <div class="card-body text-center py-2">
//                     <i class="bi bi-cart-dash" style="font-size: 1.2rem;"></i>
//                     <h6 class="mt-1 mb-0">${totalSell.toLocaleString('en-IN')}</h6>
//                     <small style="font-size: 0.75rem;">Total Sold</small>
//                 </div>
//             </div>
//         </div>
//         <div class="col-md-2">
//             <div class="card bg-success text-white">
//                 <div class="card-body text-center py-2">
//                     <i class="bi bi-box" style="font-size: 1.2rem;"></i>
//                     <h6 class="mt-1 mb-0">${currentHoldings.toLocaleString('en-IN')}</h6>
//                     <small style="font-size: 0.75rem;">Holdings</small>
//                 </div>
//             </div>
//         </div>
//         <div class="col-md-2">
//             <div class="card bg-info text-white">
//                 <div class="card-body text-center py-2">
//                     <i class="bi bi-currency-rupee" style="font-size: 1.2rem;"></i>
//                     <h6 class="mt-1 mb-0">₹${avgPrice.toFixed(2)}</h6>
//                     <small style="font-size: 0.75rem;">FIFO Avg</small>
//                 </div>
//             </div>
//         </div>
//         <div class="col-md-2">
//             <div class="card bg-warning text-white">
//                 <div class="card-body text-center py-2">
//                     <i class="bi bi-graph-up" style="font-size: 1.2rem;"></i>
//                     <h6 class="mt-1 mb-0">₹${totalRealizedPnl.toFixed(0)}</h6>
//                     <small style="font-size: 0.75rem;">Realized P&L</small>
//                 </div>
//             </div>
//         </div>
//         <div class="col-md-2">
//             <div class="card bg-dark text-white">
//                 <div class="card-body text-center py-2">
//                     <i class="bi bi-cash-stack" style="font-size: 1.2rem;"></i>
//                     <h6 class="mt-1 mb-0">₹${totalInvested.toFixed(0)}</h6>
//                     <small style="font-size: 0.75rem;">Invested</small>
//                 </div>
//             </div>
//         </div>
//     `;
    
//     statusElement.innerHTML = statusHtml;
// }

// function renderPnlSummary() {
//     let totalInvested = fifoLots.reduce((sum, lot) => sum + (lot.qty * lot.price), 0);
//     let currentValue = getCurrentHoldings() * getWeightedAveragePrice();
    
//     document.getElementById('totalPnl').textContent = `₹${totalRealizedPnl.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
//     document.getElementById('totalPnl').className = totalRealizedPnl >= 0 ? 'text-success h5' : 'text-danger h5';
//     document.getElementById('totalInvested').textContent = `₹${totalInvested.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
//     document.getElementById('currentValue').textContent = `₹${currentValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
// }

// // Export functionality
// function exportTransactions() {
//     if (transactions.length === 0) {
//         alert('No transactions to export');
//         return;
//     }

//     const processedResults = processTransactions();
//     const exportData = [];
    
//     exportData.push(['#', 'Type', 'Quantity', 'Price', 'Amount', 'P&L', 'Holdings', 'Details']);
    
//     processedResults.forEach((row, idx) => {
//         const transaction = transactions[idx];
//         exportData.push([
//             row.idx,
//             transaction.type,
//             transaction.qty || (transaction.ratioNew && transaction.ratioOld ? `${transaction.ratioNew}:${transaction.ratioOld}` : `${transaction.ratioFree}:${transaction.ratioHeld}`),
//             transaction.price || (transaction.type === 'BONUS' ? '0.00' : '—'),
//             row.amount ? row.amount.toFixed(2) : '—',
//             row.pnl !== 0 ? row.pnl.toFixed(2) : '—',
//             row.qty,
//             row.details
//         ]);
//     });
    
//     exportData.push([]);
//     exportData.push(['Summary', '', '', '', '', '', '', '']);
//     exportData.push(['Total Acquired', getTotalBuyQuantity(), '', '', '', '', '', '']);
//     exportData.push(['Total Sold', transactions.filter(t => t.type === 'SELL' && t.qty).reduce((sum, t) => sum + t.qty, 0), '', '', '', '', '', '']);
//     exportData.push(['Current Holdings', getCurrentHoldings(), '', '', '', '', '', '']);
//     exportData.push(['FIFO Average Price', getWeightedAveragePrice().toFixed(2), '', '', '', '', '', '']);
//     exportData.push(['Total Realized P&L', totalRealizedPnl.toFixed(2), '', '', '', '', '', '']);
    
//     const csvContent = exportData.map(row => 
//         row.map(cell => `"${cell}"`).join(',')
//     ).join('\n');
    
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.setAttribute('hidden', '');
//     a.setAttribute('href', url);
//     a.setAttribute('download', `fifo_transactions_${new Date().toISOString().split('T')[0]}.csv`);
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     window.URL.revokeObjectURL(url);
// }

// function resetTradeWise() {
//     if (confirm('Are you sure you want to reset all transactions?')) {
//         transactions = [];
//         fifoLots = [];
//         totalRealizedPnl = 0;
//         renderTransactions();
//     }
// }

// function loadSampleTradeWiseData() {
//     transactions = [
//         {type: 'BUY', qty: 100, price: 100, id: generateId()},
//         {type: 'BUY', qty: 50, price: 120, id: generateId()},
//         {type: 'SELL', qty: 30, price: 140, id: generateId()},
//         {type: 'SPLIT', ratioNew: 2, ratioOld: 1, id: generateId()},
//         {type: 'BONUS', ratioFree: 1, ratioHeld: 4, id: generateId()},
//         {type: 'SELL', qty: 50, price: 80, id: generateId()}
//     ];
//     renderTransactions();
// }

// function tradeWiseInit() {
//     setTimeout(() => {
//         renderTransactions();
//     }, 100);
// }

// // Make functions globally available
// window.addTransaction = addTransaction;
// window.removeTransaction = removeTransaction;
// window.updateTransactionField = updateTransactionField;
// window.handleTabNavigation = handleTabNavigation;
// window.exportTransactions = exportTransactions;
// window.resetTradeWise = resetTradeWise;
// window.loadSampleTradeWiseData = loadSampleTradeWiseData;
// window.tradeWiseInit = tradeWiseInit;

// // Enhanced event listeners with hotkeys
// document.addEventListener('DOMContentLoaded', function() {
//     if (document.getElementById('tradewise-section')) {
//         tradeWiseInit();
//     }
// });

// document.addEventListener('keydown', function(e) {
//     const section = document.getElementById('tradewise-section');
//     if (!section || section.style.display === 'none') return;
    
//     if (!e.target.matches('input')) {
//         if (e.key.toLowerCase() === 'b') {
//             e.preventDefault();
//             addTransaction('BUY');
//         }
//         if (e.key.toLowerCase() === 's') {
//             e.preventDefault();
//             addTransaction('SELL');
//         }
//     }
    
//     if (e.ctrlKey && e.key === 'l') {
//         e.preventDefault();
//         loadSampleTradeWiseData();
//     }
    
//     if (e.ctrlKey && e.key === 'r') {
//         e.preventDefault();
//         resetTradeWise();
//     }
    
//     if (e.ctrlKey && e.key === 'e') {
//         e.preventDefault();
//         exportTransactions();
//     }
// });


// Split & Bonus Pro Calculator with FIFO (Enhanced with Buy Average)
let transactions = [];
let fifoLots = [];
let totalRealizedPnl = 0;

// FIFO Lot structure
class FifoLot {
    constructor(qty, price, source = 'BUY', lotId = null) {
        this.qty = qty;
        this.price = price;
        this.originalQty = qty;
        this.lotId = lotId || Date.now() + Math.random();
        this.source = source;
    }
}

// Add new transaction with validation
function addTransaction(type) {
    if (transactions.length === 0 && type !== 'BUY') {
        alert('❌ Error: First transaction must be a BUY transaction!');
        return;
    }

    if (type === 'BUY') {
        transactions.push({type: 'BUY', qty: '', price: '', id: generateId()});
    } else if (type === 'SELL') {
        transactions.push({type: 'SELL', qty: '', price: '', id: generateId()});
    } else if (type === 'SPLIT') {
        transactions.push({type: 'SPLIT', ratioNew: 2, ratioOld: 1, id: generateId()});
    } else if (type === 'BONUS') {
        transactions.push({type: 'BONUS', ratioFree: 1, ratioHeld: 4, id: generateId()});
    }
    renderTransactions();
}

function generateId() {
    return Date.now() + Math.random();
}

function removeTransaction(idx) {
    transactions.splice(idx, 1);
    renderTransactions();
}

function updateTransactionField(idx, field, value) {
    if (['qty', 'price', 'ratioNew', 'ratioOld', 'ratioFree', 'ratioHeld'].includes(field)) {
        transactions[idx][field] = Number(value) || '';
        renderTransactions();
    }
}

// Process all transactions with FIFO logic
function processTransactions() {
    fifoLots = [];
    totalRealizedPnl = 0;
    let processedResults = [];

    transactions.forEach((transaction, idx) => {
        let result = processTransaction(transaction, idx);
        processedResults.push(result);
    });

    return processedResults;
}

function processTransaction(transaction, idx) {
    let result = {
        idx: idx + 1,
        type: transaction.type,
        transaction: transaction,
        qty: getCurrentHoldings(),
        details: '',
        pnl: 0,
        amount: 0
    };

    if (transaction.type === 'BUY') {
        if (transaction.qty && transaction.price) {
            let newLot = new FifoLot(transaction.qty, transaction.price, 'BUY', transaction.id);
            fifoLots.push(newLot);
            result.amount = transaction.qty * transaction.price;
            result.details = `Buy ${transaction.qty} shares @ ₹${transaction.price.toFixed(2)}`;
        } else {
            result.details = 'Buy transaction (enter qty & price)';
        }
    }
    else if (transaction.type === 'SELL') {
        if (transaction.qty && transaction.price) {
            let sellResult = processSell(transaction.qty, transaction.price);
            result.pnl = sellResult.pnl;
            result.amount = transaction.qty * transaction.price;
            result.details = `Sell ${transaction.qty} shares @ ₹${transaction.price.toFixed(2)} (P&L: ${sellResult.pnl >= 0 ? '+' : ''}₹${sellResult.pnl.toFixed(2)})`;
        } else {
            result.details = 'Sell transaction (enter qty & price)';
        }
    }
    else if (transaction.type === 'SPLIT') {
        if (transaction.ratioNew && transaction.ratioOld) {
            let multiplier = transaction.ratioNew / transaction.ratioOld;
            processSplit(multiplier);
            result.details = `Stock split ${transaction.ratioNew}:${transaction.ratioOld} (${multiplier.toFixed(2)}x)`;
        } else {
            result.details = `Stock split ${transaction.ratioNew}:${transaction.ratioOld}`;
        }
    }
    else if (transaction.type === 'BONUS') {
        if (transaction.ratioFree && transaction.ratioHeld) {
            let bonusShares = processBonus(transaction.ratioFree, transaction.ratioHeld);
            result.details = `Bonus ${transaction.ratioFree}:${transaction.ratioHeld} (received ${bonusShares} shares at ₹0)`;
        } else {
            result.details = `Bonus ${transaction.ratioFree}:${transaction.ratioHeld}`;
        }
    }

    result.qty = getCurrentHoldings();
    return result;
}

function processSell(sellQty, sellPrice) {
    let remainingSellQty = sellQty;
    let totalPnl = 0;

    for (let i = 0; i < fifoLots.length && remainingSellQty > 0; i++) {
        let lot = fifoLots[i];
        if (lot.qty > 0) {
            let qtyToSell = Math.min(lot.qty, remainingSellQty);
            let lotPnl = qtyToSell * (sellPrice - lot.price);
            
            totalPnl += lotPnl;
            lot.qty -= qtyToSell;
            remainingSellQty -= qtyToSell;
        }
    }

    fifoLots = fifoLots.filter(lot => lot.qty > 0);
    totalRealizedPnl += totalPnl;
    
    return { pnl: totalPnl };
}

function processSplit(multiplier) {
    fifoLots.forEach(lot => {
        let newQty = Math.floor(lot.qty * multiplier);
        lot.originalQty = lot.originalQty * multiplier;
        lot.qty = newQty;
        lot.price = lot.price / multiplier;
    });
}

function processBonus(ratioFree, ratioHeld) {
    let totalBonusShares = 0;
    
    fifoLots.forEach(lot => {
        let bonusForThisLot = Math.floor((lot.qty * ratioFree) / ratioHeld);
        if (bonusForThisLot > 0) {
            let bonusLot = new FifoLot(bonusForThisLot, 0, 'BONUS');
            fifoLots.push(bonusLot);
            totalBonusShares += bonusForThisLot;
        }
    });
    
    return totalBonusShares;
}

function getCurrentHoldings() {
    return fifoLots.reduce((total, lot) => total + lot.qty, 0);
}

// IMPORTANT: FIFO Weighted Average Price Calculation
function getWeightedAveragePrice() {
    let totalValue = fifoLots.reduce((total, lot) => total + (lot.qty * lot.price), 0);
    let totalQty = getCurrentHoldings();
    return totalQty > 0 ? totalValue / totalQty : 0;
}

function getTotalBuyQuantity() {
    let totalBuy = 0;
    
    transactions.forEach(t => {
        if (t.type === 'BUY' && t.qty) {
            totalBuy += t.qty;
        }
    });
    
    let bonusShares = fifoLots.filter(lot => lot.source === 'BONUS').reduce((sum, lot) => sum + lot.originalQty, 0);
    
    let splitMultiplier = 1;
    transactions.forEach(t => {
        if (t.type === 'SPLIT' && t.ratioNew && t.ratioOld) {
            splitMultiplier *= (t.ratioNew / t.ratioOld);
        }
    });
    
    return totalBuy + bonusShares;
}

// Main render function
function renderTransactions() {
    let processedResults = processTransactions();
    
    renderTable(processedResults);
    renderStatusPanel();
    
    if (transactions.length > 0) {
        document.getElementById('pnlSummary').style.display = 'block';
        renderPnlSummary();
    } else {
        document.getElementById('pnlSummary').style.display = 'none';
    }
}

// Render transactions table with proper alignment
function renderTable(rows) {
    const tableElement = document.getElementById('transactionsTable');
    if (!tableElement) return;
    
    let html = '';
    
    if (transactions.length === 0) {
        html = `
            <tr>
                <td colspan="9" class="text-center p-5 text-muted">
                    <i class="bi bi-plus-circle fs-1 mb-3"></i>
                    <p class="mb-0">No transactions yet. Click "Add Buy" to start tracking your portfolio.</p>
                </td>
            </tr>
        `;
    } else {
        transactions.forEach((transaction, idx) => {
            const row = rows[idx];
            html += `
                <tr>
                    <td class="text-center">${row.idx}</td>
                    <td class="text-center">
                        <span class="badge ${getBadgeClass(transaction.type)}">${transaction.type}</span>
                    </td>
                    <td class="text-center">${renderQuantityInput(transaction, idx)}</td>
                    <td class="text-end">${renderPriceInput(transaction, idx)}</td>
                    <td class="text-end">
                        ${row.amount ? '₹' + row.amount.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '—'}
                    </td>
                    <td class="text-end">
                        ${row.pnl !== 0 ? 
                            `<span class="${row.pnl >= 0 ? 'text-success' : 'text-danger'}">${row.pnl >= 0 ? '+' : ''}₹${row.pnl.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>` 
                            : '—'}
                    </td>
                    <td class="text-center">
                        <span class="fw-bold">${row.qty.toLocaleString('en-IN')}</span>
                    </td>
                    <td class="text-start"><small>${row.details}</small></td>
                    <td class="text-center">
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

// Enhanced input rendering
function renderQuantityInput(transaction, idx) {
    if (transaction.type === 'BUY' || transaction.type === 'SELL') {
        return `<input type="number" class="form-control form-control-sm text-center" 
                       value="${transaction.qty}" min="0" 
                       onchange="updateTransactionField(${idx}, 'qty', this.value)"
                       onkeydown="handleTabNavigation(event, ${idx}, 'price')"
                       placeholder="Qty" style="width: 80px;">`;
    } else if (transaction.type === 'SPLIT') {
        return `
            <div class="d-flex align-items-center justify-content-center">
                <input type="number" class="form-control form-control-sm text-center" 
                       value="${transaction.ratioNew}" min="1" style="width: 45px"
                       onchange="updateTransactionField(${idx}, 'ratioNew', this.value)">
                <span class="mx-1">:</span>
                <input type="number" class="form-control form-control-sm text-center" 
                       value="${transaction.ratioOld}" min="1" style="width: 45px"
                       onchange="updateTransactionField(${idx}, 'ratioOld', this.value)">
            </div>
        `;
    } else if (transaction.type === 'BONUS') {
        return `
            <div class="d-flex align-items-center justify-content-center">
                <input type="number" class="form-control form-control-sm text-center" 
                       value="${transaction.ratioFree}" min="1" style="width: 45px"
                       onchange="updateTransactionField(${idx}, 'ratioFree', this.value)">
                <span class="mx-1">:</span>
                <input type="number" class="form-control form-control-sm text-center" 
                       value="${transaction.ratioHeld}" min="1" style="width: 45px"
                       onchange="updateTransactionField(${idx}, 'ratioHeld', this.value)">
            </div>
        `;
    }
}

function renderPriceInput(transaction, idx) {
    if (transaction.type === 'BUY' || transaction.type === 'SELL') {
        return `<input type="number" class="form-control form-control-sm text-center" 
                       value="${transaction.price}" min="0" step="0.01"
                       onchange="updateTransactionField(${idx}, 'price', this.value)"
                       onkeydown="handleTabNavigation(event, ${idx}, 'qty')"
                       placeholder="Price" style="width: 80px;">`;
    } else if (transaction.type === 'BONUS') {
        return '<span class="badge bg-success">₹0.00</span>';
    } else {
        return '<span class="text-muted">—</span>';
    }
}

// Tab navigation between qty and price
function handleTabNavigation(event, idx, nextField) {
    if (event.key === 'Tab') {
        event.preventDefault();
        const nextRow = nextField === 'qty' ? idx + 1 : idx;
        const nextInput = document.querySelector(`#transactionsTable tr:nth-child(${nextRow + 1}) input[placeholder="${nextField === 'qty' ? 'Qty' : 'Price'}"]`);
        if (nextInput) {
            nextInput.focus();
            nextInput.select();
        }
    }
}

function getBadgeClass(type) {
    switch (type) {
        case 'BUY': return 'bg-primary';
        case 'SELL': return 'bg-danger';
        case 'SPLIT': return 'bg-secondary';
        case 'BONUS': return 'bg-success';
        default: return 'bg-light';
    }
}

// ENHANCED: Status panel with all 6 important metrics including Buy Average
function renderStatusPanel() {
    // Update header badges
    const transactionsBadge = document.getElementById('transactionsBadge');
    const holdingsBadge = document.getElementById('holdingsBadge');
    
    if (transactionsBadge) {
        transactionsBadge.textContent = `${transactions.length} transactions`;
    }
    if (holdingsBadge) {
        holdingsBadge.textContent = `${getCurrentHoldings()} holdings`;
    }
    
    // Calculate all important metrics
    let totalBuy = getTotalBuyQuantity();
    let totalSell = transactions.filter(t => t.type === 'SELL' && t.qty).reduce((sum, t) => sum + t.qty, 0);
    let currentHoldings = getCurrentHoldings();
    let buyAverage = getWeightedAveragePrice(); // IMPORTANT: FIFO Buy Average
    let totalInvested = fifoLots.reduce((sum, lot) => sum + (lot.qty * lot.price), 0);
    
    // Update the 6 status cards
    const statusElements = {
        totalAcquiredStatus: totalBuy.toLocaleString('en-IN'),
        totalSoldStatus: totalSell.toLocaleString('en-IN'),
        currentHoldingsStatus: currentHoldings.toLocaleString('en-IN'),
        buyAverageStatus: `₹${buyAverage.toFixed(2)}`, // IMPORTANT: Buy Average Display
        realizedPnlStatus: `₹${totalRealizedPnl.toFixed(0)}`,
        totalInvestedStatus: `₹${totalInvested.toFixed(0)}`
    };
    
    // Update each status element
    Object.entries(statusElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            
            // Special coloring for P&L
            if (id === 'realizedPnlStatus') {
                element.className = `fw-bold ${totalRealizedPnl >= 0 ? 'text-white' : 'text-white'}`;
                // Update parent background color based on P&L
                const parent = element.closest('.bg-warning');
                if (parent) {
                    parent.className = totalRealizedPnl >= 0 
                        ? 'text-center p-2 bg-success text-white rounded'
                        : 'text-center p-2 bg-danger text-white rounded';
                }
            }
        }
    });
    
    // Update transaction count badge in table section
    const transactionCountBadge = document.getElementById('transactionCountBadge');
    if (transactionCountBadge) {
        transactionCountBadge.textContent = `${transactions.length} transactions`;
    }
}

function renderPnlSummary() {
    let totalInvested = fifoLots.reduce((sum, lot) => sum + (lot.qty * lot.price), 0);
    let currentValue = getCurrentHoldings() * getWeightedAveragePrice();
    let buyAverage = getWeightedAveragePrice();
    
    document.getElementById('totalPnl').textContent = `₹${totalRealizedPnl.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('totalPnl').className = totalRealizedPnl >= 0 ? 'fs-3 fw-bold text-success' : 'fs-3 fw-bold text-danger';
    
    // IMPORTANT: Display FIFO Buy Average prominently
    document.getElementById('fifoAverage').textContent = `₹${buyAverage.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    
    document.getElementById('totalInvested').textContent = `₹${totalInvested.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('currentValue').textContent = `₹${currentValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

// Export functionality with Buy Average
function exportTransactions() {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }

    const processedResults = processTransactions();
    const exportData = [];
    
    exportData.push(['#', 'Type', 'Quantity', 'Price', 'Amount', 'P&L', 'Holdings', 'Details']);
    
    processedResults.forEach((row, idx) => {
        const transaction = transactions[idx];
        exportData.push([
            row.idx,
            transaction.type,
            transaction.qty || (transaction.ratioNew && transaction.ratioOld ? `${transaction.ratioNew}:${transaction.ratioOld}` : `${transaction.ratioFree}:${transaction.ratioHeld}`),
            transaction.price || (transaction.type === 'BONUS' ? '0.00' : '—'),
            row.amount ? row.amount.toFixed(2) : '—',
            row.pnl !== 0 ? row.pnl.toFixed(2) : '—',
            row.qty,
            row.details
        ]);
    });
    
    exportData.push([]);
    exportData.push(['Summary', '', '', '', '', '', '', '']);
    exportData.push(['Total Acquired', getTotalBuyQuantity(), '', '', '', '', '', '']);
    exportData.push(['Total Sold', transactions.filter(t => t.type === 'SELL' && t.qty).reduce((sum, t) => sum + t.qty, 0), '', '', '', '', '', '']);
    exportData.push(['Current Holdings', getCurrentHoldings(), '', '', '', '', '', '']);
    exportData.push(['FIFO Buy Average', getWeightedAveragePrice().toFixed(2), '', '', '', '', '', '']); // IMPORTANT: Export Buy Average
    exportData.push(['Total Invested', fifoLots.reduce((sum, lot) => sum + (lot.qty * lot.price), 0).toFixed(2), '', '', '', '', '', '']);
    exportData.push(['Total Realized P&L', totalRealizedPnl.toFixed(2), '', '', '', '', '', '']);
    
    const csvContent = exportData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `fifo_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function resetTradeWise() {
    if (confirm('Are you sure you want to reset all transactions?')) {
        transactions = [];
        fifoLots = [];
        totalRealizedPnl = 0;
        renderTransactions();
    }
}

function resetSplitBonusPro() {
    resetTradeWise();
}

function loadSampleTradeWiseData() {
    transactions = [
        {type: 'BUY', qty: 100, price: 100, id: generateId()},
        {type: 'BUY', qty: 50, price: 120, id: generateId()},
        {type: 'SELL', qty: 30, price: 140, id: generateId()},
        {type: 'SPLIT', ratioNew: 2, ratioOld: 1, id: generateId()},
        {type: 'BONUS', ratioFree: 1, ratioHeld: 4, id: generateId()},
        {type: 'SELL', qty: 50, price: 80, id: generateId()}
    ];
    renderTransactions();
}

function tradeWiseInit() {
    setTimeout(() => {
        renderTransactions();
    }, 100);
}

// Make functions globally available
window.addTransaction = addTransaction;
window.removeTransaction = removeTransaction;
window.updateTransactionField = updateTransactionField;
window.handleTabNavigation = handleTabNavigation;
window.exportTransactions = exportTransactions;
window.resetTradeWise = resetTradeWise;
window.resetSplitBonusPro = resetSplitBonusPro;
window.loadSampleTradeWiseData = loadSampleTradeWiseData;
window.tradeWiseInit = tradeWiseInit;

// Enhanced event listeners with hotkeys
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('tradewise-section')) {
        tradeWiseInit();
    }
});

document.addEventListener('keydown', function(e) {
    const section = document.getElementById('tradewise-section');
    if (!section || section.style.display === 'none') return;
    
    if (!e.target.matches('input')) {
        if (e.key.toLowerCase() === 'b') {
            e.preventDefault();
            addTransaction('BUY');
        }
        if (e.key.toLowerCase() === 's') {
            e.preventDefault();
            addTransaction('SELL');
        }
    }
    
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        loadSampleTradeWiseData();
    }
    
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetSplitBonusPro();
    }
    
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportTransactions();
    }
});
