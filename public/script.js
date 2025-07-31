// public/script.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const screens = {
        welcome: document.getElementById('welcomeScreen'),
        city: document.getElementById('citySelectionScreen'),
        interest: document.getElementById('interestSelectionScreen'),
        itinerary: document.getElementById('itineraryScreen')
    };
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

    // --- State Management ---
    let selectedCity = null;
    let selectedInterests = [];

    // --- Predefined Cities & Interests ---
    const POPULAR_CITIES = ['Tokyo', 'Paris', 'New York', 'London', 'Kyoto', 'Berlin', 'Barcelona', 'Osaka', 'Seoul', 'Mexico City'];
    // Keep INTEREST_IMAGE_MAP for interest names, even though we don't use unsplashQuery for images anymore
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
    };

    // --- Navigation Functions ---
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
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

    // --- Welcome Screen Logic ---
    startButton.addEventListener('click', () => {
        // showScreen('city'); // Call initialization function instead
        initializeCitySelection();
    });

    // --- City Selection Screen Logic ---
    function initializeCitySelection() {
        showScreen('city');
        cityButtonContainer.innerHTML = ''; // Clear previous buttons
        selectedCity = null;
        nextToInterestsBtn.disabled = true;
        hideStatus(citySelectionStatus);

        POPULAR_CITIES.forEach(cityName => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-outline-primary city-select-btn';
            button.textContent = cityName;
            button.dataset.city = cityName;

            button.addEventListener('click', () => {
                document.querySelectorAll('.city-select-btn.active').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                selectedCity = cityName;
                nextToInterestsBtn.disabled = false;
                showStatus(citySelectionStatus, `Selected: ${cityName}`, "success");
            });

            cityButtonContainer.appendChild(button);
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

    generateItineraryBtn.addEventListener('click', async () => {
         if (!selectedCity || selectedInterests.length === 0) {
             showStatus(interestSelectionStatus, "Please select a city and at least one interest.", "warning");
             return;
         }

         showScreen('itinerary');
         showStatus(itineraryStatus, "Creating your personalized TasteTrail...", "info", true);
         itineraryOutput.style.display = 'none';
         copyItineraryBtn.disabled = true;

         try {
             console.log("Sending request for itinerary:", { destination: selectedCity, interests: selectedInterests });
             const response = await fetch('/api/generate-itinerary', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     destination: selectedCity,
                     interests: selectedInterests
                 })
             });

             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || `API request failed with status ${response.status}`);
             }

             const data = await response.json();
             console.log("Received itinerary response:", data);
             hideStatus(itineraryStatus);
             if (data.error) {
                  showStatus(itineraryStatus, data.error, "danger");
                  return;
             }
             displayItinerary(data);

         } catch (error) {
             console.error("Error generating itinerary:", error);
             hideStatus(itineraryStatus);
             showStatus(itineraryStatus, `Failed to generate itinerary: ${error.message}`, "danger");
         }
    });

    // --- Itinerary Screen Logic ---
    function displayItinerary(data) {
         itineraryTitle.textContent = `Your TasteTrail in ${selectedCity}`;
         if (!data.itinerary || data.itinerary.length === 0 || data.itinerary[0].places.length === 0) {
              itineraryContent.innerHTML = '<div class="alert alert-info text-center">No places found matching your tastes in this location. Try adjusting your interests.</div>';
              itineraryOutput.style.display = 'block';
              copyItineraryBtn.disabled = true;
              return;
         }

         let html = '';
         data.itinerary.forEach(day => {
             html += `<div class="itinerary-day mb-4">`;
             html += `<h3 class="mb-3">Day ${day.dayNumber}</h3>`; // Removed date
             html += `<div class="row g-3">`;

             day.places.forEach(place => {
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
                 }

                 html += `
                     <div class="col-12">
                         <div class="card h-100">
                             <div class="card-body">
                                 <h5 class="card-title">
                                     <i class="bi ${iconClass} me-2"></i>
                                     ${place.name}
                                 </h5>
                                 <h6 class="card-subtitle mb-2 text-muted">${place.type}</h6>
                                 <p class="card-text">${place.description || 'No description available from Qloo.'}</p>
                                 <div class="explanation bg-light p-2 rounded">
                                     <strong>Why this recommendation?</strong>
                                     <p class="mb-0">${place.whyRecommended}</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 `;
             });

             html += `</div>`;
             html += `</div>`;
         });

         itineraryContent.innerHTML = html;
         itineraryOutput.style.display = 'block';
         copyItineraryBtn.disabled = false;
    }

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

    // --- Initial State ---
    // App starts on welcome screen by default due to .active class
});
