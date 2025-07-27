export default {
    // File settings
    MAX_FILE_NAME_LENGTH: 15,
    MAX_DROPDOWN_TEXT_LENGTH: 30,
    ELLIPSIS_LENGTH: 3,
    ELLIPSIS: "...",
    CSV_FILE_EXTENSION: ".csv",
    CSV_MIME_TYPES: ["text/csv", "application/vnd.ms-excel"],
    CSV_DELIMITER: ",",
    CSV_BLOB_TYPE: "text/csv;charset=utf-8;",
    EXPORT_FILENAME: "exclusive_values_comparison.csv",

    // Default values
    DEFAULT_FILE1_NAME: "File 1",
    DEFAULT_FILE2_NAME: "File 2",
    DROPDOWN_DEFAULT_OPTION: '<option value="">Select a column...</option>',
    ZERO_COUNT: "0",

    // Regex patterns
    ISIN_REGEX: "^[A-Z]{2}[A-Z0-9]{10}$",
    POSTFIX_REGEX: "-(BE|BZ|RE|ST|SM|EQ|M|T|Z|X|XT)$",

    // Display settings
    DISPLAY_BLOCK: "block",
    DISPLAY_NONE: "none",
    PROCESSING_DELAY: 100,

    // CSS classes
    DRAG_OVER_CLASS: "border-primary",

    // Error handling
    CRITICAL_ERROR_TYPE: "Delimiter",

    // Messages
    MESSAGES: {
        PROCESSING: "Processing",
        CSV_WARNINGS: "CSV parsing warnings:",
        FILE_WARNINGS: "File parsed with warnings. Check console for details.",
        UPLOAD_SUCCESS: "uploaded successfully",
        CSV_ERROR: "Error parsing CSV",
        PAPA_ERROR: "Papa Parse Error:",
        INVALID_FILE: "Please select a valid CSV file",
        SELECT_COLUMNS_FIRST: "Please select columns from both CSV files first.",
        NO_FILE_SELECTED: "No file selected"
    },

    // HTML templates
    LOADING_HTML: '<tr><td colspan="2" class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Processing...</td></tr>',
    NO_UNIQUE_VALUES_HTML: '<tr><td colspan="2" class="text-center text-muted"><i class="bi bi-info-circle me-1"></i>No unique values found</td></tr>',
    POSTFIX_FILTER_BADGE_HTML: '<span class="badge bg-info mb-2"><i class="bi bi-funnel me-1"></i>Postfix filter active ("-BE", "-BZ", "-RE" matched)</span>',
    DEFAULT_FILE1_HEADER: '<i class="bi bi-exclamation-triangle me-1"></i>Only in File 1',
    DEFAULT_FILE2_HEADER: '<i class="bi bi-info-circle me-1"></i>Only in File 2',

    // Element IDs
    ELEMENT_IDS: {
        CSV_FILTER_SECTION: "csvfilter-section",
        CSV_FILE1: "csvFile1",
        CSV_FILE2: "csvFile2",
        FILE1_STATUS: "file1Status",
        FILE2_STATUS: "file2Status",
        COLUMN_SELECTION: "columnSelectionSection",
        FILTER_OPTIONS_CARD: "filterOptionsCard",
        COLUMN1_DROPDOWN: "column1Dropdown",
        COLUMN2_DROPDOWN: "column2Dropdown",
        RESULTS_SECTION: "resultsSection",
        UNIQUE_VALUES1: "uniqueValues1",
        UNIQUE_VALUES2: "uniqueValues2",
        IGNORE_POSTFIX_CHECK: "ignorePostfixCheck",
        IGNORE_ISIN_CHECK: "ignoreIsinCheck",
        POSTFIX_FILTER_BADGE: "postfixFilterActiveBadge",
        FILE1_RESULT_HEADER: "file1ResultHeader",
        FILE2_RESULT_HEADER: "file2ResultHeader",
        COUNT1: "count1",
        COUNT2: "count2",
        COMMON_COUNT: "commonCount",
        UNIQUE_TO_FILE1: "uniqueToFile1",
        UNIQUE_TO_FILE2: "uniqueToFile2"
    },

    // Keyboard shortcuts
    KEYBOARD_SHORTCUTS: {
        RESET: "r",
        EXPORT: "e"
    }
};
