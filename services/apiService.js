/**
 * =================================================================================================
 * API Service Module
 * =================================================================================================
 *
 * Description:
 * This module centralizes all logic for making external API calls. It provides reusable
 * functions for fetching data from various endpoints, handling errors, and logging API
 * activity for debugging purposes.
 *
 * By isolating API interactions, this module decouples the main application logic from
 * the specifics of data retrieval, making the codebase cleaner, more modular, and easier
 * to maintain and test.
 *
 */

/**
 * A generic and robust utility for fetching and processing data from an API.
 * It centralizes logging, error handling, and response parsing.
 * @template T
 * @param {string} url The API endpoint URL to fetch.
 * @param {RequestInit} options Standard `fetch` options (e.g., headers).
 * @param {string|object} context A string or object providing context for logging.
 * @param {function(any, Response): T} dataProcessor A function to transform the raw JSON into the desired output format.
 * @param {object} debugInfo The centralized debug object for logging API calls and errors.
 * @returns {Promise<T|null>} The processed data as returned by `dataProcessor`, or `null` if the fetch fails.
 */
export async function fetchApiData(url, options, context, dataProcessor, debugInfo) {
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

// --- ID Management ---

/**
 * A collection of related IDs for a given campground.
 * This class simplifies passing around the various IDs (campground, facility, rec area, etc.).
 */
export class IdCollection {
    constructor(campgroundData) {
        this.campgroundId = campgroundData.campground_id;
        this.facilityId = campgroundData.facility_id;
        this.recAreaId = campgroundData.parent_rec_area_id;
        this.campsiteId = campgroundData.campsite_id; // May be undefined
        this.eventInfoStatus = 'NOT_FETCHED';
    }
}

/**
 * Calculates the start dates of all months within a given date range.
 * @param {string} startDateStr - The start date in 'YYYY-MM-DD' format.
 * @param {string} endDateStr - The end date in 'YYYY-MM-DD' format.
 * @returns {string[]} An array of month start dates in 'YYYY-MM-01' format.
 */
function getMonthsToFetch(startDateStr, endDateStr) {
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');
    const months = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
        const year = current.getFullYear();
        const month = (current.getMonth() + 1).toString().padStart(2, '0');
        months.push(`${year}-${month}-01`);
        current.setMonth(current.getMonth() + 1);
    }
    return months;
}

// --- Individual Data Fetchers ---

/**
 * Fetches campsite availability data from the Recreation.gov API.
 * This function handles multi-month searches by making concurrent requests for each month.
 * @param {object} config The configuration object.
 * @param {object} debugInfo The centralized debug object.
 * @returns {Promise<{campsites: object, requestDateTime: Date, response: Response}|null>} A promise that resolves to the combined availability data or null on complete failure.
 */
export async function fetchAvailabilityData(config, debugInfo) {
    const { campgroundId } = config.api;
    const { filterStartDate, filterEndDate } = config.filters;
    const requestDateTime = new Date();

    const monthsToFetch = getMonthsToFetch(filterStartDate, filterEndDate);
    if (monthsToFetch.length === 0) {
        console.warn('No months to fetch for the given date range.');
        return { campsites: {}, requestDateTime, response: new Response() };
    }

    const promises = monthsToFetch.map(monthStartDate => {
        // The backend proxy only uses the start_date to determine the month.
        const apiEndpoint = `/api/fetch-ridb?type=availability&campgroundId=${campgroundId}&start_date=${monthStartDate}T00:00:00.000Z`;
        const dataProcessor = (json, response) => ({
            campsites: json.campsites,
            requestDateTime,
            response
        });
        const context = { type: 'Availability', campgroundId, month: monthStartDate };
        return fetchApiData(apiEndpoint, { headers: { 'accept': 'application/json' } }, context, dataProcessor, debugInfo);
    });

    const results = await Promise.allSettled(promises);

    const combinedCampsites = {};
    let firstSuccessfulResponse = null;

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?.campsites) {
            if (!firstSuccessfulResponse) {
                firstSuccessfulResponse = result.value.response;
            }
            // Correctly merge the nested availability data from each monthly fetch.
            const monthlyCampsites = result.value.campsites;
            for (const cId in monthlyCampsites) {
                if (!combinedCampsites[cId]) {
                    combinedCampsites[cId] = monthlyCampsites[cId];
                } else {
                    Object.assign(combinedCampsites[cId].availabilities, monthlyCampsites[cId].availabilities);
                    Object.assign(combinedCampsites[cId].quantities, monthlyCampsites[cId].quantities);
                }
            }
        } else {
            const reason = result.status === 'rejected' ? result.reason : 'API returned null or empty response';
            console.error(`Failed to fetch availability for month starting ${monthsToFetch[index]}:`, reason);
        }
    });

    if (Object.keys(combinedCampsites).length === 0) {
        console.error('All availability fetches failed or returned no data.');
        return null;
    }

    return {
        campsites: combinedCampsites,
        requestDateTime,
        response: firstSuccessfulResponse,
    };
}

