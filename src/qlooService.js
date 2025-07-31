// src/qlooService.js
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const QLOO_API_BASE_URL = 'https://hackathon.api.qloo.com';
const QLOO_API_KEY = process.env.QLOO_API_KEY;

if (!QLOO_API_KEY) {
    throw new Error('QLOO_API_KEY is not defined in the environment variables.');
}

const qlooClient = axios.create({
    baseURL: QLOO_API_BASE_URL,
    headers: { 'X-API-Key': QLOO_API_KEY, 'Content-Type': 'application/json' },
    timeout: 15000,
});

/**
 * Searches for Qloo entity IDs based on a name/query string.
 * @param {string} query - The search term.
 * @returns {Promise<Array>} - Array of matching entities with id and name.
 */
async function searchEntities(query) {
    try {
        console.log(`Searching for entities with query: ${query}`);
        const response = await qlooClient.get('/search', { params: { query: query } });
        console.log(`Search Entities Response Status: ${response.status}`);

        if (response.data?.results && Array.isArray(response.data.results)) {
            // Prioritize entities that seem more concrete (e.g., artists) over generic ones
            // This is a heuristic. A better way would be to check the 'type' or 'subtype' if available and known to be good for cross-domain.
            return response.data.results.map(item => ({
                id: item.id || item.entity_id,
                name: item.name,
                type: item.type || item.subtype || 'Unknown'
            }));
        }
        console.warn(`No results or unexpected structure in /search response for query: ${query}`);
        return [];
    } catch (error) {
        console.error(`Error searching for entities with query '${query}':`, error.message);
        if (error.response) {
            console.error(`  Status: ${error.response.status}`);
            console.error(`  Data:`, JSON.stringify(error.response.data, null, 2));
        }
        return [];
    }
}

/**
 * Searches for Qloo tag IDs based on a name/query string.
 * @param {string} query - The tag search term.
 * @returns {Promise<Array>} - Array of matching tags with id and name.
 */
async function searchTags(query) {
    try {
        console.log(`Searching for tags with query: ${query}`);
        const response = await qlooClient.get('/v2/tags', { params: { 'filter.query': query } });
        console.log(`Search Tags Response Status: ${response.status}`);

        if (response.data?.results && Array.isArray(response.data.results)) {
            return response.data.results.map(item => ({
                id: item.id,
                name: item.name
            }));
        }
        console.warn(`No results or unexpected structure in /v2/tags response for query: ${query}`);
        return [];
    } catch (error) {
        console.error(`Error searching for tags with query '${query}':`, error.message);
        if (error.response) {
            console.error(`  Status: ${error.response.status}`);
            console.error(`  Data:`, JSON.stringify(error.response.data, null, 2));
        }
        return [];
    }
}

/**
 * Fetches cultural place entities based on user interests.
 * @param {Array<string>} interests - List of user interests (strings).
 * @param {string} locationName - Destination name (e.g., "Tokyo").
 * @returns {Promise<Array>} - Array of recommended place entities.
 */
