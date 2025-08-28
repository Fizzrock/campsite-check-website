/**
 * =================================================================================================
 * RECREATION.GOV CAMPSITE AVAILABILITY CHECKER
 * Version: 2.5.0
 * =================================================================================================
 *
 * Description:
 * An interactive web application for checking campsite availability on Recreation.gov.
 * This tool provides a user interface to dynamically configure searches, fetches data
 * securely through a server-side proxy, and presents the results in a detailed,
 * user-friendly format on a main web page and in several specialized new tabs.
 *
 * Code Structure:
 * The project is structured as a modern web application with a clear separation of concerns:
 * - `index.html`: Contains the HTML structure for the user interface form.
 * - `style.css`: Provides styling for the application.
 * - `campgroundAvailability.js`: The main frontend script containing UI management and rendering logic.
 *   - UI Initialization (`initializePage`): Sets up the form, populates presets, and attaches event listeners.
 *   - Dynamic Configuration (`buildConfigFromForm`): Builds the search configuration from the UI on demand.
 *   - Core Logic (`runAvailabilityCheck`): The main entry point that orchestrates the data fetching and rendering.
 * - `services/apiService.js`: A dedicated service module that encapsulates all external API fetching logic, error handling, and data shaping.
 * - `api/fetch-ridb.js`: A Vercel serverless function that acts as a secure proxy for all external API calls.
 * - `middleware.js`: Vercel Edge Middleware that provides password protection for the entire site.
 * - `presets.json`: An external file for managing campground presets, loaded dynamically by the application.
 *
 * Key Features:
 * - Architectural Refactoring: The application has been refactored to use a dedicated API service module, improving separation of concerns, maintainability, and testability.
 * - Interactive UI: Dynamically configure searches using a web form instead of editing code.
 * - External Presets: Manage favorite campgrounds and site lists in an easy-to-edit `presets.json` file.
 * - Shareable Searches: Generate and copy bookmarkable URLs that contain your exact search configuration, including all UI options.
 * - Modular & Secure API Handling: All external API calls are encapsulated in a dedicated service module and routed through a server-side proxy, keeping the API key safe and the main application logic clean.
 * - Mobile-First Responsive Design: The user interface, including the configuration form and title, now adapts for a better viewing experience on mobile devices.
 * - Intelligent API Management: Implemented "lazy loading" for site details to prevent API rate-limiting and improve performance. Details are fetched on-demand or capped at a reasonable limit.
 * - Search Constraints: Enforces a maximum 40-day search window and a 30-site filter limit to ensure efficient and predictable queries.
 * - Comprehensive Data Display: Presents detailed information about campgrounds, recreation areas, events, and media,
 *   as well as rich metadata like reservation rules, notices, activities, and facility rates in a clean, organized main page view. Data tables are now cleaner, with configurable columns and explicit row counts for better readability.
 * - Rich Summary Data: Displays at-a-glance information on the main page, including user ratings, price ranges, site counts,
 *   and cell coverage scores, sourced from an additional internal Rec.gov API.
 * - Global Sort Control: A single checkbox now controls the sort order (by Site or by Date) across all data tables for a consistent user experience.
 * - Enhanced Filtered Results: The "Filtered Sites" tab provides detailed summaries for both "Available" and "Not Reservable" dates,
 *   both for the overall tab and for each individual site.
 * - Explicit Cache Status: Always know if you're seeing live or cached data with a clear status indicator on every results page.
 * - Enhanced Debugging: The debug output now includes a summary of all API calls, flagging any non-200 responses for quick diagnostics.
 * - Password Protection: The live deployment is protected by a simple but effective access code via middleware.
 *
 * APIs Used:
 * This application leverages two primary data sources, each with distinct purposes:
 *
 * 1. Recreation.gov Internal APIs (Unofficial, Not Publicly Documented):
 *    These are the internal, undocumented APIs that the official Recreation.gov website uses.
 *    They provide real-time availability data but are not officially supported and may change without notice.
 *
 *    - Availability API (`.../api/camps/availability/campground/...`):
 *      The core endpoint for fetching the day-by-day availability grid for a specific campground and month.
 *
 *    - Metadata API (`.../api/camps/campgrounds/...`):
 *      Provides rich campground-specific metadata, including booking windows, reservation rules, fee policies,
 *      and important notices. It also provides the crucial `facility_id` needed to link to the RIDB API.
 *
 *    - Search API (`.../api/search?fq=id:...`):
 *      A general-purpose search endpoint that provides a high-level summary of a facility, including user
 *      ratings, price ranges, site counts, and cell coverage, which are not available elsewhere.
 *
 * 2. RIDB (Recreation Information Database) Public API:
 *    - `https://ridb.recreation.gov/api/v1/...`
 *    This is the official, documented, and stable API for recreation data. It requires a registered API key
 *    and is used to fetch rich, detailed information about facilities, recreation areas, events, media,
 *    and individual campsites.
 *
 * Relationship with `run-and-save-debug.js`:
 * This script is designed to be run in a browser, but it can also be automated for
 * unattended data capture using a Node.js script like `run-and-save-debug.js`
 * which uses Puppeteer.
 *
 * The automation works as follows:
 * 1. The Puppeteer script launches a headless browser.
 * 2. It navigates to the running local development server (see workflow below).
 * 3. It waits for this script to complete its execution.
 * 4. This script signals completion by assigning the `debugInfo` object to `window.debugInfo`.
 * 5. The Puppeteer script then extracts this `debugInfo` object and saves it to a
 *    timestamped JSON file.
 *
 * --- Automation Workflow ---
 * 1. **Start the Local Server**: In one terminal, start the local development server.
 *    Remember to provide the API key if needed on your system:
 *    `$env:RIDB_API_KEY="YOUR_KEY_HERE"; npm start`
 *
 * 2. **Update the Automation Script**: Modify your Puppeteer script (`run-and-save-debug.js`)
 *    to navigate to the local server's URL instead of a local file path.
 *    Change: `await page.goto('file:///path/to/your/index.html');`
 *    To:     `await page.goto('http://localhost:3000');`
 *
 * 3. **Run the Automation Script**: In a second terminal, run your Node.js script:
 *    `node run-and-save-debug.js`
 *
 * How to Run and Debug in VS Code:
 *
 * This project now includes a server-side component (the `/api/fetch-ridb.js` proxy) to
 * securely handle the API key. Therefore, you can't just open `index.html` directly.
 * You must use the Vercel CLI to run a local development server that mimics the
 * production environment.
 *
 * --- One-Time Setup ---
 * 1. Install Node.js: Make sure you have Node.js installed on your system.
 * 2. Install Vercel CLI: Open a terminal and run: `npm install -g vercel`
 * 3. Login to Vercel: Run `vercel login` and choose "Continue with GitHub".
 * 4. Link Project: Navigate your terminal to this project's root directory and run `vercel link`.
 *    Follow the prompts, accepting the defaults. This connects the local folder to your
 *    project on Vercel.
 *
 * --- Running the Local Server ---
 * 1. Open a terminal in the project's root directory (e.g., `.../campsite-check-website/`).
 * cd "D:\Fizzrock\My Custom Scripts\VScode Workspaces\AutomatedCampingWebStuff\WebStuff\CampgoundReservations\CampAvailable\campsite-check-website"
 *
 * 2. Pull Environment Variables: Run `vercel env pull .env.development.local`. This creates
 *    a local file with the secret API key you stored in your Vercel project settings.
 *    (Note: This file is already in `.gitignore` so it won't be committed).
 *
 * 3. Start the Server: Run `npm start`.
 *    --->>> USE --->>> $env:RIDB_API_KEY="86bad9e1-04d7-40fc-89b9-8b3cecabea10"; $env:ACCESS_CODE="a_very_secret_password_123"; npm start
 *    - This command executes `vercel dev` as defined in `package.json`.
 *    - The terminal will show `> Ready! Available at http://localhost:3000`.
 *
 * 4. Test in Browser: Open your browser and go to `http://localhost:3000`.
 * -->> USE THIS -->> http://localhost:3000/?access_code=a_very_secret_password_123
 *
 * --- Important Notes ---
 * - Pop-up Blocker: The script opens multiple tabs. The first time you run it, your browser
 *   will likely block them. Look for a "pop-up blocked" icon in the address bar and choose
 *   "Always allow pop-ups from http://localhost:3000". Then, refresh the page.
 *
 * - Local Environment Variable Workaround (if needed):
 *   If the server has trouble reading the `.env.development.local` file (which can sometimes
 *   happen on Windows), you can start the server with the API key set directly.
 *   In a PowerShell terminal, use this command:
 *   `$env:RIDB_API_KEY="YOUR_API_KEY_HERE"; npm start`
 *   You will need to do this every time you start the server in a new terminal.
 *
 * - Debugging:
 *   - Frontend: With the page open at `http://localhost:3000`, you can use your browser's
 *     Developer Tools (F12) to debug `campgroundAvailability.js` just like any other
 *     website. Set breakpoints in the "Sources" tab.
 *   - Backend: Any `console.log` statements you add to `api/fetch-ridb.js` will appear
 *     directly in the terminal window where the `npm start` command is running. Errors
 *     from the serverless function will also appear there.
 *
 * =================================================================================================
 */

import { fetchAllData as fetchAllDataFromService, fetchCampsiteDetails as fetchCampsiteDetailsFromService } from './services/apiService.js';

// --- Configuration Presets ---
/*
 * NOTE ON PRESET LOGIC:
 * Presets for the UI dropdown are now managed in the external `presets.json` file.
 * The hardcoded presets below, along with `activePreset`, are now only used to provide the
 * *initial default values* for the form when the page is loaded without any URL parameters.
 */
const preset_TuolumneMeadows = {
    campgroundId: "232448",
    sites: ['A040', 'A042', 'A044', 'A043', 'A038', 'A037', 'A034', 'A035', 'A033', 'A032', 'A028', 'A022', 'A020']
    // best sites Tuolumne Meadows = A035, 
};

const preset_RockCreek_Patti = {
    campgroundId: "233907",
    sites: [20, 21, 22, 23, 24] // Patti's favorites
};

const preset_RockCreek_All = {
    campgroundId: "233907",
    sites: [1, 12, 20, 21, 22, 23, 24, 25, 26]
};

const preset_YosemiteCreek = {
    campgroundId: "10083840",
    sites: [51, 54, 55, 58, 60, 61]
};

const preset_UpperPines = {
    campgroundId: "232447",
    sites: [] // No specific sites, will show all
};

// This will be populated by fetching presets.json on page load.
let PRESET_COLLECTION = {};

// --- Date Filtering Presets ---
// These presets define different date ranges for the availability check.
/*
 * How Date Filters Work:
 *
 * 1. `startDate`: Defines the *default starting month* for fetching data from the API.
 *    - "YYYY-MM-DDTHH%3Amm%3Ass.sssZ": Sets a fixed start month. (Note: colons must be URL-encoded as %3A).
 *    - `""` (Empty String): Dynamically defaults to the first day of the current month.
 *    - This value is primarily a fallback, used only if `filterStartDate` is not set.
 *
 * 2. `filterStartDate` & `filterEndDate`: Define the *specific date window* for displaying results.
 *    - "YYYY-MM-DD": Sets a fixed start or end date for the filter.
 *    - `""` (Empty String) for BOTH: Activates a dynamic range. `filterStartDate` becomes today,
 *      and `filterEndDate` is calculated based on `filterDurationInDays`.
 *    - `""` (Empty String) for only ONE: Disables that specific boundary of the filter.
 *
 * The `filterStartDate` and `filterEndDate` are the primary controls for both API fetching and data display.
 */
const datePreset_dynamic30Days = {
    startDate: "",
    filterStartDate: "",
    filterEndDate: "",
    filterDurationInDays: 30
};

const datePreset_specificRange = {
    startDate: "", // Not needed if filterStartDate is set
    filterStartDate: "2025-06-19",
    filterEndDate: "2025-07-19",
    filterDurationInDays: 30 // Ignored when filter dates are set
};

const datePreset_specificMonth = {
    startDate: "2025-07-01T00%3A00%3A00.000Z", // Fetches starting in July 2025
    filterStartDate: "", // Will be dynamic
    filterEndDate: "",   // Will be dynamic
    filterDurationInDays: 30
};

// --- Active Configuration ---
/*
 * NOTE ON ACTIVE CONFIGURATION:
 * The `activePreset` and `activeDatePreset` constants below now only define the
 * *initial default state* of the form when the page first loads. All subsequent
 * checks are driven by the values currently in the form fields.
 */
const activePreset = preset_TuolumneMeadows;
const activeDatePreset = datePreset_dynamic30Days;

/*
 * NOTE ON THE `config` OBJECT:
 * This object is constructed from the `activePreset` and `activeDatePreset` constants above.
 * It serves as the *default configuration* when the page is loaded without any URL parameters.
 * When a user runs a new check, a new configuration is built dynamically from the form fields.
 */
const config = {
    // --- API & Campground Identification ---
    api: {
        // The ID for the campground on Recreation.gov
        campgroundId: activePreset.campgroundId,
    },

    // --- Date Filtering Configuration ---
    filters: {
        startDate: activeDatePreset.startDate,
        filterStartDate: activeDatePreset.filterStartDate,
        filterEndDate: activeDatePreset.filterEndDate,
        filterDurationInDays: activeDatePreset.filterDurationInDays,
    },

    // --- Site Filtering Configuration ---
    siteFilters: {
        // List of specific site names to focus on. Can be numbers (e.g., 51) or strings (e.g., 'A040').
        siteNumbersToFilter: activePreset.sites,
    },
    ////////////////////////////////////////
    // --- Display & Feature Toggles ---
    ////////////////////////////////////////
    display: {
        // Main Page Features

        // New Tab Toggles
        showRawJsonTab: false, // If true, opens a new tab with the full raw JSON response from the availability API.
        showFullMetadataTab: false, // If true, opens a new tab with the full JSON from the campground metadata endpoint.
        showCampsitesObjectTab: false, // For debugging, not yet implemented
        showRecGovSearchDataTab: false, // If true, opens a new tab with the raw JSON from the Rec.gov search API.
        showDebugTab: false, // If true, opens a final tab with the entire `debugInfo` object for inspection.

        // Column Toggles
        showCampsiteIdColumn: false // If true, shows the 'Campsite ID' column in data tables.
    },
    ////////////////////////////////////////
    // --- Behavior Configuration for Tabs ---
    ////////////////////////////////////////
    tabBehavior: {
        // "Available Sites" Tab Settings
        includeNotReservableInAvailableTab: false, // If true, the "Available Sites" tab will *exclude* sites marked "Not Reservable".

        // "Filtered Sites" Tab Settings - these flags control fetching rich data like photos for specific sites
        showAllFilteredSitesStatuses: false, // If true, the "Filtered Sites" tab will show all statuses (Reserved, Closed, etc.). If false, it shows only 'Available' and 'Walk-up'.        
        fetchDetailsForAvailableOnly: false, // If true, fetches details only for 'Available' sites. If false, fetches for 'Available' and 'Walk-up' sites.

        openDebugTabInNewWindow: false // If true, the debug tab opens in a new window instead of an in-page tab.
    },

    // --- Sorting Preferences ---
    sorting: {
        // Primary sort key for all data tables. Options: "site", "date".
        primarySortKey: "date",
    }
};
// --- END if Configuration ---

// --- Sanitize Site Filter Configuration ---
// This logic ensures the site filter array is clean, unique, and properly sorted.
config.siteFilters.siteNumbersToFilter = [...new Set(config.siteFilters.siteNumbersToFilter)] // Remove duplicates
    .map(item => String(item).trim()) // Ensure all items are strings and trimmed
    .filter(item => item.length > 0) // Remove any empty strings
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // Use natural sort for "A10" vs "A2"
console.log("Sanitized siteNumbersToFilter:", config.siteFilters.siteNumbersToFilter);

// --- Centralized Debugging Object ---
// This object will be populated throughout the script's execution to provide a
// single, structured source of debugging information.
const debugInfo = {
    timestamps: {
        start: null,
        configPrepared: null,
        fetchStart: null,
        fetchComplete: null,
        renderStart: null,
        renderComplete: null,
        end: null
    },
    configuration: {
        initial: null,
        effective: null
    },
    api: {
        summary: null,
        monthsToFetch: [],
        calls: [] // Each entry: { context, url, status, error?, timestamp }
    },
    processing: {
        // Note: combinedCampsites can be large and is omitted to keep the debug object clean.
        // It can be inspected via the "Raw JSON" tab if needed.
        availabilityCounts: null, // Summary for the FILTERED date range
        fullAvailabilitySummary: null, // Summary for the ENTIRE fetched data range
        filteredSiteIdsForDetailFetch: []
    },
    rendering: {
        tabsOpened: [],
        mainPageRenderStatus: {} // e.g., { facilityDetails: true, events: 'ID_FOUND' }
    },
    errors: [] // Each entry: { context, message, stack? }
};

// --- Global state for cooldown timer ---
let cooldownIntervalId = null;
const COOLDOWN_SECONDS = 30;

// --- Constants for Availability Statuses ---
const AVAILABILITY_STATUS = {
    AVAILABLE: "Available",
    RESERVED: "Reserved",
    CLOSED: "Closed",
    OPEN: "Open",
    NYR: "NYR", // Not Yet Released
    NOT_AVAILABLE_CUTOFF: "Not Available Cutoff",
    NOT_RESERVABLE: "Not Reservable",
    UNKNOWN: "Unknown" // For default/fallback
};

/**
 * Defines the display order for items in the availability summary sections.
 */
const SUMMARY_DISPLAY_ORDER = [
    AVAILABILITY_STATUS.AVAILABLE,
    AVAILABILITY_STATUS.NOT_RESERVABLE,
    AVAILABILITY_STATUS.OPEN,    
    AVAILABILITY_STATUS.RESERVED,
    AVAILABILITY_STATUS.NYR,
    AVAILABILITY_STATUS.CLOSED,
    AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF,
];

/**
 * Defines icons for the compact summary view in the "Filtered Sites" tab.
 */
const COMPACT_SUMMARY_ICONS = {
    [AVAILABILITY_STATUS.AVAILABLE]: '✅',
    [AVAILABILITY_STATUS.NOT_RESERVABLE]: '🚶',
    [AVAILABILITY_STATUS.OPEN]: '➡️',
    [AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF]: '❌'
};

/**
 * Defines the display order for the compact summary.
 */
const COMPACT_SUMMARY_DISPLAY_ORDER = [
    AVAILABILITY_STATUS.AVAILABLE,
    AVAILABILITY_STATUS.NOT_RESERVABLE,
    AVAILABILITY_STATUS.OPEN,
    AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF
];


/**
 * @typedef {object} IdCollection
 * @property {string} campgroundId - The original campground ID from the config.
 * @property {string} facilityId - The resolved RIDB facility ID.
 * @property {string|null} recAreaId - The resolved RIDB recreation area ID.
 * @property {string} eventInfoStatus - The status of finding the RecArea ID ('ID_FOUND', 'INCOMPLETE_DATA', 'FETCH_FAILED').
 */

/**
 * @typedef {object} AllFetchedData
 * @property {object|null} campgroundMetadata - Detailed data for the campground from recreation.gov.
 * @property {object|null} facilityDetails - Detailed data for the facility from RIDB.
 * @property {object|null} recAreaDetails - Detailed data for the parent recreation area from RIDB.
 * @property {Array<object>|null} eventsData - Array of event data from RIDB.
 * @property {Array<object>|null} recAreaMedia - Array of media data for the recreation area from RIDB.
 * @property {object} combinedCampsites - The combined availability data for all fetched months.
 * @property {object|null} recGovSearchData - High-level data from the internal Rec.gov search API.
 * @property {Response} response - The raw fetch Response object from the primary availability call.
 * @property {Date} requestDateTime - The timestamp when the primary data request was made.
 * @property {IdCollection} ids - A collection of all relevant IDs.
 */

// --- In-Page Tab System ---

/**
 * Shows a specific tab panel and highlights its corresponding button.
 * This function is the core of the tab switching logic.
 * @param {string} panelId The ID of the panel to show.
 */
function showTab(panelId) {
    console.log(`[showTab] Activating tab for panel: ${panelId}`);
    const buttonContainer = document.getElementById('tab-buttons');
    const panelContainer = document.getElementById('tab-panels');

    if (!buttonContainer || !panelContainer) return;

    // Hide all panels
    const panels = panelContainer.querySelectorAll('.tab-panel');
    panels.forEach(panel => {
        panel.style.display = 'none';
    });

    // Deactivate all buttons
    const buttons = buttonContainer.querySelectorAll('button');
    buttons.forEach(button => button.classList.remove('active'));

    // Show the target panel and activate its button
    const targetPanel = document.getElementById(panelId);
    const targetButton = buttonContainer.querySelector(`button[data-panel-id="${panelId}"]`);
    if (targetPanel) targetPanel.style.display = 'block';
    if (targetButton) targetButton.classList.add('active');
}

/**
 * Creates a new tab button and its corresponding content panel.
 * @param {string} title The text to display on the tab button.
 * @returns {HTMLDivElement|null} The content panel element to which content can be added, or null on failure.
 */
function createInPageTab(title) {
    console.log(`[createInPageTab] Creating tab with title: "${title}"`);
    const buttonContainer = document.getElementById('tab-buttons');
    const panelContainer = document.getElementById('tab-panels');

    if (!buttonContainer || !panelContainer) {
        console.error("Tab container elements not found. Cannot create new tab.");
        return null;
    }

    // Create a safe ID from the title to link the button and panel
    const panelId = `tab-panel-${title.replace(/[^a-zA-Z0-9]/g, '-')}`;

    // Create the button
    const button = document.createElement('button');
    button.textContent = title;
    button.dataset.panelId = panelId; // Link button to its panel
    button.addEventListener('click', () => showTab(panelId));

    // Create the panel
    const panel = document.createElement('div');
    panel.id = panelId;
    panel.className = 'tab-panel'; // Initially hidden by CSS

    buttonContainer.appendChild(button);
    panelContainer.appendChild(panel);

    // If this is the very first tab being added, activate it by default.
    if (buttonContainer.children.length === 1) {
        showTab(panelId);
    }

    return panel;
}