/**
 * Fetches metadata for a campground to get its parent Rec Area ID and other details.
 * @param {string} campgroundId The ID of the campground.
 * @param {object} debugInfo The centralized debug object.
 * @returns {Promise<{ids: IdCollection}|null>} A promise that resolves to an object containing an IdCollection.
 */
export async function fetchCampgroundMetadata(campgroundId, debugInfo) {
    const url = `/api/fetch-ridb?type=campgroundMetadata&campgroundId=${campgroundId}`;
    const options = { headers: { 'Accept': 'application/json' } };
    const context = { type: 'Campground Metadata', campgroundId };

    const dataProcessor = (json) => {
        if (!json.campground) {
            console.error("Campground metadata fetch failed: 'campground' key not in response.", json);
            return null;
        }
        const ids = new IdCollection(json.campground);
        return { ids, campgroundMetadata: json.campground };
    };

    return fetchApiData(url, options, context, dataProcessor, debugInfo);
}

/**
 * Fetches detailed information for a specific facility (campground).
 * @param {IdCollection} ids The collection of IDs for the campground.
 * @param {object} debugInfo The centralized debug object.
 * @returns {Promise<object|null>} A promise that resolves to the facility details.
 */
export async function fetchFacilityDetails(ids, debugInfo) {
    if (!ids.facilityId) return null;
    const url = `/api/fetch-ridb?type=facilityDetails&facilityId=${ids.facilityId}`;
    const options = { headers: { 'Accept': 'application/json' } };
    const context = { type: 'Facility Details', facilityId: ids.facilityId };
    return fetchApiData(url, options, context, json => json, debugInfo);
}

/**
 * Fetches detailed information for a specific campsite.
 * @param {string} facilityId The RIDB ID for the parent facility.
 * @param {string} campsiteId The RIDB ID for the specific campsite.
 * @param {object} debugInfo The centralized debug object.
 * @returns {Promise<object|null>} A promise that resolves to the campsite details.
 */
export async function fetchCampsiteDetails(facilityId, campsiteId, debugInfo) {
    if (!facilityId || !campsiteId) return null;
    const url = `/api/fetch-ridb?type=campsiteDetails&facilityId=${facilityId}&campsiteId=${campsiteId}`;
    const options = { headers: { 'Accept': 'application/json' } };
    const context = { type: 'Campsite Details', campsiteId: campsiteId };
    // The RIDB API for campsite details returns the result object inside an array, even for a single site.
    const dataProcessor = (json) => (json && Array.isArray(json) && json.length > 0 ? json[0] : null);
    return fetchApiData(url, options, context, dataProcessor, debugInfo);
}

/**
 * Fetches detailed information for the parent Recreation Area.
 * @param {IdCollection} ids The collection of IDs for the campground.
 * @param {object} debugInfo The centralized debug object.
 * @returns {Promise<object|null>} A promise that resolves to the recreation area details.
 */
