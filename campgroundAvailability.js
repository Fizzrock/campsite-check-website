/**
 * =================================================================================================
 * RECREATION.GOV CAMPSITE AVAILABILITY CHECKER
 * Version: 2.0.0
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
 * - `campgroundAvailability.js`: The main frontend script containing all client-side logic.
 *   - UI Initialization (`initializePage`): Sets up the form, populates presets, and attaches event listeners.
 *   - Dynamic Configuration (`buildConfigFromForm`): Builds the search configuration from the UI on demand.
 *   - Core Logic (`runAvailabilityCheck`): The main entry point that orchestrates the data fetching and rendering.
 * - `api/fetch-ridb.js`: A Vercel serverless function that acts as a secure proxy for all external API calls.
 * - `middleware.js`: Vercel Edge Middleware that provides password protection for the entire site.
 * - `presets.json`: An external file for managing campground presets, loaded dynamically by the application.
 *
 * Key Features:
 * - Interactive UI: Dynamically configure searches using a web form instead of editing code.
 * - External Presets: Manage favorite campgrounds and site lists in an easy-to-edit `presets.json` file.
 * - Shareable Searches: Generate and copy bookmarkable URLs that contain your exact search configuration.
 * - Secure API Handling: All API calls are routed through a server-side proxy, keeping your API key safe.
 * - Comprehensive Data Display: Presents detailed information about campgrounds, recreation areas, events,
 *   and media in a clean, organized main page view.
 * - Specialized Output Tabs: Generates separate, focused tabs for available sites, filtered sites,
 *   and raw data for in-depth analysis.
 * - Site Detail Fetching: Can fetch and display rich details, including photos and attributes, for specific
 *   campsites of interest.
 * - Password Protection: The live deployment is protected by a simple but effective access code via middleware.
 *
 * APIs Used:
 * - Recreation.gov Availability API: `https://www.recreation.gov/api/camps/availability/campground/...`
 * - Recreation.gov Metadata API: `https://www.recreation.gov/api/camps/campgrounds/...`
 * - RIDB API: `https://ridb.recreation.gov/api/v1/...` (Requires an API key)
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
        showMainDataTable: true, // If true, shows a table of all campsite availabilities for the fetched period.
        fetchAndShowEventsOnMainPage: true, // If true, fetches and displays RecArea events on the main page.
        showRecAreaMediaOnMainPage: true, // If true, fetches and displays RecArea media on the main page.

        // New Tab Toggles
        showRawJsonTab: false, // If true, opens a new tab with the full raw JSON response from the availability API.
        showAvailableOnlyTab: false, // If true, opens a new tab with only "Available" sites.
        showFilteredSitesTab: true, // If true, opens a new tab with sites filtered by `siteFilters.siteNumbersToFilter`.
        showAvailabilitySummaryTab: false, // If true, opens a new tab with a summary of availability counts.
        showFullMetadataTab: false, // If true, opens a new tab with the full JSON from the campground metadata endpoint.
        showCampsitesObjectTab: false, // For debugging, not yet implemented
        showDebugTab: false // If true, opens a final tab with the entire `debugInfo` object for inspection.
    },
    ////////////////////////////////////////
    // --- Behavior Configuration for Tabs ---
    ////////////////////////////////////////
    tabBehavior: {
        // "Available Sites" Tab Settings
        includeNotReservableInAvailableTab: true, // If true, the "Available Sites" tab will also include sites marked "Not Reservable".

        // "Filtered Sites" Tab Settings
        showFilteredSitesAvailableOnly: true, // If true, the "Filtered Sites" tab will only show entries for sites that are "Available".
        showFilteredSitesNotReservableOnly: true, // If true, the "Filtered Sites" tab will also include "Not Reservable" sites.

        // "Filtered Sites" Detail Fetching (these flags control fetching rich data like photos for specific sites)
        fetchDetailsForAllFilteredSites: true, // If true, fetches details for ALL sites in the filter list, regardless of status. Overrides the two flags below.
        fetchDetailsForAvailableFilteredSites: true, // If true, fetches details for any site in the filter list that has an "Available" day.
        fetchDetailsForNotReservableFilteredSites: true, // If true, fetches details for any site in the filter list that has a "Not Reservable" day.
    },

    // --- Sorting Preferences ---
    sorting: {
        // Primary sort key for the "Filtered Sites" tab. Options: "site", "date".
        sortFilteredSitesBy: "date",
        // Primary sort key for the "Available Sites" tab. Options: "site", "date".
        sortAvailableSitesBy: "date",
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
        monthsToFetch: [],
        calls: [] // Each entry: { context, url, status, error?, timestamp }
    },
    processing: {
        // Note: combinedCampsites can be large and is omitted to keep the debug object clean.
        // It can be inspected via the "Raw JSON" tab if needed.
        availabilityCounts: null,
        filteredSiteIdsForDetailFetch: []
    },
    rendering: {
        tabsOpened: [],
        mainPageRenderStatus: {} // e.g., { facilityDetails: true, events: 'ID_FOUND' }
    },
    errors: [] // Each entry: { context, message, stack? }
};

// --- Constants for Availability Statuses ---
const AVAILABILITY_STATUS = {
    AVAILABLE: "Available",
    RESERVED: "Reserved",
    CLOSED: "Closed",
    OPEN: "Open",
    NYR: "NYR", // Not Yet Released
    NOT_RESERVABLE: "Not Reservable",
    UNKNOWN: "Unknown" // For default/fallback
};

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
 * @property {Response} response - The raw fetch Response object from the primary availability call.
 * @property {Date} requestDateTime - The timestamp when the primary data request was made.
 * @property {IdCollection} ids - A collection of all relevant IDs.
 */

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
    const initialApiStartDate = config.filters.startDate;
    if (initialApiStartDate === "") {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        config.filters.startDate = `${year}-${month}-01T00%3A00%3A00.000Z`;
        console.log(`Initial 'startDate' was empty. Dynamically set to the first of the current month: ${config.filters.startDate}`);
    } else {
        if (config.filters.startDate.includes(':') && !config.filters.startDate.includes('%3A')) {
            config.filters.startDate = config.filters.startDate.replace(/:/g, '%3A');
            console.warn(`'startDate' contained unencoded colons. Auto-encoded to: ${config.filters.startDate}`);
        }
    }

    // --- Determine effective filter dates based on configuration ---
    const initialFilterStartDate = config.filters.filterStartDate;
    const initialFilterEndDate = config.filters.filterEndDate;

    if (initialFilterStartDate === "" && initialFilterEndDate === "") {
        if (typeof config.filters.filterDurationInDays === 'number' && config.filters.filterDurationInDays > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            config.filters.filterStartDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const endDateObj = new Date(today);
            endDateObj.setDate(today.getDate() + config.filters.filterDurationInDays);
            config.filters.filterEndDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;

            console.log(`Filter dates were empty. Using duration: ${config.filters.filterDurationInDays} days. Effective Filter Start: ${config.filters.filterStartDate}, Effective Filter End: ${config.filters.filterEndDate}`);
        } else {
            config.filters.filterStartDate = null;
            config.filters.filterEndDate = null;
            console.log("Filter dates were empty and filterDurationInDays is not a valid positive number. Date range filtering disabled (set to null).");
        }
    } else {
        if (initialFilterStartDate === "") {
            config.filters.filterStartDate = null;
            console.log("Initial filterStartDate was an empty string, now effectively null (no start date constraint).");
        }
        if (initialFilterEndDate === "") {
            config.filters.filterEndDate = null;
            console.log("Initial filterEndDate was an empty string, now effectively null (no end date constraint).");
        }
    }

    // Store the final, effective configuration and timestamp.
    debugInfo.configuration.effective = JSON.parse(JSON.stringify(config));
    debugInfo.timestamps.configPrepared = new Date().toISOString();

    return config;
}

/**
 * Fetches all necessary data from the various Recreation.gov and RIDB APIs.
 * This function orchestrates the fetching of metadata, availability, facility details,
 * and recreation area information, including fallback logic.
 * @param {object} config The prepared configuration object.
 * @returns {Promise<AllFetchedData>} A promise that resolves to an object containing all fetched data.
 */
