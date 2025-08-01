document.addEventListener('DOMContentLoaded', async () => {

    const screens = {
        welcome: document.getElementById('welcomeScreen'),
        city: document.getElementById('citySelectionScreen'),
        interest: document.getElementById('interestSelectionScreen'),
        itinerary: document.getElementById('itineraryScreen'),
        history: document.getElementById('historyScreen')
    };
    const startButton = document.getElementById('startButton');
    const backToWelcomeBtn = document.getElementById('backToWelcome');
    const nextToInterestsBtn = document.getElementById('nextToInterests');
    const backToCityBtn = document.getElementById('backToCity');
    const generateItineraryBtn = document.getElementById('generateItineraryButton');
    const restartButton = document.getElementById('restartButton');
    const copyItineraryBtn = document.getElementById('copyItineraryBtn');
    const shareItineraryBtn = document.getElementById('shareItineraryBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const itinerarySubtitle = document.getElementById('itinerarySubtitle');
    const cityButtonContainer = document.getElementById('cityButtonContainer');
    const interestButtonContainer = document.getElementById('interestButtonContainer');

    const citySelectionStatus = document.getElementById('citySelectionStatus');
    const interestSelectionStatus = document.getElementById('interestSelectionStatus');
    const itineraryStatus = document.getElementById('itineraryStatus');
    const itineraryOutput = document.getElementById('itineraryOutput');
    const itineraryContent = document.getElementById('itineraryContent');
    const itineraryTitle = document.getElementById('itineraryTitle');

    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const historyLink = document.getElementById('historyLink');
    const historyList = document.getElementById('historyList');
    const backFromHistoryBtn = document.getElementById('backFromHistory');
    const mainContent = document.getElementById('mainContent');

    let selectedCity = null;
    let selectedInterests = [];
    let currentShareToken = null;

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


    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }
        if (screenName === 'welcome' || screenName === 'history') {
            openSidebarBtn.style.display = 'none';
        } else {
            openSidebarBtn.style.display = 'block';
        }
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
            iconClass = 'bi-cup-hot';
        }

        let address = 'Address not available';
        if (place.qlooMetadata && place.qlooMetadata.disambiguation) {
            address = place.qlooMetadata.disambiguation;
        } else if (place.properties && place.properties.address) {
            address = place.properties.address;
        }
        
        let encodedAddress = '';
        if (address) {
            encodedAddress = encodeURIComponent(address);
        }

        let popularityPercent = 0;
        if (place.qlooMetadata.popularity !== undefined && place.qlooMetadata.popularity >= 0 && place.qlooMetadata.popularity <= 1) {
            popularityDecimal = place.qlooMetadata.popularity;
            popularityPercent = Math.floor(place.qlooMetadata.popularity * 100).toFixed(1);
        } else {
            console.warn(`Popularity data missing or invalid for place ${place.name}:`, place.qlooMetadata.popularity);
        }

        const COLOR_RED = '#DC3545';
        const COLOR_YELLOW = '#FFC107';
        const COLOR_GREEN = '#28A745';
        const COLOR_BACKGROUND = '#e0e0e0';

        let fillColor;
        if (popularityPercent >= 80) {
            fillColor = COLOR_GREEN;
        } else if (popularityPercent >= 50) {
            fillColor = COLOR_YELLOW;
        } else {
            fillColor = COLOR_RED;
        }

        const gradientStyle = `conic-gradient(${fillColor} 0% ${popularityDecimal * 100}%, ${COLOR_BACKGROUND} ${popularityDecimal * 100}% 100%)`;

        let businessRating = null;
        let starsHtml = '&#9734;&#9734;&#9734;&#9734;&#9734;';
        if (place.qlooMetadata && typeof place.qlooMetadata.properties.business_rating === 'number') {
            businessRating = place.qlooMetadata.properties.business_rating;
            const fullStars = Math.floor(businessRating);
            const halfStar = businessRating % 1 >= 0.5 ? 1 : 0;
            const emptyStars = 5 - fullStars - halfStar;
            starsHtml = '';
            starsHtml += '&#9733;'.repeat(fullStars);
            if (halfStar) starsHtml += '&#9734;';
            starsHtml += '&#9734;'.repeat(emptyStars);
        }

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

        let goodForTags = [];
        if (place.qlooMetadata.good_for && Array.isArray(place.qlooMetadata.good_for)) {
            goodForTags = place.qlooMetadata.good_for.slice(0, 2).map(tag => tag.name);
        } else if (place.qlooMetadata.tags && Array.isArray(place.qlooMetadata.tags)) {
            goodForTags = place.qlooMetadata.tags
                .filter(tag => tag.type && (tag.type.includes('children') || tag.type.includes('group') || tag.type.includes('event')))
                .slice(0, 2)
                .map(tag => tag.name);
        }

        let keywords = [];
        if (place.qlooMetadata.properties && place.qlooMetadata.properties.keywords && Array.isArray(place.qlooMetadata.properties.keywords)) {
            keywords = place.qlooMetadata.properties.keywords.slice(0, 3).map(kw => kw.name);
        }

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

        let categories = [];
        if (place.qlooMetadata.tags && Array.isArray(place.qlooMetadata.tags)) {
            categories = place.qlooMetadata.tags
                .filter(tag => tag.type && (tag.type.includes('category:place') || tag.type.includes('genre:place')) && tag.weight > 0.8)
                .sort((a, b) => (b.weight || 0) - (a.weight || 0))
                .slice(0, 2)
                .map(tag => tag.name);
        }
        if (categories.length === 0 && place.subtype) {
            let displayType = place.subtype.replace('urn:entity:place:', '').replace('_', ' ');
            displayType = displayType.charAt(0).toUpperCase() + displayType.slice(1);
            categories = [displayType];
        }

        let additionalInfoHtml = `
        <div class="accordion mb-3" id="place-info-accordion-${place.id}">
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading${place.id}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${place.id}" aria-expanded="false" aria-controls="collapse${place.id}">
                        Additional Info
                    </button>
                </h2>
                <div id="collapse${place.id}" class="accordion-collapse collapse" aria-labelledby="heading${place.id}" data-bs-parent="#place-info-accordion-${place.id}">
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

        const sanitizedId = (place.id || `place-${Math.random().toString(36).substr(2, 9)}`).replace(/[^a-zA-Z0-9-_]/g, '_');

        return `
            <div class="col-12">
                <div class="card h-100" data-place-id="${sanitizedId}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">
                            <i class="bi ${iconClass} me-2"></i>
                            ${place.name}
                        </h5>
                        <h6 class="card-subtitle mb-2 text-muted">${place.type}</h6>
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodedAddress}" target="_blank" rel="noopener noreferrer">
                            <p class="card-text"><small class="text-muted">${address}</small></p>
                        </a>
                        <div class="mb-2 d-flex align-items-center">
                            <div class="popularity-circle"
                                style="background: ${gradientStyle};"
                                data-percent="${popularityPercent}%">
                            </div>
                            <span class="ms-2 small">Popularity</span>
                        </div>
                        <p class="card-text">${place.description || 'No description available from Qloo.'}</p>
                        ${additionalInfoHtml} <!-- Inject the accordion here -->
                        <div class="explanation-placeholder bg-light p-2 rounded">
                            <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
                            <span>Generating personalized insight...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function updatePlaceCardWithExplanation(placeId, explanationHtml, originalPlace = null, userInterests = null) {
        const sanitizedId = (placeId || `place-${Math.random().toString(36).substr(2, 9)}`).replace(/[^a-zA-Z0-9-_]/g, '_');
        const card = document.querySelector(`.card[data-place-id="${sanitizedId}"]`);
        if (card) {
            const placeholder = card.querySelector('.explanation-placeholder');
            if (placeholder) {
                placeholder.outerHTML = `
                    <div class="explanation bg-light p-2 rounded">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <strong>Why this recommendation?</strong>
                            <button class="btn btn-outline-secondary btn-sm regenerate-btn" 
                                    data-place-id="${sanitizedId}" 
                                    title="Regenerate explanation">
                                <i class="bi bi-arrow-repeat"></i> <!-- Bootstrap Icons refresh icon -->
                            </button>
                        </div>
                        <p class="mb-0 explanation-text">${explanationHtml}</p>
                        <!-- Spinner for regeneration, initially hidden -->
                        <div class="regenerate-spinner spinner-border spinner-border-sm mt-2" role="status" style="display: none;">
                            <span class="visually-hidden">Regenerating...</span>
                        </div>
                    </div>
                `;

                const explanationDiv = card.querySelector('.explanation');
                const regenButton = explanationDiv.querySelector(`button.regenerate-btn[data-place-id="${sanitizedId}"]`);
                const explanationTextElement = explanationDiv.querySelector('.explanation-text');
                const spinnerElement = explanationDiv.querySelector('.regenerate-spinner');

                if (regenButton && originalPlace && userInterests) {
                    regenButton.addEventListener('click', async () => {
                        //console.log(`Regenerating explanation for place ID: ${sanitizedId}`);
                        regenButton.disabled = true;
                        spinnerElement.style.display = 'inline-block';
                        const originalText = explanationTextElement.textContent;

                        try {
                            explanationTextElement.textContent = "Generating a new insight...";
                            const response = await fetch('/api/explain-place', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    place: originalPlace,
                                    userInterests: userInterests
                                    // shareToken: currentShareToken
                                })
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || `API request failed with status ${response.status}`);
                            }

                            const data = await response.json();
                            //console.log(`Regenerated explanation for place ID: ${sanitizedId}`, data.explanation);
                            explanationTextElement.textContent = data.explanation;

                        } catch (error) {
                            console.error(`Error regenerating explanation for place ID ${sanitizedId}:`, error);
                            explanationTextElement.textContent = originalText;
                            explanationTextElement.textContent = `Failed to regenerate: ${error.message.substring(0, 100)}...`;
                        } finally {
                            regenButton.disabled = false;
                            spinnerElement.style.display = 'none';
                        }
                    });
                } else if (regenButton) {
                    console.warn(`Regenerate button added for place ${sanitizedId} but missing originalPlace or userInterests. Button disabled.`);
                    regenButton.disabled = true;
                    regenButton.title = "Regeneration not available";
                }

            } else {
                console.warn(`Explanation placeholder not found in card for place ID ${sanitizedId}.`);
            }
        } else {
            console.warn(`Card with place ID ${sanitizedId} not found for explanation update.`);
        }
    }


    async function fetchAndDisplayExplanations(places, userInterests) {

        const explanationsMap = {};
         for (const place of places) {
             try {
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
                 
                 updatePlaceCardWithExplanation(explanationData.placeId, explanationData.explanation);
                 explanationsMap[place.id] = explanationData.explanation;

             } catch (error) {
                 console.error(`Error fetching explanation for ${place.name || place.id}:`, error);
                 updatePlaceCardWithExplanation(place.id, `Sorry, an explanation couldn't be generated for this place: ${error.message}`);
             }
         }

         //console.log("All explanations fetched and displayed.");
         showStatus(itineraryStatus, "Your QlooVoyage is ready!", "success");
        copyItineraryBtn.disabled = false;
        showStatus(itineraryStatus, "Saving your voyage...", "info", true); // true for spinner

        if (currentShareToken) {
            shareItineraryBtn.disabled = false;
            //console.log("Share button enabled with token:", currentShareToken);
        } else {
            //console.log("No initial shareToken, attempting to save completed itinerary...");
            try {
                const placesWithExplanations = places.map(place => ({
                    ...place,
                    whyRecommended: explanationsMap[place.id] || place.whyRecommended || "Explanation not available."
                }));

                const saveResponse = await fetch('/api/generate-itinerary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        destination: selectedCity,
                        interests: userInterests,
                        saveCompletedItinerary: true,
                        completedItineraryData: {
                            recommendations: placesWithExplanations
                        }
                    })
                });

                if (!saveResponse.ok) {
                    const errorData = await saveResponse.json();
                    throw new Error(errorData.error || `Save API request failed with status ${saveResponse.status}`);
                }

                const saveData = await saveResponse.json();
                console.log("Completed itinerary saved successfully, received Share Token:", saveData.shareToken);
                currentShareToken = saveData.shareToken;
                shareItineraryBtn.disabled = false;
                
                showStatus(itineraryStatus, "Itinerary saved! Ready to share.", "success");
                const originalStatusContent = itineraryStatus.innerHTML;
                itineraryStatus.innerHTML = `
                    <div class="alert alert-success d-flex align-items-center" role="alert">
                        <i class="bi bi-check-circle-fill me-2"></i> <!-- Bootstrap Icons checkmark -->
                        <div>Itinerary saved! Ready to share.</div>
                    </div>
                `;
                setTimeout(() => {
                    showStatus(itineraryStatus, "Itinerary saved! Ready to share.", "success");
                }, 2000);

            } catch (saveError) {
                console.error("Error saving completed itinerary:", saveError);
                showStatus(itineraryStatus, `Itinerary ready, but saving failed: ${saveError.message}`, "danger");
            }
        }
        downloadPdfBtn.disabled = false;
    }

    shareItineraryBtn.addEventListener('click', () => {
        if (!currentShareToken) {
            alert("Itinerary sharing link is not available.");
            return;
        }
        const shareUrl = `${window.location.origin}?share=${currentShareToken}`;
        //console.log("Sharing URL:", shareUrl);
        if (navigator.share) {
            navigator.share({
                title: 'My QlooVoyage Itinerary',
                text: 'Check out my personalized itinerary!',
                url: shareUrl
            }).then(() => {
                //console.log('Thanks for sharing!');
                showStatus(itineraryStatus, "Itinerary shared successfully!", "success");
            })
                .catch(console.error);
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Sharing link copied to clipboard!');
                showStatus(itineraryStatus, "Sharing link copied to clipboard!", "success");
                const originalHtml = shareItineraryBtn.innerHTML;
                shareItineraryBtn.innerHTML = '<i class="bi bi-check"></i>';
                setTimeout(() => {
                    shareItineraryBtn.innerHTML = originalHtml;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy link: ', err);
                const fallbackPrompt = `Copy this link to share your itinerary:\n\n${shareUrl}`;
                alert(fallbackPrompt);
                showStatus(itineraryStatus, "Failed to copy link automatically. Please copy it manually.", "warning");
            });
        }
    });

    async function loadCachedItinerary(cacheKey) {
        await loadSharedItinerary(cacheKey);
    }

    async function loadSharedItinerary(shareToken) {
        try {
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

            showScreen('itinerary');
            itineraryTitle.textContent = `Shared Itinerary: ${destination}`;
            itinerarySubtitle.textContent = '';
            itineraryOutput.style.display = 'block';
            copyItineraryBtn.disabled = false;
            shareItineraryBtn.disabled = true;
            downloadPdfBtn.disabled = false; 
            hideStatus(itineraryStatus); 

            displaySharedItineraryPlaces(placesWithExplanations, userInterests);

            showStatus(itineraryStatus, "Shared itinerary loaded!", "success");

        } catch (error) {
            console.error("Error loading shared itinerary:", error);
            showScreen('itinerary');
            itineraryContent.innerHTML = '';
            itineraryOutput.style.display = 'block';
            showStatus(itineraryStatus, `Failed to load shared itinerary: ${error.message}`, "danger");
        }
    }

    function displaySharedItineraryPlaces(placesWithExplanations, userInterestsForRegen = null) {

        itineraryContent.innerHTML = '';
        itineraryOutput.style.display = 'block';

        let html = `<div class="itinerary-day mb-4">`;
        html += `<h3 class="mb-3">Your QlooVoyage</h3>`;
        html += `<div class="row g-3" id="places-container">`;

        const cardHtmlArray = placesWithExplanations.map(place => {
            const skeletonHtml = createPlaceCardSkeleton(place);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = skeletonHtml;
            return tempDiv.innerHTML;
        });

        html += cardHtmlArray.join('');
        html += `</div>`;
        html += `</div>`;

        const container = document.getElementById('places-container');
        if (container) {
            container.innerHTML = cardHtmlArray.join('');
        } else {
            itineraryContent.innerHTML = html;
        }

        placesWithExplanations.forEach(place => {
            const sanitizedId = (place.id || `place-${Math.random().toString(36).substr(2, 9)}`).replace(/[^a-zA-Z0-9-_]/g, '_');

            updatePlaceCardWithExplanation(
                place.id,
                place.whyRecommended || 'Explanation not available.',
                place,
                userInterestsForRegen
            );
        });
    }

    startButton.addEventListener('click', () => {
        // showScreen('city');
        initializeCitySelection();
    });

    function initializeCitySelection() {
        showScreen('city');
        const cityCardContainer = document.getElementById('cityCardContainer');
        cityCardContainer.innerHTML = '';
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
            card.dataset.city = city.name;

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
            // showScreen('interest');
            initializeInterestSelection();
        }
    });

    function initializeInterestSelection() {
        showScreen('interest');
        interestButtonContainer.innerHTML = '';
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

    function displayPlacesWithoutExplanations(places) {

        itineraryContent.innerHTML = '';
        itineraryOutput.style.display = 'block';

        let html = `<div class="itinerary-day mb-4">`;
        html += `<h3 class="mb-3">Discovering your QlooVoyage...</h3>`;
        html += `<div class="row g-3" id="places-container">`;

        places.forEach(place => {
            const placeholderCard = createPlaceCardSkeleton(place);
            html += placeholderCard;
        });

        html += `</div>`;
        html += `</div>`;

        itineraryContent.innerHTML = html;
    }

    backToCityBtn.addEventListener('click', () => {
         hideStatus(interestSelectionStatus);
         selectedInterests = [];
         generateItineraryBtn.disabled = true;
         initializeCitySelection();
    });

    generateItineraryBtn.addEventListener('click', async () => {
        if (!selectedCity || selectedInterests.length === 0) {
            showStatus(interestSelectionStatus, "Please select a city and at least one interest.", "warning");
            return;
        }

        showScreen('itinerary');
        itineraryTitle.textContent = `Your QlooVoyage in ${selectedCity}`;
        itinerarySubtitle.textContent = "Curated just for you";

        itineraryContent.innerHTML = '';
        itineraryOutput.style.display = 'block';
        copyItineraryBtn.disabled = true;
        shareItineraryBtn.disabled = true;
        downloadPdfBtn.disabled = true; 
        hideStatus(itineraryStatus);

        try {
            //console.log("Sending request for Qloo recommendations:", { destination: selectedCity, interests: selectedInterests });
            const recResponse = await fetch('/api/generate-itinerary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: selectedCity,
                    interests: selectedInterests,
                    fetchExplanations: false
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
                console.warn("Unexpected status from /api/generate-itinerary:", recData.status);
            }

            displayPlacesWithoutExplanations(recData.recommendations);

            await fetchAndDisplayExplanations(recData.recommendations, selectedInterests);

            // copyItineraryBtn.disabled = false;

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
        closeSidebarBtn.click();
    });

    historyLink.addEventListener('click', async (e) => {
        e.preventDefault();
        closeSidebarBtn.click();
        await loadAndDisplayHistory();
        showScreen('history');
    });

    backFromHistoryBtn.addEventListener('click', () => {
        showScreen('welcome');
    });

    async function loadAndDisplayHistory() {
        historyList.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        try {
            const response = await fetch('/api/recent-itineraries');
            //console.log("Fetching recent itineraries...");
            if (!response.ok) {
                throw new Error(`Failed to fetch history: ${response.statusText}`);
            }
            const data = await response.json();
            //console.log("Received recent itineraries:", data);

            if (!data.recentItineraries || data.recentItineraries.length === 0) {
                //console.log("No recent itineraries found, displaying empty state.");
                historyList.innerHTML = `
                    <div class="d-flex flex-column align-items-center justify-content-center text-center p-4" style="min-height: 70vh;">
                        <i class="bi bi-clock-history" style="font-size: 3rem; color: #6c757d; margin-bottom: 1rem;"></i>
                        <h5 class="mb-3">No Search History Yet</h5>
                        <p class="mb-4 text-muted">Your recent QlooVoyages will appear here.</p>
                        <button id="goHomeFromHistory" class="btn btn-primary">
                            <i class="bi bi-house-door me-2"></i>Go to Home Screen
                        </button>
                    </div>
                `;
                const homeButton = document.getElementById('goHomeFromHistory');
                if (homeButton) {
                    homeButton.addEventListener('click', () => {
                        //console.log("Home button clicked from empty history state");
                        showScreen('welcome');
                    });
                } else {
                    console.error("Could not find 'goHomeFromHistory' button in the DOM after creating it.");
                }
                return;
            }

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

            document.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const cacheKey = item.getAttribute('data-cache-key');
                    //console.log("Loading cached itinerary for key:", cacheKey);
                    await loadCachedItinerary(cacheKey);
                });
            });

        } catch (error) {
            console.error("Error loading history:", error);
            historyList.innerHTML = `<div class="alert alert-danger m-3">Failed to load history: ${error.message}</div>`;
        }
    }

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
        closeSidebarBtn.click();
    });

    historyLink.addEventListener('click', async (e) => {
        e.preventDefault();
        closeSidebarBtn.click();
        await loadAndDisplayHistory();
        showScreen('history');
    });

    backFromHistoryBtn.addEventListener('click', () => {
        showScreen('welcome');
    });
    
    const homeButton = document.getElementById('homeButton');
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            console.log("Home button clicked from sidebar");
            showScreen('welcome');
        });
    } else {
        console.error("Could not find 'homeButton' in the DOM after creating it.");
    }

    downloadPdfBtn.addEventListener('click', async () => {
        if (!itineraryContent.innerHTML.trim()) {
            showStatus(itineraryStatus, "Nothing to download.", "warning");
            return;
        }

        showStatus(itineraryStatus, "Generating PDF...", "info", true);
        downloadPdfBtn.disabled = true;
        shareItineraryBtn.disabled = true;
        copyItineraryBtn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });


            const element = itineraryContent;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

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
            downloadPdfBtn.disabled = false;
            if (currentShareToken) shareItineraryBtn.disabled = false;
            copyItineraryBtn.disabled = false;
        }
    });

    (async function checkForSharedLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareToken = urlParams.get('share');
        if (shareToken) {
            console.log("Found share token in URL, loading shared itinerary:", shareToken);
            document.getElementById('welcomeScreen').classList.remove('active');
            await loadSharedItinerary(shareToken);
        }
    })();

    (function showWelcomeTooltip() {
        const tooltipKey = 'qloovoyage_welcome_tooltip_shown';
        const tooltipElement = document.getElementById('welcomeTooltip');
        
        if (tooltipElement && !localStorage.getItem(tooltipKey)) {
            tooltipElement.style.display = 'block';
            try {
                localStorage.setItem(tooltipKey, 'true');
            } catch (e) {
                console.warn("Could not save tooltip shown state to localStorage:", e);
            }
            console.log("Welcome tooltip shown and state saved.");
        } else if (tooltipElement) {
            tooltipElement.style.display = 'none';
        } else {
            console.warn("Welcome tooltip element not found in DOM.");
        }
    })();
});