

// // CSV handling variables
// let csvData1 = [];
// let csvData2 = [];
// let headers1 = [];
// let headers2 = [];


// // Enhanced file upload with Papa Parse
// function handleFileUpload(fileNumber) {
//     const fileInput = document.getElementById(`csvFile${fileNumber}`);
//     const statusDiv = document.getElementById(`file${fileNumber}Status`);
//     const file = fileInput.files[0];
    
//     if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
//         statusDiv.innerHTML = `<span class="text-info"><i class="bi bi-hourglass-split me-1"></i>Processing ${file.name}...</span>`;
        
//         Papa.parse(file, {
//             header: true,
//             skipEmptyLines: true,
//             trimHeaders: true,
//             dynamicTyping: false, // Keep all data as strings for consistency
//             complete: function(results) {
//                 if (results.errors.length > 0) {
//                     console.warn('CSV parsing warnings:', results.errors);
//                     // Show non-critical errors as warnings
//                     const criticalErrors = results.errors.filter(error => error.type === 'Delimiter');
//                     if (criticalErrors.length > 0) {
//                         statusDiv.innerHTML = `<span class="text-warning"><i class="bi bi-exclamation-triangle me-1"></i>File parsed with warnings. Check console for details.</span>`;
//                     }
//                 }
                
//                 const headers = results.meta.fields;
//                 const data = results.data;
                
//                 if (fileNumber === 1) {
//                     csvData1 = data;
//                     headers1 = headers;
//                     populateDropdown('column1Dropdown', headers1);
//                     statusDiv.innerHTML = `<span class="text-success"><i class="bi bi-check-circle me-1"></i>${file.name} uploaded successfully (${data.length} rows, ${headers.length} columns)</span>`;
//                 } else {
//                     csvData2 = data;
//                     headers2 = headers;
//                     populateDropdown('column2Dropdown', headers2);
//                     statusDiv.innerHTML = `<span class="text-success"><i class="bi bi-check-circle me-1"></i>${file.name} uploaded successfully (${data.length} rows, ${headers.length} columns)</span>`;
//                 }
                
//                 // Show column selection section if both files are uploaded
//                 if (csvData1.length > 0 && csvData2.length > 0) {
//                     document.getElementById('columnSelectionSection').style.display = 'block';
//                 }
//             },
//             error: function(error) {
//                 statusDiv.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Error parsing CSV: ${error.message}</span>`;
//                 console.error('Papa Parse Error:', error);
//             }
//         });
//     } else {
//         statusDiv.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Please select a valid CSV file</span>`;
//     }
// }

// // Populate dropdown with headers
// function populateDropdown(dropdownId, headers) {
//     const dropdown = document.getElementById(dropdownId);
//     dropdown.innerHTML = '<option value="">Select a column...</option>';
    
//     headers.forEach((header, index) => {
//         const option = document.createElement('option');
//         option.value = header; // Use header name as value
//         option.textContent = header;
//         dropdown.appendChild(option);
//     });
// }


// // Enhanced unique values generation with Papa Parse
// function generateUniqueValues() {
//     const column1Name = document.getElementById('column1Dropdown').value;
//     const column2Name = document.getElementById('column2Dropdown').value;
    
//     if (column1Name && column2Name) {
//         // Show loading indicator
//         document.getElementById('resultsSection').style.display = 'block';
//         document.getElementById('uniqueValues1').innerHTML = '<tr><td colspan="2" class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Processing...</td></tr>';
//         document.getElementById('uniqueValues2').innerHTML = '<tr><td colspan="2" class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Processing...</td></tr>';
        
//         // Use setTimeout to allow UI to update
//         setTimeout(() => {
//             // Extract all values from both columns using Papa Parse data structure
//             const values1 = new Set();
//             const values2 = new Set();
            
//             csvData1.forEach(row => {
//                 if (row[column1Name] && row[column1Name].toString().trim()) {
//                     values1.add(row[column1Name].toString().trim());
//                 }
//             });
            
