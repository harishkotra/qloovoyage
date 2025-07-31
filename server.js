// server.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios'); // Ensure this is present for Qloo/Gaia
// const cors = require('cors'); // Uncomment if you need CORS

const { getRecommendations } = require('./src/qlooService');
const { generateExplanation } = require('./src/llmService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
// app.use(cors()); // Uncomment if needed
app.use(express.static(path.join(__dirname, 'public')));

// --- Existing/Other Routes ---
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running and API is accessible!' });
});

// --- Main Itinerary Generation Endpoint ---
app.post('/api/generate-itinerary', async (req, res) => {
    console.log('Received request to generate itinerary:', req.body);

    // Simplified: No dates required
    const { destination, interests } = req.body;

    if (!destination || !interests || !Array.isArray(interests) || interests.length === 0) {
        return res.status(400).json({ error: 'Invalid request data. Please provide destination and a non-empty array of interests.' });
    }

    try {
        const domainsToSearch = ["dining", "entertainment", "art", "music", "fashion", "attractions"];
        const qlooRecommendations = await getRecommendations(interests, destination, domainsToSearch);

        if (qlooRecommendations.length === 0) {
            console.log("No recommendations found from Qloo.");
            return res.json({
                message: "Itinerary generation complete.",
                userInput: { destination, interests },
                itinerary: []
            });
        }

        console.log(`Received ${qlooRecommendations.length} recommendations from Qloo.`);

        const placesWithExplanations = [];
        const userInterestsString = interests.join(', ');

        for (const place of qlooRecommendations) {
            try {
                const explanation = await generateExplanation(userInterestsString, place);
                placesWithExplanations.push({
                    ...place,
                    whyRecommended: explanation
                });
                console.log(`Generated explanation for: ${place.name}`);
            } catch (llmError) {
                console.error(`Failed to generate explanation for ${place.name}:`, llmError.message);
                placesWithExplanations.push({
                    ...place,
                    whyRecommended: "Sorry, an explanation couldn't be generated for this place."
                });
            }
        }

        // --- Simple Itinerary Logic (Group by type or just list) ---
        // For simplicity, put all places in one "Day 1"
        const itinerary = [{
            date: "N/A", // Or calculate a date if needed
            dayNumber: 1,
            places: placesWithExplanations
        }];

        res.json({
            message: "Itinerary generation complete.",
            userInput: { destination, interests },
            itinerary: itinerary
        });

    } catch (error) {
        console.error('Error in /api/generate-itinerary:', error.message);
        res.status(500).json({ error: `An error occurred while generating your itinerary: ${error.message}` });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});