/**
 * Injects the necessary CSS for the lightbox into the document's head.
 * This function ensures that the styles are available in any document (main page or new tab)
 * where the lightbox is used. It creates a <style> element and appends it.
 * @param {Document} doc The document object (e.g., `document` or `newTab.document`).
 */
function injectLightboxCSS(doc) {
    // Prevent duplicate injection
    if (doc.getElementById('lightbox-styles')) return;

    const css = `
        .lightbox-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none; /* Initially hidden */
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .lightbox-overlay.visible {
            display: flex;
            opacity: 1;
        }
        .lightbox-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .lightbox-image {
            max-width: 100%;
            max-height: 100%;
            display: block;
            border-radius: 4px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.5);
        }
        .lightbox-close {
            position: absolute;
            top: -15px;
            right: -15px;
            color: white;
            background-color: #333;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            font-size: 24px;
            line-height: 30px;
            text-align: center;
            cursor: pointer;
            font-family: Arial, sans-serif;
            font-weight: bold;
            border: 2px solid white;
        }
        .lightbox-loader {
            color: white;
            font-size: 20px;
            font-family: sans-serif;
                }
        .thumbnail-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .thumbnail-image {
            width: 150px;
            height: 100px;
            object-fit: cover;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        .thumbnail-image:hover {
            transform: scale(1.05);
        }
    `;
    const style = doc.createElement('style');
    style.id = 'lightbox-styles';
    style.textContent = css;
    doc.head.appendChild(style);
}

/**
 * Creates and appends the necessary HTML structure for the lightbox to the document's body.
 * This includes the main overlay, the content wrapper, the image element, a close button,
 * and a loading indicator.
 * @param {Document} doc The document object.
 */
function createLightboxHTML(doc) {
    // Prevent duplicate injection
    if (doc.getElementById('lightbox-overlay')) return;

    const overlay = doc.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.className = 'lightbox-overlay';

    const content = doc.createElement('div');
    content.className = 'lightbox-content';

    const image = doc.createElement('img');
    image.id = 'lightbox-image';
    image.className = 'lightbox-image';

    const loader = doc.createElement('div');
    loader.id = 'lightbox-loader';
    loader.className = 'lightbox-loader';
    loader.textContent = 'Loading...';

    const closeButton = doc.createElement('span');
    closeButton.id = 'lightbox-close';
    closeButton.className = 'lightbox-close';
    closeButton.innerHTML = '&times;';

    content.appendChild(loader);
    content.appendChild(image);
    content.appendChild(closeButton);
    overlay.appendChild(content);
    doc.body.appendChild(overlay);
}

/**
 * Initializes the lightbox component in a given document.
 * It injects the CSS and HTML, and sets up the close event listeners.
 * This should be called once for each document that will use the lightbox.
 * @param {Document} doc The document object to initialize the lightbox in.
 */
function initLightbox(doc) {
    // Ensure we only initialize once per document
    if (doc.body.dataset.lightboxInitialized) return;
    doc.body.dataset.lightboxInitialized = 'true';

    injectLightboxCSS(doc);
    createLightboxHTML(doc);

    const overlay = doc.getElementById('lightbox-overlay');
    const closeButton = doc.getElementById('lightbox-close');

    const hideFunc = () => hideLightbox(doc);

    // Close lightbox when clicking the close button or the dark background
    closeButton.addEventListener('click', hideFunc);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { // Only close if the overlay itself is clicked
            hideFunc();
        }
    });
}

/**
 * Displays the lightbox with a specific image.
 * @param {string} imageUrl The URL of the image to display.
 * @param {Document} [doc=document] The document object where the lightbox exists.
 */
function showLightbox(imageUrl, doc = document) {
    const overlay = doc.getElementById('lightbox-overlay');
    const image = doc.getElementById('lightbox-image');
    const loader = doc.getElementById('lightbox-loader');

    if (!overlay || !image || !loader) {
        console.error("Lightbox is not initialized in this document.");
        return;
    }

    image.style.display = 'none'; // Hide image while it's loading
    loader.style.display = 'block'; // Show loader
    overlay.classList.add('visible');

    image.onload = () => {
        loader.style.display = 'none'; // Hide loader
        image.style.display = 'block'; // Show image
    };
    image.onerror = () => {
        loader.textContent = 'Error: Image could not be loaded.';
    };

    image.src = imageUrl;
}

/**
 * Hides the lightbox.
 * @param {Document} [doc=document] The document object where the lightbox exists.
 */
