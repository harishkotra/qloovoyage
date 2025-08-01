# QlooVoyage: Your Privacy-First Culturally Curated Journey

**QlooVoyage**, is an innovative travel planning application that redefines personalized discovery. Unlike traditional recommendation engines, QlooVoyage doesn't just guess what you might like; it leverages the power of Qloo's Taste AI™ and Large Language Models (LLMs) to curate itineraries grounded in real-world cultural behaviors and explained through intelligent narratives. Every recommendation comes with a "why," making your journey not just personalized, but truly meaningful. 

Built with a privacy-first approach, QlooVoyage ensures your data stays private while delivering exceptional experiences. It's designed to be your go-to companion for uncovering places that resonate with your unique cultural tastes, whether you're a local exploring your city or a traveler seeking authentic experiences.

<img width="428" height="926" alt="image" src="https://github.com/user-attachments/assets/6fdb3a51-aae5-4b71-a283-27a0cbaf7fc3" />
<img width="428" height="1417" alt="image" src="https://github.com/user-attachments/assets/a6038735-5f02-4790-853d-bdd593d1baf7" />
<img width="425" height="851" alt="image" src="https://github.com/user-attachments/assets/384481b5-aac5-4350-ab40-335bf0ae4160" />
<img width="428" height="993" alt="image" src="https://github.com/user-attachments/assets/33059ad0-4bf6-413d-95e4-fdad6601633a" />

https://github.com/user-attachments/assets/70445d5c-79c5-460a-8d35-9dd9225842a8

## Key Features 

- **Deep Cultural Recommendations**: Move beyond generic lists. Get places recommended because fans of your favorite music, films, or styles actually visit them.
- **AI-Powered Explanations**: Understand the 'why' behind each suggestion. Our integration with Qloo's LLM APIs provides clear, engaging reasons based on real data.
- **Privacy-First Design**: Operates without collecting or using personally identifiable information (PII). Your exploration stays yours.
- **Dynamic & Adaptive**: Recommendations adapt based on your interests, offering a tailored experience every time.
- **Share & Save**: Easily share your unique itineraries with friends or download them as a PDF for offline use.
- **Mobile-Optimized**: Crafted for an intuitive and delightful experience on any device, with a focus on mobile usability.

## How It Works 

- **Select Your Vibe:** Choose a destination city and pick your cultural interests (e.g., Ambient Music, Scandinavian Design, Sushi, Street Art).
- **Discover & Understand:** QlooVoyage fetches places aligned with your tastes using Qloo's data and generates personalized explanations for each, telling you why it's a great match.
- **Explore & Share:** Review your curated itinerary, share the unique link with others, or download it for later.

## Qloo API Integration

**Qloo Insights API (`/v2/insights`):** 

 - **Role:** This is the core engine for finding recommendations. It takes your selected interests (resolved to Qloo entities/tags) and a location, then returns a list of places (`urn:entity:place`) that have strong cultural affinities to those inputs.
 - **Uniqueness:** Unlike simple keyword matching, this API uses Qloo's vast database of over 3.7 billion entities and 10 trillion anonymized consumer signals. It identifies behavioral connections (e.g., people who like this type of music also frequently visit these kinds of venues), ensuring recommendations are based on actual consumer behavior, not just metadata. The use of `filter.location.query` and `signal.interests.entities/tags` allows for precise, taste-driven filtering.

**Qloo Search API (`/search`) & Tags API (`/v2/tags`):** 

 - **Role:** These supporting APIs are crucial for translating user-friendly inputs (like "Ambient Music" or "Tokyo") into the specific entity IDs or tag IDs that the Insights API requires.
 - **Uniqueness:** They act as the bridge between human language and Qloo's structured knowledge graph, ensuring accurate interpretation of user intent.

**Qloo's Hybrid Embeddings & Cross-Domain Affinity Analysis:** 

 - **Role:** While not directly called as a separate endpoint, these are the underlying technologies that make the Insights API so powerful. They combine user behavior signals with content analysis to create
   deep, nuanced taste profiles.
 - **Uniqueness:** This allows QlooVoyage to make sophisticated, non-obvious connections (e.g., linking a preference for a film genre
   to specific dining experiences or architectural styles) that simple
   demographic or keyword matching cannot achieve.

### Qloo LLM API Integration: Making Data Meaningful 

The raw power of Qloo's data is brought to life through Retrieval-Augmented Generation (RAG) with Large Language Models. 

 - **Role:** After fetching place recommendations from the Qloo Insights API, QlooVoyage sends the specific place data (name, type, Qloo affinity scores, metadata) and the user's original interests to a locally running Gaia node which has an LLM as part of the node. The LLM, guided by a prompt that emphasizes grounding in the provided Qloo data, generates a natural language explanation for why each place is recommended.
 - **Uniqueness & Positioning:**
	- *Grounded in Truth:* By using Qloo's behavioral data as the factual grounding (the "R" in RAG), the LLM explanations are highly relevant and avoid "hallucinations" or generic reasons. The LLM doesn't make things up; it interprets real cultural intelligence.
    - *Narrative-Driven Personalization:* This transforms a list of places into a curated story tailored to the user's interests, significantly enhancing the user experience and trust in the recommendations. 
    - *Privacy-First LLM Use:* The LLM processes data locally (e.g., via Gaia Nodes), ensuring that the personalized narrative generation doesn't rely on sending user data or specific queries to external LLM services, further protecting user privacy.

## Privacy-First Architecture 

**Anonymized Data:** All recommendations and affinities are derived from Qloo's massive pool of anonymized consumer behavior data. No personal information about the QlooVoyage user is ever sent to or processed by Qloo's core recommendation APIs.

**Local LLM Processing:** The generation of personalized explanations happens using a local LLM instance through Gaia (gaianet.ai), minimizing data exposure and keeping the user's specific query and results contained within the application environment.