async function fetchAllData(config) {
    debugInfo.timestamps.fetchStart = new Date().toISOString();

    // --- Step 1: Fetch foundational metadata to get correct RIDB IDs ---
    const campgroundMetadata = await fetchCampgroundMetadata(config.api.campgroundId);

    // Determine IDs and the status of the metadata fetch, which dictates if we can get events.
    let ridbFacilityId;
    let recAreaId;
    let eventInfoStatus;

    if (campgroundMetadata && campgroundMetadata.parent_rec_area_id) {
        ridbFacilityId = campgroundMetadata.facility_id;
        recAreaId = campgroundMetadata.parent_rec_area_id;
        eventInfoStatus = 'ID_FOUND';
    } else if (campgroundMetadata) {
        ridbFacilityId = campgroundMetadata.facility_id || config.api.campgroundId;
        recAreaId = null;
        eventInfoStatus = 'INCOMPLETE_DATA';
    } else {
        ridbFacilityId = config.api.campgroundId;
        recAreaId = null;
        eventInfoStatus = 'FETCH_FAILED';
    }

    console.log(`[fetchAllData] Using RIDB Facility ID: ${ridbFacilityId} (derived from metadata)`);
    if (recAreaId) console.log(`[fetchAllData] Found Rec Area ID from metadata: ${recAreaId}`);

    // --- Step 2: Build and execute all API requests concurrently ---
    const monthsToFetchApiStarts = getMonthsToFetch(config.filters.filterStartDate, config.filters.filterEndDate, config.filters.startDate);
    console.log("[fetchAllData] Months to fetch API start_dates:", monthsToFetchApiStarts);
    debugInfo.api.monthsToFetch = monthsToFetchApiStarts;

    const availabilityFetchPromises = monthsToFetchApiStarts.map(monthApiStart => {
        return fetchAvailabilityData(config.api.campgroundId, monthApiStart);
    });

    const allFetchPromises = [
        ...availabilityFetchPromises,
        fetchFacilityDetails(ridbFacilityId),
        config.display.fetchAndShowEventsOnMainPage && recAreaId ? fetchRecAreaEvents(recAreaId) : Promise.resolve(null),
        config.display.showRecAreaMediaOnMainPage && recAreaId ? fetchRecAreaMedia(recAreaId) : Promise.resolve(null),
        recAreaId ? fetchRecAreaDetails(recAreaId) : Promise.resolve(null)
    ];

    const allResults = await Promise.allSettled(allFetchPromises);
    debugInfo.timestamps.fetchComplete = new Date().toISOString();

    // --- Step 3: Process the results from all fetches ---
    const availabilityResults = allResults.slice(0, availabilityFetchPromises.length);
    let facilityDetails = (allResults[availabilityFetchPromises.length].status === 'fulfilled') ? allResults[availabilityFetchPromises.length].value : null;
    let eventsData = (allResults[availabilityFetchPromises.length + 1]?.status === 'fulfilled') ? allResults[availabilityFetchPromises.length + 1].value : null;
    let recAreaMedia = (allResults[availabilityFetchPromises.length + 2]?.status === 'fulfilled') ? allResults[availabilityFetchPromises.length + 2].value : null;
    let recAreaDetails = (allResults[availabilityFetchPromises.length + 3]?.status === 'fulfilled') ? allResults[availabilityFetchPromises.length + 3].value : null;

    // --- Step 4: Second-chance logic for RecArea ID if initial attempt failed ---
    if (config.display.fetchAndShowEventsOnMainPage && !recAreaId && facilityDetails) {
        let fallbackRecAreaId = facilityDetails.ParentRecAreaID || (facilityDetails.RECAREA && facilityDetails.RECAREA[0]?.RecAreaID);
        if (fallbackRecAreaId) {
            console.log(`[fetchAllData] Metadata did not provide RecAreaID. Found fallback in facilityDetails: ${fallbackRecAreaId}.`);
            recAreaId = fallbackRecAreaId;
            try {
                const fallbackPromises = [
                    config.display.fetchAndShowEventsOnMainPage ? fetchRecAreaEvents(recAreaId) : Promise.resolve(null),
                    config.display.showRecAreaMediaOnMainPage ? fetchRecAreaMedia(recAreaId) : Promise.resolve(null),
                    fetchRecAreaDetails(recAreaId)
                ];
                const [newEventsData, newMediaData, newRecAreaDetails] = await Promise.all(fallbackPromises);
                if (newEventsData) eventsData = newEventsData;
                if (newMediaData) recAreaMedia = newMediaData;
                if (newRecAreaDetails) recAreaDetails = newRecAreaDetails;
                eventInfoStatus = 'ID_FOUND';
            } catch (e) {
                console.error("Error fetching details using fallback RecAreaID:", e);
            }
        }
    }

    // --- Step 5: Combine monthly availability data ---
    const combinedCampsites = {};
    let mainResponseForHeaders = null;
    let overallRequestDateTime = new Date();

    for (let i = 0; i < availabilityResults.length; i++) {
        const result = availabilityResults[i];
        if (result.status === 'fulfilled' && result.value) {
            const { data: monthlyData, response: monthlyResponse, requestDateTime: monthlyRequestDateTime } = result.value;
            if (!mainResponseForHeaders) {
                mainResponseForHeaders = monthlyResponse;
                overallRequestDateTime = monthlyRequestDateTime;
            }
            if (monthlyData?.campsites) {
                for (const cId in monthlyData.campsites) {
                    if (!combinedCampsites[cId]) {
                        combinedCampsites[cId] = monthlyData.campsites[cId];
                    } else {
                        Object.assign(combinedCampsites[cId].availabilities, monthlyData.campsites[cId].availabilities);
                        Object.assign(combinedCampsites[cId].quantities, monthlyData.campsites[cId].quantities);
                    }
                }
            }
        }
    }

    if (!mainResponseForHeaders && Object.keys(combinedCampsites).length === 0) {
        throw new Error("Failed to fetch any availability data.");
    }

    return {
        campgroundMetadata,
        facilityDetails,
        recAreaDetails,
        eventsData,
        recAreaMedia,
        combinedCampsites,
        response: mainResponseForHeaders || { headers: new Headers() },
        requestDateTime: overallRequestDateTime,
        ids: { campgroundId: config.api.campgroundId, facilityId: ridbFacilityId, recAreaId, eventInfoStatus }
    };
}

/** 
 * @template T
 * @callback ApiDataProcessor
 * @param {any} json The parsed JSON from the response body.
 * @param {Response} response The raw fetch Response object.
 * @returns {T} The processed data of type T.
 */

/**
 * A generic and robust utility for fetching and processing data from an API.
 * It centralizes logging, error handling, and response parsing.
 * @template T
 * @param {string} url The API endpoint URL to fetch.
 * @param {RequestInit} options Standard `fetch` options (e.g., headers).
 * @param {string|object} context A string or object providing context for logging.
 * @param {ApiDataProcessor<T>} dataProcessor A function to transform the raw JSON into the desired output format.
 * @returns {Promise<T|null>} The processed data as returned by `dataProcessor`, or `null` if the fetch fails.
 */