//             csvData2.forEach(row => {
//                 if (row[column2Name] && row[column2Name].toString().trim()) {
//                     values2.add(row[column2Name].toString().trim());
//                 }
//             });
            
//             // Find values that are ONLY in CSV1 (not in CSV2)
//             const uniqueToCSV1 = new Set([...values1].filter(x => !values2.has(x)));
            
//             // Find values that are ONLY in CSV2 (not in CSV1)
//             const uniqueToCSV2 = new Set([...values2].filter(x => !values1.has(x)));
            
//             // Display results
//             displayUniqueValues(Array.from(uniqueToCSV1), Array.from(uniqueToCSV2));
            
//             // Update column names
//             document.getElementById('file1ColumnName').textContent = column1Name;
//             document.getElementById('file2ColumnName').textContent = column2Name;
            
//             // Calculate comparison statistics
//             calculateComparisonStats(values1, values2);
//         }, 100);
//     }
// }

// // Display unique values in tables
// function displayUniqueValues(uniqueValues1, uniqueValues2) {
//     const tbody1 = document.getElementById('uniqueValues1');
//     const tbody2 = document.getElementById('uniqueValues2');
    
//     // Sort values
//     uniqueValues1.sort();
//     uniqueValues2.sort();
    
//     // Clear existing content
//     tbody1.innerHTML = '';
//     tbody2.innerHTML = '';
    
//     // Populate first table (values only in CSV1)
//     if (uniqueValues1.length > 0) {
//         uniqueValues1.forEach((value, index) => {
//             const row = document.createElement('tr');
//             row.innerHTML = `
//                 <td>${index + 1}</td>
//                 <td><span class="badge bg-warning text-dark">${escapeHtml(value)}</span></td>
//             `;
//             tbody1.appendChild(row);
//         });
//     } else {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td colspan="2" class="text-center text-muted">
//                 <i class="bi bi-info-circle me-1"></i>No unique values found
//             </td>
//         `;
//         tbody1.appendChild(row);
//     }
    
//     // Populate second table (values only in CSV2)
//     if (uniqueValues2.length > 0) {
//         uniqueValues2.forEach((value, index) => {
//             const row = document.createElement('tr');
//             row.innerHTML = `
//                 <td>${index + 1}</td>
//                 <td><span class="badge bg-info">${escapeHtml(value)}</span></td>
//             `;
//             tbody2.appendChild(row);
//         });
//     } else {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td colspan="2" class="text-center text-muted">
//                 <i class="bi bi-info-circle me-1"></i>No unique values found
//             </td>
//         `;
//         tbody2.appendChild(row);
//     }
    
//     // Update counts
//     document.getElementById('count1').textContent = uniqueValues1.length;
//     document.getElementById('count2').textContent = uniqueValues2.length;
// }

// // Calculate comparison statistics
// function calculateComparisonStats(set1, set2) {
//     const intersection = new Set([...set1].filter(x => set2.has(x)));
//     const uniqueToSet1 = new Set([...set1].filter(x => !set2.has(x)));
//     const uniqueToSet2 = new Set([...set2].filter(x => !set1.has(x)));
    
//     document.getElementById('commonCount').textContent = intersection.size;
//     document.getElementById('uniqueToFile1').textContent = uniqueToSet1.size;
//     document.getElementById('uniqueToFile2').textContent = uniqueToSet2.size;
// }

// // Enhanced export function with Papa Parse
// function exportResults() {
//     const column1Name = document.getElementById('column1Dropdown').value;
//     const column2Name = document.getElementById('column2Dropdown').value;
    
//     if (!column1Name || !column2Name) {
//         alert('Please select columns from both CSV files first.');
//         return;
//     }
    
//     const values1 = new Set();
//     const values2 = new Set();
    
