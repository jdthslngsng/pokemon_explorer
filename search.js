const apiKey = '82056fa4-6f14-4ff1-9240-f8b4f0869100';

// DOM element references
const cardsContainer = document.getElementById('cards-container');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const modalName = document.getElementById('modal-name');
const modalSet = document.getElementById('modal-set');
const favoriteBtn = document.getElementById('favorite-btn');

// variables for managing state
let currentCard = null;
let currentCards = [];
let currentQuery = '';
let currentPage = 1;
const pageSize = 50;

// static data for generation search filters
const generationSets = {
  "generation-i": ["base1", "base2", "base3", "gym1", "gym2"],
  "generation-ii": ["neo1", "neo2", "neo3", "neo4"],
  "generation-iii": ["ex1", "ex2", "ex3", "ex4"]
};

const generationDexRanges = {
  "generation-i": [1, 151],
  "generation-ii": [152, 251],
  "generation-iii": [252, 386],
  "generation-iv": [387, 493],
  "generation-v": [494, 649],
  "generation-vi": [650, 721],
  "generation-vii": [722, 809],
  "generation-viii": [810, 898],
  "generation-ix": [899, 1010]
};

// fetches cards from the Pokémon TCG API using a query string and page number
async function fetchCards(query = '', page = 1) {
  currentQuery = query;
  currentPage = page;
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=${pageSize}&page=${page}`;
  try {
    const res = await fetch(url, { headers: { 'X-Api-Key': apiKey } });
    const data = await res.json();
    displayCards(data.data);
    updatePagination(data.totalCount);
  } catch (err) {
    console.error('Error fetching cards:', err);
  }
}

// displays a list of cards after fetching
function displayCards(cards) {
  currentCards = cards.slice(); // save for sorting
  applySort(); // apply sorting preference
}

// applies alphabetical sorting based on dropdown value
function applySort() {
  const sortValue = document.getElementById('sort-order').value;
  let sortedCards = [...currentCards];

  if (sortValue === 'az') {
    sortedCards.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortValue === 'za') {
    sortedCards.sort((a, b) => b.name.localeCompare(a.name));
  }

  cardsContainer.innerHTML = '';
  if (sortedCards.length === 0) {
    cardsContainer.innerHTML = '<p>No cards found.</p>';
    return;
  }

  // create and insert each card
  sortedCards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.innerHTML = `
      <div class="card-image">
        <img src="${card.images.small}" alt="${card.name}">
      </div>
      <div class="card-details">
        <h3>${card.name}</h3>
        <p>${card.set.name}</p>
      </div>
    `;
    cardEl.addEventListener('click', () => openModal(card));
    cardsContainer.appendChild(cardEl);
  });
}

// opens the modal with info about the card
function openModal(card) {
  currentCard = card;
  modalImg.src = card.images.large || card.images.small;
  modalName.textContent = card.name;
  modalSet.innerHTML = `
    <p><strong>Set:</strong> ${card.set.name}</p>
    <p><strong>Type:</strong> ${card.types?.join(', ') || 'N/A'}</p>
    <p><strong>Supertype:</strong> ${card.supertype || 'N/A'}</p>
    ${card.subtypes ? `<p><strong>Subtypes:</strong> ${card.subtypes.join(', ')}</p>` : ''}
    <p><strong>HP:</strong> ${card.hp || 'N/A'}</p>
    <p><strong>Rarity:</strong> ${card.rarity || 'N/A'}</p>
    ${card.flavorText ? `<em>"${card.flavorText}"</em><br>` : ''}
    ${card.attacks ? `<p><strong>Attacks:</strong><ul>${card.attacks.map(a => `<li><strong>${a.name}</strong> – ${a.text || ''} (Cost: ${a.convertedEnergyCost}, Damage: ${a.damage || '0'})</li>`).join('')}</ul></p>` : ''}
    ${card.weaknesses ? `<p><strong>Weaknesses:</strong> ${card.weaknesses.map(w => `${w.type} ×${w.value}`).join(', ')}</p>` : ''}
    ${card.resistances ? `<p><strong>Resistances:</strong> ${card.resistances.map(r => `${r.type} ×${r.value}`).join(', ')}</p>` : ''}
  `;
  favoriteBtn.textContent = isFavorite(card.id) ? 'Added' : 'Add to Favorites';
  modal.style.display = 'flex';
}

// closes the modal view
function closeModal() {
  modal.style.display = 'none';
}

// handles favorite toggle logic on modal button click
favoriteBtn.addEventListener('click', () => {
  if (!currentCard) return;
  const wasFavorite = isFavorite(currentCard.id);
  toggleFavorite(currentCard.id);
  if (!wasFavorite) favoriteBtn.textContent = 'Added';
});

// toggles a card ID in localStorage favorites array
function toggleFavorite(cardId) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favorites.includes(cardId)) {
    favorites = favorites.filter(id => id !== cardId);
  } else {
    favorites.push(cardId);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// checks if a card is already in favorites
function isFavorite(cardId) {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  return favorites.includes(cardId);
}

// handles search by generation using set IDs or Pokédex ranges
async function searchByGeneration(gen) {
  const sets = generationSets[gen.toLowerCase()];
  if (sets) {
    const query = sets.map(setId => `set.id:${setId}`).join(" OR ");
    fetchCards(query, 1);
    return;
  }

  const range = generationDexRanges[gen.toLowerCase()];
  if (!range) {
    alert("Invalid generation or not supported.");
    return;
  }

  const [start, end] = range;
  const pokemonNames = [];

  // uses PokéAPI to convert Pokédex range to Pokémon names
  for (let id = start; id <= end; id++) {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await res.json();
      pokemonNames.push(data.name);
    } catch (e) {
      console.error(`Error fetching Pokémon ID ${id}`);
    }
  }

  // query using all Pokémon names
  const queries = pokemonNames.map(name => `name:"${name}"`).join(' OR ');
  fetchCards(queries, 1);
}

// change page number and fetch new page
function changePage(delta) {
  const newPage = currentPage + delta;
  if (newPage < 1) return;
  fetchCards(currentQuery, newPage);
}

// updates the pagination display
function updatePagination(totalCount) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const pageNumbers = document.getElementById('page-numbers');
  pageNumbers.innerHTML = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prev-btn').disabled = currentPage === 1;
  document.getElementById('next-btn').disabled = currentPage === totalPages;
}

// handles search form submission with generation/type/rarity filters
document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('search-input').value.trim();
  let type = document.getElementById('type-filter').value;
  const rarity = document.getElementById('rarity-filter').value;

  // handle Electric type alias used by PokéAPI
  if (type === 'Electric') type = 'Lightning';

  const parts = [];
  if (name) {
    const lower = name.toLowerCase();
    // check if generation-based search is requested
    if (generationSets[lower] || generationDexRanges[lower]) {
      searchByGeneration(lower);
      return;
    }
    parts.push(`name:${name}`);
  }
  if (type) parts.push(`types:${type}`);
  if (rarity) parts.push(`rarity:"${rarity}"`);

  const query = parts.join(' ');
  fetchCards(query, 1);
});

// it triggers sorting whenever dropdown changes
document.getElementById('sort-order').addEventListener('change', applySort);

// closes modal when clicking outside of it
window.onclick = (e) => {
  if (e.target === modal) closeModal();
};

// Initial load which fetches all cards
fetchCards('');