export async function fetchRecAreaDetails(ids, debugInfo) {
    if (!ids.recAreaId) return null;
    const url = `/api/fetch-ridb?type=recAreaDetails&recAreaId=${ids.recAreaId}`;
    const options = { headers: { 'Accept': 'application/json' } };
    const context = { type: 'Rec Area Details', recAreaId: ids.recAreaId };
    return fetchApiData(url, options, context, json => json, debugInfo);
}

/**
 * Fetches event information for the parent Recreation Area.
 * @param {IdCollection} ids The collection of IDs for the campground.
 * @param {object} debugInfo The centralized debug object.
 * @returns {Promise<object|null>} A promise that resolves to the recreation area events.
 */
export async function fetchRecAreaEvents(ids, debugInfo) {
    if (!ids.recAreaId) return null;
    const url = `/api/fetch-ridb?type=recAreaEvents&recAreaId=${ids.recAreaId}`;
    const options = { headers: { 'Accept': 'application/json' } };
    const context = { type: 'Rec Area Events', recAreaId: ids.recAreaId };
    return fetchApiData(url, options, context, json => json, debugInfo);
}

/**
 * Fetches media (images, videos) for the parent Recreation Area.
 * @param {IdCollection} ids The collection of IDs for the campground.
 * @param {object} debugInfo The centralized debug object.
* @returns {Promise<object|null>} A promise that resolves to the recreation area media.
 */
export async function fetchRecAreaMedia(ids, debugInfo) {
    if (!ids.recAreaId) return null;
    const url = `/api/fetch-ridb?type=recAreaMedia&recAreaId=${ids.recAreaId}`;
    const options = { headers: { 'Accept': 'application/json' } };
    const context = { type: 'Rec Area Media', recAreaId: ids.recAreaId };
    return fetchApiData(url, options, context, json => json, debugInfo);
}

/**
 * Fetches search data from rec.gov, which contains useful summary info not in other APIs.
 * @param {IdCollection} ids The collection of IDs for the campground.
 * @param {object} debugInfo The centralized debug object.
 * @returns {Promise<object|null>} A promise that resolves to the search data.
 */
export async function fetchRecGovSearchData(ids, debugInfo) {
    if (!ids.campgroundId) return null;
    const url = `/api/fetch-ridb?type=rec-gov-search&campgroundId=${ids.campgroundId}`;
    const options = { headers: { 'Accept': 'application/json' } };
    const context = { type: 'Rec.gov Search Data', campgroundId: ids.campgroundId };
    return fetchApiData(url, options, context, json => json, debugInfo);
}

// --- Data Fetching Orchestration ---

/**
 * Fetches all necessary data from various APIs based on the provided configuration.
 * This function orchestrates multiple API calls in parallel.
 *
 * @param {object} config The configuration object for the availability check.
 * @param {object} debugInfo The centralized debug object for logging.
 * @returns {Promise<AllFetchedData>} A promise that resolves to an object containing all fetched data.
 */