function hideLightbox(doc = document) {
    const overlay = doc.getElementById('lightbox-overlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
}


/**
 * Checks if a given date string from the API falls within the specified filter range.
 * Handles null values for start or end, meaning an open-ended range.
 * @param {string} apiDateStr The date string from the API (e.g., "2024-07-20T00:00:00Z").
 * @param {string | null} filterStartStr The start date of the filter range (e.g., "2024-07-15").
 * @param {string | null} filterEndStr The end date of the filter range (e.g., "2024-07-25").
 * @returns {boolean} True if the date is within the range (inclusive), false otherwise.
 */
function isDateInRange(apiDateStr, filterStartStr, filterEndStr) {
    if (!filterStartStr && !filterEndStr) return true; // No date filter active

    const apiDate = new Date(apiDateStr);
    // Normalize apiDate to UTC midnight for fair date-only comparison
    // This ensures we compare dates without time influencing the outcome.
    apiDate.setUTCHours(0, 0, 0, 0);

    if (filterStartStr) {
        const startDateFilter = new Date(filterStartStr + "T00:00:00.000Z"); // Assume filter date is UTC start of day
        if (apiDate < startDateFilter) return false;
    }
    if (filterEndStr) {
        const endDateFilter = new Date(filterEndStr + "T00:00:00.000Z"); // Assume filter date is UTC start of day
        if (apiDate > endDateFilter) return false;
    }
    return true;
}

/**
 * Calculates all the necessary monthly API start dates to cover a given date range.
 * If the range is open-ended, it defaults to the single starting month.
 * @param {string | null} filterStartStr The start date of the filter range (e.g., "2024-07-15").
 * @param {string | null} filterEndStr The end date of the filter range (e.g., "2024-08-10").
 * @param {string} defaultApiMonthStartStr The fallback API start date if `filterStartStr` is null.
 * @returns {string[]} An array of unique month start date strings formatted for the API.
 */
function getMonthsToFetch(filterStartStr, filterEndStr, defaultApiMonthStartStr) {
    const months = new Set();
    const apiDateFormat = (year, month) => {
        // Month is 1-indexed for API, pad with zero
        const monthStr = String(month).padStart(2, '0');
        // Day is always 01 for monthly fetch
        return `${year}-${monthStr}-01T00%3A00%3A00.000Z`;
    };

    let currentYear, currentMonth;

    if (filterStartStr) {
        const d = new Date(filterStartStr + "T00:00:00.000Z");
        currentYear = d.getUTCFullYear();
        currentMonth = d.getUTCMonth() + 1; // JavaScript month is 0-indexed
    } else {
        const d = new Date(defaultApiMonthStartStr.replace(/%3A/g, ':'));
        currentYear = d.getUTCFullYear();
        currentMonth = d.getUTCMonth() + 1;
    }
    months.add(apiDateFormat(currentYear, currentMonth));

    if (filterEndStr) {
        const endD = new Date(filterEndStr + "T00:00:00.000Z");
        const endYear = endD.getUTCFullYear();
        const endMonth = endD.getUTCMonth() + 1;

        while (currentYear < endYear || (currentYear === endYear && currentMonth < endMonth)) {
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
            months.add(apiDateFormat(currentYear, currentMonth));
        }
    }
    return [...months];
}

/**
 * Prepares the configuration object by calculating effective dates.
 * It dynamically sets the API start date and the filter date window based on
 * the initial settings in the config object.
 * @param {object} config The initial configuration object.
 * @returns {object} The configuration object with calculated, effective dates.
 */
function prepareConfig(config) {
    // Store a snapshot of the configuration before any modifications are made.
    debugInfo.configuration.initial = JSON.parse(JSON.stringify(config));

    // --- Determine effective startDate (API default month) ---
    if (config.filters.startDate === "") {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        config.filters.startDate = `${year}-${month}-01T00%3A00%3A00.000Z`;
        console.log(`Initial 'startDate' was empty. Dynamically set to the first of the current month: ${config.filters.startDate}`);
    } else {
        // Ensure colons are properly encoded for the API URL.
        if (config.filters.startDate.includes(':') && !config.filters.startDate.includes('%3A')) {
            config.filters.startDate = config.filters.startDate.replace(/:/g, '%3A');
            console.warn(`'startDate' contained unencoded colons. Auto-encoded to: ${config.filters.startDate}`);
        }
    }

    // --- Determine effective filter dates based on configuration ---
    const MAX_SEARCH_DAYS = 40;
    let initialFilterStartDate = config.filters.filterStartDate;
    let initialFilterEndDate = config.filters.filterEndDate;

    if (initialFilterStartDate === "" && initialFilterEndDate === "") {
        if (typeof config.filters.filterDurationInDays === 'number' && config.filters.filterDurationInDays > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            config.filters.filterStartDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const endDateObj = new Date(today);
            endDateObj.setDate(today.getDate() + config.filters.filterDurationInDays);
            config.filters.filterEndDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;

            console.log(`Filter dates were empty. Using duration: ${config.filters.filterDurationInDays} days. Effective Filter Start: ${config.filters.filterStartDate}, Effective Filter End: ${config.filters.filterEndDate}`);
        }
    } else if (initialFilterStartDate !== "" && initialFilterEndDate === "") {
        // End date is missing. Set it to MAX_SEARCH_DAYS after start date.
        const startDateObj = new Date(initialFilterStartDate + "T00:00:00.000Z");
        const endDateObj = new Date(startDateObj);
        endDateObj.setUTCDate(startDateObj.getUTCDate() + MAX_SEARCH_DAYS - 1);
        config.filters.filterEndDate = `${endDateObj.getUTCFullYear()}-${String(endDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(endDateObj.getUTCDate()).padStart(2, '0')}`;
        console.log(`Filter end date was empty. Set to a ${MAX_SEARCH_DAYS}-day range: ${config.filters.filterEndDate}`);
    } else if (initialFilterStartDate === "" && initialFilterEndDate !== "") {
        // Start date is missing. Set it to MAX_SEARCH_DAYS before end date.
        const endDateObj = new Date(initialFilterEndDate + "T00:00:00.000Z");
        const startDateObj = new Date(endDateObj);
        startDateObj.setUTCDate(endDateObj.getUTCDate() - (MAX_SEARCH_DAYS - 1));
        config.filters.filterStartDate = `${startDateObj.getUTCFullYear()}-${String(startDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(startDateObj.getUTCDate()).padStart(2, '0')}`;
        console.log(`Filter start date was empty. Set to a ${MAX_SEARCH_DAYS}-day range: ${config.filters.filterStartDate}`);
    } else if (initialFilterStartDate !== "" && initialFilterEndDate !== "") {
        // Both dates are provided. Check if the range is > MAX_SEARCH_DAYS and cap it.
        const startDateObj = new Date(initialFilterStartDate + "T00:00:00.000Z");
        const endDateObj = new Date(initialFilterEndDate + "T00:00:00.000Z");
        const diffDays = (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24) + 1;

        if (diffDays > MAX_SEARCH_DAYS) {
            const newEndDateObj = new Date(startDateObj);
            newEndDateObj.setUTCDate(startDateObj.getUTCDate() + MAX_SEARCH_DAYS - 1);
            config.filters.filterEndDate = `${newEndDateObj.getUTCFullYear()}-${String(newEndDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(newEndDateObj.getUTCDate()).padStart(2, '0')}`;
            console.warn(`Provided date range of ${diffDays} days exceeds ${MAX_SEARCH_DAYS} days. Capping end date to ${config.filters.filterEndDate}`);
        }
    }

    // Store the final, effective configuration and timestamp.
    debugInfo.configuration.effective = JSON.parse(JSON.stringify(config));
    debugInfo.timestamps.configPrepared = new Date().toISOString();

    return config;
}

/**
 * Formats a Date object into a "MM-DD-YYYY" string based on its UTC components.
 * @param {Date} dateObj The date to format.
 * @returns {string} The formatted date string.
 */
function formatUTCDate(dateObj) {
    const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getUTCDate().toString().padStart(2, '0');
    const year = dateObj.getUTCFullYear();
    return `${month}-${day}-${year}`;
}

/**
 * Formats a Date object into a "MM-DD" string for concise table display.
 * @param {Date} dateObj The date to format.
 * @returns {string} The formatted date string (e.g., "08-14").
 */
function formatDateForTableDisplay(dateObj) {
    const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getUTCDate().toString().padStart(2, '0');
    return `${month}/${day}`;
}

/**
 * Generates a human-readable string describing the active date filter range.
 * @param {string|null} filterStartStr The start date of the filter (YYYY-MM-DD).
 * @param {string|null} filterEndStr The end date of the filter (YYYY-MM-DD).
 * @param {string} defaultApiMonthStartStr The fallback API start date if no filter is active.
 * @returns {string} A descriptive string with HTML formatting.
 */
function getDateRangeDisplayText(filterStartStr, filterEndStr, defaultApiMonthStartStr) {
    let text = "Showing availability ";
    if (filterStartStr && filterEndStr) {
        text += `from <strong>${formatUTCDate(new Date(filterStartStr + "T00:00:00.000Z"))}</strong> to <strong>${formatUTCDate(new Date(filterEndStr + "T00:00:00.000Z"))}</strong>.`;
    } else if (filterStartStr) {
        text += `from <strong>${formatUTCDate(new Date(filterStartStr + "T00:00:00.000Z"))}</strong> onwards.`;
    } else if (filterEndStr) {
        text += `up to <strong>${formatUTCDate(new Date(filterEndStr + "T00:00:00.000Z"))}</strong>.`;
    } else {
        // Ensure defaultApiMonthStartStr is valid before trying to parse
        try {
            text += `for the default API month (starting around ${formatUTCDate(new Date(defaultApiMonthStartStr.replace(/%3A/g, ':')))}).`;
        } catch (e) {
            text += `for the default API month (unable to parse default start date: ${defaultApiMonthStartStr}).`;
            console.error("Error parsing defaultApiMonthStartStr for display:", e);
        }
    }
    return text;
}

/**
 * Creates and initializes a new browser tab with a given title and basic structure.
 * This is a simplified version of the old tab creator, used for debugging purposes
 * to isolate issues with the in-page tab system.
 * @param {string} title The title for the new browser tab.
 * @returns {{newTab: Window, containerDiv: HTMLDivElement, doc: Document}|null} An object containing the new tab's window, a main container div, and its document, or null if the tab could not be opened.
 */
function openInNewWindow(title) {
    if (typeof window === 'undefined' || !window.open) {
        console.warn(`Cannot open new tab '${title}': 'window.open' is not available.`);
        return null;
    }
    const newTab = window.open("", "_blank");
    if (!newTab) {
        console.warn(`Could not open new tab for '${title}'. Pop-up blocker might be active.`);
        return null;
    }

    newTab.document.title = title;

    const link = newTab.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'style.css';
    newTab.document.head.appendChild(link);

    const containerDiv = newTab.document.createElement('div');
    containerDiv.className = 'tab-content-container';
    newTab.document.body.appendChild(containerDiv);

    return { newTab, containerDiv, doc: newTab.document };
}

/**
 * Generates a dynamic array of table headers based on the user's sorting preference.
 * This ensures the column order always matches the primary sort key.
 * @param {object} config The main configuration object, used to check `config.sorting.primarySortKey`.
 * @param {boolean} showCampsiteIdColumn If true, the 'Campsite ID' column will be included.
 * @param {boolean} includeActions If true, the 'Actions' column will be included.
 * @returns {string[]} An array of strings representing the ordered table headers.
 */
function getDynamicTableHeaders(config, showCampsiteIdColumn, includeActions) {
    const primarySortKey = config.sorting.primarySortKey;
    let baseHeaders = [];

    // Set the first two columns based on the primary sort key
    baseHeaders = (primarySortKey === 'site')
        ? ['Site', 'Date', 'Availability']
        : ['Date', 'Site', 'Availability']; // Default to 'date' first

    if (showCampsiteIdColumn) baseHeaders.push('Campsite ID');
    if (includeActions) baseHeaders.push('Actions');

    return baseHeaders;
}

/**
 * Creates and appends a basic <table> element with a header row to a parent element.
 * @param {Document} doc The document in which to create the elements.
 * @param {string[]} headersArray An array of strings for the table headers.
 * @param {HTMLElement} parentElement The element to append the new table to.
 * @returns {{table: HTMLTableElement, tbody: HTMLTableSectionElement}} An object containing the created table and its tbody element.
 */
function createTableStructure(doc, headersArray, parentElement) {
    const table = doc.createElement('table');
    table.style.width = '100%';
    const thead = doc.createElement('thead');
    const tbody = doc.createElement('tbody');
    const headerRow = doc.createElement('tr');

    headersArray.forEach(headerText => {
        const th = doc.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    table.appendChild(tbody);

    parentElement.appendChild(table);
    return { table, tbody }; // Return tbody for easy row appending
}
/**
 * Creates and appends a simple text-based HTML element to a parent.
 * A utility to reduce boilerplate when adding titles and paragraphs.
 * @param {Document} doc The document in which to create the element.
 * @param {HTMLElement} parentElement The parent element to append to.
 * @param {keyof HTMLElementTagNameMap} elementType The type of element to create (e.g., 'h1', 'p').
 * @param {string} textContent The text content for the new element.
 * @param {string | null} [className=null] An optional CSS class to add.
 * @returns {HTMLElement | null} The newly created element, or null if creation failed.
 */
function addInfoElement(doc, parentElement, elementType, textContent, className = null) {
    if (!doc || !parentElement) { // Guard against missing document or parent
        console.warn(`Cannot add info element '${elementType}' with text '${textContent}'. Document or parentElement is missing.`);
        return null;
    }
    const element = doc.createElement(elementType);
    element.textContent = textContent;
    if (className) element.className = className;
    parentElement.appendChild(element);
    return element;
}

/**
 * Adds standardized request and cache information to a given parent element.
 * @param {Document} doc The document object.
 * @param {HTMLElement} parentElement The element to append the info to.
 * @param {Date} requestDateTime The timestamp when the request was made.
 * @param {Response} response The fetch Response object to check for cache headers.
 */
function addRequestInfoElements(doc, parentElement, requestDateTime, response) {
    if (!doc || !parentElement || !requestDateTime || !response) return;

    addInfoElement(doc, parentElement, 'p', `Request Processed: ${requestDateTime.toLocaleString()}`, 'request-info');

    const age = response.headers.get('age');
    if (age) {
        const cacheDateTime = new Date(requestDateTime.getTime() - (parseInt(age) * 1000));
        const p = addInfoElement(doc, parentElement, 'p', '', 'request-info');
        if (p) p.innerHTML = `<strong>Data Source:</strong> Cached (Age: ${age} seconds, Created: ${cacheDateTime.toLocaleString()})`;
    } else {
        const p = addInfoElement(doc, parentElement, 'p', '', 'request-info');
        if (p) p.innerHTML = `<strong>Data Source:</strong> Live (Not from cache)`;
    }
}

/**
 * Orchestrates all rendering operations after data has been fetched.
 * It processes the availability data and then calls the specific rendering functions
 * for the main page and all configured new tabs.
 * @param {object} config The prepared configuration object.
 * @param {AllFetchedData} allData The comprehensive data object from `fetchAllData`.
 */
async function renderAllOutputs(allData, config) {
    console.log('[renderAllOutputs] Starting to render all outputs.');
    debugInfo.timestamps.renderStart = new Date().toISOString();

    const {
        campgroundMetadata,
        facilityDetails,
        recAreaDetails,
        eventsData,
        recGovSearchData,
        recAreaMedia,
        combinedCampsites,
        response,
        requestDateTime,
        ids
    } = allData;

    const finalAvailabilityData = { campsites: combinedCampsites };

    // Calculate and store the full, unfiltered summary for debugging.
    debugInfo.processing.fullAvailabilitySummary = calculateFullAvailabilitySummary(combinedCampsites);

    console.log("[renderAllOutputs] Processing data for rendering. FacilityDetails:", facilityDetails ? "Data present" : "No data");
    console.log("[renderAllOutputs] Combined campsites data:", finalAvailabilityData.campsites ? `${Object.keys(finalAvailabilityData.campsites).length} sites` : "No data");

    const { campsites, availabilityCounts } = processAvailabilityData(finalAvailabilityData || { campsites: {} }, config);

    console.log("[renderAllOutputs] Proceeding to open new tabs based on configuration.");

    // --- Primary Tabs (Filtered and Available) ---
    // Render these first so "Filtered Sites" can be the default active tab.
    await displayFilteredSitesInNewTab(campsites, availabilityCounts, config, ids.facilityId, requestDateTime, response, campgroundMetadata);

    // --- Campground Details Tab (formerly "Main") ---
    // This is now a secondary tab, rendered after the primary ones.
    const detailsTabPanel = createInPageTab('Campground Details');
    if (detailsTabPanel) {
        renderMainPage(detailsTabPanel, campgroundMetadata, facilityDetails, recAreaDetails, eventsData, recGovSearchData, recAreaMedia, campsites, availabilityCounts, requestDateTime, response, config, ids);
    }


    // --- Raw Data & Debugging Tabs ---
    console.log('[renderAllOutputs] Checking if showRawJsonTab is enabled:', config.display.showRawJsonTab);
    if (config.display.showRawJsonTab) {
        const jsonData = (finalAvailabilityData.campsites && Object.keys(finalAvailabilityData.campsites).length > 0) ? finalAvailabilityData : { message: "No combined availability data to show." };
        displayDataInNewTab(jsonData, `Full API Response (Combined)`);
    }
    console.log('[renderAllOutputs] Checking if showFullMetadataTab is enabled:', config.display.showFullMetadataTab);
    if (config.display.showFullMetadataTab && campgroundMetadata) {
        displayDataInNewTab(campgroundMetadata, `Full Campground Metadata`);
    }
    console.log('[renderAllOutputs] Checking if showRecGovSearchDataTab is enabled:', config.display.showRecGovSearchDataTab);
    if (config.display.showRecGovSearchDataTab && recGovSearchData) {
        displayDataInNewTab(recGovSearchData, `Rec.gov Search Data`);
    }

    // For diagnostics, always render the debug tab last.
    // Debug tab last
    console.log('[renderAllOutputs] Checking if showDebugTab is enabled:', config.display.showDebugTab);
    if (config.display.showDebugTab) {
        displayDebugInfoInNewTab(debugInfo, config);
    }

    debugInfo.timestamps.renderComplete = new Date().toISOString();
}

/**
 * @callback RowBuilderCallback
 * @param {Document} doc The document object of the new tab.
 * @param {object} rowData The data object for the current row.
 * @param {number} index The zero-based index of the current row.
 * @returns {HTMLTableRowElement} The constructed <tr> element.
 */

/**
 * @callback PostRenderCallback
 * @param {Document} doc The document object of the new tab.
 * @param {HTMLDivElement} container The main container div in the new tab.
 * @returns {Promise<void>}
 */

/**
 * @typedef {object} TabularDataOptions
 * @property {string} tabTitle The title for the browser tab.
 * @property {string} pageTitle The main H1 title on the page.
 * @property {Array<object>} dataRows The array of data objects to render in the table.
 * @property {Array<string>} headers The column headers for the table.
 * @property {object} config The main script configuration object.
 * @property {object} allCampsitesData The complete campsites data object, used to extract loop names.
 * @property {Date} requestDateTime The timestamp of the data request.
 * @property {Response} response The fetch response object for cache info.
 * @property {string} sortDescription Text describing how the data is sorted.
 * @property {string} noDataMessage Message to display if `dataRows` is empty.
 * @property {RowBuilderCallback} rowBuilder A function that builds a `<tr>` from a data row.
 * @property {function(Document, HTMLElement): void} [preTableRenderCallback] An optional function to run before the main table is rendered.
 * @property {PostRenderCallback} [postRenderCallback] An optional async function to run after the table is rendered.
 * @property {boolean} [isTableCollapsible=false] If true, the table will be rendered inside a collapsible accordion.
 */

/**
 * A generic renderer for creating a new browser tab and populating it with a data table.
 * This centralizes the logic for tab creation, header rendering, and table generation.
 *
 * @param {TabularDataOptions} options Configuration for the new tab.
 */
async function renderTabularDataInNewTab(options) {
    console.log('%c[renderTabularDataInNewTab] Received options:', 'color: blue; font-weight: bold;', options);
    const {
        tabTitle,
        pageTitle,
        dataRows,
        headers,
        config,
        allCampsitesData,
        requestDateTime,
        response,
        sortDescription,
        noDataMessage,
        rowBuilder,
        preTableRenderCallback,
        postRenderCallback,
        isTableCollapsible = false,
        _parentElement = null
    } = options;

    // If a parent element is passed directly, use it. Otherwise, create a new tab.
    const panel = _parentElement || createInPageTab(tabTitle);
    if (!panel) return;

    // Lightbox is already initialized on the main document.

    if (pageTitle) { // Only add H1 if a title is provided
        const h1 = addInfoElement(document, panel, 'h1', pageTitle);
        // Add a placeholder for the API status badge
        if (h1) {
            const badge = document.createElement('span');
            badge.className = 'api-status-badge';
            badge.style.display = 'none'; // Initially hidden
            // Insert the badge *after* the h1, not inside it, to keep font size consistent.
            h1.insertAdjacentElement('afterend', badge);
        }
    }

    // Display Date Range and other common headers
    const dateRangeText = getDateRangeDisplayText(config.filters.filterStartDate, config.filters.filterEndDate, config.filters.startDate);
    addInfoElement(document, panel, 'p', '').innerHTML = dateRangeText;

    // Collect and display all unique loop names from the data
    const loopNames = new Set();
    if (allCampsitesData && Object.keys(allCampsitesData).length > 0) {
        for (const cId in allCampsitesData) {
            if (allCampsitesData[cId].loop) loopNames.add(allCampsitesData[cId].loop);
        }
    }
    if (loopNames.size > 0) {
        const loopsArray = [...loopNames].sort();
        const loopLabel = loopNames.size > 1 ? "Loops" : "Loop";
        addInfoElement(document, panel, 'h3', `${loopLabel}: ${loopsArray.join(', ')}`);
    }

    // Execute the pre-table render callback if provided, to add custom headers.
    if (preTableRenderCallback) preTableRenderCallback(document, panel);

    addRequestInfoElements(document, panel, requestDateTime, response);

    let parentForTable = panel; // Default parent for the table

    if (isTableCollapsible && dataRows && dataRows.length > 0) {
        const tableToggleButton = document.createElement('button');
        tableToggleButton.className = 'collapsible-summary';
        tableToggleButton.textContent = `Show Full Results Table (${dataRows.length} rows)`;
        tableToggleButton.style.marginTop = '20px';

        const tableContainer = document.createElement('div');
        tableContainer.className = 'collapsible-details'; // Hidden by default

        panel.appendChild(tableToggleButton);
        panel.appendChild(tableContainer);

        tableToggleButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the generic collapsible handler in the parent from firing
            tableToggleButton.classList.toggle('active');
            const isVisible = tableContainer.style.display === 'block';
            tableContainer.style.display = isVisible ? 'none' : 'block';
            tableToggleButton.textContent = isVisible
                ? `Show Full Results Table (${dataRows.length} rows)`
                : `Hide Full Results Table (${dataRows.length} rows)`;
        });

        parentForTable = tableContainer; // The table will now be rendered inside this container
    }

    if (!dataRows || dataRows.length === 0) {
        addInfoElement(document, panel, 'p', noDataMessage);
    } else {
        const resultCount = dataRows.length;
        const resultText = `Showing ${resultCount} result${resultCount !== 1 ? 's' : ''}.`;
        addInfoElement(document, parentForTable, 'p', resultText, 'row-count-info');

        if (sortDescription) addInfoElement(document, parentForTable, 'p', sortDescription, 'sort-info');

        const { table, tbody } = createTableStructure(document, headers, parentForTable);

        applyTableColumnStyles(table, headers, document, tabTitle);

        dataRows.forEach((rowData, index) => tbody.appendChild(rowBuilder(document, rowData, index)));
    }

    if (postRenderCallback) await postRenderCallback(document, panel); // The callback still receives the main panel for context
}

/**
 * A centralized utility to apply dynamic, percentage-based column widths to a table.
 * This ensures all data tables in the application have a consistent and readable layout.
 * It creates a unique CSS class for the table and injects a <style> block into the
 * document's <head> to control column widths.
 *
 * @param {HTMLTableElement} tableElement The <table> element to style.
 * @param {string[]} headers An array of the table's header strings.
 * @param {Document} doc The document object where the table resides.
 * @param {string} baseClassName A base name to generate a unique class for the table.
 */
function applyTableColumnStyles(tableElement, headers, doc, baseClassName) {
    const className = `data-table-${baseClassName.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const styleId = `${className}-style`;

    // Remove the old style block if it exists, to ensure styles are fresh on every run.
    const existingStyle = doc.getElementById(styleId);
    if (existingStyle) {
        existingStyle.remove();
    }

    const cssRules = [
        `.${className} { table-layout: fixed; width: 100%; margin: 0; }`
    ];

    const siteIndex = headers.indexOf('Site');
    const dateIndex = headers.indexOf('Date');
    const availabilityIndex = headers.indexOf('Availability');
    const campsiteIdIndex = headers.indexOf('Campsite ID');
    const actionsIndex = headers.indexOf('Actions');

    const hasCampsiteId = campsiteIdIndex !== -1;
    const hasActions = actionsIndex !== -1;

    let siteWidth, dateWidth, availabilityWidth, campsiteIdWidth, actionsWidth;

    // Determine column widths based on the combination of visible columns.
    if (hasCampsiteId && hasActions) { // 5 columns
        siteWidth = 15; dateWidth = 15; availabilityWidth = 30; campsiteIdWidth = 20; actionsWidth = 20;
    } else if (hasCampsiteId && !hasActions) { // 4 columns (Site, Date, Avail, ID)
        siteWidth = 20; dateWidth = 20; availabilityWidth = 30; campsiteIdWidth = 30;
    } else if (!hasCampsiteId && hasActions) { // 4 columns (Site, Date, Avail, Actions)
        siteWidth = 15; dateWidth = 15; availabilityWidth = 25; actionsWidth = 45;
    } else { // 3 columns (Site, Date, Avail)
        siteWidth = 25; dateWidth = 25; availabilityWidth = 50;
    }

    // Add rules for each column that exists in the headers array.
    if (siteIndex !== -1) cssRules.push(`.${className} th:nth-child(${siteIndex + 1}) { width: ${siteWidth}%; } /* Site */`);
    if (dateIndex !== -1) cssRules.push(`.${className} th:nth-child(${dateIndex + 1}) { width: ${dateWidth}%; } /* Date */`);
    if (availabilityIndex !== -1) cssRules.push(`.${className} th:nth-child(${availabilityIndex + 1}) { width: ${availabilityWidth}%; } /* Availability */`);
    if (campsiteIdIndex !== -1) cssRules.push(`.${className} th:nth-child(${campsiteIdIndex + 1}) { width: ${campsiteIdWidth}%; } /* Campsite ID */`);
    if (actionsIndex !== -1) cssRules.push(`.${className} th:nth-child(${actionsIndex + 1}) { width: ${actionsWidth}%; } /* Actions */`);

    const style = doc.createElement('style');
    style.id = styleId;
    style.textContent = cssRules.join('\n');
    doc.head.appendChild(style);

    tableElement.classList.add(className);
}

/**
 * Opens a new tab and displays pre-formatted JSON data.
 * Useful for debugging and inspecting raw API responses.
 * @param {object} jsonData The JavaScript object to be stringified and displayed.
 * @param {string} [title="Parsed API Data"] The title for the new tab.
 */
function displayDataInNewTab(jsonData, title = "Parsed API Data") {
    const panel = createInPageTab(title);
    if (!panel) {
        console.error(`Could not create tab panel for '${title}'.`);
        return;
    }

    addInfoElement(document, panel, 'h1', title);

    const preformattedText = document.createElement('pre');
    preformattedText.textContent = safeJsonStringify(jsonData);
    panel.appendChild(preformattedText);
}

/**
 * A generic data processor to filter and sort campsite availability data.
 * @param {object} allCampsitesData - The complete campsites data object.
 * @param {object} config - The main configuration object.
 * @param {function(object, string): boolean} rowFilterPredicate - A function that returns true if a row should be included.
 * @param {string} sortBy - The primary key to sort by ('site' or 'date').
 * @returns {Array<object>} The filtered and sorted array of row data.
 */
function processAndSortAvailability(allCampsitesData, config, rowFilterPredicate, sortBy) {
    const rowsData = [];
    if (allCampsitesData && Object.keys(allCampsitesData).length > 0) {
        for (const cId in allCampsitesData) {
            const campsite = allCampsitesData[cId];
            for (const dateStr in campsite.availabilities) {
                const currentAvailability = campsite.availabilities[dateStr];

                // Check if the row passes the specific filter for the tab and the date range.
                if (isDateInRange(dateStr, config.filters.filterStartDate, config.filters.filterEndDate) && rowFilterPredicate(campsite, currentAvailability)) {
                    const dateObj = new Date(dateStr);
                    rowsData.push({
                        site: campsite.site,
                        date: formatDateForTableDisplay(dateObj),
                        originalDate: dateObj,
                        availability: currentAvailability,
                        quantity: campsite.quantities[dateStr],
                        campsite_id: campsite.campsite_id
                    });
                }
            }
        }
    }
    rowsData.sort(createSiteSorter(sortBy));
    return rowsData;
}

/**
 * Renders the color-coded summary of all availability counts for the campground.
 * @param {Document} doc The document object.
 * @param {HTMLElement} containerDiv The parent element to append the summary to.
 * @param {object} availabilityCounts The object containing availability counts.
 */
function renderOverallAvailabilitySummary(doc, containerDiv, availabilityCounts) {
    const summaryDiv = doc.createElement('div');
    summaryDiv.className = 'availability-summary-main';
    addInfoElement(doc, summaryDiv, 'h3', 'Overall Availability Counts');

    if (availabilityCounts && Object.keys(availabilityCounts).length > 0) {
        const summaryList = doc.createElement('ul');
        summaryList.style.listStyleType = 'none';
        summaryList.style.paddingLeft = '0';

        SUMMARY_DISPLAY_ORDER.forEach(type => {
            if (availabilityCounts[type]) {
                const count = availabilityCounts[type];
                const listItem = doc.createElement('li');

                let displayText = type;
                if (type === AVAILABILITY_STATUS.NOT_RESERVABLE) {
                    displayText = 'Walk-up (FCFS)';
                } else if (type === AVAILABILITY_STATUS.OPEN) {
                    displayText = 'Extend Only';
                } else if (type === AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF) {
                    displayText = 'Cutoff (Walk-up)';
                } else if (type === AVAILABILITY_STATUS.NYR) {
                    displayText = 'Not Yet Released';
                }

                listItem.textContent = `${displayText}: ${count}`;
                listItem.className = `summary-item ${getAvailabilityClass(type)}`;
                summaryList.appendChild(listItem);
            }
        });
        summaryDiv.appendChild(summaryList);
    } else {
        addInfoElement(doc, summaryDiv, 'p', "No availability data to summarize for the selected period.");
    }
    containerDiv.appendChild(summaryDiv);
}

/**
 * Renders a collapsible table of all available sites.
 * @param {HTMLElement} containerDiv The parent element to append the table to.
 * @param {object} allCampsitesData The complete campsites data object.
 * @param {object} config The main configuration object.
 * @param {Date} requestDateTime The timestamp of the data request.
 * @param {Response} response The fetch response object.
 * @param {object|null} campgroundMetadata The metadata for the campground.
 */
async function renderAllAvailableSitesSection(containerDiv, allCampsitesData, config, requestDateTime, response, campgroundMetadata) {
    const includeNotReservable = config.tabBehavior.includeNotReservableInAvailableTab;

    const rowFilter = (_campsite, availability) => {
        return availability === AVAILABILITY_STATUS.AVAILABLE ||
               (!includeNotReservable && availability === AVAILABILITY_STATUS.NOT_RESERVABLE);
    };
    const availableRowsData = processAndSortAvailability(allCampsitesData, config, rowFilter, config.sorting.primarySortKey);

    const headers = getDynamicTableHeaders(config, config.display.showCampsiteIdColumn, false);
    const rowBuilder = (doc, rowData) => createBaseAvailabilityRow(doc, rowData, headers);

    const pageTitle = `All Available Campsites${includeNotReservable ? ' & Walk-Up (FCFS)' : ''}`;
    const sortDescription = config.sorting.primarySortKey === 'site' ? "Data sorted by Site, then by Date." : "Data sorted by Date, then by Site.";

    const tableContainer = document.createElement('div');
    containerDiv.appendChild(tableContainer);

    addInfoElement(document, tableContainer, 'h2', pageTitle);

    const tableOptions = {
        tabTitle: 'AllAvailableSites', // A non-rendered title used for generating CSS classes.
        dataRows: availableRowsData,
        headers: headers,
        config, allCampsitesData, requestDateTime, response, sortDescription, rowBuilder,
        noDataMessage: "No 'Available' or 'Walk-Up (FCFS)' campsites found for the selected period.",
        isTableCollapsible: true,
        _parentElement: tableContainer // This tells the function to render here, not in a new tab.
    };
    console.log('%c[renderAllAvailableSitesSection] Calling renderTabularDataInNewTab with options:', 'color: blue; font-weight: bold;', tableOptions);
    await renderTabularDataInNewTab(tableOptions);
}

/**
 * Renders a new tab showing only campsites that are "Available" (and optionally "Not Reservable").
 * It filters the main dataset, sorts it, and uses the generic `renderTabularDataInNewTab` function.
 * @param {object} allCampsitesData The complete campsites data object.
 * @param {object} config The main configuration object.
 * @param {Date} requestDateTime The timestamp of the data request.
 * @param {Response} response The fetch response object.
 */
async function displayAvailableSitesInNewTab(allCampsitesData, availabilityCounts, config, requestDateTime, response, campgroundMetadata) {
    const includeNotReservable = config.tabBehavior.includeNotReservableInAvailableTab;

    // 1. Use the new generic processor to filter and sort the data.
    const rowFilter = (_campsite, availability) => {
        return availability === AVAILABILITY_STATUS.AVAILABLE ||
               (!includeNotReservable && availability === AVAILABILITY_STATUS.NOT_RESERVABLE);
    };
    const availableRowsData = processAndSortAvailability(allCampsitesData, config, rowFilter, config.sorting.primarySortKey);

    // 2. Define the function that builds a single table row using the shared helper.
    const rowBuilder = (doc, rowData) => createBaseAvailabilityRow(doc, rowData, config);

    // New pre-table callback to render the summary
    const preTableRenderCallback = (doc, containerDiv) => {
        const summaryDiv = doc.createElement('div');
        summaryDiv.className = 'availability-summary-main';
        addInfoElement(doc, summaryDiv, 'h3', 'Availability Counts');

        if (availabilityCounts && Object.keys(availabilityCounts).length > 0) {
            const summaryList = doc.createElement('ul');
            summaryList.style.listStyleType = 'none';
            summaryList.style.paddingLeft = '0';

            SUMMARY_DISPLAY_ORDER.forEach(type => {
                if (availabilityCounts[type]) {
                    const count = availabilityCounts[type];
                    const listItem = doc.createElement('li');

                    let displayText = type;
                    if (type === AVAILABILITY_STATUS.NOT_RESERVABLE) {
                        displayText = 'Walk-up (FCFS)';
                    } else if (type === AVAILABILITY_STATUS.OPEN) {
                        displayText = 'Extend Only';
                    } else if (type === AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF) {
                        displayText = 'Cutoff (Walk-up)';
                    } else if (type === AVAILABILITY_STATUS.NYR) {
                        displayText = 'Not Yet Released';
                    }

                    listItem.textContent = `${displayText}: ${count}`;
                    listItem.className = `summary-item ${getAvailabilityClass(type)}`;
                    summaryList.appendChild(listItem);
                }
            });
            summaryDiv.appendChild(summaryList);
        } else {
            addInfoElement(doc, summaryDiv, 'p', "No availability data to summarize for the selected period.");
        }
        containerDiv.appendChild(summaryDiv);
    };

    // 3. Configure and call the generic renderer.
    const pageTitle = `Available Campsites${includeNotReservable ? ' & Walk-Up (FCFS)' : ''} - ${campgroundMetadata?.facility_name || config.api.campgroundId}`;
    const sortDescription = config.sorting.primarySortKey === 'site' ? "Data sorted by Site, then by Date." : "Data sorted by Date, then by Site.";

    await renderTabularDataInNewTab({
        tabTitle: 'Available Sites',
        pageTitle: pageTitle,
        dataRows: availableRowsData,
        headers: ["Site", "Date", "Availability"].concat(
            config.display.showCampsiteIdColumn ? ["Campsite ID"] : []
        ),
        config: config,
        allCampsitesData: allCampsitesData,
        requestDateTime: requestDateTime,
        response: response,
        sortDescription: sortDescription,
        noDataMessage: "No 'Available' or 'Walk-Up (FCFS)' campsites found for the selected period.",
        rowBuilder: rowBuilder,
        preTableRenderCallback: preTableRenderCallback,
        postRenderCallback: null,
        isTableCollapsible: true
    });
}

/**
 * Normalizes a site name for consistent lookups. It handles purely numeric sites
 * by removing leading zeros, while leaving alphanumeric sites as-is.
 * @param {string|number} name The site name or number.
 * @returns {string} The normalized site name.
 */
function normalizeSiteName(name) {
    const strName = String(name).trim().toUpperCase();
    // If the site name is purely numeric, parse and convert back to string to remove leading zeros.
    if (/^\d+$/.test(strName)) {
        return String(parseInt(strName, 10));
    }
    return strName; // Return as-is for alphanumeric sites like 'A020'
}

/**
 * Determines which site IDs require detailed information fetching based on the current configuration and filtered results.
 * @param {object} config - The main configuration object.
 * @param {Array<object>} filteredRowsData - The data already filtered for the tab.
 * @param {object} allCampsitesData - The complete campsites data object for lookups.
 * @param {function(string): void} logDebug - A logging function for in-tab diagnostics.
 * @returns {Array<string>} A sorted array of campsite IDs to fetch details for.
 */
function getSiteIdsForDetailFetch(config, filteredRowsData, allCampsitesData, logDebug = () => { }) {
    const idsForDetailFetch = new Set(); // Use a Set to avoid duplicates
    const fetchAvailableOnly = config.tabBehavior.fetchDetailsForAvailableOnly;
    const siteNumbersToFilter = config.siteFilters.siteNumbersToFilter;
    const isFilteringBySiteNumber = siteNumbersToFilter && siteNumbersToFilter.length > 0;

    logDebug(`'fetchDetailsForAvailableOnly' is ${fetchAvailableOnly}.`);
    logDebug(`'isFilteringBySiteNumber' (user provided sites) is ${isFilteringBySiteNumber}.`);

    if (!fetchAvailableOnly && isFilteringBySiteNumber) {
        // Scenario: User provided specific sites AND wants details for ALL of them (not just available).
        // We need to get the campsite_ids for ALL sites in siteNumbersToFilter.
        logDebug(`Including all ${siteNumbersToFilter.length} sites from user's filter list for detail fetching.`);

        // Create a map from normalized site name to campsite_id for efficient lookup
        const siteNameToCampsiteIdMap = new Map();
        for (const campsiteId in allCampsitesData) {
            const campsite = allCampsitesData[campsiteId];
            siteNameToCampsiteIdMap.set(normalizeSiteName(campsite.site), campsite.campsite_id);
        }

        siteNumbersToFilter.forEach(siteNum => {
            const normalizedSiteNum = normalizeSiteName(siteNum);
            const campsiteId = siteNameToCampsiteIdMap.get(normalizedSiteNum);
            if (campsiteId) {
                idsForDetailFetch.add(campsiteId);
            } else {
                logDebug(`Warning: Site '${siteNum}' (normalized: '${normalizedSiteNum}') from filter list not found in fetched availability data. Skipping for details.`);
            }
        });
    } else {
        // Scenario: fetchAvailableOnly is true OR no specific sites were provided by the user.
        // We rely on the availability results from filteredRowsData.
        logDebug(`Including sites based on availability from filteredRowsData.`);
        filteredRowsData.forEach(row => {
            if (row.availability === AVAILABILITY_STATUS.AVAILABLE) {
                idsForDetailFetch.add(row.campsite_id);
            } else if (!fetchAvailableOnly &&
                       (row.availability === AVAILABILITY_STATUS.NOT_RESERVABLE ||
                        row.availability === AVAILABILITY_STATUS.OPEN)) {
                idsForDetailFetch.add(row.campsite_id);
            }
        });
    }

    // Convert Set to Array for sorting
    const finalIds = Array.from(idsForDetailFetch);

    logDebug(`Identified ${finalIds.length} site(s) for detail fetching.`);

    // Sort the final list numerically based on the site number for consistent display order. (This part remains the same)
    const siteNumberMap = new Map();
    for (const cId in allCampsitesData) {
        const campsite = allCampsitesData[cId];
        siteNumberMap.set(campsite.campsite_id, parseInt(String(campsite.site).match(/\d+/)?.[0] || '0', 10));
    }
    finalIds.sort((idA, idB) => (siteNumberMap.get(idA) || 0) - (siteNumberMap.get(idB) || 0));
    logDebug(`Sorted idsForDetailFetch: [${finalIds.join(', ')}]`);

    return finalIds;
}

