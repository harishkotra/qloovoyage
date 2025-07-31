// server.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios'); // Ensure this is present for Qloo/Gaia calls
const mysql = require('mysql2/promise');

const { getRecommendations } = require('./src/qlooService');
const { generateExplanation } = require('./src/llmService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
// app.use(cors()); // Uncomment if you need CORS
app.use(express.static(path.join(__dirname, 'public')));

// --- Database Connection Pool ---
let db; 
(async () => {
    try {
        // Use createPool instead of createConnection
        db = mysql.createPool({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
            // Add acquireTimeout if needed
            // acquireTimeout: 60000 // 60 seconds
        });
        console.log('MySQL connection pool created.');
        // Test the connection
        const connection = await db.getConnection();
        console.log('Successfully connected to MySQL database.');
        connection.release(); // Release the test connection back to the pool
    } catch (err) {
        console.error('Error setting up MySQL connection pool:', err.message);
        // Consider process.exit(1) if DB is critical
    }
})();

// --- Endpoint to Fetch Recent Itineraries ---
app.get('/api/recent-itineraries', async (req, res) => {
    // Optional: Limit the number of recent itineraries returned
    const limit = parseInt(req.query.limit, 10) || 10;
    const safeLimit = Math.min(Math.max(limit, 1), 50); // Ensure limit is between 1 and 50

    if (!db) {
        console.error('Database connection not available for fetching recent itineraries.');
        return res.status(500).json({ error: 'Database connection failed.' });
    }

    try {
        // Query the database for the N most recent itineraries
        // ORDER BY created_at DESC gets the newest first
        // LIMIT restricts the number of results
        const [rows] = await db.execute(
            `SELECT id, share_token, destination, user_interests, created_at,
             (SELECT COUNT(*) FROM itinerary_places WHERE itinerary_id = itineraries.id) AS place_count
             FROM itineraries
             ORDER BY created_at DESC
             LIMIT ?`,
            [safeLimit]
        );

        // Process the results to match the expected frontend format
        const recentItineraries = rows.map(row => ({
            // cacheKey is replaced by share_token in the DB approach
            cacheKey: row.share_token, 
            shareToken: row.share_token, // Include shareToken for clarity/use
            destination: row.destination,
            // Parse the JSON string back into an array
            interests: JSON.parse(row.user_interests), 
            timestamp: new Date(row.created_at).getTime(), // Convert to milliseconds timestamp
            placeCount: row.place_count
        }));

        res.json({ recentItineraries });

    } catch (error) {
        console.error('Error fetching recent itineraries from DB:', error.message);
        // Include stack trace in server logs for debugging, but not in response
        if (error.stack) {
            console.error('DB Error Stack:', error.stack);
        }
        res.status(500).json({ error: 'Failed to fetch recent itineraries.' });
    }
});
// --- Endpoint to Fetch Cached Itinerary by Cache Key ---
app.get('/api/cached-itinerary/:cacheKey', (req, res) => {
    const { cacheKey } = req.params;

    if (!cacheKey) {
        return res.status(400).json({ error: 'Missing cacheKey parameter.' });
    }

    try {
        const cachedData = getCachedData(cacheKey);
        if (!cachedData) {
             return res.status(404).json({ error: 'Cached itinerary not found or expired.' });
        }
        res.json({ cachedItinerary: cachedData });
    } catch (error) {
        console.error(`Error fetching cached itinerary for key ${cacheKey}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch cached itinerary details.' });
    }
});

// --- Existing/Other Routes ---
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running and API is accessible!' });
});

app.post('/api/generate-itinerary', async (req, res) => {
    //console.log('Received request to generate itinerary:', req.body);
    const { destination, interests, fetchExplanations = true, saveCompletedItinerary = false, completedItineraryData = null } = req.body;
    // saveCompletedItinerary: Boolean flag
    // completedItineraryData: The full data structure { recommendations: [...], explanations: { placeId: "expl", ... } } sent by frontend

    if (!destination || !interests || !Array.isArray(interests) || interests.length === 0) {
        return res.status(400).json({ error: 'Invalid request data. Please provide destination and a non-empty array of interests.' });
    }

    // --- Mode 1: Save a completed itinerary sent by the frontend ---
    if (saveCompletedItinerary && completedItineraryData) {
        console.log("Request to save completed itinerary received.");
        if (!completedItineraryData.recommendations || !Array.isArray(completedItineraryData.recommendations)) {
             return res.status(400).json({ error: 'Invalid completedItineraryData format. Missing recommendations array.' });
        }
        // Assume completedItineraryData.recommendations already has .whyRecommended populated
        // or we merge explanations from completedItineraryData.explanations if sent separately
        // For simplicity, assume recommendations array items already have whyRecommended

        let shareToken;
        try {
            console.log("Attempting to save completed itinerary to DB...");
            // Pass the recommendations array which should now contain whyRecommended
            shareToken = await saveItineraryToDB(destination, interests, completedItineraryData.recommendations);
            console.log("Completed itinerary saved successfully, Share Token:", shareToken);
            return res.json({
                 message: "Completed itinerary saved for sharing.",
                 shareToken: shareToken
            });
        } catch (dbError) {
            console.error("!!! CRITICAL ERROR: Failed to save completed itinerary to database:", dbError.message);
            if (dbError.stack) {
                console.error("DB Error Stack:", dbError.stack);
            }
            return res.status(500).json({
                error: "Itinerary generated, but failed to save for sharing.",
                dbErrorMessage: dbError.message // Consider removing for production
            });
        }
    }

    // --- Mode 2: Original flow - Fetch recommendations from Qloo ---
    try {
        // --- Call Qloo API to get recommendations ---
        // Note: Limit take to 1 as requested
        const domainsToSearch = ["dining", "entertainment", "art", "music", "fashion", "attractions", "retail", "nightlife"];
        const qlooRecommendations = await getRecommendations(interests, destination, domainsToSearch);

        // --- CRITICAL CHECK: If no recommendations, return early ---
        if (qlooRecommendations.length === 0) {
            console.log("No recommendations found from Qloo. Skipping database save (incomplete itinerary).");
            return res.json({
                message: "Itinerary generation complete, but no places found.",
                status: "no_results",
                userInput: { destination, interests },
                recommendations: [],
                shareToken: null
            });
        }

        console.log(`Found ${qlooRecommendations.length} recommendations from Qloo.`);

        // --- Respond to client with recommendations to start fetching explanations ---
        // Do NOT save here anymore.
        res.json({
            message: "Qloo recommendations fetched. Start fetching explanations.",
            status: "explanations_pending",
            userInput: { destination, interests },
            recommendations: qlooRecommendations,
            shareToken: null // Will be generated later
        });

    } catch (error) {
        console.error('Error in /api/generate-itinerary (fetching Qloo recs):', error.message);
        res.status(500).json({ error: `An error occurred while generating your itinerary: ${error.message}` });
    }
});

app.post('/api/explain-place', async (req, res) => {
     //console.log('Received request to explain a place:', req.body);

     const { place, userInterests, shareToken } = req.body;

     // Validate request data
     if (!place || !userInterests || !Array.isArray(userInterests) || userInterests.length === 0) {
         return res.status(400).json({ 
             error: 'Invalid request data for explanation. Please provide place object and user interests array.' ,
             placeId: place?.id // Include placeId in error response if available
         });
     }

     try {
         // --- Generate explanation using LLM ---
         // No caching: Always call the LLM function
         const userInterestsString = userInterests.join(', ');
         //console.log(`Generating explanation for place: ${place.name}`);
         const explanation = await generateExplanation(userInterestsString, place);
         //console.log(`Generated explanation for place: ${place.name}`);


         // --- Update database with the new explanation (if shareToken was provided) ---
         if (shareToken) {
             try {
                 const updateSuccess = await updatePlaceExplanationsInDB(shareToken, place.id, explanation);
                 if (!updateSuccess) {
                     console.warn(`Explanation generated but not saved to DB for place ${place.id} under token ${shareToken}. Itinerary might not exist or place not found.`);
                 } else {
                     console.log(`Explanation saved to DB for place ${place.id} under token ${shareToken}.`);
                 }
                 // Note: Failure to update DB doesn't fail the explanation generation itself.
             } catch (dbUpdateError) {
                 console.error(`Error during DB update attempt for place ${place.name} (token: ${shareToken}):`, dbUpdateError.message);
                 // Don't fail the response to the client if DB update fails, the explanation was still generated
             }
         } else {
             //console.log(`Explanation generated for place ${place.name}, but no shareToken provided for DB update.`);
         }

         // --- Send the generated explanation back to the client ---
         res.json({
             placeId: place.id,
             explanation: explanation
         });

     } catch (error) {
         console.error('Error in /api/explain-place:', error.message);
         // Provide a more user-friendly error message if possible
         const userMessage = error.message.includes('timeout') ? 
                             `LLM timed out while generating explanation for ${place?.name || 'this place'}.` :
                             `Failed to generate explanation for ${place?.name || 'this place'}.`;
         res.status(500).json({
             placeId: place?.id,
             error: userMessage
         });
     }
});

// Function to save a complete itinerary and its places
async function saveItineraryToDB(destination, userInterests, recommendationsWithExplanations) {
    console.log(`saveItineraryToDB called with destination: ${destination}, interests count: ${userInterests.length}, recommendations count: ${recommendationsWithExplanations.length}`);

    if (!db) {
        console.error("Database connection pool not available for saving itinerary.");
        throw new Error("Database connection failed.");
    }

    const shareToken = generateShareToken();
    console.log("Generated Share Token:", shareToken);

    // Get a connection from the pool for the transaction
    let connection;
    try {
        connection = await db.getConnection(); // <-- Correct way to get connection from pool
        await connection.beginTransaction();
        console.log("Database transaction started.");

        const [itineraryResult] = await connection.execute(
            'INSERT INTO itineraries (share_token, destination, user_interests) VALUES (?, ?, ?)',
            [shareToken, destination, JSON.stringify(userInterests)]
        );
        const itineraryId = itineraryResult.insertId;
        console.log("Inserted itinerary record with ID:", itineraryId);

        // Iterate through the recommendations that now include explanations
        for (const place of recommendationsWithExplanations) {
            // Save the place data and its corresponding explanation
            await connection.execute(
                'INSERT INTO itinerary_places (itinerary_id, place_id, place_data, explanation) VALUES (?, ?, ?, ?)',
                [itineraryId, place.id, JSON.stringify(place), place.whyRecommended || null]
            );
        }
        console.log(`Inserted ${recommendationsWithExplanations.length} place records with explanations.`);

        await connection.commit();
        console.log(`Itinerary with explanations saved to DB with ID: ${itineraryId}, Share Token: ${shareToken}`);
        return shareToken;

    } catch (error) {
        if (connection) {
            await connection.rollback();
            console.error('!!! Error saving itinerary to DB (rolled back):', error.message);
        } else {
            console.error('!!! Error preparing DB connection for saving itinerary:', error.message);
        }
        throw error;
    } finally {
        // Release the connection back to the pool
        if (connection) {
            connection.release();
            console.log("Database connection released back to pool.");
        }
    }
}

// Function to load an itinerary by its share token
async function loadItineraryFromDB(shareToken) {
     if (!db) {
        console.error("Database connection not available for loading itinerary.");
        throw new Error("Database connection failed.");
    }

    try {
        // 1. Get the main itinerary details
        const [itineraryRows] = await db.execute(
            'SELECT id, destination, user_interests, created_at FROM itineraries WHERE share_token = ?',
            [shareToken]
        );

        if (itineraryRows.length === 0) {
            return null; // Not found
        }

        const itinerary = itineraryRows[0];
        // Parse JSON interests
        itinerary.user_interests = JSON.parse(itinerary.user_interests);

        // 2. Get the places for this itinerary
        const [placeRows] = await db.execute(
            'SELECT place_id, place_data, explanation FROM itinerary_places WHERE itinerary_id = ? ORDER BY id',
            [itinerary.id]
        );

        const placesWithExplanations = placeRows.map(row => {
            const placeData = JSON.parse(row.place_data);
            return {
                ...placeData, // Spread the original Qloo data
                whyRecommended: row.explanation || "Explanation not available." // Add the explanation
            };
        });

        return {
            itinerary: {
                ...itinerary,
                recommendations: placesWithExplanations // Attach places
            }
        };

    } catch (error) {
        console.error(`Error loading itinerary from DB for token ${shareToken}:`, error.message);
        throw error;
    }
}

// Function to update explanations for places in an existing itinerary
// This is useful after loading from DB and generating new explanations
async function updatePlaceExplanationsInDB(shareToken, placeId, explanation) {
    if (!db) {
        console.error("Database connection not available for updating explanation.");
        throw new Error("Database connection failed.");
    }

    try {
        // Get itinerary ID first
        const [itineraryRows] = await db.execute(
            'SELECT id FROM itineraries WHERE share_token = ?',
            [shareToken]
        );

        if (itineraryRows.length === 0) {
             console.warn(`Itinerary with share_token ${shareToken} not found for explanation update.`);
             return false;
        }

        const itineraryId = itineraryRows[0].id;

        // Update the explanation for the specific place
        const [result] = await db.execute(
            'UPDATE itinerary_places SET explanation = ? WHERE itinerary_id = ? AND place_id = ?',
            [explanation, itineraryId, placeId]
        );

        if (result.affectedRows === 0) {
             console.warn(`Place ${placeId} not found in itinerary ${shareToken} for explanation update.`);
             return false;
        }

        //console.log(`Explanation updated for place ${placeId} in itinerary ${shareToken}`);
        return true;

    } catch (error) {
        console.error(`Error updating explanation for place ${placeId} in itinerary ${shareToken}:`, error.message);
        throw error;
    }
}


// Simple function to generate a UUID v4 (you could use a library like 'uuid' instead)
function generateShareToken() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

app.get('/api/shared-itinerary/:shareToken', async (req, res) => {
    const { shareToken } = req.params;

    if (!shareToken) {
        return res.status(400).json({ error: 'Missing shareToken parameter.' });
    }

    try {
        const loadedData = await loadItineraryFromDB(shareToken);

        if (!loadedData || !loadedData.itinerary) {
            return res.status(404).json({ error: 'Shared itinerary not found or expired.' });
        }

        // The loadedData.itinerary now contains destination, user_interests, and recommendations (with explanations)
        res.json({
            message: "Shared itinerary loaded successfully.",
            sharedItinerary: loadedData.itinerary
        });

    } catch (error) {
        console.error(`Error loading shared itinerary for token ${shareToken}:`, error.message);
        res.status(500).json({ error: 'Failed to load shared itinerary.' });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
