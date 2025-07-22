let ifscData = null;
let validationTimeout = null;

// Handle IFSC input with real-time validation
function handleIFSCInput() {
    const input = document.getElementById('ifscInput');
    let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    input.value = value;
    
    // Clear previous timeout
    clearTimeout(validationTimeout);
    
    // ALWAYS clear everything when user types
    completelyResetAll();
    
    if (value.length === 0) {
        updateValidationStatus('Enter IFSC code to validate', 'muted');
        return;
    }
    
    // Basic format validation
    if (value.length < 11) {
        updateValidationStatus(`${11 - value.length} more characters needed`, 'warning');
    } else if (value.length === 11) {
        if (isValidIFSCFormat(value)) {
            updateValidationStatus('Format looks good! Click validate', 'success');
        } else {
            updateValidationStatus('Format may have errors - check below', 'warning');
            showPotentialMistakes(value);
        }
    } else {
        input.value = value.substring(0, 11); // Trim to 11 characters
    }
}

// Check if IFSC format is valid
function isValidIFSCFormat(ifsc) {
    // IFSC format: 4 letters + 1 zero + 6 alphanumeric
    const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return regex.test(ifsc);
}

// Update validation status
function updateValidationStatus(message, type) {
    const statusDiv = document.getElementById('validationStatus');
    const iconClass = {
        'muted': 'bi-info-circle',
        'warning': 'bi-exclamation-triangle',
        'success': 'bi-check-circle',
        'danger': 'bi-x-circle'
    };
    
    statusDiv.innerHTML = `
        <i class="bi ${iconClass[type]} me-1 text-${type}"></i>
        <small class="text-${type} fw-bold">${message}</small>
    `;
}