/**
 * Renders a new tab showing only the campsites specified in the configuration's filter list.
 * This function can also fetch and display detailed information (like photos) for these specific sites.
 * @param {object} allCampsitesData The complete campsites data object.
 * @param {object} config The main configuration object.
 * @param {string} currentRidbFacilityId The RIDB Facility ID, needed for fetching campsite details.
 * @param {Date} requestDateTime The timestamp of the data request.
 * @param {Response} response The fetch response object.
 */
async function displayFilteredSitesInNewTab(allCampsitesData, availabilityCounts, config, currentRidbFacilityId, requestDateTime, response, campgroundMetadata) {
    console.log('[displayFilteredSitesInNewTab] Using facility ID for details:', currentRidbFacilityId);
    const campsiteDetailsCache = new Map();

    // This handler is defined here to have access to the function's scope (cache, config, etc.)
    async function handleShowDetailsClick(event) {
        const button = event.target;
        const campsiteId = button.dataset.campsiteId;
        const siteName = button.dataset.siteName;
        const tr = button.closest('tr');

        if (!campsiteId || !tr) return;

        const existingDetailsRow = tr.nextElementSibling;
        if (existingDetailsRow && existingDetailsRow.classList.contains('details-row')) {
            // Details are visible, so hide them
            existingDetailsRow.remove();
            button.textContent = 'Show Details';
            button.classList.remove('active');
        } else {
            // Details are hidden, so show them
            button.textContent = 'Loading...';
            button.disabled = true;

            let details;
            if (campsiteDetailsCache.has(campsiteId)) {
                details = campsiteDetailsCache.get(campsiteId);
            } else {
                details = await fetchCampsiteDetailsFromService(currentRidbFacilityId, campsiteId, debugInfo);
                if (details) {
                    campsiteDetailsCache.set(campsiteId, details);
                }
            }

            button.textContent = 'Hide Details';
            button.classList.add('active');
            button.disabled = false;

            // Create a new row to hold the details content
            const detailsRow = tr.parentNode.insertRow(tr.sectionRowIndex + 1);
            detailsRow.className = 'details-row';
            const detailsCell = detailsRow.insertCell(0);
            detailsCell.colSpan = tr.cells.length; // Span across all columns

            if (details) {
                const availableDates = filteredRowsData.filter(row => row.campsite_id === campsiteId && row.availability === AVAILABILITY_STATUS.AVAILABLE).map(row => row.date);
                const notReservableDates = filteredRowsData.filter(row => row.campsite_id === campsiteId && row.availability === AVAILABILITY_STATUS.NOT_RESERVABLE).map(row => row.date);
                const openDates = filteredRowsData.filter(row => row.campsite_id === campsiteId && row.availability === AVAILABILITY_STATUS.OPEN).map(row => row.date);
                renderCampsiteDetailsInTab(details, availableDates, notReservableDates, openDates, detailsCell, tr.ownerDocument);
            } else {
                detailsCell.textContent = `Could not load details for site ${siteName}.`;
                detailsCell.style.padding = '10px';
                detailsCell.style.color = 'red';
            }
        }
    }

    const siteNumbersToFilterArray = config.siteFilters.siteNumbersToFilter;
    const showAllStatuses = config.tabBehavior.showAllFilteredSitesStatuses;
    const isFilteringBySiteNumber = siteNumbersToFilterArray && siteNumbersToFilterArray.length > 0;
    const normalizedSiteNumbersToFilter = siteNumbersToFilterArray.map(normalizeSiteName);
    
    const headers = getDynamicTableHeaders(config, config.display.showCampsiteIdColumn, !isFilteringBySiteNumber);

    // 1. Use the new generic processor to filter and sort the data.
    const rowFilter = (campsite, availability) => {
        const siteMatchesFilter = !isFilteringBySiteNumber || normalizedSiteNumbersToFilter.includes(normalizeSiteName(campsite.site));
        if (!siteMatchesFilter) {
            return false;
        }

        // If "Show All Statuses" is checked, no further filtering is needed.
        if (showAllStatuses) {
            return true;
        }

        // Otherwise, only show 'Available', 'Open' (Extend Only), and 'Not Reservable' (Walk-up).
        const allowedStatuses = [
            AVAILABILITY_STATUS.AVAILABLE,
            AVAILABILITY_STATUS.OPEN,
            AVAILABILITY_STATUS.NOT_RESERVABLE
        ];
        return allowedStatuses.includes(availability);
    };

    const filteredRowsData = processAndSortAvailability(allCampsitesData, config, rowFilter, config.sorting.primarySortKey);

    // 2. Define the function that builds a single table row.
    const rowBuilder = (doc, rowData) => {
        const tr = createBaseAvailabilityRow(doc, rowData, headers);

        // If no site filter is active, add a button for lazy-loading details.
        if (!isFilteringBySiteNumber) {
            const detailsCell = tr.insertCell();
            const detailsButton = doc.createElement('button');
            detailsButton.textContent = 'Show Details';
            detailsButton.dataset.campsiteId = rowData.campsite_id;
            detailsButton.dataset.siteName = rowData.site;
            // The event listener is attached in the postRenderCallback
            detailsCell.appendChild(detailsButton);
        }
        return tr;
    };

    // 3. Define the asynchronous action to perform *after* the main table is rendered.
    const postRenderCallback = async (doc, containerDiv) => {
        // --- START: In-Tab Debugging ---
        const debugDiv = doc.createElement('div');
        debugDiv.style.border = '2px dashed red';
        debugDiv.style.padding = '10px';
        debugDiv.style.marginTop = '20px';
        debugDiv.style.fontFamily = 'monospace';
        debugDiv.style.whiteSpace = 'pre-wrap';
        const debugPre = doc.createElement('pre');
        // Keep this code for potential future debugging, but hide it from view.
        if (false && config.display.showDebugTab) {
            addInfoElement(doc, debugDiv, 'h3', 'Live Debug Info for Filtered Tab');
            debugDiv.appendChild(debugPre);
            containerDiv.appendChild(debugDiv);
        }
        let debugText = '';
        const logDebug = (msg) => {
            if (!config.display.showDebugTab) return;
            debugText += msg + '\n';
            debugPre.textContent = debugText;
        };
        // --- END: In-Tab Debugging ---

        if (isFilteringBySiteNumber) {
            console.log('[postRenderCallback] isFilteringBySiteNumber:', isFilteringBySiteNumber);
            logDebug(`Site filter is active. Fetching details automatically.`);
            let idsForDetailFetch = getSiteIdsForDetailFetch(config, filteredRowsData, allCampsitesData, logDebug);
            console.log('[postRenderCallback] Site IDs identified for detail fetching:', idsForDetailFetch);
            const originalDetailFetchCount = idsForDetailFetch.length;
            const MAX_DETAILS_TO_FETCH = 50;
            let isCapped = false;

            if (config.siteFilters.siteNumbersToFilter.length > 0 && originalDetailFetchCount > MAX_DETAILS_TO_FETCH) {
                logDebug(`Capping site detail fetches from ${originalDetailFetchCount} to ${MAX_DETAILS_TO_FETCH}.`);
                idsForDetailFetch = idsForDetailFetch.slice(0, MAX_DETAILS_TO_FETCH);
                isCapped = true;
            }

            if (idsForDetailFetch.length === 0) {
                logDebug(`\nCONCLUSION: No site IDs were identified for detail fetching. Exiting callback.`);
                return;
            }

            const detailsHeader = addInfoElement(doc, containerDiv, 'h2', "Detailed Information for Filtered Campsites");
            if (detailsHeader) {
                detailsHeader.style.marginTop = "30px";
                detailsHeader.style.borderTop = "2px solid #ccc";
                detailsHeader.style.paddingTop = "20px";
            }

            if (isCapped) {
                const capNote = doc.createElement('p');
                capNote.innerHTML = `<strong>Note:</strong> To improve performance, details are being shown for the first <strong>${MAX_DETAILS_TO_FETCH}</strong> of <strong>${originalDetailFetchCount}</strong> matching sites.`;
                capNote.className = 'info-message';
                detailsHeader.parentNode.insertBefore(capNote, detailsHeader);
            }

            debugInfo.processing.filteredSiteIdsForDetailFetch = idsForDetailFetch;

            const loadingDetailsP = addInfoElement(doc, containerDiv, 'p', "Loading detailed information for each campsite...");
            const detailPromises = idsForDetailFetch.map(cId => fetchCampsiteDetailsFromService(currentRidbFacilityId, cId, debugInfo));
            const allDetailsResults = await Promise.allSettled(detailPromises);
            console.log('[postRenderCallback] Raw results from all detail fetches:', allDetailsResults);
            if (loadingDetailsP) containerDiv.removeChild(loadingDetailsP);

            allDetailsResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    const campsiteDetails = result.value;
                    const availableDates = filteredRowsData.filter(row => row.campsite_id === campsiteDetails.CampsiteID && row.availability === AVAILABILITY_STATUS.AVAILABLE).map(row => row.date);
                    const notReservableDates = filteredRowsData.filter(row => row.campsite_id === campsiteDetails.CampsiteID && row.availability === AVAILABILITY_STATUS.NOT_RESERVABLE).map(row => row.date);
                    const openDates = filteredRowsData.filter(row => row.campsite_id === campsiteDetails.CampsiteID && row.availability === AVAILABILITY_STATUS.OPEN).map(row => row.date);
                    const cutoffDates = filteredRowsData.filter(row => row.campsite_id === campsiteDetails.CampsiteID && row.availability === AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF).map(row => row.date);

                    // Calculate per-site summary for the button
                    const siteSummary = {
                        [AVAILABILITY_STATUS.AVAILABLE]: availableDates.length,
                        [AVAILABILITY_STATUS.NOT_RESERVABLE]: notReservableDates.length,
                        [AVAILABILITY_STATUS.OPEN]: openDates.length,
                        [AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF]: cutoffDates.length
                    };

                    const compactSummaryText = generateCompactSummaryString(siteSummary);
                    const tooltipText = generateCompactSummaryTooltip(siteSummary);

                    // Create the summary button
                    const summaryButton = doc.createElement('button');
                    summaryButton.className = 'collapsible-summary';
                    const baseButtonText = `Site: ${campsiteDetails.CampsiteName}`;
                    summaryButton.textContent = `${baseButtonText}${compactSummaryText}`;
                    summaryButton.title = `${baseButtonText}\n${tooltipText}`;
                    containerDiv.appendChild(summaryButton);

                    // Create the details panel
                    const detailsPanel = doc.createElement('div');
                    detailsPanel.className = 'collapsible-details';
                    containerDiv.appendChild(detailsPanel);

                    // Render the campsite details into the newly created detailsPanel
                    renderCampsiteDetailsInTab(campsiteDetails, availableDates, notReservableDates, openDates, detailsPanel, doc);
                } else if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value)) {
                    console.warn("[displayFilteredSitesInNewTab] Failed to fetch or no data for a campsite detail:", result.reason || "No data returned");
                }
            });

            // Add the single event listener for all collapsible sections
            containerDiv.addEventListener('click', (event) => {
                if (event.target.classList.contains('collapsible-summary')) {
                    const button = event.target;
                    button.classList.toggle('active');
                    const content = button.nextElementSibling;
                    if (content) {
                        if (content.style.display === 'block') {
                            content.style.display = 'none';
                        } else {
                            content.style.display = 'block';
                        }
                    }
                }
            });
        } else {
            logDebug(`Site filter is empty. Details will be lazy-loaded on demand.`);
            const detailButtons = containerDiv.querySelectorAll('button[data-campsite-id]');
            detailButtons.forEach(button => {
                button.addEventListener('click', handleShowDetailsClick);
            });
            logDebug(`Attached 'Show Details' listeners to ${detailButtons.length} buttons.`);
        }

        // --- Add the overall availability summary at the bottom ---
        const separator = doc.createElement('hr');
        separator.style.marginTop = '40px';
        separator.style.marginBottom = '20px';
        separator.style.border = '1px solid #ccc';
        containerDiv.appendChild(separator);

        addInfoElement(doc, containerDiv, 'h2', 'Overall Campground Availability');

        // Render the summary box and the full available sites table
        renderOverallAvailabilitySummary(doc, containerDiv, availabilityCounts);
        await renderAllAvailableSitesSection(containerDiv, allCampsitesData, config, requestDateTime, response, campgroundMetadata);
    };

    // 4. Configure and call the generic renderer.
    const preTableRenderCallback = (doc, containerDiv) => {
        // --- Create Summaries for Available and Not Reservable Dates ---

        // 1. Separate the data sources
        const availableRows = filteredRowsData.filter(
            row => row.availability === AVAILABILITY_STATUS.AVAILABLE
        );

        const notReservableRows = filteredRowsData.filter(
            row => row.availability === AVAILABILITY_STATUS.NOT_RESERVABLE
        );

        const openRows = filteredRowsData.filter(
            row => row.availability === AVAILABILITY_STATUS.OPEN
        );

        // 2. Render the "Available" summary box, if applicable
        if (availableRows.length > 0) {
            const summaryDiv = doc.createElement('div');
            summaryDiv.className = 'availability-summary-main';
            addInfoElement(doc, summaryDiv, 'h3', 'Available Summary for Filtered Sites');
            summaryDiv.style.backgroundColor = '#e6ffed'; // A light green for success
            summaryDiv.style.border = '1px solid #28a745';

            const availableBySite = availableRows.reduce((acc, row) => {
                if (!acc[row.site]) {
                    acc[row.site] = [];
                }
                acc[row.site].push(row.date);
                return acc;
            }, {});

            const summaryList = doc.createElement('ul');
            summaryList.style.paddingLeft = '20px';
            Object.keys(availableBySite).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(site => {
                const dates = availableBySite[site].join(', ');
                const li = doc.createElement('li');
                li.innerHTML = `<strong>${site}:</strong> ${dates}`;
                summaryList.appendChild(li);
            });
            summaryDiv.appendChild(summaryList);
            containerDiv.appendChild(summaryDiv);
        }

        // 3. Render the "Not Reservable" summary box, if applicable
        if (notReservableRows.length > 0) {
            const summaryDiv = doc.createElement('div');
            summaryDiv.className = 'availability-summary-main';
            addInfoElement(doc, summaryDiv, 'h3', 'Walk-up (FCFS) Summary');
            summaryDiv.style.backgroundColor = '#fffbe6'; // Light yellow
            summaryDiv.style.border = '1px solid #ffeeba'; // Yellow border
            summaryDiv.style.marginTop = '10px'; // Add space between summaries

            const notReservableBySite = notReservableRows.reduce((acc, row) => {
                if (!acc[row.site]) {
                    acc[row.site] = [];
                }
                acc[row.site].push(row.date);
                return acc;
            }, {});

            const summaryList = doc.createElement('ul');
            summaryList.style.paddingLeft = '20px';
            Object.keys(notReservableBySite).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(site => {
                const dates = notReservableBySite[site].join(', ');
                const li = doc.createElement('li');
                li.innerHTML = `<strong>${site}:</strong> ${dates}`;
                summaryList.appendChild(li);
            });
            summaryDiv.appendChild(summaryList);
            containerDiv.appendChild(summaryDiv);
        }

        // 4. Render the "Open for Continuation" summary box, if applicable
        if (openRows.length > 0) {
            const summaryDiv = doc.createElement('div');
            summaryDiv.className = 'availability-summary-main';
            addInfoElement(doc, summaryDiv, 'h3', 'Open for Continuation On (Extend Only)');
            summaryDiv.style.backgroundColor = '#e7f3ff'; // Light blue
            summaryDiv.style.border = '1px solid #4a90e2'; // Blue border
            summaryDiv.style.marginTop = '10px';

            const openBySite = openRows.reduce((acc, row) => {
                if (!acc[row.site]) {
                    acc[row.site] = [];
                }
                acc[row.site].push(row.date);
                return acc;
            }, {});

            const summaryList = doc.createElement('ul');
            summaryList.style.paddingLeft = '20px';
            Object.keys(openBySite).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(site => {
                const dates = openBySite[site].join(', ');
                const li = doc.createElement('li');
                li.innerHTML = `<strong>${site}:</strong> ${dates}`;
                summaryList.appendChild(li);
            });
            summaryDiv.appendChild(summaryList);
            containerDiv.appendChild(summaryDiv);
        }

        // --- Create main filter description header ---
        const siteFilterText = isFilteringBySiteNumber ? `Displaying sites: ${siteNumbersToFilterArray.join(", ")}` : `Displaying all sites`;
        const statusFilterDescription = showAllStatuses
            ? " (Showing All Statuses, incl. Reserved)"
            : " (Showing 'Available' & 'Walk-up' Only)";

        const filterDescriptionHeader = doc.createElement('h2');
        filterDescriptionHeader.textContent = `${siteFilterText}${statusFilterDescription}`;
        containerDiv.appendChild(filterDescriptionHeader);
    };

    const pageTitle = `Filtered Campsite Availability - ${campgroundMetadata?.facility_name || config.api.campgroundId}`;
    const sortDescription = config.sorting.primarySortKey === 'site' ? "Data sorted by Site, then by Date." : "Data sorted by Date, then by Site.";
    const tabTitle = `Filtered Sites (${isFilteringBySiteNumber ? `${siteNumbersToFilterArray.length} sites` : "All"})`;

    await renderTabularDataInNewTab({
        tabTitle: tabTitle,
        pageTitle: pageTitle,
        dataRows: filteredRowsData,
        headers: headers,
        preTableRenderCallback: preTableRenderCallback,
        config: config,
        allCampsitesData: allCampsitesData,
        requestDateTime: requestDateTime,
        response: response,
        sortDescription: sortDescription,
        noDataMessage: "No campsites found matching the specified filters and date range.",
        rowBuilder: rowBuilder,
        postRenderCallback: postRenderCallback,
        isTableCollapsible: isFilteringBySiteNumber
    });
}

/**
 * Renders the user ratings section with stars.
 * @param {HTMLElement} parentElement The parent element to append the ratings to.
 * @param {object} searchResult The result object from the rec.gov search API.
 */
function renderUserRatings(parentElement, searchResult) {
    if (!searchResult || typeof searchResult.average_rating !== 'number' || typeof searchResult.number_of_ratings !== 'number') {
        return;
    }

    const doc = parentElement.ownerDocument;
    const ratingsContainer = doc.createElement('div');
    ratingsContainer.className = 'ratings-section';
    ratingsContainer.style.display = 'flex';
    ratingsContainer.style.alignItems = 'center';
    ratingsContainer.style.marginBottom = '10px';

    const averageRating = parseFloat(searchResult.average_rating).toFixed(1);
    const numRatings = searchResult.number_of_ratings;

    // Create stars
    const starsContainer = doc.createElement('div');
    starsContainer.className = 'stars';
    const fullStars = Math.round(searchResult.average_rating);
    for (let i = 0; i < 5; i++) {
        const star = doc.createElement('span');
        star.innerHTML = i < fullStars ? '&#9733;' : '&#9734;'; // filled or empty star
        star.style.color = '#f5b301'; // gold color
        star.style.fontSize = '20px';
        starsContainer.appendChild(star);
    }

    const ratingsText = doc.createElement('span');
    ratingsText.textContent = ` ${averageRating} out of 5 (${numRatings} ratings)`;
    ratingsText.style.marginLeft = '10px';
    ratingsText.style.verticalAlign = 'middle';
    ratingsText.style.fontSize = '0.9em';

    ratingsContainer.appendChild(starsContainer);
    ratingsContainer.appendChild(ratingsText);

    // Insert after the main h1 title
    const h1 = parentElement.querySelector('h1');
    if (h1 && h1.nextSibling) {
        parentElement.insertBefore(ratingsContainer, h1.nextSibling);
    } else {
        parentElement.appendChild(ratingsContainer);
    }
}

