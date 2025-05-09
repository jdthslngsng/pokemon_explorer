const apiKey = '82056fa4-6f14-4ff1-9240-f8b4f0869100';
const favoritesContainer = document.getElementById('cards-container'); // it grabs the HTML element with the ID cards-container where favorite cards will be displayed on the page

async function fetchCardById(cardId) {
  const url = `https://api.pokemontcg.io/v2/cards/${cardId}`;
  try {
    const res = await fetch(url, { headers: { 'X-Api-Key': apiKey } });
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error('Error fetching card:', err);
    return null;
  }
}

// removes a favorite card both from the DOM and from localStorage
function removeFavorite(cardId, cardElement) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || []; // retrieve current favorites from localStorage or fallback to empty array
  favorites = favorites.filter(id => id !== cardId); // filter out the cardId that the user want to remove
  localStorage.setItem('favorites', JSON.stringify(favorites)); // save the updated favorites list back to localStorage
  cardElement.remove(); // remove the card's HTML element from the page

  // Check if all cards are removed
  const remainingCards = favoritesContainer.querySelectorAll('.card');
  if (remainingCards.length === 0) {
    favoritesContainer.innerHTML = '<p>No favorites added yet.</p>'; // if no cards are left, it displays the fallback message
  }
}

// loads and displays all favorite cards saved in localStorage
async function loadFavorites() {
  if (!favoritesContainer) return;

  const favoriteIds = JSON.parse(localStorage.getItem('favorites')) || [];

  if (favoriteIds.length === 0) {
    favoritesContainer.innerHTML = '<p>No favorites added yet.</p>';
    return;
  }

  let anyCardLoaded = false;

  // loop through each saved card ID
  for (const id of favoriteIds) {
    const card = await fetchCardById(id);
    if (card) {
      anyCardLoaded = true;

      // HTML structure to display he card on the page
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.innerHTML = `
        <div class="card-image">
          <img src="${card.images.small}" alt="${card.name}">
        </div>
        <div class="card-details">
          <h3>${card.name}</h3>
          <p>${card.set.name}</p>
          <button class="remove-btn">Remove</button>
        </div>
      `;

      // event listener to the remove button to remove the card when clicked
      const removeBtn = cardEl.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => removeFavorite(card.id, cardEl));

      favoritesContainer.appendChild(cardEl); // append the card to the container
    }
  }

  // if no cards were successfully loaded (e.g., bad IDs), show the fallback message
  if (!anyCardLoaded) {
    favoritesContainer.innerHTML = '<p>No favorites added yet.</p>';
  }
}

// automatically call loadFavorites only if the user is on the favorites page
if (window.location.pathname.includes('favorites.html')) {
  loadFavorites();
}