// Show potential mistakes without auto-correction
function showPotentialMistakes(ifsc) {
    const mistakes = findPotentialMistakes(ifsc);
    
    if (mistakes.length > 0) {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = `
            <div class="alert alert-info mb-3">
                <h6><i class="bi bi-info-circle me-2"></i>Potential Issues Detected:</h6>
                <p class="mb-2">Please review your IFSC code. We found these possible mistakes:</p>
            </div>
        `;
        
        mistakes.forEach((mistake, index) => {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-warning mb-2';
            alertDiv.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                    <div class="flex-grow-1">
                        <strong>Position ${mistake.position}:</strong> 
                        "${mistake.character}" ${mistake.issue}
                        <br><small class="text-muted">${mistake.suggestion}</small>
                    </div>
                </div>
            `;
            suggestionsList.appendChild(alertDiv);
        });
        
        // Add general help
        const helpDiv = document.createElement('div');
        helpDiv.className = 'alert alert-light mt-3';
        helpDiv.innerHTML = `
            <h6><i class="bi bi-lightbulb me-2"></i>IFSC Format Help:</h6>
            <ul class="mb-0">
                <li><strong>First 4 characters:</strong> Bank code (letters only)</li>
                <li><strong>5th character:</strong> Always "0" (zero)</li>
                <li><strong>Last 6 characters:</strong> Branch code (letters and numbers)</li>
            </ul>
            <small class="text-muted">Example: SBIN0001234, HDFC0000123, ICIC0000456</small>
        `;
        suggestionsList.appendChild(helpDiv);
        
        document.getElementById('suggestionsSection').style.display = 'block';
    }
}

// Find potential mistakes in IFSC code
function findPotentialMistakes(ifsc) {
    const mistakes = [];
    
    // Check each position for common mistakes
    for (let i = 0; i < ifsc.length; i++) {
        const char = ifsc[i];
        const position = i + 1;
        
        // Check first 4 positions (should be letters)
        if (i < 4) {
            if (/[0-9]/.test(char)) {
                const possibleLetters = {
                    '0': 'O (letter O)',
                    '1': 'I (letter I) or L (letter L)',
                    '5': 'S (letter S)',
                    '2': 'Z (letter Z)',
                    '8': 'B (letter B)',
                    '6': 'G (letter G)',
                    '7': 'T (letter T)',
                    '3': 'E (letter E)',
                    '4': 'A (letter A)'
                };
                
                if (possibleLetters[char]) {
                    mistakes.push({
                        position: position,
                        character: char,
                        issue: 'is a number but should be a letter',
                        suggestion: `Did you mean ${possibleLetters[char]}?`
                    });
                }
            }
        }
        
        // Check 5th position (should always be 0)
        if (i === 4) {
            if (char !== '0') {
                mistakes.push({
                    position: position,
                    character: char,
                    issue: 'should always be "0" (zero)',
                    suggestion: 'The 5th character in IFSC codes is always zero'
                });
            }
        }
        
        // Check last 6 positions (can be letters or numbers, but check common mistakes)
        if (i >= 5) {
            const possibleCorrections = {
                'O': '0 (zero)',
                'o': '0 (zero)',
                'I': '1 (one)',
                'l': '1 (one)',
                'L': '1 (one)',
                'S': '5 (five)',
                'Z': '2 (two)',
                'B': '8 (eight)',
                'G': '6 (six)',
                'T': '7 (seven)'
            };
            
            if (possibleCorrections[char]) {
                mistakes.push({
                    position: position,
                    character: char,
                    issue: 'might be confused with a similar character',
                    suggestion: `Did you mean ${possibleCorrections[char]}?`
                });
            }
        }
    }
    
    return mistakes;
}

// Validate IFSC code via API - COMPLETELY FIXED
async function validateIFSC() {
    const ifscInput = document.getElementById('ifscInput');
    const ifscCode = ifscInput.value.trim().toUpperCase();
    
    if (!ifscCode) {
        updateValidationStatus('Please enter an IFSC code', 'danger');
        return;
    }
    
    if (ifscCode.length !== 11) {
        updateValidationStatus('IFSC code must be exactly 11 characters', 'danger');
        return;
    }
    
    // STEP 1: Completely reset everything before starting
    completelyResetAll();
    
    // STEP 2: Show loading
    document.getElementById('loadingSection').style.display = 'block';
    updateValidationStatus('Validating...', 'muted');
    
    try {
        const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
        
        if (response.ok) {
            // STEP 3: Success - Complete reset and show bank details
            completelyResetAll();
            
            ifscData = await response.json();
            displayBankDetails(ifscData);
            updateValidationStatus('✓ IFSC code validated successfully!', 'success');
        } else if (response.status === 404) {
            throw new Error('IFSC code not found');
        } else {
            throw new Error(`Server error: ${response.status}`);
        }
    } catch (error) {
        // STEP 4: Error - Complete reset and show error
        completelyResetAll();
        
        console.error('IFSC validation error:', error);
        let errorMessage = 'The IFSC code is not valid or doesn\'t exist in our database.';
        
        if (error.message.includes('not found')) {
            errorMessage = 'This IFSC code was not found. Please double-check the code for any typing errors.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to the validation service. Please check your internet connection and try again.';
        }
        
        showError(errorMessage);
        updateValidationStatus('❌ IFSC code not found', 'danger');
        
        // Show potential mistakes when validation fails
        const currentIFSC = document.getElementById('ifscInput').value;
        if (currentIFSC.length === 11) {
            showPotentialMistakes(currentIFSC);
        }
    } finally {
        document.getElementById('loadingSection').style.display = 'none';
    }
}

// Display bank details - NO PREVIOUS CLEARING NEEDED (already done)
function displayBankDetails(data) {
    // Update summary cards
    document.getElementById('bankName').textContent = data.BANK || 'N/A';
    document.getElementById('branchName').textContent = data.BRANCH || 'N/A';
    document.getElementById('cityName').textContent = data.CITY || 'N/A';
    document.getElementById('stateName').textContent = data.STATE || 'N/A';
    
    // Update detailed information
    document.getElementById('ifscCode').textContent = data.IFSC || 'N/A';
    document.getElementById('bankCode').textContent = data.BANKCODE || 'N/A';
    document.getElementById('micrCode').textContent = data.MICR || 'N/A';
    document.getElementById('swiftCode').textContent = data.SWIFT || 'Not Available';
    document.getElementById('addressDetails').textContent = data.ADDRESS || 'N/A';
    document.getElementById('districtName').textContent = data.DISTRICT || 'N/A';
    document.getElementById('centreName').textContent = data.CENTRE || 'N/A';
    document.getElementById('contactInfo').textContent = data.CONTACT || 'Not Available';
    
    // Update service indicators
    updateServiceIndicator('rtgsService', data.RTGS);
    updateServiceIndicator('neftService', data.NEFT);
    updateServiceIndicator('impsService', data.IMPS);
    updateServiceIndicator('upiService', data.UPI);
    
    // Show ONLY the bank details section
    document.getElementById('bankDetailsSection').style.display = 'block';
}

// Update service indicator
function updateServiceIndicator(elementId, isAvailable) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const serviceName = element.querySelector('.fw-bold')?.textContent || elementId;
    
    if (isAvailable) {
        element.className = 'service-indicator text-success';
        element.innerHTML = `
            <i class="bi bi-check-circle-fill fs-4 text-success"></i>
            <div class="fw-bold mt-1">${serviceName}</div>
            <small class="text-success">Available</small>
        `;
    } else {
        element.className = 'service-indicator text-muted';
        element.innerHTML = `
            <i class="bi bi-x-circle fs-4 text-muted"></i>
            <div class="fw-bold mt-1">${serviceName}</div>
            <small class="text-muted">Not Available</small>
        `;
    }
}

// Show error message
function showError(message) {
    const errorMessageElement = document.getElementById('errorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
    const errorSection = document.getElementById('errorSection');
    if (errorSection) {
        errorSection.style.display = 'block';
    }
}

// NEW FUNCTION: Complete reset of everything
function completelyResetAll() {
    // Hide all sections
    const sections = [
        'suggestionsSection',
        'loadingSection', 
        'bankDetailsSection',
        'errorSection'
    ];
    
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Clear all content completely
    const suggestionsList = document.getElementById('suggestionsList');
    if (suggestionsList) {
        suggestionsList.innerHTML = '';
    }
    
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.innerHTML = '';
    }
    
    // Clear bank details content (THIS WAS MISSING!)
    const bankDetailsSection = document.getElementById('bankDetailsSection');
    if (bankDetailsSection) {
        // Clear all bank detail fields
        const bankDetailFields = [
            'bankName', 'branchName', 'cityName', 'stateName',
            'ifscCode', 'bankCode', 'micrCode', 'swiftCode',
            'addressDetails', 'districtName', 'centreName', 'contactInfo'
        ];
        
        bankDetailFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.textContent = '';
            }
        });
        
        // Clear service indicators
        const serviceFields = ['rtgsService', 'neftService', 'impsService', 'upiService'];
        serviceFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.innerHTML = '';
                element.className = 'service-indicator';
            }
        });
    }
    
    // Reset data
    ifscData = null;
}

// Clear IFSC form - Use the complete reset
function clearIFSCForm() {
    const input = document.getElementById('ifscInput');
    if (input) {
        input.value = '';
    }
    
    completelyResetAll();
    updateValidationStatus('Enter IFSC code to validate', 'muted');
}

// Initialize IFSC validator
function ifscValidatorInit() {
    console.log('IFSC Validator initialized');
    clearIFSCForm();
}

// Make functions globally available
window.handleIFSCInput = handleIFSCInput;
window.validateIFSC = validateIFSC;
window.clearIFSCForm = clearIFSCForm;
window.ifscValidatorInit = ifscValidatorInit;

// Add Enter key support
document.addEventListener('keydown', function(e) {
    if (document.getElementById('ifsc-section') && 
        document.getElementById('ifsc-section').style.display !== 'none' && 
        e.key === 'Enter') {
        const ifscInput = document.getElementById('ifscInput');
        if (document.activeElement === ifscInput) {
            e.preventDefault();
            validateIFSC();
        }
    }
});