//     csvData1.forEach(row => {
//         if (row[column1Name] && row[column1Name].toString().trim()) {
//             values1.add(row[column1Name].toString().trim());
//         }
//     });
    
//     csvData2.forEach(row => {
//         if (row[column2Name] && row[column2Name].toString().trim()) {
//             values2.add(row[column2Name].toString().trim());
//         }
//     });
    
//     // Get only exclusive values
//     const uniqueToCSV1 = Array.from(new Set([...values1].filter(x => !values2.has(x)))).sort();
//     const uniqueToCSV2 = Array.from(new Set([...values2].filter(x => !values1.has(x)))).sort();
    
//     // Use Papa Parse to generate CSV
//     const exportData = [];
//     const maxLength = Math.max(uniqueToCSV1.length, uniqueToCSV2.length);
    
//     for (let i = 0; i < maxLength; i++) {
//         exportData.push({
//             [`Only in ${column1Name}`]: uniqueToCSV1[i] || '',
//             [`Only in ${column2Name}`]: uniqueToCSV2[i] || ''
//         });
//     }
    
//     const csvContent = Papa.unparse(exportData, {
//         quotes: true,
//         delimiter: ",",
//         header: true
//     });
    
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.setAttribute('hidden', '');
//     a.setAttribute('href', url);
//     a.setAttribute('download', 'exclusive_values_comparison.csv');
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     window.URL.revokeObjectURL(url);
// }

// // Utility function to escape HTML
// function escapeHtml(unsafe) {
//     return unsafe
//          .replace(/&/g, "&amp;")
//          .replace(/</g, "&lt;")
//          .replace(/>/g, "&gt;")
//          .replace(/"/g, "&quot;")
//          .replace(/'/g, "&#039;");
// }

// // Reset function to clear all data
// function resetAnalytics() {
//     csvData1 = [];
//     csvData2 = [];
//     headers1 = [];
//     headers2 = [];
    
//     document.getElementById('csvFile1').value = '';
//     document.getElementById('csvFile2').value = '';
//     document.getElementById('file1Status').textContent = 'No file selected';
//     document.getElementById('file2Status').textContent = 'No file selected';
//     document.getElementById('columnSelectionSection').style.display = 'none';
//     document.getElementById('resultsSection').style.display = 'none';
    
//     document.getElementById('column1Dropdown').innerHTML = '<option value="">Select a column...</option>';
//     document.getElementById('column2Dropdown').innerHTML = '<option value="">Select a column...</option>';
// }

// // Add keyboard shortcuts
// document.addEventListener('keydown', function(e) {
//     // Ctrl+R to reset analytics
//     if (e.ctrlKey && e.key === 'r') {
//         e.preventDefault();
//         if (document.getElementById('csvfilter-section').style.display !== 'none') {
//             resetAnalytics();
//         }
//     }
    
//     // Ctrl+E to export (when results are visible)
//     if (e.ctrlKey && e.key === 'e') {
//         e.preventDefault();
//         if (document.getElementById('csvfilter-section').style.display !== 'none') {
//             exportResults();
//         }
//     }
// });

// // Drag and drop functionality
// function setupDragAndDrop() {
//     const dropZones = ['csvFile1', 'csvFile2'];
    
//     dropZones.forEach((id, index) => {
//         const input = document.getElementById(id);
//         const container = input.closest('.card-body');
        
//         container.addEventListener('dragover', function(e) {
//             e.preventDefault();
//             container.classList.add('border-primary');
//         });
        
//         container.addEventListener('dragleave', function(e) {
//             e.preventDefault();
//             container.classList.remove('border-primary');
//         });
        
//         container.addEventListener('drop', function(e) {
//             e.preventDefault();
//             container.classList.remove('border-primary');
            
//             const files = e.dataTransfer.files;
//             if (files.length > 0) {
//                 input.files = files;
//                 handleFileUpload(index + 1);
//             }
//         });
//     });
// }

