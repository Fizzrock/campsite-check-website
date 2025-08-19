/**
 * Vercel Serverless Function to act as a secure proxy for Recreation.gov APIs.
 *
 * How it works:
 * 1. It receives a request from the frontend with a `type` parameter (e.g., 'availability', 'facilityDetails').
 * 2. It securely retrieves the RIDB_API_KEY from Vercel's environment variables.
 * 3. Based on the `type`, it constructs the correct URL for the target API (recreation.gov or ridb.recreation.gov).
 * 4. It attaches the API key to requests that need it.
 * 5. It forwards the request to the target API.
 * 6. It sends the response from the target API back to the frontend.
 */

const API_ROUTES = {
    campgroundMetadata: {
        urlTemplate: (p) => `https://www.recreation.gov/api/camps/campgrounds/${p.campgroundId}`,
        requiredParams: ['campgroundId'],
    },
    availability: {
        urlTemplate: (p) => `https://www.recreation.gov/api/camps/availability/campground/${p.campgroundId}/month?start_date=${encodeURIComponent(p.start_date)}`,
        requiredParams: ['campgroundId', 'start_date'],
    },
    facilityDetails: {
        urlTemplate: (p) => `https://ridb.recreation.gov/api/v1/facilities/${p.facilityId}`,
        requiredParams: ['facilityId'],
        needsApiKey: true,
    },
    recAreaDetails: {
        urlTemplate: (p) => `https://ridb.recreation.gov/api/v1/recareas/${p.recAreaId}`,
        requiredParams: ['recAreaId'],
        needsApiKey: true,
    },
    recAreaEvents: {
        urlTemplate: (p) => `https://ridb.recreation.gov/api/v1/recareas/${p.recAreaId}/events`,
        requiredParams: ['recAreaId'],
        needsApiKey: true,
    },
    recAreaMedia: {
        urlTemplate: (p) => `https://ridb.recreation.gov/api/v1/recareas/${p.recAreaId}/media`,
        requiredParams: ['recAreaId'],
        needsApiKey: true,
    },
    campsiteDetails: {
        urlTemplate: (p) => `https://ridb.recreation.gov/api/v1/facilities/${p.facilityId}/campsites/${p.campsiteId}`,
        requiredParams: ['facilityId', 'campsiteId'],
        needsApiKey: true,
    },
};

export default async function handler(request, response) {
    // 1. Get the API key from environment variables (securely stored in Vercel)
    const apiKey = process.env.RIDB_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'API key is not configured on the server.' });
    }

    // 2. Determine which API to call based on query parameters from the frontend
    const { type, ...params } = request.query;
    const routeConfig = API_ROUTES[type];

    try {
        if (!routeConfig) {
            return response.status(400).json({ error: `Invalid API type specified: '${type}'` });
        }

        for (const param of routeConfig.requiredParams) {
            if (!params[param]) {
                throw new Error(`Missing required parameter '${param}' for type '${type}'`);
            }
        }

        let upstreamUrl = routeConfig.urlTemplate(params);
        if (routeConfig.needsApiKey) {
            upstreamUrl += `?apikey=${apiKey}`;
        }

        // 3. Fetch data from the upstream API
        const upstreamResponse = await fetch(upstreamUrl, {
            headers: { 'accept': 'application/json' }
        });

        if (!upstreamResponse.ok) {
            const errorBody = await upstreamResponse.text();
            return response.status(upstreamResponse.status).json({ error: `Upstream API error for type '${type}'`, details: errorBody });
        }

        const data = await upstreamResponse.json();

        // 4. Send the successful response back to the client, with caching instructions for Vercel
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // Cache for 5 minutes
        return response.status(200).json(data);

    } catch (error) {
        console.error(`Serverless function error for type '${type}':`, error);
        return response.status(500).json({ error: error.message });
    }
}
