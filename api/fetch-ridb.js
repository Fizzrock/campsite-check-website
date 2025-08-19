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

export default async function handler(request, response) {
    // 1. Get the API key from environment variables (securely stored in Vercel)
    const apiKey = process.env.RIDB_API_KEY;

    // --- DEBUGGING STEP ---
    console.log("[Serverless Function] RIDB_API_KEY found on server:", apiKey ? `...${apiKey.slice(-4)}` : 'NOT FOUND');

    if (!apiKey) {
        return response.status(500).json({ error: 'API key is not configured on the server.' });
    }

    // 2. Determine which API to call based on query parameters from the frontend
    const { type, ...params } = request.query;
    let upstreamUrl;

    try {
        switch (type) {
            case 'campgroundMetadata':
                if (!params.campgroundId) throw new Error('Missing campgroundId');
                upstreamUrl = `https://www.recreation.gov/api/camps/campgrounds/${params.campgroundId}`;
                break;

            case 'availability':
                if (!params.campgroundId || !params.start_date) throw new Error('Missing campgroundId or start_date');
                upstreamUrl = `https://www.recreation.gov/api/camps/availability/campground/${params.campgroundId}/month?start_date=${encodeURIComponent(params.start_date)}`;
                break;

            case 'facilityDetails':
                if (!params.facilityId) throw new Error('Missing facilityId');
                upstreamUrl = `https://ridb.recreation.gov/api/v1/facilities/${params.facilityId}?apikey=${apiKey}`;
                break;

            case 'recAreaDetails':
                if (!params.recAreaId) throw new Error('Missing recAreaId');
                upstreamUrl = `https://ridb.recreation.gov/api/v1/recareas/${params.recAreaId}?apikey=${apiKey}`;
                break;

            case 'recAreaEvents':
                if (!params.recAreaId) throw new Error('Missing recAreaId');
                upstreamUrl = `https://ridb.recreation.gov/api/v1/recareas/${params.recAreaId}/events?apikey=${apiKey}`;
                break;

            case 'recAreaMedia':
                if (!params.recAreaId) throw new Error('Missing recAreaId');
                upstreamUrl = `https://ridb.recreation.gov/api/v1/recareas/${params.recAreaId}/media?apikey=${apiKey}`;
                break;

            case 'campsiteDetails':
                if (!params.facilityId || !params.campsiteId) throw new Error('Missing facilityId or campsiteId');
                upstreamUrl = `https://ridb.recreation.gov/api/v1/facilities/${params.facilityId}/campsites/${params.campsiteId}?apikey=${apiKey}`;
                break;

            default:
                return response.status(400).json({ error: 'Invalid API type specified.' });
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
