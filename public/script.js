// public/script.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const screens = {
        welcome: document.getElementById('welcomeScreen'),
        city: document.getElementById('citySelectionScreen'),
        interest: document.getElementById('interestSelectionScreen'),
        itinerary: document.getElementById('itineraryScreen')
    };
    
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const historyLink = document.getElementById('historyLink');
    const historyScreen = document.getElementById('historyScreen');
    const historyList = document.getElementById('historyList');
    const backFromHistoryBtn = document.getElementById('backFromHistory');
    const mainContent = document.getElementById('mainContent');

    const startButton = document.getElementById('startButton');
    const backToWelcomeBtn = document.getElementById('backToWelcome');
    const nextToInterestsBtn = document.getElementById('nextToInterests');
    const backToCityBtn = document.getElementById('backToCity');
    const generateItineraryBtn = document.getElementById('generateItineraryButton');
    const restartButton = document.getElementById('restartButton');
    const copyItineraryBtn = document.getElementById('copyItineraryBtn');

    // Removed citySearchInput and cityImageGrid
    const cityButtonContainer = document.getElementById('cityButtonContainer');
    const interestButtonContainer = document.getElementById('interestButtonContainer'); // Add this line

    const citySelectionStatus = document.getElementById('citySelectionStatus');
    const interestSelectionStatus = document.getElementById('interestSelectionStatus');
    const itineraryStatus = document.getElementById('itineraryStatus');
    const itineraryOutput = document.getElementById('itineraryOutput');
    const itineraryContent = document.getElementById('itineraryContent');
    const itineraryTitle = document.getElementById('itineraryTitle');

    const shareItineraryBtn = document.getElementById('shareItineraryBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const itinerarySubtitle = document.getElementById('itinerarySubtitle');

    // --- State Management ---
    let selectedCity = null;
    let selectedInterests = [];
    let currentCacheKey = null;
    let currentShareToken = null;
    
    // --- Predefined Cities & Interests ---
    const POPULAR_CITIES = ['Tokyo', 'Paris', 'New York', 'London', 'Kyoto', 'Berlin', 'Barcelona', 'Osaka', 'Seoul', 'Mexico City'];
    
    const INTEREST_IMAGE_MAP = {
        'Ambient Music': 'ambient music',
        'Jazz': 'jazz',
        'Electronic Music': 'electronic music',
        'Scandinavian Design': 'scandinavian design',
        'Japanese Architecture': 'japanese architecture',
        'Film Noir': 'film noir',
        'Indie Films': 'indie films',
        'Sushi': 'sushi',
        'Craft Beer': 'craft beer',
        'Street Art': 'street art',
        'Minimalism': 'minimalism',
        'Vintage Fashion': 'vintage fashion',
        'Bookstores': 'bookstores',
        'Botanical Gardens': 'botanical gardens',
        'Skateboarding': 'skateboarding',
        'Hiking': 'hiking',

        // Additional interests
        'Opera': 'opera',
        'Theater': 'theater',
        'Classical Music': 'classical music',
        'High Fashion': 'high fashion',
        'Sustainable Fashion': 'sustainable fashion',
        'Tech Cafes': 'tech cafes',
        'Maker Spaces': 'maker spaces',
        'Literary Festivals': 'literary festivals',
        'Live Music Venues': 'live music venues',
        'Comedy Clubs': 'comedy clubs',
        'Yoga': 'yoga',
        'Climbing': 'climbing',
        'Surfing': 'surfing',
        'Historical Sites': 'historical sites',
        'Museums': 'museums'
    };

    // --- Navigation Functions ---
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }

        // Always show the sidebar toggle button on all screens
        openSidebarBtn.style.display = 'block'; // Make sure the sidebar toggle is always visible
    }

    function showStatus(element, message, type = "info", showSpinner = false) {
        element.innerHTML = `
            <div class="alert alert-${type} d-flex align-items-center" role="alert">
                ${showSpinner ? '<span class="loading-spinner me-2"></span>' : ''}
                <div>${message}</div>
            </div>
        `;
        element.style.display = 'block';
    }

    function hideStatus(element) {
        element.style.display = 'none';
    }

    // Function to display the initial list of places without explanations
    function displayPlacesWithoutExplanations(places) {
        // Clear previous content and show the itinerary output container
        itineraryContent.innerHTML = '';
        itineraryOutput.style.display = 'block';

        let html = `<div class="itinerary-day mb-4">`;
        html += `<h3 class="mb-3">Discovering your QlooVoyage...</h3>`; // Temporary header
        html += `<div class="row g-3" id="places-container">`; // Container for individual place cards

        places.forEach(place => {
            // Create a placeholder card for each place
            const placeholderCard = createPlaceCardSkeleton(place);
            html += placeholderCard;
        });

        html += `</div>`; // Close row
        html += `</div>`; // Close day div

        itineraryContent.innerHTML = html;
        // Hide any previous status messages related to itinerary generation start
        hideStatus(itineraryStatus);
    }

    // Function to create a skeleton/placeholder card for a place
    function createPlaceCardSkeleton(place) {
        // Determine icon
        let iconClass = 'bi-geo-alt';
        const typeLower = (place.type || '').toLowerCase();
        if (typeLower.includes('restaurant') || typeLower.includes('dining') || typeLower.includes('food') || typeLower.includes('cafe')) {
            iconClass = 'bi-restaurant';
        } else if (typeLower.includes('music') || typeLower.includes('concert') || typeLower.includes('venue')) {
            iconClass = 'bi-music-note-beamed';
        } else if (typeLower.includes('art') || typeLower.includes('gallery') || typeLower.includes('museum') || typeLower.includes('exhibition')) {
            iconClass = 'bi-palette';
        } else if (typeLower.includes('shop') || typeLower.includes('store') || typeLower.includes('fashion') || typeLower.includes('boutique')) {
            iconClass = 'bi-shop';
        } else if (typeLower.includes('book') || typeLower.includes('library')) {
            iconClass = 'bi-book';
        } else if (typeLower.includes('park') || typeLower.includes('garden') || typeLower.includes('outdoor')) {
            iconClass = 'bi-tree';
        } else if (typeLower.includes('hotel') || typeLower.includes('lodging')) {
            iconClass = 'bi-building';
        } else if (typeLower.includes('observation') || typeLower.includes('tower') || typeLower.includes('landmark')) {
            iconClass = 'bi-binoculars';
        } else if (typeLower.includes('cafe') || typeLower.includes('coffee')) {
            iconClass = 'bi-cup-hot'; // Specific icon for cafes
        }

        // Sanitize ID for data attribute lookup
        const sanitizedId = (place.id || `place-${Math.random().toString(36).substr(2, 9)}`).replace(/[^a-zA-Z0-9-_]/g, '_');

        // Extract address
        let address = 'Address not available';
        if (place.qlooMetadata && place.qlooMetadata.disambiguation) {
            address = place.qlooMetadata.disambiguation;
        } else if (place.qlooMetadata.properties && place.qlooMetadata.properties.address) {
            address = place.qlooMetadata.properties.address;
        }

        // Extract popularity
        let popularityPercent = 0;
        console.log("yo yo", place.qlooMetadata.popularity, place.name);
        if (place.qlooMetadata && place.qlooMetadata.popularity !== undefined && place.qlooMetadata.popularity >= 0 && place.qlooMetadata.popularity <= 1) {
            // Popularity is a decimal between 0 and 1, convert to percentage for display
            popularityPercent = Math.floor(place.qlooMetadata.popularity * 100).toFixed(1);
        } else {
            console.warn(`Popularity data missing or invalid for place ${place.name}:`, place.qlooMetadata.popularity);
        }

        let businessRating = null;
        let starsHtml = ''; // Initialize starsHtml here
        if (place.qlooMetadata.properties && typeof place.qlooMetadata.properties.business_rating === 'number') {
            businessRating = place.qlooMetadata.properties.business_rating;
            const fullStars = Math.floor(businessRating);
            const halfStar = businessRating % 1 >= 0.5 ? 1 : 0;
            const emptyStars = 5 - fullStars - halfStar;
            starsHtml = ''; // Reset and build
            starsHtml += '&#9733;'.repeat(fullStars); // Full stars
            if (halfStar) starsHtml += '&#9734;'; // Half star (outlined)
            starsHtml += '&#9734;'.repeat(emptyStars); // Empty stars
        }

        // --- Opening Hours ---
        let openingHoursToday = 'Hours not available';
        if (place.qlooMetadata.properties && place.qlooMetadata.properties.hours) {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const hoursForToday = place.qlooMetadata.properties.hours[today];
            if (hoursForToday && hoursForToday.length > 0) {
                const openTime = hoursForToday[0].opens.replace('T', '').substring(0, 5);
                const closeTime = hoursForToday[0].closes.replace('T', '').substring(0, 5);
                openingHoursToday = `${openTime} - ${closeTime}`;
            }
        }

        // --- Good For Tags ---
        let goodForTags = [];
        if (place.qlooMetadata.properties.good_for && Array.isArray(place.qlooMetadata.properties.good_for)) {
            goodForTags = place.qlooMetadata.properties.good_for.slice(0, 2).map(tag => tag.name);
        } else if (place.qlooMetadata.tags && Array.isArray(place.qlooMetadata.tags)) {
            goodForTags = place.qlooMetadata.tags
                .filter(tag => tag.type && (tag.type.includes('children') || tag.type.includes('group') || tag.type.includes('event')))
                .slice(0, 2)
                .map(tag => tag.name);
        }

        // --- Keywords ---
        let keywords = [];
        if (place.qlooMetadata.properties && place.qlooMetadata.properties.keywords && Array.isArray(place.qlooMetadata.properties.keywords)) {
            keywords = place.qlooMetadata.properties.keywords.slice(0, 3).map(kw => kw.name);
        }

        // --- Website and Phone ---
        let website = null;
        let phone = null;
        if (place.qlooMetadata.properties) {
            if (place.qlooMetadata.properties.website) {
                try {
                    const urlObj = new URL(place.qlooMetadata.properties.website.trim());
                    website = urlObj.origin + urlObj.pathname;
                } catch (e) {
                    website = place.qlooMetadata.properties.website.trim();
                }
            }
            phone = place.qlooMetadata.properties.phone || null;
        }

        // --- Categories/Genres ---
        let categories = [];
        if (place.qlooMetadata.tags && Array.isArray(place.qlooMetadata.tags)) {
            categories = place.qlooMetadata.tags
                .filter(tag => tag.type && (tag.type.includes('category:place') || tag.type.includes('genre:place')) && tag.weight > 0.8)
                .sort((a, b) => (b.weight || 0) - (a.weight || 0))
                .slice(0, 2)
                .map(tag => tag.name);
        }
        if (categories.length === 0 && place.qlooMetadata.subtype) {
            let displayType = place.qlooMetadata.subtype.replace('urn:entity:place:', '').replace('_', ' ');
            displayType = displayType.charAt(0).toUpperCase() + displayType.slice(1);
            categories = [displayType];
        }
        // --- END: Calculate variables needed for Additional Info Accordion ---

        // --- Build Additional Info Accordion HTML ---
        // Now all variables (starsHtml, openingHoursToday, etc.) are guaranteed to be defined
        let additionalInfoHtml = `
        <div class="accordion mb-3" id="place-info-accordion-${sanitizedId}">
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading${sanitizedId}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${sanitizedId}" aria-expanded="false" aria-controls="collapse${sanitizedId}">
                        Additional Info
                    </button>
                </h2>
                <div id="collapse${sanitizedId}" class="accordion-collapse collapse" aria-labelledby="heading${sanitizedId}" data-bs-parent="#place-info-accordion-${sanitizedId}">
                    <div class="accordion-body">
                        <div class="mb-1"><small><strong>Rating:</strong> ${starsHtml} ${businessRating !== null ? `(${businessRating.toFixed(1)})` : ''}</small></div>
                        <div class="mb-1"><small><strong>Today:</strong> ${openingHoursToday}</small></div>
                        <div class="mb-1"><small><strong>Type:</strong> ${categories.join(', ')}</small></div>
                        <div class="mb-1"><small><strong>Good for:</strong> ${goodForTags.join(', ')}</small></div>
                        <div class="mb-1"><small><strong>Keywords:</strong> ${keywords.join(', ')}</small></div>
                        <div class="mb-1"><small><strong>Website:</strong> ${website ? `<a href="${website}" target="_blank" rel="noopener noreferrer">${website.length > 30 ? website.substring(0, 27) + '...' : website}</a>` : 'N/A'}</small></div>
                        <div class="mb-1"><small><strong>Phone:</strong> ${phone ? `<a href="tel:${phone}">${phone}</a>` : 'N/A'}</small></div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Create the card HTML
        return `
            <div class="col-12">
                <div class="card h-100" data-place-id="${sanitizedId}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">
                            <i class="bi ${iconClass} me-2"></i>
                            ${place.name}
                        </h5>
                        <h6 class="card-subtitle mb-2 text-muted">${place.type}</h6>
                        <p class="card-text"><small class="text-muted">${address}</small></p>
                        <div class="mb-2 d-flex align-items-center">
                            <!-- Popularity Circle -->
                            <div class="popularity-circle" style="--popularity: ${popularityPercent};" data-percent="${popularityPercent}%"></div>
                            <span class="ms-2 small">Popularity</span> <!-- Shortened label -->
                        </div>
                        <p class="card-text">${place.description || 'No description available from Qloo.'}</p>
                        ${additionalInfoHtml}
                        <div class="mt-auto">
                            <div class="explanation-placeholder bg-light p-2 rounded">
                                <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
                                <span>Generating personalized insight...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Function to update a specific place card with its explanation
    function updatePlaceCardWithExplanation(placeId, explanationHtml) {
         // Sanitize the placeId used for the data attribute lookup to match the one set in the skeleton
         const sanitizedId = (placeId || `place-${Math.random().toString(36).substr(2, 9)}`).replace(/[^a-zA-Z0-9-_]/g, '_');
         const card = document.querySelector(`.card[data-place-id="${sanitizedId}"]`);
         if (card) {
             const placeholder = card.querySelector('.explanation-placeholder');
             if (placeholder) {
                 // Replace the placeholder with the actual explanation
                 placeholder.outerHTML = `<div class="explanation bg-light p-2 rounded"><strong>Why this recommendation?</strong><p class="mb-0">${explanationHtml}</p></div>`;
             } else {
                 console.warn(`Explanation placeholder not found in card for place ID ${sanitizedId}.`);
             }
         } else {
             console.warn(`Card with place ID ${sanitizedId} not found for explanation update.`);
         }
    }

    // Function to iterate through places and fetch explanations
    async function fetchAndDisplayExplanations(places, userInterests) {
        // Object to store explanations as they are fetched
        const explanationsMap = {};
         // Use a simple for...of loop to process sequentially
         for (const place of places) {
             try {
                 // Optional: Show status message (can be noisy, uncomment if desired)
                 // showStatus(itineraryStatus, `Generating insight for ${place.name}...`, "info");

                 const explanationResponse = await fetch('/api/explain-place', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                         place: place,
                         userInterests: userInterests,
                         shareToken: currentShareToken 
                     })
                 });

                 if (!explanationResponse.ok) {
                     const errorData = await explanationResponse.json();
                     throw new Error(errorData.error || `Explanation API request failed for ${place.name}`);
                 }

                 const explanationData = await explanationResponse.json();
                 //console.log(`Received explanation for ${place.name}:`, explanationData.explanation);
                 
                 // Update the specific card in the UI
                 updatePlaceCardWithExplanation(explanationData.placeId, explanationData.explanation);
                 // Store explanation for saving
                 explanationsMap[place.id] = explanationData.explanation;

             } catch (error) {
                 console.error(`Error fetching explanation for ${place.name || place.id}:`, error);
                 // Update the card with an error message using the place's ID
                 updatePlaceCardWithExplanation(place.id, `Sorry, an explanation couldn't be generated for this place: ${error.message}`);
             }
         }
         // All explanations fetched
         //console.log("All explanations fetched and displayed.");
         showStatus(itineraryStatus, "Your QlooVoyage is ready!", "success");
        copyItineraryBtn.disabled = false;
        if (currentShareToken) {
            shareItineraryBtn.disabled = false;
            console.log("Share button enabled with token:", currentShareToken);
        } else {
            // --- SAVE THE COMPLETED ITINERARY ---
            console.log("No initial shareToken, attempting to save completed itinerary...");
            try {
                // Prepare the data structure with explanations
                const placesWithExplanations = places.map(place => ({
                    ...place,
                    whyRecommended: explanationsMap[place.id] || "Explanation not available."
                }));

                const saveResponse = await fetch('/api/generate-itinerary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        destination: selectedCity, // Make sure selectedCity is accessible here
                        interests: userInterests,  // Make sure userInterests is accessible here
                        saveCompletedItinerary: true,
                        completedItineraryData: {
                            recommendations: placesWithExplanations
                            // Optional: explanationsMap if you want to send them separately
                            // explanations: explanationsMap
                        }
                    })
                });

                if (!saveResponse.ok) {
                    const errorData = await saveResponse.json();
                    throw new Error(errorData.error || `Save API request failed with status ${saveResponse.status}`);
                }

                const saveData = await saveResponse.json();
                console.log("Completed itinerary saved successfully, received Share Token:", saveData.shareToken);
                currentShareToken = saveData.shareToken; // Store the token for sharing
                shareItineraryBtn.disabled = false; // Enable the share button
                showStatus(itineraryStatus, "Itinerary finalized and ready to share!", "success");

            } catch (saveError) {
                console.error("Error saving completed itinerary:", saveError);
                showStatus(itineraryStatus, `Itinerary ready, but saving for sharing failed: ${saveError.message}`, "warning");
                // Share button remains disabled
            }
        }
        // --- Enable Download Button ---
        downloadPdfBtn.disabled = false;
    }

    shareItineraryBtn.addEventListener('click', () => {
        if (!currentShareToken) {
            alert("Itinerary sharing link is not available.");
            return;
        }
        const shareUrl = `${window.location.origin}?share=${currentShareToken}`;
        console.log("Sharing URL:", shareUrl);

        // Use the Web Share API if available (mobile/desktop)
        if (navigator.share) {
            navigator.share({
                title: 'My QlooVoyage Itinerary',
                text: 'Check out my personalized itinerary!',
                url: shareUrl
            }).then(() => {
                console.log('Thanks for sharing!');
                showStatus(itineraryStatus, "Itinerary shared successfully!", "success");
            })
            .catch(console.error);
        } else {
            // Fallback: Copy link to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Sharing link copied to clipboard!'); // Simple alert, or use showStatus
                showStatus(itineraryStatus, "Sharing link copied to clipboard!", "success");
                // Temporarily change button text/icon?
                const originalHtml = shareItineraryBtn.innerHTML;
                shareItineraryBtn.innerHTML = '<i class="bi bi-check"></i>';
                setTimeout(() => {
                    shareItineraryBtn.innerHTML = originalHtml;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy link: ', err);
                // Show full link in an alert or modal if copy fails
                const fallbackPrompt = `Copy this link to share your itinerary:\n\n${shareUrl}`;
                alert(fallbackPrompt);
                showStatus(itineraryStatus, "Failed to copy link automatically. Please copy it manually.", "warning");
            });
        }
    });

    // --- Function to Load and Display a Shared Itinerary ---
    async function loadSharedItinerary(shareToken) {
        try {
            // 1. Fetch shared itinerary data
            const response = await fetch(`/api/shared-itinerary/${encodeURIComponent(shareToken)}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('This shared itinerary link is not valid or has expired.');
                }
                throw new Error(`Failed to fetch shared itinerary: ${response.statusText}`);
            }
            const data = await response.json();
            
            if (!data.sharedItinerary) {
                throw new Error('Invalid shared itinerary data received.');
            }

            const sharedItinerary = data.sharedItinerary;
            const { destination, user_interests: userInterests, recommendations: placesWithExplanations } = sharedItinerary;
            
            // 2. Show the itinerary screen
            showScreen('itinerary');
            shareItineraryBtn.disabled = true; // Cannot re-share a shared link
            downloadPdfBtn.disabled = false; // But can still download
            copyItineraryBtn.disabled = false;
            itinerarySubtitle.textContent = `Shared Itinerary: ${destination}`;
            itineraryOutput.style.display = 'block';
            copyItineraryBtn.disabled = false; // Enable copy for shared itineraries
            hideStatus(itineraryStatus); // Hide previous messages

            // 3. Display places WITH explanations (they are pre-loaded from DB)
            // We can reuse the display logic, but need to adapt the data structure slightly
            // The data from DB has explanations in `whyRecommended`
            
            // Create a mock "recommendations" object that `displayPlacesWithoutExplanations` can use
            // We'll pass the places with explanations directly
            displaySharedItineraryPlaces(placesWithExplanations);
            
            showStatus(itineraryStatus, "Shared itinerary loaded!", "success");

        } catch (error) {
            console.error("Error loading shared itinerary:", error);
            showScreen('itinerary'); // Still show the screen to display the error
            itineraryContent.innerHTML = '';
            itineraryOutput.style.display = 'block';
            showStatus(itineraryStatus, `Failed to load shared itinerary: ${error.message}`, "danger");
        }
    }

    // --- Helper function to display places from a shared itinerary (which already have explanations) ---
    function displaySharedItineraryPlaces(placesWithExplanations) {
        // Clear previous content and show the itinerary output container
        itineraryContent.innerHTML = '';
        itineraryOutput.style.display = 'block';

        // Group places into a single "day" for display
        let html = `<div class="itinerary-day mb-4">`;
        html += `<h3 class="mb-3">Shared Itinerary</h3>`;
        html += `<div class="row g-3" id="places-container">`;

        placesWithExplanations.forEach(place => {
            // Reuse the skeleton creation logic, but inject the explanation directly
            const skeletonHtml = createPlaceCardSkeleton(place);
            // We need to replace the explanation placeholder with the actual explanation
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = skeletonHtml;
            const cardBody = tempDiv.querySelector('.card-body');
            if (cardBody) {
                const placeholder = cardBody.querySelector('.explanation-placeholder');
                if (placeholder) {
                    placeholder.outerHTML = `<div class="explanation bg-light p-2 rounded"><strong>Why this recommendation?</strong><p class="mb-0">${place.whyRecommended || 'Explanation not available.'}</p></div>`;
                }
            }
            html += tempDiv.innerHTML;
        });

        html += `</div>`; // Close row
        html += `</div>`; // Close day div

        itineraryContent.innerHTML = html;
    }

    // --- Welcome Screen Logic ---
    startButton.addEventListener('click', () => {
        // showScreen('city'); // Call initialization function instead
        initializeCitySelection();
    });

    // --- City Selection Screen Logic ---
    function initializeCitySelection() {
        showScreen('city');
        const cityCardContainer = document.getElementById('cityCardContainer'); // New container for city cards
        cityCardContainer.innerHTML = ''; // Clear previous cards
        selectedCity = null;
        nextToInterestsBtn.disabled = true;
        hideStatus(citySelectionStatus);

        const POPULAR_CITIES = [
            { name: 'Tokyo', image: 'tokyo.png' },
            { name: 'Paris', image: 'paris.png' },
            { name: 'New York', image: 'newyork.png' },
            { name: 'London', image: 'london.png' },
            { name: 'Kyoto', image: 'kyoto.png' },
            { name: 'Berlin', image: 'berlin.png' },
            { name: 'Barcelona', image: 'barcelona.png' },
            { name: 'Osaka', image: 'osaka.png' },
            { name: 'Mexico City', image: 'mexico-city.png' },
            { name: 'Seoul', image: 'seoul.png' }
        ];

        POPULAR_CITIES.forEach(city => {
            const card = document.createElement('div');
            card.className = 'city-card';
            card.dataset.city = city.name; // Store city name on the card

            card.innerHTML = `
                <img src="/images/${city.image}" alt="${city.name}" class="city-image">
                <div class="city-name">${city.name}</div>
            `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.city-card.selected').forEach(card => card.classList.remove('selected'));
                card.classList.add('selected');
                selectedCity = city.name;
                nextToInterestsBtn.disabled = false;
                showStatus(citySelectionStatus, `Selected: ${city.name}`, "success");
            });

            cityCardContainer.appendChild(card);
        });
    }

    backToWelcomeBtn.addEventListener('click', () => {
        showScreen('welcome');
    });

    nextToInterestsBtn.addEventListener('click', () => {
        if (selectedCity) {
            // showScreen('interest'); // Call initialization function instead
            initializeInterestSelection();
        }
    });

    // --- Interest Selection Screen Logic ---
    function initializeInterestSelection() {
        showScreen('interest');
        const interestButtonContainer = document.getElementById('interestButtonContainer'); // Add this line
        interestButtonContainer.innerHTML = ''; // Clear previous buttons
        hideStatus(interestSelectionStatus);
        selectedInterests = [];
        generateItineraryBtn.disabled = true;

        Object.keys(INTEREST_IMAGE_MAP).forEach(interest => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'interest-button';
            button.textContent = interest;
            button.dataset.interest = interest;

            button.addEventListener('click', () => {
                const isSelected = button.classList.toggle('selected');
                if (isSelected) {
                    selectedInterests.push(interest);
                } else {
                    selectedInterests = selectedInterests.filter(i => i !== interest);
                }
                generateItineraryBtn.disabled = selectedInterests.length === 0;
            });

            interestButtonContainer.appendChild(button);
        });
    }

    backToCityBtn.addEventListener('click', () => {
         hideStatus(interestSelectionStatus);
         selectedInterests = [];
         generateItineraryBtn.disabled = true;
         // Go back to city selection and re-initialize
         initializeCitySelection();
    });

    generateItineraryButton.addEventListener('click', async () => {
        if (!selectedCity || selectedInterests.length === 0) {
            showStatus(interestSelectionStatus, "Please select a city and at least one interest.", "warning");
            return;
        }

        showScreen('itinerary');
        itineraryTitle.textContent = `Your QlooVoyage in ${selectedCity}`;
        // Clear previous content
        itineraryContent.innerHTML = '';
        itineraryOutput.style.display = 'block'; // Show the container
        copyItineraryBtn.disabled = true;
        hideStatus(itineraryStatus); // Hide any previous status messages

        try {
            //console.log("Sending request for Qloo recommendations:", { destination: selectedCity, interests: selectedInterests });
            // Step 1: Fetch recommendations from Qloo
            const recResponse = await fetch('/api/generate-itinerary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: selectedCity,
                    interests: selectedInterests,
                    fetchExplanations: false // Tell server we only want recommendations
                })
            });

            if (!recResponse.ok) {
                const errorData = await recResponse.json();
                
                throw new Error(errorData.error || `Recommendation API request failed with status ${recResponse.status}`);
            }

            const recData = await recResponse.json();
            currentShareToken = recData.shareToken || null; // Store the token
            console.log("Received shareToken from backend:", currentShareToken);
            if (currentShareToken) {
                // Update UI to show share is available? Or wait until explanations are done?
                // Let's enable the share button once the itinerary is fully displayed
            } else {
                shareItineraryBtn.disabled = true; // Disable if no token
                console.warn("No shareToken received from backend. Sharing disabled.");
            }


            currentCacheKey = recData.cacheKey || null;

            if (recData.status === "no_results" || !recData.recommendations || recData.recommendations.length === 0) {
                 itineraryContent.innerHTML = '<div class="alert alert-info text-center">No places found matching your tastes in this location. Try adjusting your interests.</div>';
                 return;
            }

            if (recData.status !== "recommendations_ready") {
                // This shouldn't happen with fetchExplanations: false, but good check
                console.warn("Unexpected status from /api/generate-itinerary:", recData.status);
            }

            // Step 2: Display the list of places (without explanations yet)
            displayPlacesWithoutExplanations(recData.recommendations);

            // Step 3: Iterate and fetch explanations one by one
            await fetchAndDisplayExplanations(recData.recommendations, selectedInterests);

            // Re-enable copy button after all explanations are loaded (optional)
            // copyItineraryBtn.disabled = false; // Or enable it earlier if preferred

        } catch (error) {
            console.error("Error generating itinerary:", error);
            showStatus(itineraryStatus, `Failed to start itinerary generation: ${error.message}`, "danger");
        }
    });

    copyItineraryBtn.addEventListener('click', () => {
         const textToCopy = itineraryContent.innerText || itineraryContent.textContent;
         if (!textToCopy) {
             showStatus(itineraryStatus, "No itinerary to copy.", "warning");
             return;
         }
         navigator.clipboard.writeText(textToCopy).then(() => {
             const originalText = copyItineraryBtn.innerHTML;
             copyItineraryBtn.innerHTML = '<i class="bi bi-clipboard-check"></i>';
             setTimeout(() => {
                 copyItineraryBtn.innerHTML = originalText;
             }, 2000);
             showStatus(itineraryStatus, "Itinerary copied to clipboard!", "success");
         }).catch(err => {
             console.error('Failed to copy itinerary: ', err);
             showStatus(itineraryStatus, "Failed to copy itinerary.", "danger");
         });
    });

    restartButton.addEventListener('click', () => {
         selectedCity = null;
         selectedInterests = [];
         showScreen('welcome');
    });

    generateItineraryButton.addEventListener('click', async () => {
        if (!selectedCity || selectedInterests.length === 0) {
            showStatus(interestSelectionStatus, "Please select a city and at least one interest.", "warning");
            return;
        }

        showScreen('itinerary');
        itineraryTitle.textContent = `Your QlooVoyage in ${selectedCity}`;
        // Clear previous content
        itineraryContent.innerHTML = '';
        itineraryOutput.style.display = 'block'; // Show the container
        copyItineraryBtn.disabled = true;
        hideStatus(itineraryStatus); // Hide any previous status messages

        try {
            //console.log("Sending request for Qloo recommendations:", { destination: selectedCity, interests: selectedInterests });
            // Step 1: Fetch recommendations from Qloo
            const recResponse = await fetch('/api/generate-itinerary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: selectedCity,
                    interests: selectedInterests,
                    fetchExplanations: false // Tell server we only want recommendations
                })
            });

            if (!recResponse.ok) {
                const errorData = await recResponse.json();
                throw new Error(errorData.error || `Recommendation API request failed with status ${recResponse.status}`);
            }

            const recData = await recResponse.json();
            //console.log("Received Qloo recommendations:", recData);

            if (recData.status === "no_results" || !recData.recommendations || recData.recommendations.length === 0) {
                 itineraryContent.innerHTML = '<div class="alert alert-info text-center">No places found matching your tastes in this location. Try adjusting your interests.</div>';
                 return;
            }

            if (recData.status !== "recommendations_ready") {
                // This shouldn't happen with fetchExplanations: false, but good check
                console.warn("Unexpected status from /api/generate-itinerary:", recData.status);
            }

            // Step 2: Display the list of places (without explanations yet)
            displayPlacesWithoutExplanations(recData.recommendations);

            // Step 3: Iterate and fetch explanations one by one
            await fetchAndDisplayExplanations(recData.recommendations, selectedInterests);

            // Re-enable copy button after all explanations are loaded (optional)
            // copyItineraryBtn.disabled = false; // Or enable it earlier if preferred

        } catch (error) {
            console.error("Error generating itinerary:", error);
            showStatus(itineraryStatus, `Failed to start itinerary generation: ${error.message}`, "danger");
        }
    });

    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        mainContent.classList.add('shifted');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        mainContent.classList.remove('shifted');
    });

    sidebarOverlay.addEventListener('click', () => {
        // Close sidebar if overlay is clicked
        closeSidebarBtn.click();
    });

    historyLink.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent default link behavior
        closeSidebarBtn.click(); // Close the sidebar
        await loadAndDisplayHistory(); // Load history data
        showScreen('history'); // Show the history screen
    });

    backFromHistoryBtn.addEventListener('click', () => {
        // Go back to the previous screen, or default to welcome
        // For simplicity, let's go back to the welcome screen
        // You could implement a screen stack if needed
        showScreen('welcome');
    });

    // --- Functions for History Screen ---
    async function loadAndDisplayHistory() {
        // Always clear the list first
        historyList.innerHTML = '';

        try {
            const response = await fetch('/api/recent-itineraries');
            //console.log("Fetching recent itineraries...");
            if (!response.ok) {
                throw new Error(`Failed to fetch history: ${response.statusText}`);
            }
            const data = await response.json();
            //console.log("Received recent itineraries:", data);

            // --- Check for empty history ---
            if (!data.recentItineraries || data.recentItineraries.length === 0) {
                //console.log("No recent itineraries found, displaying empty state.");
                // Use a simpler structure without fixed height
                historyList.innerHTML = `
                    <div class="d-flex flex-column align-items-center justify-content-center text-center p-4" style="min-height: 70vh;"> 
                        <!-- Added min-height and padding for better spacing -->
                        <i class="bi bi-clock-history" style="font-size: 3rem; color: #6c757d; margin-bottom: 1rem;"></i>
                        <h5 class="mb-3">No Search History Yet</h5>
                        <p class="mb-4 text-muted">Your recent QlooVoyages will appear here.</p>
                        <button id="goHomeFromHistory" class="btn btn-primary">
                            <i class="bi bi-house-door me-2"></i>Go to Home Screen
                        </button>
                    </div>
                `;
                // --- Crucially, add the event listener AFTER the button is added to the DOM ---
                const homeButton = document.getElementById('goHomeFromHistory');
                if (homeButton) {
                    homeButton.addEventListener('click', () => {
                        //console.log("Home button clicked from empty history state");
                        showScreen('welcome');
                    });
                } else {
                    console.error("Could not find 'goHomeFromHistory' button in the DOM after creating it.");
                }
                return; // Stop execution if history is empty
            }

            // --- If history exists, display the items ---
            //console.log(`Displaying ${data.recentItineraries.length} history items.`);
            let html = '';
            data.recentItineraries.forEach(item => {
                const date = new Date(item.timestamp).toLocaleString();
                html += `
                    <div class="history-item" data-cache-key="${item.cacheKey}">
                        <h6>${item.destination}</h6>
                        <p class="mb-1"><small>${item.interests.join(', ')}</small></p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">${date}</small>
                            <span class="badge bg-secondary">${item.placeCount} places</span>
                        </div>
                    </div>
                `;
            });
            historyList.innerHTML = html;

            // Add click listeners to history items
            document.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const cacheKey = item.getAttribute('data-cache-key');
                    //console.log("Loading cached itinerary for key:", cacheKey);
                    await loadCachedItinerary(cacheKey);
                });
            });

        } catch (error) {
            console.error("Error loading history:", error);
            // Display error message inside historyList
            historyList.innerHTML = `<div class="alert alert-danger m-3">Failed to load history: ${error.message}</div>`;
        }
    }

    async function loadCachedItinerary(cacheKey) {
        try {
            // 1. Fetch cached recommendations data
            const response = await fetch(`/api/cached-itinerary/${encodeURIComponent(cacheKey)}`);
            if (!response.ok) {
                if (response.status === 404) {
                     throw new Error('This cached itinerary is no longer available.');
                }
                throw new Error(`Failed to fetch cached itinerary: ${response.statusText}`);
            }
            const data = await response.json();
            
            if (!data.cachedItinerary) {
                 throw new Error('Invalid cached itinerary data received.');
            }

            const cachedRecommendations = data.cachedItinerary;
            // We need to simulate the original user input to re-run the process
            // The cached data might not have the original userInput.
            // Let's try to find it in the RECENT_ITINERARIES list
            const historyItem = RECENT_ITINERARIES.find(item => item.cacheKey === cacheKey);
            if (!historyItem) {
                 throw new Error('Original search parameters not found for this cache entry.');
            }
            
            const { destination, interests } = historyItem;
            
            // 2. Show the itinerary screen
            showScreen('itinerary');
            itineraryTitle.textContent = `Your QlooVoyage in ${destination} (Cached)`;
            itineraryOutput.style.display = 'block';
            copyItineraryBtn.disabled = true; // Disable copy until fully loaded
            hideStatus(itineraryStatus); // Hide previous messages

            // 3. Display places without explanations (using cached data)
            displayPlacesWithoutExplanations(cachedRecommendations);
            currentCacheKey = cacheKey; // Store the key

            // 4. Iterate and fetch (or use) cached explanations
            // We need to trigger the explanation fetch for each place.
            // The cache on the backend should serve them quickly.
            await fetchAndDisplayExplanations(cachedRecommendations, interests);

            // Re-enable copy button after all explanations are loaded (optional)
            copyItineraryBtn.disabled = false;
            showStatus(itineraryStatus, "Cached itinerary loaded!", "success");

        } catch (error) {
            console.error("Error loading cached itinerary:", error);
            showScreen('itinerary'); // Still show the screen to display the error
            itineraryContent.innerHTML = '';
            itineraryOutput.style.display = 'block';
            showStatus(itineraryStatus, `Failed to load cached itinerary: ${error.message}`, "danger");
        }
    }

    // --- Sidebar Event Listeners ---
    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        mainContent.classList.add('shifted');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        mainContent.classList.remove('shifted');
    });

    sidebarOverlay.addEventListener('click', () => {
        // Close sidebar if overlay is clicked
        closeSidebarBtn.click();
    });

    historyLink.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent default link behavior
        closeSidebarBtn.click(); // Close the sidebar
        await loadAndDisplayHistory(); // Load history data
        showScreen('history'); // Show the history screen
    });

    backFromHistoryBtn.addEventListener('click', () => {
        // Go back to the welcome screen
        showScreen('welcome');
    });
    
    downloadPdfBtn.addEventListener('click', async () => {
        if (!itineraryContent.innerHTML.trim()) {
            showStatus(itineraryStatus, "Nothing to download.", "warning");
            return;
        }

        showStatus(itineraryStatus, "Generating PDF...", "info", true); // Show with spinner
        downloadPdfBtn.disabled = true; // Prevent multiple clicks
        shareItineraryBtn.disabled = true;
        copyItineraryBtn.disabled = true;

        try {
            // Ensure jsPDF is available (it's loaded as a module)
            const { jsPDF } = window.jspdf;

            // Create a new jsPDF instance
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });

            // Get the element to capture
            const element = itineraryContent; // This is the div containing the itinerary cards

            // Use html2canvas to capture the element as an image
            // Options for html2canvas to improve quality and handle styles
            const canvas = await html2canvas(element, {
                scale: 2, // Increase scale for better quality
                useCORS: true, // If images are from different origins
                logging: false // Reduce console logs
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add new pages if content overflows
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Save the PDF
            const fileName = `QlooVoyage_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(fileName);

            showStatus(itineraryStatus, `PDF downloaded as ${fileName}`, "success");

        } catch (error) {
            console.error("Error generating PDF:", error);
            showStatus(itineraryStatus, "Failed to generate PDF. Please try again.", "danger");
        } finally {
            // Re-enable buttons
            downloadPdfBtn.disabled = false;
            if (currentShareToken) shareItineraryBtn.disabled = false;
            copyItineraryBtn.disabled = false;
        }
    });

    (async function checkForSharedLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareToken = urlParams.get('share');
        if (shareToken) {
            //console.log("Found share token in URL, loading shared itinerary:", shareToken);
            // Hide the welcome screen and load the shared itinerary
            document.getElementById('welcomeScreen').classList.remove('active');
            await loadSharedItinerary(shareToken);
        }
    })();

});