/**
 * Determines a color based on a cell coverage score.
 * @param {number} score The score from 0 to 10.
 * @returns {string} A hex color code.
 */
function getCellScoreColor(score) {
    if (score >= 7.0) {
        return '#28a745'; // Green
    }
    if (score >= 4.0) {
        return '#ffc107'; // Orange/Yellow
    }
    return '#dc3545'; // Red
}

/**
 * Renders at-a-glance information like site count and types.
 * @param {HTMLElement} parentElement The parent element to append the info to.
 * @param {object} searchResult The result object from the rec.gov search API.
 */
function renderAtAGlanceInfo(parentElement, searchResult) {
    if (!searchResult) return;

    const siteInfoParts = [];
    if (searchResult.campsites_count) {
        // The API returns this as a string, which is fine.
        siteInfoParts.push(`<strong>${searchResult.campsites_count}</strong> sites`);
    }
    if (searchResult.campsite_reserve_type && searchResult.campsite_reserve_type.length > 0) {
        // e.g., (Site-Specific)
        siteInfoParts.push(`(${searchResult.campsite_reserve_type.join(', ')})`);
    }
    if (searchResult.campsite_equipment_name && searchResult.campsite_equipment_name.length > 0) {
        // e.g., for Tent, RV
        siteInfoParts.push(`for ${searchResult.campsite_equipment_name.join(', ')}`);
    }

    const hasSiteInfo = siteInfoParts.length > 0;
    const hasCellInfo = typeof searchResult.aggregate_cell_coverage === 'number';
    const hasPriceInfo = searchResult.price_range &&
        typeof searchResult.price_range.amount_min === 'number' &&
        typeof searchResult.price_range.amount_max === 'number';


    if (!hasSiteInfo && !hasCellInfo && !hasPriceInfo) return;

    const doc = parentElement.ownerDocument;
    const glanceContainer = doc.createElement('div');
    glanceContainer.className = 'glance-info-section';
    glanceContainer.style.marginBottom = '15px';
    glanceContainer.style.fontSize = '1.1em';
    glanceContainer.style.color = '#333';
    glanceContainer.style.padding = '10px';
    glanceContainer.style.backgroundColor = '#f8f9fa';
    glanceContainer.style.border = '1px solid #dee2e6';
    glanceContainer.style.borderRadius = '4px';

    if (hasSiteInfo) {
        const p = doc.createElement('p');
        p.style.margin = '0';
        p.innerHTML = siteInfoParts.join(' ');
        glanceContainer.appendChild(p);
    }

    if (hasCellInfo) {
        const coverage = searchResult.aggregate_cell_coverage;
        const score = Math.round(coverage * 10);
        const color = getCellScoreColor(score);

        const wrapper = doc.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.margin = hasSiteInfo ? '8px 0 0 0' : '0';

        const icon = doc.createElement('div');
        icon.style.width = '1em';
        icon.style.height = '1em';
        icon.style.marginRight = '8px';
        icon.style.backgroundColor = color;
        icon.style.webkitMask = 'url(media/tower-cell-solid-full.svg) no-repeat center';
        icon.style.mask = 'url(media/tower-cell-solid-full.svg) no-repeat center';
        icon.style.webkitMaskSize = 'contain';
        icon.style.maskSize = 'contain';

        const textSpan = doc.createElement('span');
        textSpan.innerHTML = `<strong>Cell Coverage Score:</strong> ${score} / 10 (raw: ${coverage.toFixed(4)})`;

        wrapper.appendChild(icon);
        wrapper.appendChild(textSpan);
        glanceContainer.appendChild(wrapper);
    }

    if (hasPriceInfo) {
        const { amount_min, amount_max, per_unit } = searchResult.price_range;
        let priceText;
        if (amount_min === amount_max) {
            priceText = `$${amount_min.toFixed(2)}`;
        } else {
            priceText = `$${amount_min.toFixed(2)} - $${amount_max.toFixed(2)}`;
        }
        if (per_unit) {
            priceText += ` per ${per_unit}`;
        }
        const p = addInfoElement(doc, glanceContainer, 'p', '');
        p.style.margin = (hasSiteInfo || hasCellInfo) ? '8px 0 0 0' : '0';
        p.innerHTML = `<strong>Price:</strong> ${priceText}`;
    }

    const ratingsSection = parentElement.querySelector('.ratings-section');
    parentElement.insertBefore(glanceContainer, ratingsSection.nextSibling);
}

/**
 * Renders the primary preview image from the search data.
 * @param {HTMLElement} parentElement The parent element to append the image to.
 * @param {object} searchResult The result object from the rec.gov search API.
 */
function renderPrimaryImage(parentElement, searchResult) {
    if (!searchResult || !searchResult.preview_image_url) {
        return;
    }

    const doc = parentElement.ownerDocument;
    const imageContainer = doc.createElement('div');
    imageContainer.className = 'primary-image-section';
    imageContainer.style.marginTop = '20px';

    addInfoElement(doc, imageContainer, 'h3', 'Primary Image');

    const img = doc.createElement('img');
    img.src = searchResult.preview_image_url;
    img.alt = searchResult.name || 'Primary campground image';
    img.title = `View full size: ${searchResult.name || 'Primary Image'}`;
    img.style.maxWidth = '600px';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.border = '1px solid #ddd';
    img.style.borderRadius = '4px';
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => showLightbox(searchResult.preview_image_url, doc));

    imageContainer.appendChild(img);
    parentElement.appendChild(imageContainer);
}

/**
 * Safely stringifies a JavaScript object, handling circular references.
 * @param {object} obj The object to stringify.
 * @returns {string} A JSON string representation of the object.
 */
function safeJsonStringify(obj) {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) {
                // Circular reference found, replace with a placeholder.
                return '[Circular Reference]';
            }
            // Store value in our collection
            cache.add(value);
        }
        return value;
    }, 2); // 2 spaces for pretty printing
}

/**
 * Creates a download link for a given JSON object.
 * This allows the user to save the data to a local file.
 * @param {Document} doc The document to create the link in.
 * @param {object} jsonData The JavaScript object to be saved as a file.
 * @param {string} filename The desired name for the downloaded file.
 * @returns {HTMLAnchorElement} The created anchor element, ready to be appended to the DOM.
 */
function createDownloadLink(doc, jsonData, filename) {
    const jsonString = safeJsonStringify(jsonData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = doc.createElement('a');
    link.href = url;
    link.download = filename;
    link.textContent = `Save ${filename}`;
    link.style.display = 'inline-block';
    link.style.padding = '10px 15px';
    link.style.backgroundColor = '#28a745'; // A nice green color
    link.style.color = 'white';
    link.style.textDecoration = 'none';
    link.style.borderRadius = '5px';
    link.style.marginBottom = '20px';
    link.style.fontWeight = 'bold';

    return link;
}
/**
 * Displays the final debugInfo object in a new tab for easy inspection.
 * @param {object} debugData The populated debugInfo object.
 * @param {object} config The configuration object for the current run.
 */
function displayDebugInfoInNewTab(debugData, config) {
    const tabTitle = 'Debug Info';
    const downloadFilename = `debug_info_${config.api.campgroundId}_${new Date().toISOString().split('T')[0]}.json`;

    if (config.tabBehavior.openDebugTabInNewWindow) {
        // --- Open in a separate browser window ---
        const tabContext = openInNewWindow(tabTitle);
        if (!tabContext) return;

        const { newTab, containerDiv, doc } = tabContext;
        addInfoElement(doc, containerDiv, 'h1', 'Script Execution Debug Information');
        const downloadLink = createDownloadLink(doc, debugData, downloadFilename);
        containerDiv.appendChild(downloadLink);
        const pre = doc.createElement('pre');
        pre.textContent = safeJsonStringify(debugData);
        containerDiv.appendChild(pre);
        newTab.document.close();
    } else {
        // --- Open as an in-page tab ---
        const panel = createInPageTab(tabTitle);
        if (!panel) return;

        addInfoElement(document, panel, 'h1', 'Script Execution Debug Information');
        const downloadLink = createDownloadLink(document, debugData, downloadFilename);
        panel.appendChild(downloadLink);
        const pre = document.createElement('pre');
        pre.textContent = safeJsonStringify(debugData);
        panel.appendChild(pre);
    }
}
/**
 * Renders a detailed block for a single campsite within a parent element.
 * This includes attributes, permitted equipment, and a media gallery.
 * @param {object} campsiteDetails The detailed data for one campsite from the RIDB API.
 * @param {Array<string>} availableDates An array of date strings when this site is "Available".
 * @param {Array<string>} notReservableDates An array of date strings when this site is "Not Reservable".
 * @param {HTMLElement} parentElement The parent element to append the details to.
 * @param {Document} [doc=document] The document object where rendering occurs.
 */
function renderCampsiteDetailsInTab(campsiteDetails, availableDates, notReservableDates, openDates, parentElement, doc = document) {
    if (!campsiteDetails) return;

    const detailDiv = doc.createElement('div');
    detailDiv.className = 'campsite-specific-details';
    detailDiv.style.border = "1px solid #eee";
    detailDiv.style.padding = "15px";
    detailDiv.style.marginBottom = "15px";
    detailDiv.style.backgroundColor = "#f9f9f9";
    detailDiv.style.borderRadius = '4px';

    const isAvailable = availableDates && availableDates.length > 0;

    if (isAvailable) {
        const availableDiv = doc.createElement('div');
        availableDiv.style.backgroundColor = '#e6ffed';
        availableDiv.style.border = '1px solid #28a745';
        availableDiv.style.padding = '10px';
        availableDiv.style.marginBottom = '10px';
        availableDiv.style.borderRadius = '4px';
        addInfoElement(doc, availableDiv, 'p', '').innerHTML = `<strong>Available on:</strong> ${availableDates.join(', ')}`;
        detailDiv.appendChild(availableDiv);
    }

    const isNotReservable = notReservableDates && notReservableDates.length > 0;

    if (isNotReservable) {
        const notReservableDiv = doc.createElement('div');
        notReservableDiv.style.backgroundColor = '#fffbe6'; // Light yellow, consistent with notices
        notReservableDiv.style.border = '1px solid #ffeeba'; // Yellow border
        notReservableDiv.style.padding = '10px';
        notReservableDiv.style.marginBottom = '10px';
        notReservableDiv.style.borderRadius = '4px';
        addInfoElement(doc, notReservableDiv, 'p', '').innerHTML = `<strong>Walk-up (FCFS) on:</strong> ${notReservableDates.join(', ')}`;
        detailDiv.appendChild(notReservableDiv);
    }

    const isOpen = openDates && openDates.length > 0;

    if (isOpen) {
        const openDiv = doc.createElement('div');
        openDiv.style.backgroundColor = '#e7f3ff'; // Light blue
        openDiv.style.border = '1px solid #4a90e2'; // Blue border
        openDiv.style.padding = '10px';
        openDiv.style.marginBottom = '10px';
        openDiv.style.borderRadius = '4px';
        addInfoElement(doc, openDiv, 'p', '').innerHTML = `<strong>Extend Only on:</strong> ${openDates.join(', ')}`;
        detailDiv.appendChild(openDiv);
    }

    const titleHeader = addInfoElement(doc, detailDiv, 'h3', `Site ${campsiteDetails.CampsiteName} (ID: ${campsiteDetails.CampsiteID})`);
    if (isAvailable && titleHeader) {
        titleHeader.style.color = '#28a745'; // Green color for available sites
    }

    // Check if the details are "rich" (have attributes or media). If not, display a warning.
    const hasRichDetails = (campsiteDetails.ATTRIBUTES && campsiteDetails.ATTRIBUTES.length > 0) ||
                           (campsiteDetails.ENTITYMEDIA && campsiteDetails.ENTITYMEDIA.length > 0);

    if (!hasRichDetails) {
        const warningP = addInfoElement(
            doc,
            detailDiv,
            'p',
            'Minimal details were returned for this campsite. The script may not have been able to identify the correct parent facility, which can be caused by API data inconsistencies for certain campgrounds.'
        );
        if (warningP) {
            warningP.style.color = '#9F3A38'; // Dark red text
            warningP.style.backgroundColor = '#FFF6F6'; // Light red background
            warningP.style.border = '1px solid #E0B4B4';
            warningP.style.padding = '10px';
            warningP.style.borderRadius = '4px';
        }
    }
    const addDetailText = (label, value) => {
        if (value !== undefined && value !== null && value.toString().trim() !== "") {
            addInfoElement(doc, detailDiv, 'p', `${label}: ${value}`).innerHTML = `<strong>${label}:</strong> ${value}`;
        }
    };

    addDetailText("Type", campsiteDetails.CampsiteType);
    addDetailText("Loop", campsiteDetails.Loop);
    addDetailText("Accessible by Vehicle", campsiteDetails.CampsiteAccessible ? "Yes" : "No");
    addDetailText("Reservable", campsiteDetails.CampsiteReservable ? "Yes" : "No");
    addDetailText("Type of Use", campsiteDetails.TypeOfUse);

    if (campsiteDetails.ATTRIBUTES && campsiteDetails.ATTRIBUTES.length > 0) {
        const attrP = addInfoElement(doc, detailDiv, 'p', `Attributes:`);
        if (attrP) {
            attrP.innerHTML = `<strong>Attributes:</strong>`;
            const attrUl = doc.createElement('ul');
            campsiteDetails.ATTRIBUTES.forEach(attr => {
                const attrLi = doc.createElement('li');
                attrLi.textContent = `${attr.AttributeName}: ${attr.AttributeValue}`;
                attrUl.appendChild(attrLi);
            });
            attrP.appendChild(attrUl);
        }
    }
    if (campsiteDetails.PERMITTEDEQUIPMENT && campsiteDetails.PERMITTEDEQUIPMENT.length > 0) {
        const equipP = addInfoElement(doc, detailDiv, 'p', `Permitted Equipment: ${campsiteDetails.PERMITTEDEQUIPMENT.map(eq => `${eq.EquipmentName} (Max Length: ${eq.MaxLength})`).join(', ')}`);
        if (equipP) equipP.innerHTML = `<strong>Permitted Equipment:</strong> ${campsiteDetails.PERMITTEDEQUIPMENT.map(eq => `${eq.EquipmentName} (Max Length: ${eq.MaxLength})`).join(', ')}`;
    }
    if (campsiteDetails.ENTITYMEDIA && campsiteDetails.ENTITYMEDIA.length > 0) {
        const imageMedia = campsiteDetails.ENTITYMEDIA.filter(m => m.MediaType === "Image" && m.URL);
        if (imageMedia.length > 0) {
            const imagesP = addInfoElement(doc, detailDiv, 'p', `Images:`);
            if (imagesP) {
                imagesP.innerHTML = `<strong>Images:</strong>`;
                const ul = doc.createElement('ul');
                imageMedia.forEach((media, index) => {
                    const li = doc.createElement('li');
                    let linkText = media.Title || `Image ${index + 1}`;
                    if (media.IsPrimary) {
                        linkText += " (Primary)";
                    }
                    li.innerHTML = `<a href="${media.URL}" target="_blank">${linkText}</a> ${media.Description ? '- ' + media.Description : ''}`;
                    ul.appendChild(li);
                });
                imagesP.appendChild(ul);
            }

            // Display actual images
            imageMedia.forEach(media => {
                const imgElement = doc.createElement('img');
                imgElement.src = media.URL;
                imgElement.alt = media.Title || media.Description || `Campsite Image for ${campsiteDetails.CampsiteName}`;
                imgElement.style.maxWidth = '100%'; // Ensure image is responsive and does not overflow its container.
                imgElement.style.height = 'auto'; // Maintain aspect ratio.
                imgElement.style.display = 'block';
                imgElement.style.marginTop = '10px';
                imgElement.style.cursor = 'pointer';
                imgElement.addEventListener('click', () => showLightbox(media.URL, doc));
                detailDiv.appendChild(imgElement);
            });
        }
    }

    parentElement.appendChild(detailDiv);
}

/**
 * Generates a compact, icon-based summary string for a site's availability.
 * @param {object} siteSummary - An object with availability statuses as keys and their counts as values.
 * @returns {string} A formatted string like " | ✅ 3 | 🚶 2".
 */
function generateCompactSummaryString(siteSummary) {
    const parts = [];
    COMPACT_SUMMARY_DISPLAY_ORDER.forEach(type => {
        if (siteSummary[type] > 0) {
            const icon = COMPACT_SUMMARY_ICONS[type];
            if (icon) { // Ensure icon is defined before adding
                parts.push(`${icon} ${siteSummary[type]}`);
            }
        }
    });
    return parts.length > 0 ? ` | ${parts.join(' | ')}` : '';
}

/**
 * Generates a detailed, multi-line tooltip string for a site's availability summary.
 * @param {object} siteSummary - An object with availability statuses as keys and their counts as values.
 * @returns {string} A formatted string for the title attribute, e.g., "Available: 3 day(s)\nWalk-up (FCFS): 2 day(s)".
 */
function generateCompactSummaryTooltip(siteSummary) {
    const parts = [];
    const statusToText = {
        [AVAILABILITY_STATUS.AVAILABLE]: 'Available',
        [AVAILABILITY_STATUS.NOT_RESERVABLE]: 'Walk-up (FCFS)',
        [AVAILABILITY_STATUS.OPEN]: 'Extend Only',
        [AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF]: 'Cutoff (Walk-up)'
    };

    COMPACT_SUMMARY_DISPLAY_ORDER.forEach(type => {
        if (siteSummary[type] > 0) {
            const text = statusToText[type];
            if (text) { // Ensure text is defined
                parts.push(`${text}: ${siteSummary[type]} day(s)`);
            }
        }
    });
    return parts.join('\n');
}

/**
 * Calculates a summary of all availability statuses from the raw combined data,
 * ignoring any date filters. This is used for the debug output.
 * @param {object} combinedCampsites The combined campsites data object from all fetched months.
 * @returns {object} An object with availability statuses as keys and their counts as values.
 */
function calculateFullAvailabilitySummary(combinedCampsites) {
    const summary = {};
    if (!combinedCampsites) return summary;

    for (const campsiteId in combinedCampsites) {
        const campsite = combinedCampsites[campsiteId];
        if (campsite && campsite.availabilities) {
            for (const date in campsite.availabilities) {
                const status = campsite.availabilities[date];
                summary[status] = (summary[status] || 0) + 1;
            }
        }
    }
    return summary;
}

/**
 * Processes the raw, combined availability data from the API.
 * It primarily calculates the summary counts of each availability status
 * within the configured date range.
 * @param {object} data The combined availability data object.
 * @param {object} config The main configuration object.
 * @returns {{campsites: object, availabilityCounts: object}} An object containing the original campsites data and the calculated counts.
 */
function processAvailabilityData(data, config) {
    const campsites = data.campsites;
    console.log("[processAvailabilityData] Extracted campsites:", campsites ? `${Object.keys(campsites).length} sites` : "null/undefined");
    const availabilityCounts = {};
    
    // Always calculate counts as they are now used in the primary "Filtered Sites" tab.
    if (campsites && Object.keys(campsites).length > 0) {
        for (const campsiteId_calc in campsites) {
            const campsite_calc = campsites[campsiteId_calc];
            for (const date_calc in campsite_calc.availabilities) {
                if (isDateInRange(date_calc, config.filters.filterStartDate, config.filters.filterEndDate)) { // Apply date range filter
                    const availability_calc = campsite_calc.availabilities[date_calc];
                    availabilityCounts[availability_calc] = (availabilityCounts[availability_calc] || 0) + 1;
                }
            }
        }
    }
    console.log("[processAvailabilityData] Calculated availabilityCounts:", availabilityCounts);
    debugInfo.processing.availabilityCounts = availabilityCounts;
    return { campsites, availabilityCounts };
}

/**
 * Returns a CSS class name based on the availability status string.
 * @param {string} availabilityStatus The status string (e.g., "Available", "Reserved").
 * @returns {string} The corresponding CSS class name (e.g., "available", "reserved").
 */
function getAvailabilityClass(availabilityStatus) {
    switch (availabilityStatus) {
        case AVAILABILITY_STATUS.RESERVED: return "reserved";
        case AVAILABILITY_STATUS.CLOSED: return "closed";
        case AVAILABILITY_STATUS.NYR: return "NYR";
        case AVAILABILITY_STATUS.AVAILABLE: return "available";
        case AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF: return "cutoff";
        case AVAILABILITY_STATUS.OPEN: return "open-continuation";
        case AVAILABILITY_STATUS.NOT_RESERVABLE: return "walk-up";
        default: return AVAILABILITY_STATUS.UNKNOWN.toLowerCase(); // Ensure class is lowercase
    }
}

/**
 * Creates a standard table row (<tr>) for displaying availability data.
 * This is a reusable helper that dynamically creates cells based on the provided headers array,
 * ensuring consistency and correct column order across all tables.
 * @param {Document} doc The document object.
 * @param {object} rowData The data for the row, including site, date, availability, etc.
 * @param {string[]} headers The ordered array of headers for the table.
 * @returns {HTMLTableRowElement} The constructed <tr> element.
 */
function createBaseAvailabilityRow(doc, rowData, headers) {
    const tr = doc.createElement('tr');

    headers.forEach(header => {
        const cell = tr.insertCell();
        switch (header) {
            case 'Site':
                cell.textContent = rowData.site;
                break;
            case 'Date':
                cell.textContent = rowData.date;
                break;
            case 'Availability':
                let availabilityText = rowData.availability;
                let availabilityTitle = '';

                if (rowData.availability === AVAILABILITY_STATUS.OPEN) {
                    availabilityText = 'Extend Only';
                } else if (rowData.availability === AVAILABILITY_STATUS.NOT_RESERVABLE) {
                    availabilityText = 'Walk-up';
                    availabilityTitle = 'This site is not available for online reservation but may be available on-site on a first-come, first-served basis.';
                } else if (rowData.availability === AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF) {
                    availabilityText = 'Cutoff';
                    availabilityTitle = 'This date is within the booking cutoff window and is no longer available for online reservation. It may be available for walk-up (FCFS) at the campground.';
                }

                cell.textContent = availabilityText;
                if (availabilityTitle) cell.title = availabilityTitle;
                cell.className = getAvailabilityClass(rowData.availability);
                break;
            case 'Campsite ID':
                cell.textContent = rowData.campsite_id;
                break;
            case 'Actions':
                // This cell is intentionally left blank. It will be populated by the calling function if needed.
                break;
        }
    });

    return tr;
}

/**
 * Creates a reusable sorting function for campsite data rows.
 * This ensures consistent sorting behavior across all tables.
 * The sort order is determined by the primary key, with the other key used for tie-breaking.
 *
 * When sorting by site, it correctly handles alphanumeric names by first comparing
 * the numeric part and then the full string name.
 *
 * @param {string} primarySortKey - The primary key to sort by, either "date" or "site".
 * @returns {function} A comparison function for use with Array.prototype.sort().
 */
function createSiteSorter(primarySortKey = 'date') {
    return (a, b) => {
        // --- Site Name Comparison Logic (handles alphanumeric) ---
        const siteNameA = a.site || '';
        const siteNameB = b.site || '';

        const getParts = (siteName) => {
            // Regular expression to capture a non-digit prefix and a numeric part.
            const regex = /^(\D*)(\d+.*)$/;
            const match = siteName.match(regex);

            if (match) {
                // Handles 'A001', 'Loop-A-10', etc.
                // parseInt will stop at the first non-digit, handling '10a' correctly.
                return { prefix: match[1], num: parseInt(match[2], 10) };
            }

            // Handles purely numeric site names like '101'.
            const num = parseInt(siteName, 10);
            if (!isNaN(num) && String(num) === siteName) {
                return { prefix: '', num };
            }

            // Handles purely alphabetic site names like 'WALKUP'.
            return { prefix: siteName, num: 0 };
        };

        const partsA = getParts(siteNameA);
        const partsB = getParts(siteNameB);

        let siteComparison;
        if (partsA.prefix !== partsB.prefix) {
            siteComparison = partsA.prefix.localeCompare(partsB.prefix);
        } else {
            siteComparison = partsA.num - partsB.num;
        }

        // --- Date Comparison Logic ---
        const dateComparison = a.originalDate.getTime() - b.originalDate.getTime();

        // --- Apply Primary/Secondary Sort ---
        if (primarySortKey === 'site') {
            return siteComparison !== 0 ? siteComparison : dateComparison;
        }

        // Default to 'date' as primary
        return dateComparison !== 0 ? dateComparison : siteComparison;
    };
}

/**
 * Starts a cooldown timer on the submit button, disabling it and showing a countdown.
 * @param {HTMLButtonElement} button The submit button element.
 */
function startCooldown(button) {
    if (cooldownIntervalId) {
        clearInterval(cooldownIntervalId);
    }

    let secondsRemaining = COOLDOWN_SECONDS;
    button.disabled = true;
    button.textContent = `Please wait (${secondsRemaining}s)...`;
    button.title = `To ensure fair use of the service, a ${COOLDOWN_SECONDS}-second cooldown is active between searches.`;

    cooldownIntervalId = setInterval(() => {
        secondsRemaining--;
        if (secondsRemaining > 0) {
            button.textContent = `Please wait (${secondsRemaining}s)...`;
        } else {
            clearInterval(cooldownIntervalId);
            cooldownIntervalId = null;
            button.disabled = false;
            button.textContent = 'Run Availability Check';
            button.title = '';
        }
    }, 1000);
}

// --- Main Page Rendering Sub-components ---

/**
 * Renders the main header section with facility and recreation area details.
 * @param {HTMLElement} parentElement The element to append the header content to.
 * @param {object|null} facilityDetails The detailed data for the facility.
 * @param {object|null} recAreaDetails The detailed data for the parent recreation area.
 * @param {IdCollection} ids The collection of IDs for the campground.
 */
function renderFacilityHeaderAndDetails(parentElement, facilityDetails, recAreaDetails, searchResult, ids) {
    addInfoElement(document, parentElement, 'h1', facilityDetails.FacilityName || `Details for Campground ID: ${ids.campgroundId}`);

    if (searchResult) {
        renderUserRatings(parentElement, searchResult);
        renderAtAGlanceInfo(parentElement, searchResult);
    }

    // --- Display Key IDs ---
    const idsDiv = document.createElement('div');
    idsDiv.className = 'id-display-section';
    idsDiv.style.padding = '10px';
    idsDiv.style.margin = '10px 0';
    idsDiv.style.backgroundColor = '#f0f0f0';
    idsDiv.style.border = '1px solid #ddd';

    let campgroundIdText = `<strong>Recreation.gov Campground ID:</strong> ${ids.campgroundId || 'Not Found'}`;
    if (facilityDetails && facilityDetails.FacilityName) {
        const cleanName = facilityDetails.FacilityName.split('(')[0].trim();
        campgroundIdText += ` (${cleanName})`;
    }
    addInfoElement(document, idsDiv, 'p', '').innerHTML = campgroundIdText;

    let recAreaText = `<strong>Parent RecArea ID:</strong> ${ids.recAreaId || 'Not Found'}`;
    if (recAreaDetails && recAreaDetails.RecAreaName) {
        recAreaText += ` (${recAreaDetails.RecAreaName})`;
    }
    addInfoElement(document, idsDiv, 'p', '').innerHTML = recAreaText;

    if (searchResult?.org_name && searchResult?.org_id) {
        const orgText = `<strong>Managing Organization:</strong> ${searchResult.org_name} (ID: ${searchResult.org_id})`;
        addInfoElement(document, idsDiv, 'p', '').innerHTML = orgText;
    }
    parentElement.appendChild(idsDiv);

    // --- Add link to Recreation.gov for the campground ---
    const recGovLink = addInfoElement(document, parentElement, 'p', '');
    if (recGovLink) {
        const link = document.createElement('a');
        link.href = `https://www.recreation.gov/camping/campgrounds/${ids.campgroundId}`;
        link.textContent = `View ${facilityDetails.FacilityName || 'Campground'} on Recreation.gov`;
        link.target = '_blank';
        recGovLink.appendChild(link);
    }

    // Helper to add a detail if it exists
    const addDetail = (label, value, isHTML = false) => {
        if (value && value.toString().trim() !== "") {
            const p = addInfoElement(document, parentElement, 'p', '');
            if (p) p.innerHTML = `<strong>${label}:</strong> ${value}`;
        }
    };

    addDetail("Type", facilityDetails.FacilityTypeDescription);
    if (facilityDetails.FacilityDescription) addDetail("Description", facilityDetails.FacilityDescription, true);
    if (facilityDetails.FacilityDirections) addDetail("Directions", facilityDetails.FacilityDirections, true);
    addDetail("Phone", facilityDetails.FacilityPhone);
    if (facilityDetails.FacilityEmail) addDetail("Email", `<a href="mailto:${facilityDetails.FacilityEmail}">${facilityDetails.FacilityEmail}</a>`, true);
    addDetail("Accessibility", facilityDetails.FacilityAccessibilityText);

    let facilityLat, facilityLon;
    if (facilityDetails.FacilityLatitude && facilityDetails.FacilityLongitude) {
        facilityLat = facilityDetails.FacilityLatitude;
        facilityLon = facilityDetails.FacilityLongitude;
    } else if (facilityDetails.GEOJSON && facilityDetails.GEOJSON.COORDINATES && facilityDetails.GEOJSON.COORDINATES.length === 2) {
        facilityLat = facilityDetails.GEOJSON.COORDINATES[1];
        facilityLon = facilityDetails.GEOJSON.COORDINATES[0];
    }
    if (facilityLat && facilityLon) {
        addDetail("Coordinates", `<a href="https://www.google.com/maps?q=${facilityLat},${facilityLon}" target="_blank">${facilityLat}, ${facilityLon} (View on Map)</a>`, true);

        // --- Add Interactive Map ---
        const mapFrame = document.createElement('iframe');
        mapFrame.src = `https://maps.google.com/maps?q=${facilityLat},${facilityLon}&z=14&output=embed`;
        mapFrame.width = '100%';
        mapFrame.height = '300';
        mapFrame.style.border = '0';
        mapFrame.style.borderRadius = '4px';
        mapFrame.style.marginTop = '10px';
        mapFrame.allowFullscreen = true;
        mapFrame.loading = 'lazy';
        mapFrame.referrerPolicy = 'no-referrer-when-downgrade';
        parentElement.appendChild(mapFrame);

        // --- Add OpenStreetMap View ---
        const osmHeader = addInfoElement(document, parentElement, 'h3', 'OpenStreetMap View');
        if (osmHeader) {
            osmHeader.style.marginTop = '20px';
            osmHeader.style.paddingTop = '15px';
            osmHeader.style.borderTop = '1px solid #eee';
        }

        const osmMapFrame = document.createElement('iframe');
        // Create a small bounding box around the point for a reasonable zoom level
        const bboxOffset = 0.01;
        const lon1 = facilityLon - bboxOffset;
        const lat1 = facilityLat - bboxOffset;
        const lon2 = facilityLon + bboxOffset;
        const lat2 = facilityLat + bboxOffset;

        osmMapFrame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon1},${lat1},${lon2},${lat2}&layer=mapnik&marker=${facilityLat},${facilityLon}`;
        osmMapFrame.width = '100%';
        osmMapFrame.height = '300';
        osmMapFrame.style.border = '0';
        osmMapFrame.style.borderRadius = '4px';
        osmMapFrame.style.marginTop = '10px';
        parentElement.appendChild(osmMapFrame);
    }

    if (facilityDetails.FACILITYADDRESS && facilityDetails.FACILITYADDRESS.length > 0) {
        const address = facilityDetails.FACILITYADDRESS[0];
        let addressString = [address.FacilityStreetAddress1, address.City, address.AddressStateCode, address.PostalCode].filter(Boolean).join(', ');
        addDetail("Address", addressString);
    }

    if (facilityDetails.ORGANIZATION?.[0]?.OrgName) addDetail("Managed By", facilityDetails.ORGANIZATION[0].OrgName);
    if (facilityDetails.RECAREA?.[0]?.RecAreaName) addDetail("Recreation Area", facilityDetails.RECAREA[0].RecAreaName);
    if (facilityDetails.Keywords) addDetail("Keywords", facilityDetails.Keywords.replace(/,/g, ', '));
    addDetail("Reservable", facilityDetails.Reservable ? "Yes" : "No");
    addDetail("Enabled", facilityDetails.Enabled ? "Yes" : "No");
    addDetail("Last Updated", facilityDetails.LastUpdatedDate);

    // --- Display RecArea Details ---
    if (recAreaDetails) {
        const recAreaContainer = document.createElement('div');
        recAreaContainer.className = 'rec-area-details';
        recAreaContainer.style.marginTop = '20px';
        recAreaContainer.style.paddingTop = '15px';
        recAreaContainer.style.borderTop = '2px solid #ccc';
        addInfoElement(document, recAreaContainer, 'h2', recAreaDetails.RecAreaName || 'Recreation Area Details');

        const addRecAreaDetail = (label, value, isHTML = false) => {
            if (value && value.toString().trim() !== "") {
                const p = addInfoElement(document, recAreaContainer, 'p', '');
                if (p) p.innerHTML = `<strong>${label}:</strong> ${value}`;
            }
        };

        addRecAreaDetail("Description", recAreaDetails.RecAreaDescription, true);
        addRecAreaDetail("Directions", recAreaDetails.RecAreaDirections, true);
        addRecAreaDetail("Phone", recAreaDetails.RecAreaPhone);
        if (recAreaDetails.RecAreaEmail) addRecAreaDetail("Email", `<a href="mailto:${recAreaDetails.RecAreaEmail}">${recAreaDetails.RecAreaEmail}</a>`, true);
        if (recAreaDetails.RecAreaLatitude && recAreaDetails.RecAreaLongitude) {
            const lat = recAreaDetails.RecAreaLatitude;
            const lon = recAreaDetails.RecAreaLongitude;
            addRecAreaDetail("Coordinates", `<a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank">${lat}, ${lon} (View on Map)</a>`, true);
        }
        if (recAreaDetails.Keywords) addRecAreaDetail("Keywords", recAreaDetails.Keywords.replace(/,/g, ', '));
        addRecAreaDetail("Last Updated", recAreaDetails.LastUpdatedDate);
        parentElement.appendChild(recAreaContainer);
    }
}