// // Initialize drag and drop when DOM is loaded
// document.addEventListener('DOMContentLoaded', function() {
//     setupDragAndDrop();
// });

// // Enhanced populate dropdown with text truncation
// function populateDropdown(dropdownId, headers) {
//     const dropdown = document.getElementById(dropdownId);
//     dropdown.innerHTML = '<option value="">Select a column...</option>';
    
//     headers.forEach((header, index) => {
//         const option = document.createElement('option');
//         option.value = header;
        
//         // Truncate long column names for display
//         const displayName = header.length > 30 ? header.substring(0, 30) + '...' : header;
//         option.textContent = displayName;
        
//         // Add full name as title for tooltip
//         option.title = header;
        
//         dropdown.appendChild(option);
//     });
    
//     // Add Bootstrap tooltip functionality
//     dropdown.setAttribute('data-bs-toggle', 'tooltip');
//     dropdown.setAttribute('data-bs-placement', 'top');
//     dropdown.setAttribute('title', 'Select a column to compare');
// }


// CSV handling variables
let csvData1 = [];
let csvData2 = [];
let headers1 = [];
let headers2 = [];

// Show/hide "ignore postfix" filter when both CSVs uploaded
function checkShowPostfixOption() {
    if (csvData1.length > 0 && csvData2.length > 0) {
        document.getElementById('columnSelectionSection').style.display = 'block';
        document.getElementById('postfixFilterOption').style.display = 'block'; // Now visible!
    }
}

// Enhanced file upload with Papa Parse
function handleFileUpload(fileNumber) {
    const fileInput = document.getElementById(`csvFile${fileNumber}`);
    const statusDiv = document.getElementById(`file${fileNumber}Status`);
    const file = fileInput.files[0];
    
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        statusDiv.innerHTML = `<span class="text-info"><i class="bi bi-hourglass-split me-1"></i>Processing ${file.name}...</span>`;
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            trimHeaders: true,
            dynamicTyping: false,
            complete: function(results) {
                if (results.errors.length > 0) {
                    console.warn('CSV parsing warnings:', results.errors);
                    const criticalErrors = results.errors.filter(error => error.type === 'Delimiter');
                    if (criticalErrors.length > 0) {
                        statusDiv.innerHTML = `<span class="text-warning"><i class="bi bi-exclamation-triangle me-1"></i>File parsed with warnings. Check console for details.</span>`;
                    }
                }
                
                const headers = results.meta.fields;
                const data = results.data;
                
                if (fileNumber === 1) {
                    csvData1 = data;
                    headers1 = headers;
                    populateDropdown('column1Dropdown', headers1);
                    statusDiv.innerHTML = `<span class="text-success"><i class="bi bi-check-circle me-1"></i>${file.name} uploaded successfully (${data.length} rows, ${headers.length} columns)</span>`;
                } else {
                    csvData2 = data;
                    headers2 = headers;
                    populateDropdown('column2Dropdown', headers2);
                    statusDiv.innerHTML = `<span class="text-success"><i class="bi bi-check-circle me-1"></i>${file.name} uploaded successfully (${data.length} rows, ${headers.length} columns)</span>`;
                }
                checkShowPostfixOption();
            },
            error: function(error) {
                statusDiv.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Error parsing CSV: ${error.message}</span>`;
                console.error('Papa Parse Error:', error);
            }
        });
    } else {
        statusDiv.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Please select a valid CSV file</span>`;
    }
}

// Populate dropdown with headers (supports tooltip)
function populateDropdown(dropdownId, headers) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '<option value="">Select a column...</option>';
    headers.forEach((header) => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header.length > 30 ? header.substring(0, 30) + '...' : header;
        option.title = header;
        dropdown.appendChild(option);
    });
}

// Utility: trim -BE, -BZ, -RE (case-insensitive) postfixes
function trimPostfix(val) {
    if (typeof val !== 'string') return val;
    return val.replace(/-(BE|BZ|RE)$/i, '');
}