async function getRecommendations(interests, locationName) {
    try {
        console.log(`Fetching recommendations for interests: [${interests.join(', ')}], location: ${locationName}`);

        // --- Step 1: Resolve User Interests ---
        const signalEntities = [];
        const signalTags = [];

        for (const interest of interests) {
            console.log(`Attempting to resolve interest: ${interest}`);
            // --- Resolution Strategy ---
            // 1. Try Tags First (Better for genres/concepts like "Ambient music")
            let tags = await searchTags(interest);
            if (tags.length > 0) {
                signalTags.push(tags[0].id); // Take first match
                console.log(`Resolved '${interest}' to tag ID: ${tags[0].id}`);
            } else {
                // 2. Fallback to Entities if Tag not found
                let entities = await searchEntities(interest);
                if (entities.length > 0) {
                    signalEntities.push(entities[0].id); // Take first match
                    console.log(`Resolved '${interest}' to entity ID: ${entities[0].id} (${entities[0].type})`);
                } else {
                    console.warn(`Could not resolve interest '${interest}' to a known entity or tag. Skipping.`);
                }
            }
        }

        // Check if we have any resolved signals
        if (signalEntities.length === 0 && signalTags.length === 0) {
            console.warn("No valid signals (entities or tags) found for user interests.");
            return [];
        }

        // --- Step 2: Construct the Insights API Request for Places ---
        const params = {
            'filter.type': 'urn:entity:place',
            // Include resolved signals
            ...signalEntities.length > 0 && { 'signal.interests.entities': signalEntities.join(',') },
            ...signalTags.length > 0 && { 'signal.interests.tags': signalTags.join(',') },
            'filter.location.query': locationName,
            'take': 15
        };

        console.log("Qloo Insights API Request Params:", params);

        // --- Step 3: Make the API Call ---
        const response = await qlooClient.get('/v2/insights', { params });
        console.log("Qloo Insights API Response Status:", response.status);

        // --- Step 4: Process the Response & Handle Warnings ---
        // Check for warnings first
        if (response.data?.warnings && Array.isArray(response.data.warnings)) {
            for (const warning of response.data.warnings) {
                if (warning.type === 'not_found') {
                    console.warn("Qloo API returned 'not_found' warnings for signals:", warning);
                    // You could potentially remove the problematic signal and retry,
                    // but for simplicity, we'll log and proceed. If all signals are bad, results might be empty.
                } else {
                     console.warn("Qloo API returned other warning:", warning);
                }
            }
        }

        // Check for results structure
        // The provided log shows `response.data.results.entities` array.
        // Let's adapt to that structure.
        let rawResults = [];
        if (response.data?.results?.entities && Array.isArray(response.data.results.entities)) {
            rawResults = response.data.results.entities;
            console.log(`Successfully retrieved ${rawResults.length} raw results from Qloo.`);
        } else if (response.data?.results && Array.isArray(response.data.results)) {
             // Fallback to previous assumption
             rawResults = response.data.results;
             console.log(`Successfully retrieved ${rawResults.length} raw results (fallback structure) from Qloo.`);
        } else {
            console.warn("Unexpected Qloo Insights API response structure for results:", response.data);
            // Log the full response for debugging unexpected structure
            // console.log("Full Qloo Response Data:", JSON.stringify(response.data, null, 2));
            return [];
        }

        if (rawResults.length === 0) {
             console.log("Qloo returned an empty results list.");
             return [];
        }

        // --- Step 5: Parse Individual Results ---
        const parsedResults = rawResults.map(item => {
            const id = item.entity_id || item.id; // Check entity_id first
            const name = item.name || 'Unknown Place';
            // Simplify type
            let type = 'Place';
            if (item.subtype === 'urn:entity:place') {
                // Extract a more user-friendly category if possible
                const categoryTag = item.tags?.find(tag => tag.type === 'urn:tag:category:place');
                if (categoryTag) {
                    type = categoryTag.name;
                } else {
                    const genreTag = item.tags?.find(tag => tag.type === 'urn:tag:genre:place');
                    if (genreTag) {
                         type = genreTag.name;
                    }
                }
            }

            // Description is nested
            const description = item.properties?.description || item.summary || '';
            // Use popularity as score
            const affinityScore = item.popularity || item.score || item.affinity || 0;
            const qlooMetadata = item; // Pass full item

            return { id, name, type, description, affinityScore, qlooMetadata };
        });

        console.log(`Parsed ${parsedResults.length} recommendations.`);
        return parsedResults;

    } catch (error) {
        console.error('Error fetching recommendations from Qloo:', error.message);
        if (error.response) {
            console.error('Qloo API Error Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Qloo API Error Status:', error.response.status);
        } else if (error.request) {
            console.error('Qloo API Error Request:', error.request);
        } else {
            console.error('Error setting up Qloo API request:', error.message);
        }
        // Return empty array on error to allow graceful handling
        return [];
    }
}

module.exports = { getRecommendations };