/**
 * Renders a media gallery with a primary image and thumbnails.
 * @param {HTMLElement} parentElement The DOM element to append the gallery to.
 * @param {Array<object>} mediaArray The array of media objects from the RIDB API.
 * @param {string} title The `<h3>` title for the gallery section (e.g., "Facility Media").
 */
function renderMediaGallery(parentElement, mediaArray, title) {
    const imageMedia = mediaArray.filter(m => m.MediaType === "Image" && m.URL);
    if (imageMedia.length === 0) return;

    const mediaHeader = addInfoElement(document, parentElement, 'h3', title);
    mediaHeader.style.marginTop = '20px';
    mediaHeader.style.paddingTop = '15px';
    mediaHeader.style.borderTop = '1px solid #eee';

    let primaryMedia = imageMedia.find(m => m.IsPrimary) || imageMedia[0];

    const primaryImageContainer = document.createElement('div');
    primaryImageContainer.style.marginBottom = '10px';
    const primaryImg = document.createElement('img');
    primaryImg.src = primaryMedia.URL;
    primaryImg.alt = primaryMedia.Title || 'Primary Image';
    primaryImg.title = `View full size: ${primaryMedia.Title || 'Primary Image'}`;
    primaryImg.style.maxWidth = '600px';
    primaryImg.style.width = '100%';
    primaryImg.style.height = 'auto';
    primaryImg.style.border = '1px solid #ddd';
    primaryImg.style.borderRadius = '4px';
    primaryImg.style.cursor = 'pointer';
    primaryImg.addEventListener('click', () => showLightbox(primaryMedia.URL, document));
    primaryImageContainer.appendChild(primaryImg);
    parentElement.appendChild(primaryImageContainer);

    const thumbnailMedia = imageMedia.filter(m => m !== primaryMedia);
    if (thumbnailMedia.length > 0) {
        const thumbnailGrid = document.createElement('div');
        thumbnailGrid.className = 'thumbnail-grid';
        thumbnailMedia.forEach(media => {
            const thumbImg = document.createElement('img');
            thumbImg.src = media.URL;
            thumbImg.alt = media.Title || 'Thumbnail Image';
            thumbImg.title = media.Title || 'Facility Image';
            thumbImg.className = 'thumbnail-image';
            thumbImg.addEventListener('click', () => showLightbox(media.URL, document));
            thumbnailGrid.appendChild(thumbImg);
        });
        parentElement.appendChild(thumbnailGrid);
    }
}

/**
 * Renders the "Upcoming Events" section based on fetched data and status.
 * @param {HTMLElement} parentElement The DOM element to append the events section to.
 * @param {Array<object>|null} eventsData The fetched events data array from RIDB.
 * @param {IdCollection} ids An object containing key IDs, including `eventInfoStatus`.
 */
function renderEventsSection(parentElement, eventsData, ids) {
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'events-section';
    eventsContainer.style.marginTop = '20px';
    eventsContainer.style.paddingTop = '15px';
    eventsContainer.style.borderTop = '2px solid #ccc';
    addInfoElement(document, eventsContainer, 'h3', 'Upcoming Events');

    switch (ids.eventInfoStatus) {
        case 'ID_FOUND':
            if (eventsData && eventsData.length > 0) {
                eventsData.forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.className = 'event-details-main';
                    eventDiv.style.border = "1px solid #ddd";
                    eventDiv.style.padding = "15px";
                    eventDiv.style.marginBottom = "15px";
                    eventDiv.style.backgroundColor = "#fdfdfd";
                    addInfoElement(document, eventDiv, 'h4', event.EventName);
                    const addEventDetail = (label, value, isHTML = false) => {
                        if (value !== undefined && value !== null && value.toString().trim() !== "") {
                            const p = addInfoElement(document, eventDiv, 'p', '');
                            if (p) p.innerHTML = `<strong>${label}:</strong> ${value}`;
                        }
                    };
                    addEventDetail("Type", event.EventType);
                    addEventDetail("Start Date", event.EventStartDate ? formatUTCDate(new Date(event.EventStartDate)) : "N/A");
                    addEventDetail("End Date", event.EventEndDate ? formatUTCDate(new Date(event.EventEndDate)) : "N/A");
                    addEventDetail("Description", event.EventDescription, true);
                    if (event.EventURL) addEventDetail("More Info", `<a href="${event.EventURL}" target="_blank">Click here</a>`, true);
                    eventsContainer.appendChild(eventDiv);
                });
            } else if (eventsData) {
                addInfoElement(document, eventsContainer, 'p', 'No upcoming events found for this area.');
            } else {
                addInfoElement(document, eventsContainer, 'p', 'Could not retrieve event information. The API call for events failed.');
            }
            break;
        case 'INCOMPLETE_DATA':
            addInfoElement(document, eventsContainer, 'p', 'Could not check for events. The parent Recreation Area could not be automatically identified.');
            break;
        case 'FETCH_FAILED':
            addInfoElement(document, eventsContainer, 'p', 'Could not check for events. The initial metadata request to identify the Recreation Area failed.');
            break;
    }
    parentElement.appendChild(eventsContainer);
}

/**
 * Renders the booking window information on the main page.
 * @param {HTMLElement} parentElement The DOM element to append the section to.
 * @param {object|null} bookingInfo The `booking_information` object from the campground metadata.
 */
function renderBookingWindow(parentElement, bookingInfo) {
    if (!bookingInfo?.booking_window_message) {
        return;
    }
    const doc = parentElement.ownerDocument;
    const container = doc.createElement('div');
    container.className = 'info-section';
    addInfoElement(doc, container, 'h3', 'Booking Window');
    addInfoElement(doc, container, 'p', bookingInfo.booking_window_message);
    parentElement.appendChild(container);
}

/**
 * Renders a table of facility rates by season.
 * @param {HTMLElement} parentElement The DOM element to append the section to.
 * @param {Array<object>|null} feePolicies The `fee_policies` array from the campground metadata.
 */
function renderFacilityRates(parentElement, feePolicies) {
    if (!feePolicies || feePolicies.length === 0) {
        return;
    }
    const doc = parentElement.ownerDocument;
    const container = doc.createElement('div');
    container.className = 'info-section';
    addInfoElement(doc, container, 'h3', 'Facility Rates');

    const { tbody } = createTableStructure(doc, ["Season Dates", "Site Type", "Nightly/Daily Rates"], container);

    feePolicies.forEach(policy => {
        if (!policy.rates || policy.rates.length === 0) {
            return; // Skip seasons with no rates (like 'Out of Season')
        }
        const seasonText = `<strong>${policy.season}</strong><br>${formatUTCDate(new Date(policy.start_date))} - ${formatUTCDate(new Date(policy.end_date))}`;

        policy.rates.forEach((rate, index) => {
            const tr = doc.createElement('tr');
            if (index === 0) {
                const seasonCell = tr.insertCell();
                seasonCell.rowSpan = policy.rates.length;
                seasonCell.innerHTML = seasonText;
            }
            tr.insertCell().textContent = rate.site_type;
            tr.insertCell().textContent = `$${parseFloat(rate.cost).toFixed(2)}`;
            tbody.appendChild(tr);
        });
    });
    parentElement.appendChild(container);
}

/**
 * Renders a table of reservation rules.
 * @param {HTMLElement} parentElement The DOM element to append the section to.
 * @param {object} metadata The full `campgroundMetadata` object.
 */
function renderReservationRules(parentElement, metadata) {
    const doc = parentElement.ownerDocument;
    const rulesToRender = [];

    // Case 1: The ideal, simple array format under the 'rules' key.
    if (metadata.rules && Array.isArray(metadata.rules) && metadata.rules.length > 0) {
        metadata.rules.forEach(rule => {
            rulesToRender.push({ name: rule.name, description: rule.description });
        });
    }
    // Case 2: The object-based format under the 'facility_rules' key.
    else if (metadata.facility_rules && typeof metadata.facility_rules === 'object') {
        const facilityRules = metadata.facility_rules;
        const toTitleCase = (str) => str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

        for (const key in facilityRules) {
            const rule = facilityRules[key];
            let description = rule.description || '';

            // Construct a more human-readable description if one isn't provided.
            if (!description && rule.value) {
                switch (key) {
                    case 'maxConsecutiveStay':
                        description = `You may stay up to ${rule.value} ${rule.units || 'nights'} during a visit.`;
                        break;
                    case 'minConsecutiveStay':
                        description = `You must stay at least ${rule.value} ${rule.units || 'night(s)'} to book a visit.`;
                        break;
                    case 'minHolidayWeekendStay':
                        description = `A minimum stay of ${rule.value} nights is required on holiday weekends.`;
                        break;
                    case 'minWeekendStay':
                        description = `A minimum stay of ${rule.value} nights is required on weekends.`;
                        break;
                    case 'reservationCutOff':
                        description = `Reservations must be made at least ${rule.value} day(s) in advance.`;
                        break;
                    default:
                        description = `A value of ${rule.value} ${rule.units || ''} applies.`.trim();
                }
            }
            rulesToRender.push({ name: toTitleCase(key), description });
        }
    }

    if (rulesToRender.length === 0) {
        return;
    }

    const container = doc.createElement('div');
    container.className = 'info-section';
    addInfoElement(doc, container, 'h3', 'Reservation Rules');

    const { tbody } = createTableStructure(doc, ["Rule Name", "Description"], container);

    rulesToRender.forEach(rule => {
        const tr = doc.createElement('tr');
        tr.insertCell().textContent = rule.name;
        tr.insertCell().textContent = rule.description;
        tbody.appendChild(tr);
    });
    parentElement.appendChild(container);
}

