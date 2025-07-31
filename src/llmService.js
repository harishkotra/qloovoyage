// src/llmService.js
const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// --- Configuration for Local Gaia Node (OpenAI Compatible) ---
const GAIA_API_KEY = process.env.GAIA_API_KEY;
const GAIA_BASE_URL = process.env.GAIA_BASE_URL;
// Example model name, adjust based on your Gaia setup (e.g., 'gemma', 'llama3')
// You might need to check your Gaia node's /v1/models endpoint to see available models.
const LLM_MODEL = 'llama3'; 

let openaiClient;

if (GAIA_API_KEY && GAIA_BASE_URL) {
    openaiClient = new OpenAI({
        apiKey: GAIA_API_KEY, // Required by the library, even if not enforced
        baseURL: GAIA_BASE_URL, // Point to your local Gaia node
    });
    console.log(`LLM Service initialized. Using model: ${LLM_MODEL} at ${GAIA_BASE_URL}`);
} else {
    console.warn('GAIA_API_KEY or GAIA_BASE_URL not defined in .env. LLM explanations will be disabled.');
    openaiClient = null;
}

/**
 * Generates an explanation for why a place is recommended based on user interests and Qloo data.
 * This function now calls the LOCAL Gaia LLM via the OpenAI SDK.
 * @param {string} userInterestsString - The original user interests string.
 * @param {Object} recommendedPlace - The place object returned by Qloo service.
 * @returns {Promise<string>} - The generated explanation, or a fallback message.
 */
async function generateExplanation(userInterestsString, recommendedPlace) {
    if (!openaiClient) {
        console.warn(`LLM client not configured. Returning fallback explanation for ${recommendedPlace.name}.`);
        return `This place, ${recommendedPlace.name}, is recommended based on your interests: [${userInterestsString}]. (Detailed explanation requires LLM integration).`;
    }

    try {
        console.log(`Generating explanation for place: ${recommendedPlace.name}`);

        // --- Prepare the prompt using RAG principles ---
        const systemPrompt = "You are a helpful and culturally aware assistant. Your task is to explain why a specific place is recommended to a user based on their cultural interests. You will be given factual data from Qloo, a cultural intelligence platform. Your explanation must be based SOLELY on this Qloo data. Do not make up reasons. Be concise, engaging, and sound human. Avoid phrases like 'The data suggests...' or 'Based on the information provided...'. Just give the explanation directly.";

        const userPrompt = `
A user interested in [${userInterestsString}] is recommended the place: "${recommendedPlace.name}" (Type: ${recommendedPlace.type}).

Qloo, a cultural intelligence platform, provides the following data to explain this recommendation:
- Place Name: ${recommendedPlace.name}
- Place Type: ${recommendedPlace.type}
- Place Description: ${recommendedPlace.description || 'N/A'}
- Qloo Affinity/Popularity Score (higher is stronger): ${recommendedPlace.affinityScore.toFixed(4)}
- Additional Qloo Metadata (for context): ${JSON.stringify(recommendedPlace.qlooMetadata || {}, null, 2)}

Based strictly on this Qloo data, explain in a natural, engaging sentence or two why someone with interests in [${userInterestsString}] would likely enjoy "${recommendedPlace.name}". Focus on the connection implied by the Qloo data (e.g., shared aesthetics, audience overlap, thematic links, category). Do not invent reasons not supported by the data provided. Make it sound like a helpful, personalized tip.
`;

        console.log("--- LLM System Prompt ---\n", systemPrompt);
        console.log("--- LLM User Prompt ---\n", userPrompt);

        // --- Make the API call using the OpenAI SDK ---
        const chatCompletion = await openaiClient.chat.completions.create({
            model: LLM_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 180, // Slightly increased for a bit more detail
            temperature: 0.7 // Adjust for creativity vs. consistency
        });

        console.log("LLM API Response Status: Success");
        // console.log("LLM Full Response:", JSON.stringify(chatCompletion, null, 2)); // Debug

        // --- Extract the generated text ---
        if (chatCompletion.choices && chatCompletion.choices.length > 0 && chatCompletion.choices[0].message?.content) {
            const explanation = chatCompletion.choices[0].message.content.trim();
            
            // Basic check for common LLM fallbacks (optional, depends on model)
            if (explanation.toLowerCase().includes("i cannot") || explanation.toLowerCase().includes("the provided data does not")) {
                 console.warn(`LLM explanation for ${recommendedPlace.name} seems non-committal: ${explanation}`);
                 // Optionally return a different fallback or the raw data summary
            }
            
            console.log(`Generated explanation for ${recommendedPlace.name}: ${explanation}`);
            return explanation;
        } else {
            console.warn("Unexpected LLM API response structure for explanation:", chatCompletion);
            return "Sorry, I couldn't generate a detailed explanation for this place right now, although the recommendation is based on strong data.";
        }

    } catch (error) {
        console.error('Error generating explanation with local Gaia LLM:', error.message);
        // Log more details if available
        if (error.response) {
            console.error('LLM API Error Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('LLM API Error Status:', error.response.status);
        } else {
            console.error('Error setting up LLM API request or processing response:', error.message);
        }
        // Return a fallback message instead of crashing the whole process
        return `An error occurred while generating the explanation for ${recommendedPlace.name}. The recommendation is based on data from Qloo.`;
    }
}

module.exports = { generateExplanation };