// Generate unique values and show results, with or without postfix filtering
function generateUniqueValues() {
    const column1Name = document.getElementById('column1Dropdown').value;
    const column2Name = document.getElementById('column2Dropdown').value;
    if (column1Name && column2Name) {
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('uniqueValues1').innerHTML =
            '<tr><td colspan="2" class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Processing...</td></tr>';
        document.getElementById('uniqueValues2').innerHTML =
            '<tr><td colspan="2" class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Processing...</td></tr>';
        setTimeout(() => {
            const ignorePostfix = document.getElementById('ignorePostfixCheck')?.checked;

            // Build Sets, optionally trimming postfix
            let values1 = new Set();
            let values2 = new Set();
            csvData1.forEach(row => {
                if (row[column1Name] && row[column1Name].toString().trim()) {
                    let val = row[column1Name].toString().trim();
                    if (ignorePostfix) val = trimPostfix(val);
                    values1.add(val);
                }
            });
            csvData2.forEach(row => {
                if (row[column2Name] && row[column2Name].toString().trim()) {
                    let val = row[column2Name].toString().trim();
                    if (ignorePostfix) val = trimPostfix(val);
                    values2.add(val);
                }
            });

            // Find unique values
            const uniqueToCSV1 = new Set([...values1].filter(x => !values2.has(x)));
            const uniqueToCSV2 = new Set([...values2].filter(x => !values1.has(x)));

            // Show postfix filter indicator
            showPostfixFilterBadge(ignorePostfix);

            displayUniqueValues(Array.from(uniqueToCSV1), Array.from(uniqueToCSV2));
            document.getElementById('file1ColumnName').textContent = column1Name;
            document.getElementById('file2ColumnName').textContent = column2Name;
            calculateComparisonStats(values1, values2);

        }, 100);
    }
}

// Show/hide a badge that indicates postfix filtering is active
function showPostfixFilterBadge(isActive) {
    let badge = document.getElementById('postfixFilterActiveBadge');
    if (isActive) {
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'postfixFilterActiveBadge';
            badge.innerHTML = `<span class="badge bg-info mb-2">
                <i class="bi bi-funnel me-1"></i>
                Postfix filter active ("-BE", "-BZ", "-RE" matched)
            </span>`;
            document.getElementById('resultsSection').prepend(badge);
        }
    } else if (badge) {
        badge.remove();
    }
}

// Display unique values in tables as before
function displayUniqueValues(uniqueValues1, uniqueValues2) {
    const tbody1 = document.getElementById('uniqueValues1');
    const tbody2 = document.getElementById('uniqueValues2');
    uniqueValues1.sort();
    uniqueValues2.sort();
    tbody1.innerHTML = '';
    tbody2.innerHTML = '';

    if (uniqueValues1.length > 0) {
        uniqueValues1.forEach((value, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><span class="badge bg-warning text-dark">${escapeHtml(value)}</span></td>
            `;
            tbody1.appendChild(row);
        });
    } else {
        tbody1.innerHTML = `<tr><td colspan="2" class="text-center text-muted">
                <i class="bi bi-info-circle me-1"></i>No unique values found
            </td></tr>`;
    }
    if (uniqueValues2.length > 0) {
        uniqueValues2.forEach((value, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><span class="badge bg-info">${escapeHtml(value)}</span></td>
            `;
            tbody2.appendChild(row);
        });
    } else {
        tbody2.innerHTML = `<tr><td colspan="2" class="text-center text-muted">
                <i class="bi bi-info-circle me-1"></i>No unique values found
            </td></tr>`;
    }
    document.getElementById('count1').textContent = uniqueValues1.length;
    document.getElementById('count2').textContent = uniqueValues2.length;
}