/**
 * Renders a list of important notices.
 * @param {HTMLElement} parentElement The DOM element to append the section to.
 * @param {Array<object>|null} notices The `notices` array from the campground metadata.
 */
function renderNotices(parentElement, notices) {
    if (!notices || notices.length === 0) {
        return;
    }
    const doc = parentElement.ownerDocument;
    const container = doc.createElement('div');
    container.className = 'info-section notices-section';
    addInfoElement(doc, container, 'h3', 'Important Notices');

    notices.forEach(notice => {
        if (notice.notice_text) {
            const noticeDiv = doc.createElement('div');
            noticeDiv.className = `notice-item notice-${notice.notice_type || 'info'}`; // e.g., notice-warning
            noticeDiv.innerHTML = notice.notice_text; // Use innerHTML as notices can contain HTML tags
            container.appendChild(noticeDiv);
        }
    });
    parentElement.appendChild(container);
}

/**
 * Renders a list of related links.
 * @param {HTMLElement} parentElement The DOM element to append the section to.
 * @param {Array<object>|null} links The `links` array from the campground metadata.
 */
function renderLinks(parentElement, links) {
    if (!links || links.length === 0) {
        return;
    }
    const doc = parentElement.ownerDocument;
    const container = doc.createElement('div');
    container.className = 'info-section';
    addInfoElement(doc, container, 'h3', 'Related Links');

    const ul = doc.createElement('ul');
    links.forEach(link => {
        if (link.url && link.title) {
            const li = doc.createElement('li');
            const a = doc.createElement('a');
            a.href = link.url;
            a.textContent = link.title;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            li.appendChild(a);
            if (link.description) {
                li.append(` - ${link.description}`);
            }
            ul.appendChild(li);
        }
    });
    container.appendChild(ul);
    parentElement.appendChild(container);
}

/**
 * Renders a list of available activities.
 * @param {HTMLElement} parentElement The DOM element to append the section to.
 * @param {Array<object>|null} activities The `activities` array from the campground metadata.
 */
function renderActivities(parentElement, activities) {
    if (!activities || activities.length === 0) {
        return;
    }
    const doc = parentElement.ownerDocument;
    const container = doc.createElement('div');
    container.className = 'info-section';
    addInfoElement(doc, container, 'h3', 'Activities');

    const activityNames = activities.map(act => act.activity_name).filter(Boolean).join(', ');
    addInfoElement(doc, container, 'p', activityNames);
    parentElement.appendChild(container);
}

/**
 * Renders the facility's address.
 * @param {HTMLElement} parentElement The DOM element to append the section to.
 * @param {Array<object>|null} addresses The `addresses` array from the campground metadata.
 */
function renderAddresses(parentElement, addresses) {
    if (!addresses || addresses.length === 0) {
        return;
    }
    const doc = parentElement.ownerDocument;
    const container = doc.createElement('div');
    container.className = 'info-section';
    addInfoElement(doc, container, 'h3', 'Address');

    addresses.forEach(address => {
        const addressParts = [
            address.address1,
            address.address2,
            address.address3,
            address.city,
            address.state_code,
            address.postal_code
        ].filter(Boolean).join(', ');

        if (addressParts) {
            addInfoElement(doc, container, 'p', addressParts);
        }
    });
    parentElement.appendChild(container);
}

/**
 * Renders other miscellaneous details from the campground metadata.
 * @param {HTMLElement} parentElement The DOM element to append the section to.
 * @param {object} metadata The full `campgroundMetadata` object.
 */
function renderOtherMetadata(parentElement, metadata) {
    const doc = parentElement.ownerDocument;
    const container = doc.createElement('div');
    container.className = 'info-section';

    const addDetail = (label, value) => {
        // Check for undefined, null, or empty string
        if (value === undefined || value === null || value.toString().trim() === "") return;

        // Add the 'h3' header only if we are about to add the first detail.
        if (container.children.length === 0) {
            addInfoElement(doc, container, 'h3', 'Additional Details');
        }
        const p = addInfoElement(doc, container, 'p', '');
        if (p) p.innerHTML = `<strong>${label}:</strong> ${value}`;
    };

    addDetail("Time Zone", metadata.facility_time_zone);
    addDetail("Commercially Managed", typeof metadata.is_commercially_managed === 'boolean' ? (metadata.is_commercially_managed ? "Yes" : "No") : metadata.is_commercially_managed);

    if (container.children.length > 0) parentElement.appendChild(container);
}
/**
 * Renders the main, comprehensive availability data table on the primary page.
 * @param {HTMLElement} parentElement The DOM element to append the table to.
 * @param {object} campsites The combined campsites data object.
 * @param {Date} requestDateTime The timestamp when the data request was made.
 * @param {Response} response The raw fetch response object for cache info.
 * @param {object} config The script's configuration object.
 */
function renderMainAvailabilityTable(parentElement, campsites, requestDateTime, response, config) {
    const availabilityHeader = addInfoElement(document, parentElement, 'h3', "Monthly Availability Details");
    if (availabilityHeader) availabilityHeader.style.marginTop = "20px";

    addRequestInfoElements(document, parentElement, requestDateTime, response);

    const rowsToSort = [];
    if (campsites && Object.keys(campsites).length > 0) {
        for (const cId in campsites) {
            const campsite = campsites[cId];
            for (const dateStr in campsite.availabilities) {
                if (isDateInRange(dateStr, config.filters.filterStartDate, config.filters.filterEndDate)) {
                    rowsToSort.push({
                        site: campsite.site,
                        date: formatDateForTableDisplay(new Date(dateStr)),
                        originalDate: new Date(dateStr),
                        availability: campsite.availabilities[dateStr],
                        quantity: campsite.quantities[dateStr],
                        campsite_id: campsite.campsite_id
                    });
                }
            }
        }
    }

    rowsToSort.sort(createSiteSorter(config.sorting.primarySortKey));

    const resultCount = rowsToSort.length;
    if (resultCount === 0) {
        addInfoElement(document, parentElement, 'p', 'No availability data found for the selected period.');
        return;
    }

    const tableToggleButton = document.createElement('button');
    tableToggleButton.className = 'collapsible-summary';
    tableToggleButton.textContent = `Show Main Availability Table (${resultCount} rows)`;
    tableToggleButton.style.marginTop = '20px';

    const tableContainer = document.createElement('div');
    tableContainer.className = 'collapsible-details'; // Hidden by default

    parentElement.appendChild(tableToggleButton);
    parentElement.appendChild(tableContainer);

    tableToggleButton.addEventListener('click', () => {
        tableToggleButton.classList.toggle('active');
        const isVisible = tableContainer.style.display === 'block';
        tableContainer.style.display = isVisible ? 'none' : 'block';
        tableToggleButton.textContent = isVisible
            ? `Show Main Availability Table (${resultCount} rows)`
            : `Hide Main Availability Table (${resultCount} rows)`;
    });

    const resultText = `Showing ${resultCount} result${resultCount !== 1 ? 's' : ''}.`;
    addInfoElement(document, tableContainer, 'p', resultText, 'row-count-info');

    const sortDescription = config.sorting.primarySortKey === 'site' ? "Data sorted primarily by Site, then by Date." : "Data sorted primarily by Date, then by Site.";
    const mainSortInfo = addInfoElement(document, tableContainer, 'p', sortDescription, 'sort-info');
    if (mainSortInfo) mainSortInfo.style.fontStyle = 'italic';

    const headers = getDynamicTableHeaders(config, config.display.showCampsiteIdColumn, false);
    const { table, tbody } = createTableStructure(document, headers, tableContainer);

    applyTableColumnStyles(table, headers, document, 'main-availability');

    rowsToSort.forEach(itemData => {
        const row = createBaseAvailabilityRow(document, itemData, headers);
        tbody.appendChild(row);
    });
}

/**
 * Renders all content for the main `index.html` page.
 * This function acts as a master renderer for the primary view, calling sub-functions
 * to render each distinct section (header, details, events, summary, table).
 * @param {HTMLElement} containerElement The main container element from `index.html`.
 * @param {object|null} facilityDetails The detailed data for the facility.
 * @param {object|null} recAreaDetails The detailed data for the parent recreation area.
 * @param {Array<object>|null} eventsData The array of event data.
 * @param {Array<object>|null} recAreaMedia The array of media data for the recreation area.
 * @param {object} campsites The combined campsites data.
 * @param {object} availabilityCounts The summary of availability counts.
 * @param {Date} requestDateTime The timestamp of the data request.
 * @param {Response} response The raw fetch response object.
 * @param {object} config The script's configuration object.
 * @param {IdCollection} ids An object containing all relevant IDs.
 */
function renderMainPage(containerElement, campgroundMetadata, facilityDetails, recAreaDetails, eventsData, recGovSearchData, recAreaMedia, campsites, availabilityCounts, requestDateTime, response, config, ids) {
    if (typeof document === 'undefined' || !containerElement) {
        console.warn("Main page container element not found or document not available. Skipping main page DOM updates.");
        return;
    }

    containerElement.innerHTML = '';

    const searchResult = recGovSearchData?.results?.[0] || null;
    const mainPageRenderStatus = debugInfo.rendering.mainPageRenderStatus;

    // Centralized badge creation (always create the badge element)
    const badgePlaceholder = document.createElement('div');
    badgePlaceholder.style.textAlign = 'left';
    badgePlaceholder.style.marginBottom = '10px';
    const badge = document.createElement('span');
    badge.className = 'api-status-badge';
    badge.style.display = 'none'; // Initially hidden
    badgePlaceholder.appendChild(badge);

    debugInfo.rendering.mainPageRenderStatus.facilityDetails = !!facilityDetails;
    debugInfo.rendering.mainPageRenderStatus.recAreaDetails = !!recAreaDetails;
    debugInfo.rendering.mainPageRenderStatus.events = ids.eventInfoStatus;
    debugInfo.rendering.mainPageRenderStatus.mediaGalleries = 0;

    // --- New debug info for rec.gov search data ---
    mainPageRenderStatus.recGovSearchData = searchResult ? 'DATA_FOUND' : 'DATA_MISSING';
    mainPageRenderStatus.userRatings = searchResult && typeof searchResult.average_rating === 'number' ? 'DATA_FOUND' : 'DATA_MISSING';
    mainPageRenderStatus.atAGlanceInfo = searchResult && (searchResult.campsites_count || typeof searchResult.aggregate_cell_coverage === 'number' || searchResult.price_range) ? 'DATA_FOUND' : 'DATA_MISSING';
    mainPageRenderStatus.primaryImage = searchResult?.preview_image_url ? 'DATA_FOUND' : 'DATA_MISSING';
    mainPageRenderStatus.organizationInfo = searchResult?.org_name && searchResult?.org_id ? 'DATA_FOUND' : 'DATA_MISSING';

    // --- Section 1: Render Header, Details, and Galleries ---
    if (facilityDetails) {
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'facility-details';
        detailsContainer.style.fontSize = "1.1rem";
        containerElement.appendChild(detailsContainer);

        // Insert the API status badge placeholder after the main H1 title
        // The H1 is created by renderFacilityHeaderAndDetails
        // Render the main header, facility details, and rec area details into their container.
        renderFacilityHeaderAndDetails(detailsContainer, facilityDetails, recAreaDetails, searchResult, ids);
        const h1 = detailsContainer.querySelector('h1');
        if (h1) h1.parentNode.insertBefore(badgePlaceholder, h1.nextSibling);

        const ratingsSection = detailsContainer.querySelector('.ratings-section');
        if (ratingsSection) {
            // The badge is now inserted after the H1, so this specific insertion logic is no longer needed.
            // The ratings section will appear after the badge.
        }

        // Render primary image from search data, if available
        if (searchResult) {
            renderPrimaryImage(detailsContainer, searchResult);
        }

        // Render media galleries into the same container.
        if (facilityDetails.MEDIA && facilityDetails.MEDIA.length > 0) {
            renderMediaGallery(detailsContainer, facilityDetails.MEDIA, 'Facility Media');
            debugInfo.rendering.mainPageRenderStatus.mediaGalleries++;
        }
        if (recAreaMedia && recAreaMedia.length > 0) {
            renderMediaGallery(detailsContainer, recAreaMedia, 'Recreation Area Gallery');
            debugInfo.rendering.mainPageRenderStatus.mediaGalleries++;
        }

        // Render the events section directly into the main container, after the details block.
        renderEventsSection(containerElement, eventsData, ids);
    } else {
        // Fallback if facilityDetails are not available, still provide a link and key IDs.
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'facility-details';
        addInfoElement(document, fallbackDiv, 'h1', `Details for Campground ID: ${ids.campgroundId}`);

        // Insert the API status badge placeholder after the main H1 title in fallback
        const h1 = fallbackDiv.querySelector('h1');
        if (h1) h1.parentNode.insertBefore(badgePlaceholder, h1.nextSibling);

        const idsDiv = document.createElement('div');
        idsDiv.className = 'id-display-section';
        idsDiv.style.padding = '10px';
        idsDiv.style.margin = '10px 0';
        idsDiv.style.backgroundColor = '#f0f0f0';
        idsDiv.style.border = '1px solid #ddd';
        let campgroundIdText = `<strong>Recreation.gov Campground ID:</strong> ${ids.campgroundId || 'Not Found'}`;
        // In the fallback, we don't have facilityDetails, but we might have campgroundMetadata
        if (campgroundMetadata && campgroundMetadata.facility_name) {
            const cleanName = campgroundMetadata.facility_name.split('(')[0].trim();
            campgroundIdText += ` (${cleanName})`;
        }
        addInfoElement(document, idsDiv, 'p', '').innerHTML = campgroundIdText;

        let recAreaText = `<strong>Parent RecArea ID:</strong> ${ids.recAreaId || 'Not Found'}`;
        if (recAreaDetails && recAreaDetails.RecAreaName) {
            recAreaText += ` (${recAreaDetails.RecAreaName})`;
        }
        addInfoElement(document, idsDiv, 'p', '').innerHTML = recAreaText;

        if (searchResult?.org_name && searchResult?.org_id) {
            const orgText = `<strong>Managing Organization:</strong> ${searchResult.org_name} (ID: ${searchResult.org_id})`;
            addInfoElement(document, idsDiv, 'p', '').innerHTML = orgText;
        }

        fallbackDiv.appendChild(idsDiv);

        const recGovLink = addInfoElement(document, fallbackDiv, 'p', '');
        if (recGovLink) {
            const link = document.createElement('a');
            link.href = `https://www.recreation.gov/camping/campgrounds/${config.api.campgroundId}`;
            link.textContent = `View Campground ${config.api.campgroundId} on Recreation.gov`;
            link.target = '_blank';
            recGovLink.appendChild(link);
        }
        containerElement.appendChild(fallbackDiv);
    }

    // --- Section 1.5: Render Booking Window, Rates, and Rules from campground metadata ---
    if (campgroundMetadata) {
        const infoContainer = document.createElement('div');
        infoContainer.className = 'additional-info-container';

        // --- Debug logging for metadata sections ---
        // This helps diagnose why sections might not render by explicitly stating if the data was found.
        debugInfo.rendering.mainPageRenderStatus.bookingWindow = campgroundMetadata.booking_information ? 'DATA_FOUND' : 'DATA_MISSING';
        debugInfo.rendering.mainPageRenderStatus.facilityRates = campgroundMetadata.fee_policies ? 'DATA_FOUND' : 'DATA_MISSING';
        if (campgroundMetadata.rules && Array.isArray(campgroundMetadata.rules) && campgroundMetadata.rules.length > 0) {
            debugInfo.rendering.mainPageRenderStatus.reservationRules = 'FOUND_RULES_ARRAY';
        } else if (campgroundMetadata.facility_rules && typeof campgroundMetadata.facility_rules === 'object') {
            debugInfo.rendering.mainPageRenderStatus.reservationRules = 'FOUND_FACILITY_RULES_OBJECT';
        } else {
            debugInfo.rendering.mainPageRenderStatus.reservationRules = 'DATA_MISSING';
        }
        debugInfo.rendering.mainPageRenderStatus.notices = (campgroundMetadata.notices && campgroundMetadata.notices.length > 0) ? 'DATA_FOUND' : 'DATA_MISSING';
        debugInfo.rendering.mainPageRenderStatus.links = (campgroundMetadata.links && campgroundMetadata.links.length > 0) ? 'DATA_FOUND' : 'DATA_MISSING';
        debugInfo.rendering.mainPageRenderStatus.activities = (campgroundMetadata.activities && campgroundMetadata.activities.length > 0) ? 'DATA_FOUND' : 'DATA_MISSING';
        debugInfo.rendering.mainPageRenderStatus.addresses = (campgroundMetadata.addresses && campgroundMetadata.addresses.length > 0) ? 'DATA_FOUND' : 'DATA_MISSING';
        debugInfo.rendering.mainPageRenderStatus.otherMetadata = (campgroundMetadata.facility_time_zone || campgroundMetadata.is_commercially_managed !== undefined) ? 'DATA_FOUND' : 'DATA_MISSING';

        renderBookingWindow(infoContainer, campgroundMetadata.booking_information);
        renderFacilityRates(infoContainer, campgroundMetadata.fee_policies);
        renderReservationRules(infoContainer, campgroundMetadata);
        renderNotices(infoContainer, campgroundMetadata.notices);
        renderLinks(infoContainer, campgroundMetadata.links);
        renderActivities(infoContainer, campgroundMetadata.activities);
        renderAddresses(infoContainer, campgroundMetadata.addresses);
        renderOtherMetadata(infoContainer, campgroundMetadata);

        // Append the container with all the new sections to the main results container
        containerElement.appendChild(infoContainer);
    } else {
        // Log that the entire metadata object was missing, which explains why all related sections are absent.
        debugInfo.rendering.mainPageRenderStatus.bookingWindow = 'METADATA_OBJECT_MISSING';
        debugInfo.rendering.mainPageRenderStatus.facilityRates = 'METADATA_OBJECT_MISSING';
        debugInfo.rendering.mainPageRenderStatus.reservationRules = 'METADATA_OBJECT_MISSING';
        debugInfo.rendering.mainPageRenderStatus.notices = 'METADATA_OBJECT_MISSING';
        debugInfo.rendering.mainPageRenderStatus.links = 'METADATA_OBJECT_MISSING';
        debugInfo.rendering.mainPageRenderStatus.activities = 'METADATA_OBJECT_MISSING';
        debugInfo.rendering.mainPageRenderStatus.addresses = 'METADATA_OBJECT_MISSING';
        debugInfo.rendering.mainPageRenderStatus.otherMetadata = 'METADATA_OBJECT_MISSING';
    }

    // --- Section 2: Render Date Range, Summary, and Loop Info ---
    const dateRangeDiv = document.createElement('div');
    dateRangeDiv.className = 'date-range-info';
    dateRangeDiv.style.marginTop = '15px';
    dateRangeDiv.style.padding = '10px';
    dateRangeDiv.style.backgroundColor = '#e9e9e9';
    dateRangeDiv.style.border = '1px solid #ccc';
    dateRangeDiv.style.fontSize = "1.1rem";
    const dateRangeText = getDateRangeDisplayText(config.filters.filterStartDate, config.filters.filterEndDate, config.filters.startDate);
    addInfoElement(document, dateRangeDiv, 'p', '').innerHTML = dateRangeText;
    containerElement.appendChild(dateRangeDiv);

    const summaryElement = document.createElement("div");
    summaryElement.className = 'availability-summary-main';
    summaryElement.style.fontSize = "1.1rem";
    addInfoElement(document, summaryElement, 'h3', "Availability Summary");

    if (Object.keys(availabilityCounts).length > 0) {
        const summaryList = document.createElement('ul');
        summaryList.style.listStyleType = 'none';
        summaryList.style.paddingLeft = '0';

        SUMMARY_DISPLAY_ORDER.forEach(type => {
            if (availabilityCounts[type]) {
                const count = availabilityCounts[type];
                const listItem = document.createElement('li');

                let displayText = type;
                if (type === AVAILABILITY_STATUS.NOT_RESERVABLE) displayText = 'Walk-up (FCFS)';
                else if (type === AVAILABILITY_STATUS.OPEN) displayText = 'Extend Only';
                else if (type === AVAILABILITY_STATUS.NOT_AVAILABLE_CUTOFF) displayText = 'Cutoff (Walk-up)';
                else if (type === AVAILABILITY_STATUS.NYR) displayText = 'Not Yet Released';

                listItem.textContent = `${displayText}: ${count}`;
                listItem.className = `summary-item ${getAvailabilityClass(type)}`;
                summaryList.appendChild(listItem);
            }
        });
        summaryElement.appendChild(summaryList);
    } else {
        addInfoElement(document, summaryElement, 'p', "No availability data to summarize for the selected period.");
    }
    containerElement.appendChild(summaryElement);

    const loopNames = new Set();
    if (campsites && Object.keys(campsites).length > 0) {
        for (const cId in campsites) {
            if (campsites[cId].loop) loopNames.add(campsites[cId].loop);
        }
    }
    if (loopNames.size > 0) {
        const loopsArray = [...loopNames].sort();
        const loopLabel = loopNames.size > 1 ? "Loops" : "Loop";
        addInfoElement(document, containerElement, 'h2', `${loopLabel}: ${loopsArray.join(', ')}`);
    }

    // --- Section 3: Render the Main Availability Data Table ---
    renderMainAvailabilityTable(containerElement, campsites, requestDateTime, response, config);
    debugInfo.rendering.mainPageRenderStatus.mainAvailabilityTable = config.display.showMainDataTable ? 'RENDERED' : 'DISABLED';
}