export async function fetchAllData(config, debugInfo) {
    debugInfo.timestamps.fetchStart = new Date().toISOString();
    const { campgroundId } = config.api;
    const { fetchAndShowEventsOnMainPage, showRecAreaMediaOnMainPage } = config.display;

    // These fetches are not configurable in the UI, so we assume they are always wanted for the main page.
    const shouldFetchFacilityDetails = true;
    const shouldFetchRecAreaDetails = true;
    const shouldFetchRecGovSearchData = true;

    // --- Step 1: Fetch foundational metadata to get correct RIDB IDs ---
    const metadataResult = await fetchCampgroundMetadata(campgroundId, debugInfo);
    if (!metadataResult) {
        throw new Error(`Failed to fetch essential campground metadata for ID ${campgroundId}. Cannot proceed.`);
    }
    const { ids, campgroundMetadata } = metadataResult;

    // --- Step 2: Build and execute all other API requests concurrently ---
    const dataPromises = {
        availability: fetchAvailabilityData(config, debugInfo),
        facilityDetails: shouldFetchFacilityDetails ? fetchFacilityDetails(ids, debugInfo) : Promise.resolve(null),
        recAreaDetails: shouldFetchRecAreaDetails && ids.recAreaId ? fetchRecAreaDetails(ids, debugInfo) : Promise.resolve(null),
        recAreaEvents: fetchAndShowEventsOnMainPage && ids.recAreaId ? fetchRecAreaEvents(ids, debugInfo) : Promise.resolve(null),
        recAreaMedia: showRecAreaMediaOnMainPage && ids.recAreaId ? fetchRecAreaMedia(ids, debugInfo) : Promise.resolve(null),
        recGovSearchData: shouldFetchRecGovSearchData ? fetchRecGovSearchData(ids, debugInfo) : Promise.resolve(null),
    };

    const promiseResults = await Promise.allSettled(Object.values(dataPromises));
    debugInfo.timestamps.fetchComplete = new Date().toISOString();

    // --- Step 3: Process the results from all fetches ---
    const [
        availabilityResult,
        facilityDetailsResult,
        recAreaDetailsResult,
        recAreaEventsResult,
        recAreaMediaResult,
        recGovSearchDataResult
    ] = promiseResults;

    const availabilityData = availabilityResult.status === 'fulfilled' ? availabilityResult.value : null;
    let facilityDetails = facilityDetailsResult.status === 'fulfilled' ? facilityDetailsResult.value : null;
    let recAreaDetails = recAreaDetailsResult.status === 'fulfilled' ? recAreaDetailsResult.value : null;
    let eventsData = recAreaEventsResult.status === 'fulfilled' ? recAreaEventsResult.value : null;
    let recAreaMedia = recAreaMediaResult.status === 'fulfilled' ? recAreaMediaResult.value : null;
    let recGovSearchData = recGovSearchDataResult.status === 'fulfilled' ? recGovSearchDataResult.value : null;

    // --- Step 4: ID Correction & Second-chance logic ---

    // The facilityDetails response is the most reliable source for the true facilityId.
    // Correct the ID if it differs from what the initial metadata provided. This handles cases
    // where the metadata API returns an incorrect or outdated facilityId.
    if (facilityDetails && facilityDetails.FacilityID) {
        if (ids.facilityId !== facilityDetails.FacilityID) {
            console.warn(`[fetchAllData] Correcting facilityId. Metadata gave ${ids.facilityId}, but facility details gave ${facilityDetails.FacilityID}. Using the latter.`);
            ids.facilityId = facilityDetails.FacilityID;
        }
    }


    // Second-chance logic for RecArea ID if initial attempt failed
    if (fetchAndShowEventsOnMainPage && !ids.recAreaId && facilityDetails) {
        const fallbackRecAreaId = facilityDetails.ParentRecAreaID || (facilityDetails.RECAREA && facilityDetails.RECAREA[0]?.RecAreaID);
        if (fallbackRecAreaId) {
            console.log(`[fetchAllData] Metadata did not provide RecAreaID. Found fallback in facilityDetails: ${fallbackRecAreaId}.`);
            ids.recAreaId = fallbackRecAreaId;
            ids.eventInfoStatus = 'ID_FOUND_FALLBACK';
            // Re-fetch with the new ID
            const [newEvents, newMedia, newDetails] = await Promise.all([
                fetchRecAreaEvents(ids, debugInfo),
                fetchRecAreaMedia(ids, debugInfo),
                fetchRecAreaDetails(ids, debugInfo)
            ]);
            eventsData = newEvents;
            recAreaMedia = newMedia;
            recAreaDetails = newDetails;
        }
    }

    // --- Step 5: Assemble the final data object in the format the application expects ---
    return {
        campgroundMetadata,
        facilityDetails,
        recAreaDetails,
        eventsData: eventsData ? eventsData.RECDATA : null,
        recAreaMedia: recAreaMedia ? recAreaMedia.RECDATA : null,
        recGovSearchData,
        combinedCampsites: availabilityData ? availabilityData.campsites : {},
        response: availabilityData ? availabilityData.response : { headers: new Headers() },
        requestDateTime: availabilityData ? availabilityData.requestDateTime : new Date(),
        ids
    };
}