// Calculate comparison statistics
function calculateComparisonStats(set1, set2) {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const uniqueToSet1 = new Set([...set1].filter(x => !set2.has(x)));
    const uniqueToSet2 = new Set([...set2].filter(x => !set1.has(x)));
    document.getElementById('commonCount').textContent = intersection.size;
    document.getElementById('uniqueToFile1').textContent = uniqueToSet1.size;
    document.getElementById('uniqueToFile2').textContent = uniqueToSet2.size;
}

// Export (unchanged)
function exportResults() {
    const column1Name = document.getElementById('column1Dropdown').value;
    const column2Name = document.getElementById('column2Dropdown').value;
    if (!column1Name || !column2Name) {
        alert('Please select columns from both CSV files first.');
        return;
    }

    // Use current filter state for export
    const ignorePostfix = document.getElementById('ignorePostfixCheck')?.checked;
    let values1 = new Set();
    let values2 = new Set();
    csvData1.forEach(row => {
        if (row[column1Name] && row[column1Name].toString().trim()) {
            let val = row[column1Name].toString().trim();
            if (ignorePostfix) val = trimPostfix(val);
            values1.add(val);
        }
    });
    csvData2.forEach(row => {
        if (row[column2Name] && row[column2Name].toString().trim()) {
            let val = row[column2Name].toString().trim();
            if (ignorePostfix) val = trimPostfix(val);
            values2.add(val);
        }
    });

    const uniqueToCSV1 = Array.from(new Set([...values1].filter(x => !values2.has(x)))).sort();
    const uniqueToCSV2 = Array.from(new Set([...values2].filter(x => !values1.has(x)))).sort();

    const exportData = [];
    const maxLength = Math.max(uniqueToCSV1.length, uniqueToCSV2.length);
    for (let i = 0; i < maxLength; i++) {
        exportData.push({
            [`Only in ${column1Name}`]: uniqueToCSV1[i] || '',
            [`Only in ${column2Name}`]: uniqueToCSV2[i] || ''
        });
    }
    const csvContent = Papa.unparse(exportData, {
        quotes: true, delimiter: ",", header: true
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'exclusive_values_comparison.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Utility function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Reset function to clear all data
function resetAnalytics() {
    csvData1 = [];
    csvData2 = [];
    headers1 = [];
    headers2 = [];

    document.getElementById('csvFile1').value = '';
    document.getElementById('csvFile2').value = '';
    document.getElementById('file1Status').textContent = 'No file selected';
    document.getElementById('file2Status').textContent = 'No file selected';
    document.getElementById('columnSelectionSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('postfixFilterOption').style.display = 'none';
    const badge = document.getElementById('postfixFilterActiveBadge');
    if (badge) badge.remove();

    document.getElementById('column1Dropdown').innerHTML = '<option value="">Select a column...</option>';
    document.getElementById('column2Dropdown').innerHTML = '<option value="">Select a column...</option>';
}

// Drag and drop functionality
function setupDragAndDrop() {
    const dropZones = ['csvFile1', 'csvFile2'];
    dropZones.forEach((id, index) => {
        const input = document.getElementById(id);
        const container = input.closest('.card-body');
        container.addEventListener('dragover', function(e) { e.preventDefault(); container.classList.add('border-primary'); });
        container.addEventListener('dragleave', function(e) { e.preventDefault(); container.classList.remove('border-primary'); });
        container.addEventListener('drop', function(e) {
            e.preventDefault();
            container.classList.remove('border-primary');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                handleFileUpload(index + 1);
            }
        });
    });
}

// Initialize drag and drop when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupDragAndDrop();
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+R to reset analytics
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (document.getElementById('csvfilter-section') && document.getElementById('csvfilter-section').style.display !== 'none') {
            resetAnalytics();
        }
    }
    // Ctrl+E to export
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        if (document.getElementById('csvfilter-section') && document.getElementById('csvfilter-section').style.display !== 'none') {
            exportResults();
        }
    }
});