async function fetchApiData(url, options, context, dataProcessor) {
    const contextName = typeof context === 'string' ? context : JSON.stringify(context);
    console.log(`Fetching ${contextName} from: ${url}`);

    const logEntry = {
        context: contextName,
        url: url,
        status: null,
        error: null,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(url, options);
        logEntry.status = response.status;
        console.log(`Response Status for ${contextName}: ${response.status}`);

        if (!response.ok) {
            logEntry.error = `HTTP error! Status: ${response.status}`;
            console.error(`HTTP error fetching ${contextName}! Status: ${response.status}`);
            return null; // Graceful failure
        }

        const json = await response.json();
        return dataProcessor(json, response);

    } catch (error) {
        logEntry.status = 'Network/JSON Error';
        logEntry.error = error.message;
        debugInfo.errors.push({
            context: `fetchApiData: ${contextName}`,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        console.error(`Network error or JSON parsing error fetching ${contextName}:`, error);
        return null; // Graceful failure
    } finally {
        debugInfo.api.calls.push(logEntry);
    }
}

/**
 * Fetches monthly availability data from the Recreation.gov API.
 * @param {string} url The specific monthly availability API URL.
 * @returns {Promise<{data: object, response: Response, requestDateTime: Date}|null>} An object containing the parsed data, the raw response, and the request timestamp, or null on failure.
 */
async function fetchAvailabilityData(campgroundId, startDate) {
    const url = `/api/fetch-ridb?type=availability&campgroundId=${campgroundId}&start_date=${startDate}`;
    const context = `Availability Data from ${url}`;
    // The dataProcessor constructs the specific object shape required by the rest of the script,
    // including the raw response object for accessing headers later.
    const dataProcessor = (json, response) => ({
        data: json,
        response,
        requestDateTime: new Date()
    });
    return fetchApiData(url, { headers: { 'accept': 'application/json' } }, context, dataProcessor);
}

/**
 * Fetches detailed information for a specific facility from the RIDB API.
 * @param {string} facilityId The RIDB ID for the facility.
 * @returns {Promise<object|null>} The facility details object, or null on failure.
 */
async function fetchFacilityDetails(facilityId) {
    const url = `/api/fetch-ridb?type=facilityDetails&facilityId=${facilityId}`;
    const options = { headers: { 'accept': 'application/json' } };
    const context = `Facility Details for ${facilityId}`;
    // The dataProcessor checks if the returned JSON is a valid facility object.
    const dataProcessor = (json) => (json && typeof json === 'object' && json.FacilityID ? json : null);

    return fetchApiData(url, options, context, dataProcessor);
}

/**
 * Fetches detailed information for a specific campsite within a facility from the RIDB API.
 * This is used to get rich data like photos, attributes, and equipment details for individual sites.
 * @param {string} facilityId The RIDB ID for the parent facility.
 * @param {string} campsiteId The RIDB ID for the specific campsite.
 * @returns {Promise<object|null>} The campsite details object, or null on failure.
 */
async function fetchCampsiteDetails(facilityId, campsiteId) {
    const url = `/api/fetch-ridb?type=campsiteDetails&facilityId=${facilityId}&campsiteId=${campsiteId}`;
    const options = { headers: { 'accept': 'application/json' } };
    const context = `Campsite Details for ${campsiteId}`;
    // The dataProcessor extracts the first element from the returned array, as the API wraps single results in an array.
    const dataProcessor = (json) => (json && Array.isArray(json) && json.length > 0 ? json[0] : null);

    return fetchApiData(url, options, context, dataProcessor);
}

/**
 * Fetches metadata for a campground from the Recreation.gov API.
 * This is a crucial step to bridge the gap between the availability API's `campgroundId`
 * and the RIDB API's `facilityId` and `recAreaId`, which are not always the same.
 * @param {string} campgroundId The ID of the campground from Recreation.gov.
 * @returns {Promise<object|null>} The campground metadata object containing IDs, or null on failure.
 */
async function fetchCampgroundMetadata(campgroundId) {
    const url = `/api/fetch-ridb?type=campgroundMetadata&campgroundId=${campgroundId}`;
    const context = `Campground Metadata for ${campgroundId}`;
    // The dataProcessor extracts the nested 'campground' object from the JSON response.
    const dataProcessor = (json) => json.campground || null;
    return fetchApiData(url, {}, context, dataProcessor);
}

/**
 * Fetches a list of events for a given Recreation Area from the RIDB API.
 * @param {string} recAreaId The ID of the recreation area.
 * @returns {Promise<Array<object>|null>} An array of event objects, or null on failure.
 */
async function fetchRecAreaEvents(recAreaId) {
    if (!recAreaId) {
        console.log("No RecArea ID provided. Skipping event fetch.");
        return null;
    }
    const url = `/api/fetch-ridb?type=recAreaEvents&recAreaId=${recAreaId}`;
    const options = { headers: { 'accept': 'application/json' } };
    const context = `RecArea Events for ${recAreaId}`;
    // The dataProcessor extracts the 'RECDATA' array from the response, defaulting to an empty array.
    const dataProcessor = (json) => json.RECDATA || [];

    return fetchApiData(url, options, context, dataProcessor);
}

/**
 * Fetches a list of media (images, videos) for a given Recreation Area from the RIDB API.
 * @param {string} recAreaId The ID of the recreation area.
 * @returns {Promise<Array<object>|null>} An array of media objects, or null on failure.
 */
async function fetchRecAreaMedia(recAreaId) {
    if (!recAreaId) {
        console.log("No RecArea ID provided. Skipping media fetch.");
        return null;
    }
    const url = `/api/fetch-ridb?type=recAreaMedia&recAreaId=${recAreaId}`;
    const options = { headers: { 'accept': 'application/json' } };
    const context = `RecArea Media for ${recAreaId}`;
    // The dataProcessor extracts the 'RECDATA' array from the response, defaulting to an empty array.
    const dataProcessor = (json) => json.RECDATA || [];

    return fetchApiData(url, options, context, dataProcessor);
}

/**
 * Fetches detailed information for a given Recreation Area from the RIDB API.
 * @param {string} recAreaId The ID of the recreation area.
 * @returns {Promise<object|null>} The recreation area details object, or null on failure.
 */
async function fetchRecAreaDetails(recAreaId) {
    if (!recAreaId) {
        console.log("No RecArea ID provided. Skipping RecArea details fetch.");
        return null;
    }
    const url = `/api/fetch-ridb?type=recAreaDetails&recAreaId=${recAreaId}`;
    const options = { headers: { 'accept': 'application/json' } };
    const context = `RecArea Details for ${recAreaId}`;
    // The API returns the object directly, so we just return the JSON if it's valid.
    const dataProcessor = (json) => json || null;

    return fetchApiData(url, options, context, dataProcessor);
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
 * Creates and initializes a new browser tab with a given title and basic structure.
 * It handles potential pop-up blocker issues gracefully.
 * @param {string} title The title for the new browser tab.
 * @returns {{newTab: Window, containerDiv: HTMLDivElement, doc: Document}|null} An object containing the new tab's window, a main container div, and its document, or null if the tab could not be opened.
 */
function initializeNewTab(title) {
    if (typeof window === 'undefined' || !window.open) {
        // Log attempt even if it fails, e.g., in a non-browser environment
        debugInfo.errors.push({ context: 'initializeNewTab', message: `Cannot open new tab '${title}': 'window.open' is not available.` });
        console.warn(`Cannot open new tab '${title}': 'window.open' is not available.`);
        return null;
    }
    const newTab = window.open("", "_blank");
    if (!newTab) {
        console.warn(`Could not open new tab for '${title}'. Pop-up blocker might be active.`);
        return null;
    }

    debugInfo.rendering.tabsOpened.push(title);

    newTab.document.title = title;

    const link = newTab.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'style.css'; // Assuming style.css is in the same directory
    newTab.document.head.appendChild(link);

    const containerDiv = newTab.document.createElement('div');
    containerDiv.className = 'tab-content-container'; // A general class for tab content styling
    newTab.document.body.appendChild(containerDiv);

    return { newTab, containerDiv, doc: newTab.document };
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
 * Creates and appends a basic <table> element with a header row to a parent element.
 * @param {Document} doc The document in which to create the elements.
 * @param {string[]} headersArray An array of strings for the table headers.
 * @param {HTMLElement} parentElement The element to append the new table to.
 * @returns {{table: HTMLTableElement, tbody: HTMLTableSectionElement}} An object containing the created table and its tbody element.
 */
function createTableStructure(doc, headersArray, parentElement) {
    const table = doc.createElement('table');
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
        addInfoElement(doc, parentElement, 'p', `Cached Data (Age: ${age} seconds, Created: ${cacheDateTime.toLocaleString()})`, 'request-info');
    }
}

/**
 * Orchestrates all rendering operations after data has been fetched.
 * It processes the availability data and then calls the specific rendering functions
 * for the main page and all configured new tabs.
 * @param {object} config The prepared configuration object.
 * @param {AllFetchedData} allData The comprehensive data object from `fetchAllData`.
 * @param {HTMLElement} mainContainer The main DOM element on the `index.html` page.
 */
async function renderAllOutputs(allData, config, mainContainer) {
    debugInfo.timestamps.renderStart = new Date().toISOString();

    const {
        campgroundMetadata,
        facilityDetails,
        recAreaDetails,
        eventsData,
        recAreaMedia,
        combinedCampsites,
        response,
        requestDateTime,
        ids
    } = allData;

    const finalAvailabilityData = { campsites: combinedCampsites };

    console.log("[renderAllOutputs] Processing data for rendering. FacilityDetails:", facilityDetails ? "Data present" : "No data");
    console.log("[renderAllOutputs] Combined campsites data:", finalAvailabilityData.campsites ? `${Object.keys(finalAvailabilityData.campsites).length} sites` : "No data");

    const { campsites, availabilityCounts } = processAvailabilityData(finalAvailabilityData || { campsites: {} }, config);

    renderMainPage(mainContainer, campgroundMetadata, facilityDetails, recAreaDetails, eventsData, recAreaMedia, campsites, availabilityCounts, requestDateTime, response, config, ids);

    console.log("[renderAllOutputs] Proceeding to open new tabs based on configuration.");

    if (config.display.showRawJsonTab) {
        const jsonData = (finalAvailabilityData.campsites && Object.keys(finalAvailabilityData.campsites).length > 0) ? finalAvailabilityData : { message: "No combined availability data to show." };
        displayDataInNewTab(jsonData, `Full API Response (Combined) - ${config.api.campgroundId}`);
    }
    if (config.display.showFullMetadataTab && campgroundMetadata) {
        displayDataInNewTab(campgroundMetadata, `Full Campground Metadata - ${config.api.campgroundId}`);
    }
    if (config.display.showAvailabilitySummaryTab) {
        displayAvailabilitySummaryInNewTab(availabilityCounts, config, requestDateTime, response);
    }
    if (config.display.showAvailableOnlyTab) {
        await displayAvailableSitesInNewTab(campsites, config, requestDateTime, response);
    }
    if (config.display.showFilteredSitesTab) {
        await displayFilteredSitesInNewTab(campsites, config, ids.facilityId, requestDateTime, response);
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
 */

/**
 * A generic renderer for creating a new browser tab and populating it with a data table.
 * This centralizes the logic for tab creation, header rendering, and table generation.
 *
 * @param {TabularDataOptions} options Configuration for the new tab.
 */
async function renderTabularDataInNewTab(options) {
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
        postRenderCallback
    } = options;

    const tabContext = initializeNewTab(tabTitle);
    if (!tabContext) return;

    const { newTab, containerDiv, doc } = tabContext;

    // Initialize lightbox if a post-render action (like showing campsite details) might need it.
    if (postRenderCallback) {
        initLightbox(doc);
    }

    addInfoElement(doc, containerDiv, 'h1', pageTitle);

    // Display Date Range and other common headers
    const dateRangeText = getDateRangeDisplayText(config.filters.filterStartDate, config.filters.filterEndDate, config.filters.startDate);
    addInfoElement(doc, containerDiv, 'p', '').innerHTML = dateRangeText;

    // Collect and display all unique loop names from the data
    const loopNames = new Set();
    if (allCampsitesData && Object.keys(allCampsitesData).length > 0) {
        for (const cId in allCampsitesData) {
            if (allCampsitesData[cId].loop) {
                loopNames.add(allCampsitesData[cId].loop);
            }
        }
    }
    if (loopNames.size > 0) {
        const loopsArray = [...loopNames].sort();
        const loopLabel = loopNames.size > 1 ? "Loops" : "Loop";
        addInfoElement(doc, containerDiv, 'h3', `${loopLabel}: ${loopsArray.join(', ')}`);
    }

    // Execute the pre-table render callback if provided, to add custom headers.
    if (preTableRenderCallback) preTableRenderCallback(doc, containerDiv);
    
    addRequestInfoElements(doc, containerDiv, requestDateTime, response);

    if (!dataRows || dataRows.length === 0) {
        addInfoElement(doc, containerDiv, 'p', noDataMessage);
    } else {
        if (sortDescription) addInfoElement(doc, containerDiv, 'p', sortDescription, 'sort-info');

        const { tbody } = createTableStructure(doc, headers, containerDiv);
        dataRows.forEach((rowData, index) => tbody.appendChild(rowBuilder(doc, rowData, index)));
    }

    if (postRenderCallback) await postRenderCallback(doc, containerDiv);

    newTab.document.close();
}

/**
 * Opens a new tab and displays pre-formatted JSON data.
 * Useful for debugging and inspecting raw API responses.
 * @param {object} jsonData The JavaScript object to be stringified and displayed.
 * @param {string} [title="Parsed API Data"] The title for the new tab.
 */
function displayDataInNewTab(jsonData, title = "Parsed API Data") {
    if (typeof window === 'undefined' || !window.open) {
        console.warn("Cannot open new tab: 'window.open' is not available (e.g., running in Node.js).");
        return;
    }
    const newTab = window.open("", "_blank");
    if (newTab) {
        newTab.document.title = title;

        addInfoElement(newTab.document, newTab.document.body, 'h1', title);

        const preformattedText = newTab.document.createElement('pre');
        preformattedText.textContent = JSON.stringify(jsonData, null, 2);
        newTab.document.body.appendChild(preformattedText);

        newTab.document.close();
    } else {
        console.warn("Could not open new tab. Pop-up blocker might be active or 'window.open' failed.");
    }
}

/**
 * Renders a new tab showing only campsites that are "Available" (and optionally "Not Reservable").
 * It filters the main dataset, sorts it, and uses the generic `renderTabularDataInNewTab` function.
 * @param {object} allCampsitesData The complete campsites data object.
 * @param {object} config The main configuration object.
 * @param {Date} requestDateTime The timestamp of the data request.
 * @param {Response} response The fetch response object.
 */
async function displayAvailableSitesInNewTab(allCampsitesData, config, requestDateTime, response) {
    const includeNotReservable = config.tabBehavior.includeNotReservableInAvailableTab;

    // 1. Filter and sort the data specifically for this tab's purpose.
    const availableRowsData = [];
    if (allCampsitesData && Object.keys(allCampsitesData).length > 0) {
        for (const cId in allCampsitesData) {
            const campsite = allCampsitesData[cId];
            for (const dateStr in campsite.availabilities) {
                const currentAvailability = campsite.availabilities[dateStr];
                if (isDateInRange(dateStr, config.filters.filterStartDate, config.filters.filterEndDate)) { // Apply date range filter
                    if (currentAvailability === AVAILABILITY_STATUS.AVAILABLE || (includeNotReservable && currentAvailability === AVAILABILITY_STATUS.NOT_RESERVABLE)) {
                        const dateObj = new Date(dateStr);
                        availableRowsData.push({
                            site: campsite.site,
                            date: formatUTCDate(dateObj),
                            originalDate: dateObj,
                            availability: currentAvailability,
                            quantity: campsite.quantities[dateStr],
                            campsite_id: campsite.campsite_id
                        });
                    }
                }
            }
        }
    }
    availableRowsData.sort(createSiteSorter(config.sorting.sortAvailableSitesBy));

    // 2. Define the function that builds a single table row.
    const rowBuilder = (doc, rowData, index) => {
        const tr = doc.createElement('tr');
        tr.insertCell().textContent = index + 1;
        tr.insertCell().textContent = rowData.site;
        tr.insertCell().textContent = rowData.date;
        const availabilityCell = tr.insertCell();
        availabilityCell.textContent = rowData.availability;
        availabilityCell.className = getAvailabilityClass(rowData.availability);
        tr.insertCell().textContent = rowData.quantity;
        tr.insertCell().textContent = rowData.campsite_id;
        return tr;
    };

    // 3. Configure and call the generic renderer.
    const pageTitle = `Available Campsites${includeNotReservable ? ' & Not Reservable' : ''} - ${config.api.campgroundId}`;
    const sortDescription = config.sorting.sortAvailableSitesBy === 'site' ? "Data sorted primarily by Site, then by Date." : "Data sorted primarily by Date, then by Site.";

    await renderTabularDataInNewTab({
        tabTitle: `Available Sites - ${config.api.campgroundId}`,
        pageTitle: pageTitle,
        dataRows: availableRowsData,
        headers: ["#", "Site", "Date", "Availability", "Quantity", "Campsite ID"],
        config: config,
        allCampsitesData: allCampsitesData,
        requestDateTime: requestDateTime,
        response: response,
        sortDescription: sortDescription,
        noDataMessage: "No 'Available' or 'Not Reservable' campsites found for the selected period.",
        rowBuilder: rowBuilder,
        postRenderCallback: null // No post-render action needed for this tab.
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
 * Renders a new tab showing only the campsites specified in the configuration's filter list.
 * This function can also fetch and display detailed information (like photos) for these specific sites.
 * @param {object} allCampsitesData The complete campsites data object.
 * @param {object} config The main configuration object.
 * @param {string} currentRidbFacilityId The RIDB Facility ID, needed for fetching campsite details.
 * @param {Date} requestDateTime The timestamp of the data request.
 * @param {Response} response The fetch response object.
 */
async function displayFilteredSitesInNewTab(allCampsitesData, config, currentRidbFacilityId, requestDateTime, response) {
    const siteNumbersToFilterArray = config.siteFilters.siteNumbersToFilter;
    const availableOnlyConfig = config.tabBehavior.showFilteredSitesAvailableOnly;
    const notReservableOnlyConfig = config.tabBehavior.showFilteredSitesNotReservableOnly;
    const isFilteringBySiteNumber = siteNumbersToFilterArray && siteNumbersToFilterArray.length > 0;

    // Create a normalized version of the filter list for consistent matching (e.g., '20' should match '020').
    const normalizedSiteNumbersToFilter = siteNumbersToFilterArray.map(normalizeSiteName);

    // 1. Filter and sort the data based on this tab's specific criteria.
    const filteredRowsData = [];
    if (allCampsitesData && Object.keys(allCampsitesData).length > 0) {
        for (const cId in allCampsitesData) {
            const campsite = allCampsitesData[cId];
            // Normalize the site name from the API before comparing it to the normalized filter list.
            const siteMatchesFilter = !isFilteringBySiteNumber || normalizedSiteNumbersToFilter.includes(normalizeSiteName(campsite.site));
            if (siteMatchesFilter) {
                for (const dateStr in campsite.availabilities) {
                    const currentAvailability = campsite.availabilities[dateStr];
                    let includeRow;

                    if (!availableOnlyConfig && !notReservableOnlyConfig) { // Case for "Show All Statuses"
                        includeRow = true;
                    } else if (availableOnlyConfig && notReservableOnlyConfig) { // Case for "Available & Not Reservable"
                        includeRow = (currentAvailability === AVAILABILITY_STATUS.AVAILABLE || currentAvailability === AVAILABILITY_STATUS.NOT_RESERVABLE);
                    } else if (availableOnlyConfig) {
                        includeRow = (currentAvailability === AVAILABILITY_STATUS.AVAILABLE);
                    } else if (notReservableOnlyConfig) {
                        includeRow = (currentAvailability === AVAILABILITY_STATUS.NOT_RESERVABLE);
                    } else {
                        includeRow = true;
                    }

                    if (includeRow && isDateInRange(dateStr, config.filters.filterStartDate, config.filters.filterEndDate)) {
                        const dateObj = new Date(dateStr);
                        filteredRowsData.push({
                            site: campsite.site,
                            date: formatUTCDate(dateObj),
                            originalDate: dateObj,
                            availability: currentAvailability,
                            quantity: campsite.quantities[dateStr],
                            campsite_id: campsite.campsite_id
                        });
                    }
                }
            }
        }
    }
    filteredRowsData.sort(createSiteSorter(config.sorting.sortFilteredSitesBy));

    // 2. Define the function that builds a single table row.
    const rowBuilder = (doc, rowData, index) => {
        const tr = doc.createElement('tr');
        tr.insertCell().textContent = index + 1;
        tr.insertCell().textContent = rowData.site;
        tr.insertCell().textContent = rowData.date;
        const availabilityCell = tr.insertCell();
        availabilityCell.textContent = rowData.availability;
        availabilityCell.className = getAvailabilityClass(rowData.availability);
        tr.insertCell().textContent = rowData.quantity;
        tr.insertCell().textContent = rowData.campsite_id;
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
        addInfoElement(doc, debugDiv, 'h3', 'Live Debug Info for Filtered Tab');
        const debugPre = doc.createElement('pre');
        debugDiv.appendChild(debugPre);
        containerDiv.appendChild(debugDiv);
        let debugText = '';
        const logDebug = (msg) => { debugText += msg + '\n'; debugPre.textContent = debugText; };
        // --- END: In-Tab Debugging ---

        const idsForDetailFetch = [];

        if (config.tabBehavior.fetchDetailsForAllFilteredSites) {
            // When this flag is true, derive the list of sites to fetch directly
            // from the configuration, not from the filtered availability results.
            const siteNumbersToFilterArray = config.siteFilters.siteNumbersToFilter;
            if (siteNumbersToFilterArray.length > 0 && allCampsitesData) {
                logDebug(`'fetchDetailsForAllFilteredSites' is TRUE.`);
                logDebug(`Sites to filter from config: [${siteNumbersToFilterArray.join(', ')}]`);
                logDebug(`Total campsites in master list (allCampsitesData): ${Object.keys(allCampsitesData).length}`);

                // Create a map for efficient lookup of site name -> campsite_id
                const siteNameToIdMap = new Map();
                for (const cId in allCampsitesData) {
                    const campsite = allCampsitesData[cId];
                    const normalizedName = normalizeSiteName(campsite.site);
                    siteNameToIdMap.set(normalizedName, campsite.campsite_id);
                }

                logDebug(`Built siteNameToIdMap with ${siteNameToIdMap.size} entries.`);

                siteNumbersToFilterArray.forEach(siteName => {
                    const normalizedLookupName = normalizeSiteName(siteName);
                    const campsiteId = siteNameToIdMap.get(normalizedLookupName);
                    if (campsiteId) {
                        idsForDetailFetch.push(campsiteId);
                    } else {
                        logDebug(`- WARN: Could not find campsite_id for site name "${siteName}" (normalized to "${normalizedLookupName}") in the map.`);
                    }
                });
                logDebug(`Resulting idsForDetailFetch: [${idsForDetailFetch.join(', ')}]`);
            }
        } else {
            // When the flag is false, derive the list from the sites that actually
            // appeared in the filtered availability data.
            logDebug(`'fetchDetailsForAllFilteredSites' is FALSE.`);
            const allUniqueIdsInFilteredList = [...new Set(filteredRowsData.map(item => item.campsite_id))];
            const processedForDetailFetch = new Set();

            allUniqueIdsInFilteredList.forEach(cId => {
                const entriesForThisCampsite = filteredRowsData.filter(item => item.campsite_id === cId);
                const isAvailableInFilteredList = entriesForThisCampsite.some(item => item.availability === AVAILABILITY_STATUS.AVAILABLE);
                const isNotReservableInFilteredList = entriesForThisCampsite.some(item => item.availability === AVAILABILITY_STATUS.NOT_RESERVABLE);

                const shouldFetchForAvailable = config.tabBehavior.fetchDetailsForAvailableFilteredSites && isAvailableInFilteredList;
                const shouldFetchForNotReservable = config.tabBehavior.fetchDetailsForNotReservableFilteredSites && isNotReservableInFilteredList;

                if ((shouldFetchForAvailable || shouldFetchForNotReservable) && !processedForDetailFetch.has(cId)) {
                    idsForDetailFetch.push(cId);
                    processedForDetailFetch.add(cId);
                }
            });
            logDebug(`Resulting idsForDetailFetch from available rows: [${idsForDetailFetch.join(', ')}]`);
        }

        // If, after all logic, there are no sites to fetch details for, we can exit.
        if (idsForDetailFetch.length === 0) {
            logDebug(`\nCONCLUSION: No site IDs were identified for detail fetching. Exiting callback.`);
            return;
        }

        // Build a map of campsite_id -> site_number for sorting.
        // Use the master `allCampsitesData` list to ensure we can sort
        // even if a site has no availability data in the current range.
        const siteNumberMap = new Map();
        if (allCampsitesData) {
            for (const cId in allCampsitesData) {
                const campsite = allCampsitesData[cId];
                if (campsite && campsite.site && !siteNumberMap.has(cId)) {
                    const siteNum = parseInt(campsite.site.match(/\d+/)?.[0] || '0', 10);
                    siteNumberMap.set(cId, siteNum);
                }
            }
        }
        logDebug(`\nBuilt siteNumberMap for sorting with ${siteNumberMap.size} entries.`);
        idsForDetailFetch.sort((idA, idB) => {
            const siteNumA = siteNumberMap.get(idA) || 0;
            const siteNumB = siteNumberMap.get(idB) || 0;
            return siteNumA - siteNumB;
        });
        logDebug(`Sorted idsForDetailFetch: [${idsForDetailFetch.join(', ')}]`);

        const detailPromises = idsForDetailFetch.map(cId =>
            fetchCampsiteDetails(currentRidbFacilityId, cId)
        );

        // Add the header for the details section now that we know we have details to fetch.
        const detailsHeader = addInfoElement(doc, containerDiv, 'h2', "Detailed Information for Filtered Campsites");
        if (detailsHeader) {
            detailsHeader.style.marginTop = "30px";
            detailsHeader.style.borderTop = "2px solid #ccc";
            detailsHeader.style.paddingTop = "20px";
        }

        const loadingDetailsP = addInfoElement(doc, containerDiv, 'p', "Loading detailed information for each campsite...");
        const allDetailsResults = await Promise.allSettled(detailPromises);
        if (loadingDetailsP) containerDiv.removeChild(loadingDetailsP);

        allDetailsResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const campsiteDetails = result.value;
                // Find all "Available" dates for this specific campsite from the table data.
                const availableDates = filteredRowsData
                    .filter(row => row.campsite_id === campsiteDetails.CampsiteID && row.availability === AVAILABILITY_STATUS.AVAILABLE)
                    .map(row => row.date);
                // Find all "Not Reservable" dates for this specific campsite.
                const notReservableDates = filteredRowsData
                    .filter(row => row.campsite_id === campsiteDetails.CampsiteID && row.availability === AVAILABILITY_STATUS.NOT_RESERVABLE)
                    .map(row => row.date);

                renderCampsiteDetailsInTab(campsiteDetails, availableDates, notReservableDates, containerDiv, doc);
            } else if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value)) {
                console.warn("[displayFilteredSitesInNewTab] Failed to fetch or no data for a campsite detail:", result.reason || "No data returned");
            }
        });
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
            addInfoElement(doc, summaryDiv, 'h3', 'Not Reservable Summary for Filtered Sites');
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

        // --- Create main filter description header ---
        const siteFilterText = isFilteringBySiteNumber ? `Displaying sites: ${siteNumbersToFilterArray.join(", ")}` : `Displaying all sites`;
        let statusFilterDescription = "";
        if (!availableOnlyConfig && !notReservableOnlyConfig) {
            statusFilterDescription = " (Showing All Statuses)";
        } else if (availableOnlyConfig) {
            statusFilterDescription = notReservableOnlyConfig ? " (Showing 'Available' OR 'Not Reservable')" : " (Showing 'Available' Only)";
        } else if (notReservableOnlyConfig) {
            statusFilterDescription = " (Showing 'Not Reservable' Only)";
        } else {
            // This case should not be hit with the new UI, but as a fallback:
            statusFilterDescription = " (Showing All Statuses)";
        }
        const filterDescriptionHeader = doc.createElement('h2');
        filterDescriptionHeader.textContent = `${siteFilterText}${statusFilterDescription}`;
        containerDiv.appendChild(filterDescriptionHeader);
    };

    const pageTitle = `Filtered Campsite Availability - ${config.api.campgroundId}`;
    const sortDescription = config.sorting.sortFilteredSitesBy === 'site' ? "Data sorted primarily by Site, then by Date." : "Data sorted primarily by Date, then by Site.";
    const tabTitle = `Filtered Sites (${isFilteringBySiteNumber ? siteNumbersToFilterArray.join(", ") : "All"}) - ${config.api.campgroundId}`;

    await renderTabularDataInNewTab({
        tabTitle: tabTitle,
        pageTitle: pageTitle,
        dataRows: filteredRowsData,
        headers: ["#", "Site", "Date", "Availability", "Quantity", "Campsite ID"],
        preTableRenderCallback: preTableRenderCallback,
        config: config,
        allCampsitesData: allCampsitesData,
        requestDateTime: requestDateTime,
        response: response,
        sortDescription: sortDescription,
        noDataMessage: "No campsites found matching the specified filters and date range.",
        rowBuilder: rowBuilder,
        postRenderCallback: postRenderCallback
    });
}

/**
 * Renders a new tab displaying a simple summary of availability counts (e.g., "Available: 50").
 * @param {object} availabilityCountsData An object with availability statuses as keys and counts as values.
 * @param {object} config The main configuration object.
 * @param {Date} currentRequestDateTime The timestamp of the data request.
 * @param {Response} responseFromFetch The fetch response object.
 */
function displayAvailabilitySummaryInNewTab(availabilityCountsData, config, currentRequestDateTime, responseFromFetch) {
    const currentCampgroundId = config.api.campgroundId;
    const { filterStartDate, filterEndDate, startDate } = config.filters;

    const tabTitle = `Availability Summary - ${currentCampgroundId}`;
    const tabContext = initializeNewTab(tabTitle);
    if (!tabContext) {
        return;
    }
    const { newTab, containerDiv, doc } = tabContext;

    initLightbox(doc); // Initialize lightbox in the new tab

    addInfoElement(doc, containerDiv, 'h1', `Availability Summary - ${currentCampgroundId}`);

    // Display Date Range
    const dateRangeText = getDateRangeDisplayText(filterStartDate, filterEndDate, startDate);
    addInfoElement(doc, containerDiv, 'p', '').innerHTML = dateRangeText;

    addRequestInfoElements(doc, containerDiv, currentRequestDateTime, responseFromFetch);
    if (Object.keys(availabilityCountsData).length > 0) {
        const summaryList = doc.createElement('ul');
        summaryList.style.listStyleType = 'none';
        summaryList.style.paddingLeft = '0';

        for (const type in availabilityCountsData) {
            const count = availabilityCountsData[type];
            const listItem = doc.createElement('li');
            listItem.textContent = `${type}: ${count}`;
            listItem.className = `summary-item ${getAvailabilityClass(type)}`; // Add class for styling
            summaryList.appendChild(listItem);
        }
        containerDiv.appendChild(summaryList);
    } else {
        addInfoElement(doc, containerDiv, 'p', "No availability data to summarize for the selected period.");
    }
    newTab.document.close();
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
 */
function displayDebugInfoInNewTab(debugData) {
    const tabContext = initializeNewTab(`Debug Info - ${config.api.campgroundId}`);
    if (!tabContext) return;

    const { newTab, containerDiv, doc } = tabContext;

    addInfoElement(doc, containerDiv, 'h1', 'Script Execution Debug Information');

    // Add the download link to the top of the tab
    const downloadLink = createDownloadLink(doc, debugData, `debug_info_${config.api.campgroundId}_${new Date().toISOString().split('T')[0]}.json`);
    containerDiv.appendChild(downloadLink);
    const pre = doc.createElement('pre');
    pre.textContent = safeJsonStringify(debugData);
    containerDiv.appendChild(pre);

    newTab.document.close();
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
function renderCampsiteDetailsInTab(campsiteDetails, availableDates, notReservableDates, parentElement, doc = document) {
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
        addInfoElement(doc, notReservableDiv, 'p', '').innerHTML = `<strong>Not Reservable on:</strong> ${notReservableDates.join(', ')}`;
        detailDiv.appendChild(notReservableDiv);
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
                imgElement.style.maxWidth = '1000px';
                imgElement.style.maxHeight = '1000px';
                imgElement.style.display = 'block';
                imgElement.style.marginTop = '10px';
                detailDiv.appendChild(imgElement);
            });
        }
    }

    parentElement.appendChild(detailDiv);
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

    // Calculate counts if main table or summary tab is enabled
    if (config.display.showMainDataTable || config.display.showAvailabilitySummaryTab) {
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
        case AVAILABILITY_STATUS.OPEN: return "open";
        case AVAILABILITY_STATUS.NOT_RESERVABLE: return "not-reservable";
        default: return AVAILABILITY_STATUS.UNKNOWN.toLowerCase(); // Ensure class is lowercase
    }
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
        const matchA = siteNameA.match(/\d+/);
        const matchB = siteNameB.match(/\d+/);
        const numA = matchA ? parseInt(matchA[0], 10) : Infinity;
        const numB = matchB ? parseInt(matchB[0], 10) : Infinity;

        let siteComparison;
        if (numA !== numB) {
            siteComparison = numA - numB;
        } else {
            siteComparison = siteNameA.localeCompare(siteNameB);
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

// --- Robust Date Parsing Function ---
/**
 * Parses a date string from an aria-label with the expected format "DayOfWeek, Month Day, Year".
 * Example: "Thursday, July 10, 2025"
 *
 * @param {string} ariaLabel The aria-label string containing the date.
 * @returns {Date|null} A Date object if parsing is successful, otherwise null.
 */
function parseDateFromAriaLabelRobust(ariaLabel) {
  if (typeof ariaLabel !== 'string' || ariaLabel.trim() === '') {
    console.error("Invalid ariaLabel input: must be a non-empty string.");
    return null;
  }

  // The format is "DayOfWeek, Month Day, Year"
  // We are primarily interested in "Month Day, Year" for reliable parsing by new Date().
  // Example: "Thursday, July 10, 2025" -> we want "July 10, 2025"

  // Find the first comma, then take the substring after it.
  const commaIndex = ariaLabel.indexOf(',');
  if (commaIndex === -1) {
    console.error(`Invalid date format in ariaLabel: "${ariaLabel}". Expected "DayOfWeek, Month Day, Year".`);
    return null;
  }

  // Extract the "Month Day, Year" part
  const dateStringPart = ariaLabel.substring(commaIndex + 1).trim(); // e.g., "July 10, 2025"

  if (dateStringPart === '') {
    console.error(`Empty date part after comma in ariaLabel: "${ariaLabel}".`);
    return null;
  }

  // Attempt to parse the date string.
  const date = new Date(dateStringPart);

  // Check if the date is valid.
  if (isNaN(date.getTime())) {
    console.error(`Failed to parse date from string: "${dateStringPart}" (derived from "${ariaLabel}")`);
    return null;
  }
  return date;
}

// --- Main Page Rendering Sub-components ---

/**
 * Renders the main header section with facility and recreation area details.
 * @param {HTMLElement} parentElement The element to append the header content to.
 * @param {object|null} facilityDetails The detailed data for the facility.
 * @param {object|null} recAreaDetails The detailed data for the parent recreation area.
 * @param {IdCollection} ids The collection of IDs for the campground.
 */
function renderFacilityHeaderAndDetails(parentElement, facilityDetails, recAreaDetails, ids) {
    addInfoElement(document, parentElement, 'h1', facilityDetails.FacilityName || `Details for Campground ID: ${ids.campgroundId}`);

    // --- Display Key IDs ---
    const idsDiv = document.createElement('div');
    idsDiv.className = 'id-display-section';
    idsDiv.style.padding = '10px';
    idsDiv.style.margin = '10px 0';
    idsDiv.style.backgroundColor = '#f0f0f0';
    idsDiv.style.border = '1px solid #ddd';
    addInfoElement(document, idsDiv, 'p', '').innerHTML = `<strong>Recreation.gov Campground ID:</strong> ${ids.campgroundId || 'Not Found'}`;
    addInfoElement(document, idsDiv, 'p', '').innerHTML = `<strong>Parent RecArea ID:</strong> ${ids.recAreaId || 'Not Found'}`;
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
    if (facilityLat && facilityLon) addDetail("Coordinates", `<a href="https://www.google.com/maps?q=${facilityLat},${facilityLon}" target="_blank">${facilityLat}, ${facilityLon} (View on Map)</a>`, true);

    if (facilityDetails.FACILITYADDRESS && facilityDetails.FACILITYADDRESS.length > 0) {
        const address = facilityDetails.FACILITYADDRESS[0];
        let addressString = [address.FacilityStreetAddress1, address.City, address.AddressStateCode, address.PostalCode].filter(Boolean).join(', ');
        addDetail("Address", addressString);
    }

    if (facilityDetails.ORGANIZATION?.[0]?.OrgName) addDetail("Managed By", facilityDetails.ORGANIZATION[0].OrgName);
    if (facilityDetails.RECAREA?.[0]?.RecAreaName) addDetail("Recreation Area", facilityDetails.RECAREA[0].RecAreaName);
    addDetail("Keywords", facilityDetails.Keywords);
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
        addRecAreaDetail("Keywords", recAreaDetails.Keywords);
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
    if (!config.display.showMainDataTable) {
        addInfoElement(document, parentElement, 'p', "Main data table display is disabled by configuration.", "warning-message");
        return;
    }

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
                        date: formatUTCDate(new Date(dateStr)),
                        originalDate: new Date(dateStr),
                        availability: campsite.availabilities[dateStr],
                        quantity: campsite.quantities[dateStr],
                        campsite_id: campsite.campsite_id
                    });
                }
            }
        }
    }

    rowsToSort.sort(createSiteSorter('site'));

    const mainSortInfo = addInfoElement(document, parentElement, 'p', "Data sorted primarily by Site, then by Date.", 'sort-info');
    if (mainSortInfo) mainSortInfo.style.fontStyle = 'italic';

    const headers = ["#", "Site", "Date", "Availability", "Quantity", "Campsite ID"];
    const { tbody } = createTableStructure(document, headers, parentElement);

    rowsToSort.forEach((itemData, index) => {
        const row = tbody.insertRow();
        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = itemData.site;
        row.insertCell().textContent = itemData.date;
        const availabilityCell = row.insertCell();
        availabilityCell.textContent = itemData.availability;
        availabilityCell.classList.add(getAvailabilityClass(itemData.availability));
        row.insertCell().textContent = itemData.quantity;
        row.insertCell().textContent = itemData.campsite_id;
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
function renderMainPage(containerElement, campgroundMetadata, facilityDetails, recAreaDetails, eventsData, recAreaMedia, campsites, availabilityCounts, requestDateTime, response, config, ids) {
    if (typeof document === 'undefined' || !containerElement) {
        console.warn("Main page container element not found or document not available. Skipping main page DOM updates.");
        return;
    }

    // Clear previous content from the main container
    containerElement.innerHTML = '';
    debugInfo.rendering.mainPageRenderStatus.facilityDetails = !!facilityDetails;
    debugInfo.rendering.mainPageRenderStatus.recAreaDetails = !!recAreaDetails;
    debugInfo.rendering.mainPageRenderStatus.events = ids.eventInfoStatus;
    debugInfo.rendering.mainPageRenderStatus.mediaGalleries = 0;

    // --- Section 1: Render Header, Details, and Galleries ---
    if (facilityDetails) {
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'facility-details';
        detailsContainer.style.fontSize = "1.1rem";
        containerElement.appendChild(detailsContainer);

        // Render the main header, facility details, and rec area details into their container.
        renderFacilityHeaderAndDetails(detailsContainer, facilityDetails, recAreaDetails, ids);

        // Render media galleries into the same container.
        if (facilityDetails.MEDIA && facilityDetails.MEDIA.length > 0) {
            renderMediaGallery(detailsContainer, facilityDetails.MEDIA, 'Facility Media');
            debugInfo.rendering.mainPageRenderStatus.mediaGalleries++;
        }
        if (config.display.showRecAreaMediaOnMainPage && recAreaMedia && recAreaMedia.length > 0) {
            renderMediaGallery(detailsContainer, recAreaMedia, 'Recreation Area Gallery');
            debugInfo.rendering.mainPageRenderStatus.mediaGalleries++;
        }

        // Render the events section directly into the main container, after the details block.
        if (config.display.fetchAndShowEventsOnMainPage) {
            renderEventsSection(containerElement, eventsData, ids);
        }
    } else {
        // Fallback if facilityDetails are not available, still provide a link and key IDs.
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'facility-details';
        addInfoElement(document, fallbackDiv, 'h1', `Details for Campground ID: ${ids.campgroundId}`);

        const idsDiv = document.createElement('div');
        idsDiv.className = 'id-display-section';
        idsDiv.style.padding = '10px';
        idsDiv.style.margin = '10px 0';
        idsDiv.style.backgroundColor = '#f0f0f0';
        idsDiv.style.border = '1px solid #ddd';
        addInfoElement(document, idsDiv, 'p', '').innerHTML = `<strong>Recreation.gov Campground ID:</strong> ${ids.campgroundId || 'Not Found'}`;
        addInfoElement(document, idsDiv, 'p', '').innerHTML = `<strong>Parent RecArea ID:</strong> ${ids.recAreaId || 'Not Found'}`;
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
        for (const type in availabilityCounts) {
            addInfoElement(document, summaryElement, 'p', `${type}: ${availabilityCounts[type]}`);
        }
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
 * The main entry point and execution flow for the script.
 * It prepares the configuration, fetches all data, and then triggers the rendering process.
 * @param {object} config The initial configuration object.
 */
async function runAvailabilityCheck(config) {
    debugInfo.timestamps.start = new Date().toISOString(); // Record start time

    const mainContainer = typeof document !== 'undefined' ? document.getElementById("results-container") : null;
    if (typeof document !== 'undefined') {
        initLightbox(document); // Initialize lightbox on the main page
    }

    // Prepare configuration by calculating effective dates
    const effectiveConfig = prepareConfig(JSON.parse(JSON.stringify(config))); // Deep copy to prevent mutation of original config

    try {
        const allData = await fetchAllData(effectiveConfig);
        await renderAllOutputs(allData, effectiveConfig, mainContainer);
    } catch (error) { // Catch errors not handled by Promise.allSettled's individual rejections
        console.error("Unhandled error in runAvailabilityCheck:", error);
        handleFetchError(error, mainContainer);
    } finally {
        debugInfo.timestamps.end = new Date().toISOString();
        console.log("Script execution finished. Final debug object:", debugInfo);

        if (typeof window !== 'undefined') {
            window.debugInfo = debugInfo;
            console.log("Debug object assigned to 'window.debugInfo' for inspection in the browser console.");
        }

        if (effectiveConfig.display.showDebugTab) {
            displayDebugInfoInNewTab(debugInfo);
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
        if (configObject.sorting.sortFilteredSitesBy) {
            document.getElementById('sortFilteredSitesBy').value = configObject.sorting.sortFilteredSitesBy;
        }
    }

    if (configObject.tabBehavior) {
        const behavior = configObject.tabBehavior;
        document.getElementById('includeNotReservableInAvailableTab').checked = behavior.includeNotReservableInAvailableTab;

        // Logic to set the 'Filtered Sites Table Content' dropdown
        if (!behavior.showFilteredSitesAvailableOnly && !behavior.showFilteredSitesNotReservableOnly) {
            document.getElementById('filteredSitesTableContent').value = 'all';
        } else if (behavior.showFilteredSitesAvailableOnly && !behavior.showFilteredSitesNotReservableOnly) {
            document.getElementById('filteredSitesTableContent').value = 'available_only';
        } else { // Default case: both are true
            document.getElementById('filteredSitesTableContent').value = 'available_or_not_reservable';
        }

        // Logic to set the 'Fetch Details For' dropdown
        if (behavior.fetchDetailsForAllFilteredSites) {
            document.getElementById('filteredSitesDetailFetch').value = 'all_filtered';
        } else if (behavior.fetchDetailsForAvailableFilteredSites && behavior.fetchDetailsForNotReservableFilteredSites) {
            document.getElementById('filteredSitesDetailFetch').value = 'available_or_not_reservable';
        } else {
            document.getElementById('filteredSitesDetailFetch').value = 'only_available';
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
    newConfig.siteFilters.siteNumbersToFilter = sitesText.split(',').map(s => s.trim()).filter(Boolean);

    // Update display toggles from checkboxes
    for (const key in newConfig.display) {
        const checkbox = document.querySelector(`input[name="${key}"]`);
        if (checkbox) {
            newConfig.display[key] = checkbox.checked;
        }
    }

    // Update sorting preferences
    newConfig.sorting.sortFilteredSitesBy = document.getElementById('sortFilteredSitesBy').value;

    // Update tab behavior preferences
    const behavior = newConfig.tabBehavior;
    behavior.includeNotReservableInAvailableTab = document.getElementById('includeNotReservableInAvailableTab').checked;

    // Logic for 'Filtered Sites Table Content'
    const tableContent = document.getElementById('filteredSitesTableContent').value;
    switch (tableContent) {
        case 'available_or_not_reservable':
            behavior.showFilteredSitesAvailableOnly = true;
            behavior.showFilteredSitesNotReservableOnly = true;
            break;
        case 'available_only':
            behavior.showFilteredSitesAvailableOnly = true;
            behavior.showFilteredSitesNotReservableOnly = false;
            break;
        case 'all':
            behavior.showFilteredSitesAvailableOnly = false;
            behavior.showFilteredSitesNotReservableOnly = false;
            break;
    }

    // Logic for 'Fetch Details For'
    const detailFetch = document.getElementById('filteredSitesDetailFetch').value;
    switch (detailFetch) {
        case 'all_filtered':
            behavior.fetchDetailsForAllFilteredSites = true;
            // The other two flags don't matter when the master flag is true, but we can set them for consistency.
            behavior.fetchDetailsForAvailableFilteredSites = true;
            behavior.fetchDetailsForNotReservableFilteredSites = true;
            break;
        case 'available_or_not_reservable':
            behavior.fetchDetailsForAllFilteredSites = false;
            behavior.fetchDetailsForAvailableFilteredSites = true;
            behavior.fetchDetailsForNotReservableFilteredSites = true;
            break;
        case 'only_available':
            behavior.fetchDetailsForAllFilteredSites = false;
            behavior.fetchDetailsForAvailableFilteredSites = true;
            behavior.fetchDetailsForNotReservableFilteredSites = false;
            break;
    }

    return newConfig;
}

/**
 * Handles the form submission event. It prevents the default page reload,
 * builds a new config from the form, and starts the availability check.
 * @param {Event} event The form submission event.
 */
async function handleFormSubmit(event) {
    event.preventDefault(); // Stop the browser from reloading the page
    const dynamicConfig = buildConfigFromForm();
    await runAvailabilityCheck(dynamicConfig);
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

    // Add sorting parameters
    if (dynamicConfig.sorting.sortFilteredSitesBy) params.append('sortFilteredSitesBy', dynamicConfig.sorting.sortFilteredSitesBy);

    // Add tab behavior parameters from the UI controls
    params.append('includeNotReservableInAvailableTab', document.getElementById('includeNotReservableInAvailableTab').checked);
    params.append('filteredSitesTableContent', document.getElementById('filteredSitesTableContent').value);
    params.append('filteredSitesDetailFetch', document.getElementById('filteredSitesDetailFetch').value);

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

    // Handle sorting flags from the URL
    initialConfig.sorting.sortFilteredSitesBy = urlParams.get('sortFilteredSitesBy') || initialConfig.sorting.sortFilteredSitesBy;

    // Handle tab behavior flags from the URL
    if (urlParams.has('includeNotReservableInAvailableTab')) {
        initialConfig.tabBehavior.includeNotReservableInAvailableTab = urlParams.get('includeNotReservableInAvailableTab') === 'true';
    }

    const tableContentFromUrl = urlParams.get('filteredSitesTableContent');
    if (tableContentFromUrl) {
        switch (tableContentFromUrl) {
            case 'available_or_not_reservable':
                initialConfig.tabBehavior.showFilteredSitesAvailableOnly = true;
                initialConfig.tabBehavior.showFilteredSitesNotReservableOnly = true;
                break;
            case 'available_only':
                initialConfig.tabBehavior.showFilteredSitesAvailableOnly = true;
                initialConfig.tabBehavior.showFilteredSitesNotReservableOnly = false;
                break;
            case 'all':
                initialConfig.tabBehavior.showFilteredSitesAvailableOnly = false;
                initialConfig.tabBehavior.showFilteredSitesNotReservableOnly = false;
                break;
        }
    }

    const detailFetchFromUrl = urlParams.get('filteredSitesDetailFetch');
    if (detailFetchFromUrl) {
        switch (detailFetchFromUrl) {
            case 'all_filtered':
                initialConfig.tabBehavior.fetchDetailsForAllFilteredSites = true;
                initialConfig.tabBehavior.fetchDetailsForAvailableFilteredSites = true;
                initialConfig.tabBehavior.fetchDetailsForNotReservableFilteredSites = true;
                break;
            case 'available_or_not_reservable':
                initialConfig.tabBehavior.fetchDetailsForAllFilteredSites = false;
                initialConfig.tabBehavior.fetchDetailsForAvailableFilteredSites = true;
                initialConfig.tabBehavior.fetchDetailsForNotReservableFilteredSites = true;
                break;
            case 'only_available':
                initialConfig.tabBehavior.fetchDetailsForAllFilteredSites = false;
                initialConfig.tabBehavior.fetchDetailsForAvailableFilteredSites = true;
                initialConfig.tabBehavior.fetchDetailsForNotReservableFilteredSites = false;
                break;
        }
    }

    // 2. Populate the form with the determined initial configuration
    populateFormFromConfig(initialConfig);

    // 3. Attach event listeners (handlers will be implemented in the next step)
    form.addEventListener('submit', handleFormSubmit);
    copyLinkButton.addEventListener('click', handleCopyLink);
    presetSelector.addEventListener('change', handlePresetChange);

    console.log("Page initialized. Ready for user input.");
}

// --- Script Entry Point ---
// The script now starts by listening for the DOM to be ready.
document.addEventListener('DOMContentLoaded', initializePage);

// The script is now controlled by event listeners, so we no longer call this automatically.
// runAvailabilityCheck(config);
