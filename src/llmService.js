const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const GAIA_API_KEY = process.env.GAIA_API_KEY;
const GAIA_BASE_URL = process.env.GAIA_BASE_URL;
const LLM_MODEL =  process.env.GAIA_MODEL_NAME; 

let openaiClient;

if (GAIA_API_KEY && GAIA_BASE_URL) {
    openaiClient = new OpenAI({
        apiKey: GAIA_API_KEY,
        baseURL: GAIA_BASE_URL,
    });
    //console.log(`LLM Service initialized. Using model: ${LLM_MODEL} at ${GAIA_BASE_URL}`);
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
        //console.log(`Generating explanation for place: ${recommendedPlace.name}`);

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

        //console.log("--- LLM System Prompt ---\n", systemPrompt);
        //console.log("--- LLM User Prompt ---\n", userPrompt);

        const chatCompletion = await openaiClient.chat.completions.create({
            model: LLM_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 180,
            temperature: 0.7
        });

        //console.log("LLM API Response Status: Success");
        // console.log("LLM Full Response:", JSON.stringify(chatCompletion, null, 2)); // Debug

        if (chatCompletion.choices && chatCompletion.choices.length > 0 && chatCompletion.choices[0].message?.content) {
            const explanation = chatCompletion.choices[0].message.content.trim();
            
            if (explanation.toLowerCase().includes("i cannot") || explanation.toLowerCase().includes("the provided data does not")) {
                 console.warn(`LLM explanation for ${recommendedPlace.name} seems non-committal: ${explanation}`);
            }
            
            //console.log(`Generated explanation for ${recommendedPlace.name}: ${explanation}`);
            return explanation;
        } else {
            console.warn("Unexpected LLM API response structure for explanation:", chatCompletion);
            return "Sorry, I couldn't generate a detailed explanation for this place right now, although the recommendation is based on strong data.";
        }

    } catch (error) {
        console.error('Error generating explanation with local Gaia LLM:', error.message);
        if (error.response) {
            console.error('LLM API Error Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('LLM API Error Status:', error.response.status);
        } else {
            console.error('Error setting up LLM API request or processing response:', error.message);
        }
        return `An error occurred while generating the explanation for ${recommendedPlace.name}. The recommendation is based on data from Qloo.`;
    }
}

module.exports = { generateExplanation };