/**
 * Handles and logs errors that occur during the main execution flow.
 * @param {Error} error The error object that was caught.
 * @param {HTMLElement|null} containerElement The main DOM container to display an error message in.
 */
function handleFetchError(error, containerElement) {
    console.error("Error during script execution:", error);
    debugInfo.errors.push({
        context: 'runAvailabilityCheck',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });

    if (typeof document !== 'undefined' && containerElement) {
        containerElement.textContent = "Error fetching or parsing data. Check console for details.";
    } else {
        console.log("Skipping DOM error display as 'document' is not available or container not found.");
    }
}

/**
 * Generates a summary of API call outcomes.
 * @param {Array<object>} apiCalls - The array of API call log entries from `debugInfo.api.calls`.
 * @returns {{totalCalls: number, successfulCalls: number, failedCalls: number, failures: Array<object>}} - The summary object.
 */
function generateApiSummary(apiCalls) {
    const totalCalls = apiCalls.length;
    let successfulCalls = 0;
    const failures = [];

    apiCalls.forEach(call => {
        if (call.status === 200) {
            successfulCalls++;
        } else {
            failures.push({
                context: call.context,
                status: call.status,
                error: call.error || 'No error message provided.'
            });
        }
    });

    return {
        totalCalls,
        successfulCalls,
        failedCalls: totalCalls - successfulCalls,
        failures
    };
}

/**
 * Renders a status badge indicating API call success or failure.
 * This function now updates all elements with the class 'api-status-badge'.
 * @param {object} summary The API summary object from `generateApiSummary`.
 */
function renderApiStatusBadge(summary) {
    const badges = document.querySelectorAll('.api-status-badge');
    if (badges.length === 0) {
        console.warn("No API status badge elements found.");
        return;
    }

    badges.forEach(badge => {
        // Reset badge state
        badge.textContent = '';
        badge.className = 'api-status-badge'; // Ensure the base class is always present
        badge.style.display = 'none';

        if (!summary || summary.totalCalls === 0) {
            return; // Don't show the badge if no API calls were made
        }

        if (summary.failedCalls > 0) {
            badge.textContent = `API: ${summary.failedCalls} Failed`;
            badge.classList.add('failed');
        } else {
            badge.textContent = 'API: OK';
            badge.classList.add('ok');
        }

        badge.style.display = 'inline-block';
    });
}

/**
 * The main entry point and execution flow for the script.
 * It prepares the configuration, fetches all data, and then triggers the rendering process.
 * @param {object} config The initial configuration object.
 */
async function runAvailabilityCheck(config) {
    debugInfo.timestamps.start = new Date().toISOString();

    if (typeof document !== 'undefined') {
        initLightbox(document);
    }

    const effectiveConfig = prepareConfig(JSON.parse(JSON.stringify(config)));

    try {
        // Use the new, centralized fetchAllData function from the API service.
        const allData = await fetchAllDataFromService(effectiveConfig, debugInfo);
        await renderAllOutputs(allData, effectiveConfig);
    } catch (error) {
        handleFetchError(error, document.getElementById('tab-panels'));
    } finally {
        // Generate the API call summary before finalizing the debug object.
        debugInfo.api.summary = generateApiSummary(debugInfo.api.calls);
        if (typeof document !== 'undefined') {
            renderApiStatusBadge(debugInfo.api.summary);
        }

        debugInfo.timestamps.end = new Date().toISOString();
        console.log("Script execution finished. Final debug object:", debugInfo);

        if (typeof window !== 'undefined') {
            window.debugInfo = debugInfo;
            console.log("Debug object assigned to 'window.debugInfo' for inspection in the browser console.");
        }
    }
}

// =================================================================================================
// --- Dynamic UI Logic & Event Handling ---
// The following functions handle the interactive form and dynamic configuration.
// =================================================================================================

/**
 * Populates the HTML form with values from a given configuration object.
 * This function ensures the UI always reflects the current settings, whether
 * they come from defaults or from a shared URL.
 * @param {object} configObject The configuration object to use for populating the form.
 */
function populateFormFromConfig(configObject) {
    // Defensively update form fields only if the corresponding data exists in the config object.
    if (configObject.api && configObject.api.campgroundId !== undefined) {
        document.getElementById('campgroundId').value = configObject.api.campgroundId;
    }

    if (configObject.filters) {
        document.getElementById('filterStartDate').value = configObject.filters.filterStartDate || '';
        document.getElementById('filterEndDate').value = configObject.filters.filterEndDate || '';
    }

    if (configObject.siteFilters && configObject.siteFilters.siteNumbersToFilter !== undefined) {
        document.getElementById('siteNumbers').value = (configObject.siteFilters.siteNumbersToFilter || []).join(', ');
    }

    if (configObject.display) {
        for (const key in configObject.display) {
            const checkbox = document.querySelector(`input[name="${key}"]`);
            if (checkbox) {
                checkbox.checked = configObject.display[key];
            }
        }
    }

    if (configObject.sorting) {
        // Handle the new global sort checkbox
        if (configObject.sorting.primarySortKey) {
            document.getElementById('sortBySiteFirst').checked = configObject.sorting.primarySortKey === 'site';
        }
    }

    if (configObject.tabBehavior) {
        const behavior = configObject.tabBehavior;
        document.getElementById('includeNotReservableInAvailableTab').checked = behavior.includeNotReservableInAvailableTab;

        // New logic for the "Show All Statuses" checkbox
        document.getElementById('showAllFilteredSitesStatuses').checked = behavior.showAllFilteredSitesStatuses;
        if (behavior.fetchDetailsForAvailableOnly !== undefined) {
            document.getElementById('fetchDetailsForAvailableOnly').checked = behavior.fetchDetailsForAvailableOnly;
        }

        if (behavior.openDebugTabInNewWindow !== undefined) {
            document.getElementById('openDebugTabInNewWindow').checked = behavior.openDebugTabInNewWindow;
        }
    }
}

/**
 * Reads all values from the form and builds a dynamic configuration object.
 * This is called when the user initiates a new search.
 * @returns {object} A complete configuration object ready for `runAvailabilityCheck`.
 */
function buildConfigFromForm() {
    const newConfig = JSON.parse(JSON.stringify(config)); // Start with a deep copy of defaults

    // Update API and filter values from text/date inputs
    newConfig.api.campgroundId = document.getElementById('campgroundId').value.trim();
    newConfig.filters.filterStartDate = document.getElementById('filterStartDate').value;
    newConfig.filters.filterEndDate = document.getElementById('filterEndDate').value;

    // Parse site numbers from textarea
    const sitesText = document.getElementById('siteNumbers').value;
    const MAX_SITES_TO_FILTER = 30;
    let siteNumbers = sitesText.split(',').map(s => s.trim()).filter(Boolean);
    if (siteNumbers.length > MAX_SITES_TO_FILTER) {
        console.warn(`User entered ${siteNumbers.length} sites, which is more than the maximum of ${MAX_SITES_TO_FILTER}. Truncating the list.`);
        siteNumbers = siteNumbers.slice(0, MAX_SITES_TO_FILTER);
        // Update the UI to show the user the truncated list
        document.getElementById('siteNumbers').value = siteNumbers.join(', ');
    }
    newConfig.siteFilters.siteNumbersToFilter = siteNumbers;

    // Update display toggles from checkboxes
    for (const key in newConfig.display) {
        const checkbox = document.querySelector(`input[name="${key}"]`);
        if (checkbox) {
            newConfig.display[key] = checkbox.checked;
        }
    }

    // Update sorting preferences from the new global checkbox
    const sortBySite = document.getElementById('sortBySiteFirst').checked;
    newConfig.sorting.primarySortKey = sortBySite ? 'site' : 'date';

    // Update tab behavior preferences
    const behavior = newConfig.tabBehavior;
    behavior.includeNotReservableInAvailableTab = document.getElementById('includeNotReservableInAvailableTab').checked;

    // New logic for the "Show All Statuses" checkbox
    behavior.showAllFilteredSitesStatuses = document.getElementById('showAllFilteredSitesStatuses').checked;

    // New logic for the "Fetch for 'Available' sites only" checkbox
    behavior.fetchDetailsForAvailableOnly = document.getElementById('fetchDetailsForAvailableOnly').checked;

    behavior.openDebugTabInNewWindow = document.getElementById('openDebugTabInNewWindow').checked;

    return newConfig;
}

/**
 * Handles the form submission event. It prevents the default page reload,
 * builds a new config from the form, and starts the availability check.
 * @param {Event} event The form submission event.
 */
async function handleFormSubmit(event) {
    console.log('[handleFormSubmit] Form submitted. Preventing default page reload.');
    event.preventDefault();

    const submitButton = document.querySelector('#config-form button[type="submit"]');
    if (!submitButton) {
        console.error("Submit button not found.");
        return;
    }

    // This check prevents re-submission if the button is already disabled (loading or on cooldown)
    if (submitButton.disabled) {
        console.log('[handleFormSubmit] Submit button is already disabled. Aborting.');
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Loading...';

        // Clear previous API status badges
        const apiBadges = document.querySelectorAll('.api-status-badge');
        apiBadges.forEach(badge => {
            badge.style.display = 'none';
            badge.className = 'api-status-badge';
        });

        // Prepare the new tabbed interface for results
        const resultsTabsContainer = document.getElementById('results-tabs-container');
        const tabButtonsContainer = document.getElementById('tab-buttons');
        const tabPanelsContainer = document.getElementById('tab-panels');
        console.log('[handleFormSubmit] resultsTabsContainer found:', !!resultsTabsContainer);

        if (resultsTabsContainer && tabButtonsContainer && tabPanelsContainer) {
            // Clear any previous results
            console.log('[handleFormSubmit] Clearing previous tab results.');
            tabButtonsContainer.innerHTML = '';
            tabPanelsContainer.innerHTML = '';

            // Make the tab system visible for the new results
            console.log('[handleFormSubmit] Setting resultsTabsContainer display to "block".');
            resultsTabsContainer.style.display = 'block';
        } else {
            console.error("Could not find tab container elements. Aborting run.");
            return;
        }

        const dynamicConfig = buildConfigFromForm();
        await runAvailabilityCheck(dynamicConfig);

        // --- Automatically collapse the accordion AFTER results are shown ---
        const accordionHeader = document.querySelector('.accordion-header');
        if (accordionHeader && accordionHeader.classList.contains('active')) {
            accordionHeader.click();
        }

    } finally {
        // Instead of re-enabling immediately, start the cooldown.
        startCooldown(submitButton);
    }
}

/**
 * Handles the change event for the preset dropdown. It loads the selected
 * preset's configuration into the form fields.
 * @param {Event} event The change event from the select element.
 */
function handlePresetChange(event) {
    const selectedPresetName = event.target.value;
    const selectedPreset = PRESET_COLLECTION[selectedPresetName];

    if (!selectedPreset) return;

    // Create a temporary config object from the preset to populate the form
    const presetConfig = {
        api: { campgroundId: selectedPreset.campgroundId },
        siteFilters: { siteNumbersToFilter: selectedPreset.sites }
    };
    populateFormFromConfig(presetConfig);
}

/**
 * Handles the click event for the "Copy Sharable Link" button. It reads the
 * current form state, constructs a URL with query parameters, and copies it
 * to the clipboard.
 */
function handleCopyLink() {
    const dynamicConfig = buildConfigFromForm();
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();

    // Preserve the access_code from the current URL if it exists, so the
    // generated link will also be accessible.
    const currentParams = new URLSearchParams(window.location.search);
    const accessCode = currentParams.get('access_code');
    if (accessCode) {
        params.append('access_code', accessCode);
    }

    // Add main search parameters
    if (dynamicConfig.api.campgroundId) params.append('campgroundId', dynamicConfig.api.campgroundId);
    if (dynamicConfig.filters.filterStartDate) params.append('filterStartDate', dynamicConfig.filters.filterStartDate);
    if (dynamicConfig.filters.filterEndDate) params.append('filterEndDate', dynamicConfig.filters.filterEndDate);
    if (dynamicConfig.siteFilters.siteNumbersToFilter.length > 0) {
        params.append('sites', dynamicConfig.siteFilters.siteNumbersToFilter.join(','));
    }

    // Add all display flags
    for (const key in dynamicConfig.display) {
        params.append(key, dynamicConfig.display[key]);
    }

    // Add sorting parameter from the new global checkbox
    if (dynamicConfig.sorting.primarySortKey === 'site') {
        params.append('sortBySiteFirst', 'true');
    }

    // Add tab behavior parameters from the UI controls
    params.append('includeNotReservableInAvailableTab', document.getElementById('includeNotReservableInAvailableTab').checked);
    params.append('showAllFilteredSitesStatuses', document.getElementById('showAllFilteredSitesStatuses').checked);
    params.append('fetchDetailsAvailableOnly', document.getElementById('fetchDetailsForAvailableOnly').checked);
    params.append('openDebugTabInNewWindow', document.getElementById('openDebugTabInNewWindow').checked);

    const finalUrl = `${baseUrl}?${params.toString()}`;

    navigator.clipboard.writeText(finalUrl).then(() => {
        const copyButton = document.getElementById('copy-link-button');
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        setTimeout(() => { copyButton.textContent = originalText; }, 2000);
    }).catch(err => console.error('Failed to copy link: ', err));
}

/**
 * Initializes the page on load. It sets up the form with values from URL parameters
 * or defaults from the `config` object, and attaches event listeners to the form buttons.
 */
async function initializePage() {
    // --- Setup Live Debug Panel ---
    // const debugPanel = document.getElementById('live-debug-panel');
    // if (debugPanel) debugPanel.style.display = 'block';
    // const logDebug = (msg) => {
    //     if (!debugPanel) return;
    //     const p = document.createElement('p');
    //     p.style.margin = '2px 0';
    //     p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    //     debugPanel.appendChild(p);
    // };
    // logDebug("Initializing page...");

    const form = document.getElementById('config-form');
    const copyLinkButton = document.getElementById('copy-link-button');
    const presetSelector = document.getElementById('preset-selector');

    if (!form || !copyLinkButton || !presetSelector) {
        const errorMsg = "Required form elements not found. Aborting UI initialization.";
        // logDebug(`ERROR: ${errorMsg}`);
        console.error(errorMsg);
        return;
    }

    // --- Add UI Note for Date Range ---
    const endDateInput = document.getElementById('filterEndDate');
    if (endDateInput && endDateInput.parentElement) {
        // Create a placeholder for the first column to align the note correctly in the grid
        const placeholder = document.createElement('div');

        const noteElement = document.createElement('p');
        noteElement.className = 'form-note';
        noteElement.innerHTML = 'The maximum search range is 40 days. If only one date is provided, a 40-day range is calculated automatically. Longer ranges will be capped.' +
                                '<br><strong>Leave dates blank for a 30-day search starting today.</strong>';
        noteElement.style.fontSize = '0.8em';
        noteElement.style.color = '#555';
        noteElement.style.marginTop = '5px';

        // Insert the new row (placeholder + note) after the end date input's row
        endDateInput.insertAdjacentElement('afterend', noteElement);
        endDateInput.insertAdjacentElement('afterend', placeholder);
    }

    // --- Add UI Note for Site Filter Limit ---
    const siteNumbersTextarea = document.getElementById('siteNumbers');
    if (siteNumbersTextarea && siteNumbersTextarea.parentElement) {
        // Create a placeholder for the first column to align the note correctly in the grid
        const placeholder = document.createElement('div');

        const noteElement = document.createElement('p');
        noteElement.className = 'form-note';
        noteElement.innerHTML = 'A maximum of 30 site numbers can be entered. The list will be automatically truncated if it exceeds this limit.' +
                                '<br><strong>If left blank, the "Filtered Sites" tab will show all sites, with details enabled per site as needed.</strong>';
        noteElement.style.fontSize = '0.8em';
        noteElement.style.color = '#555';
        noteElement.style.marginTop = '5px';

        // Insert the new row (placeholder + note) after the textarea's row
        siteNumbersTextarea.insertAdjacentElement('afterend', noteElement);
        siteNumbersTextarea.insertAdjacentElement('afterend', placeholder);
    }

    // --- Fetch and Populate Presets ---
    try {
        // logDebug("Attempting to fetch 'presets.json'...");
        const response = await fetch('presets.json');
        // logDebug(`Fetch response status: ${response.status} ${response.statusText}`);
        // logDebug(`Response OK: ${response.ok}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // logDebug("Response OK. Attempting to parse JSON...");
        PRESET_COLLECTION = await response.json();
        // logDebug("Successfully parsed JSON. Populating preset dropdown...");

        // Populate the preset dropdown from the fetched data
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select a Preset...";
        presetSelector.appendChild(defaultOption);

        for (const presetName in PRESET_COLLECTION) {
            const option = document.createElement('option');
            option.value = presetName;
            option.textContent = presetName;
            presetSelector.appendChild(option);
        }
        // logDebug(`Dropdown populated with ${Object.keys(PRESET_COLLECTION).length} presets.`);
    } catch (error) {
        const errorMsg = `Could not load or parse presets.json: ${error.message}`;
        // logDebug(`ERROR: ${errorMsg}`);
        console.error(errorMsg, error);
        const errorOption = document.createElement('option');
        errorOption.value = "";
        errorOption.textContent = "Error loading presets";
        presetSelector.appendChild(errorOption);
        presetSelector.disabled = true;
    }
    // logDebug("\n--- Initializing Form from URL/Defaults ---");

    // 1. Create initial config from URL params, falling back to the hardcoded defaults
    const urlParams = new URLSearchParams(window.location.search);
    const initialConfig = JSON.parse(JSON.stringify(config)); // Deep copy of defaults

    // Override defaults with URL parameters if they exist
    initialConfig.api.campgroundId = urlParams.get('campgroundId') || initialConfig.api.campgroundId;
    initialConfig.filters.filterStartDate = urlParams.get('filterStartDate') || initialConfig.filters.filterStartDate;
    initialConfig.filters.filterEndDate = urlParams.get('filterEndDate') || initialConfig.filters.filterEndDate;

    const sitesFromUrl = urlParams.get('sites');
    if (sitesFromUrl) {
        initialConfig.siteFilters.siteNumbersToFilter = sitesFromUrl.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Handle boolean flags (checkboxes) from the URL
    for (const key in initialConfig.display) {
        if (urlParams.has(key)) {
            initialConfig.display[key] = urlParams.get(key) === 'true';
        }
    }

    // Handle sorting flags from the URL using the new global checkbox parameter
    if (urlParams.get('sortBySiteFirst') === 'true') {
        initialConfig.sorting.primarySortKey = 'site';
    }

    // Handle tab behavior flags from the URL
    if (urlParams.has('includeNotReservableInAvailableTab')) {
        initialConfig.tabBehavior.includeNotReservableInAvailableTab = urlParams.get('includeNotReservableInAvailableTab') === 'true';
    }

    if (urlParams.has('showAllFilteredSitesStatuses')) { // This was already here, keeping it.
        initialConfig.tabBehavior.showAllFilteredSitesStatuses = urlParams.get('showAllFilteredSitesStatuses') === 'true';
    }
    if (urlParams.has('fetchDetailsAvailableOnly')) {
        initialConfig.tabBehavior.fetchDetailsForAvailableOnly = urlParams.get('fetchDetailsAvailableOnly') === 'true';
    }

    if (urlParams.has('openDebugTabInNewWindow')) {
        initialConfig.tabBehavior.openDebugTabInNewWindow = urlParams.get('openDebugTabInNewWindow') === 'true';
    }

    // 2. Populate the form with the determined initial configuration
    populateFormFromConfig(initialConfig);

    // --- Accordion Logic ---
    const accordionHeader = document.querySelector('.accordion-header');
    if (accordionHeader) {
        const contentPanel = accordionHeader.nextElementSibling;

        const updateAccordionHeight = () => {
            // Only update height if the accordion is currently open
            if (accordionHeader.classList.contains('active')) {
                contentPanel.style.maxHeight = contentPanel.scrollHeight + "px";
            }
        };

        accordionHeader.addEventListener('click', function() {
            this.classList.toggle('active');
            if (contentPanel.style.maxHeight) {
                // If it has a maxHeight, it's open, so close it
                contentPanel.style.maxHeight = null;
            } else {
                // If it's closed, use the helper to set the height
                updateAccordionHeight();
            }
        });

        // Add a resize listener to handle orientation changes or window resizing
        window.addEventListener('resize', updateAccordionHeight);

        // --- Make the accordion open by default on page load ---
        // We do this after a tiny delay to allow the browser to render everything,
        // ensuring scrollHeight is calculated correctly.
        setTimeout(() => {
            accordionHeader.click(); // Programmatically click to open it
        }, 100);
    }

    // 3. Attach event listeners (handlers will be implemented in the next step)
    form.addEventListener('submit', handleFormSubmit);
    copyLinkButton.addEventListener('click', handleCopyLink);
    presetSelector.addEventListener('change', handlePresetChange);
    
    console.log("Page initialized. Ready for user input.");
}


document.addEventListener('DOMContentLoaded', initializePage);

// The script is now controlled by event listeners, so we no longer call this automatically.
// runAvailabilityCheck(config);
