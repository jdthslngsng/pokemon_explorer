const apiBase = 'https://pokeapi.co/api/v2/pokemon/';

// capitalizes the first letter of a string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// used to style stat bars with different colors
function statColorClass(statName) {
  switch (statName.toLowerCase()) {
    case 'hp': return 'hp-bar';
    case 'attack': return 'attack-bar';
    case 'defense': return 'defense-bar';
    case 'speed': return 'speed-bar';
    case 'special-attack': return 'spatk-bar';
    case 'special-defense': return 'spdef-bar';
    default: return '';
  }
}

// main function to compare two Pokémon based on total base stats
function comparePokemon() {
  const p1 = document.getElementById('poke1').value.trim().toLowerCase();
  const p2 = document.getElementById('poke2').value.trim().toLowerCase();

  // show alert if either input is empty
  if (!p1 || !p2) {
    alert('Please enter both Pokémon names.');
    return;
  }

  // fetch both Pokémon data in parallel using Promise.all
  Promise.all([
    fetch(apiBase + p1).then(res => {
      if (!res.ok) throw new Error(`Pokémon "${p1}" not found`);
      return res.json();
    }),
    fetch(apiBase + p2).then(res => {
      if (!res.ok) throw new Error(`Pokémon "${p2}" not found`);
      return res.json();
    })
  ])
    .then(([data1, data2]) => {

      // calculate total base stats for each Pokémon
      const total1 = data1.stats.reduce((sum, s) => sum + s.base_stat, 0);
      const total2 = data2.stats.reduce((sum, s) => sum + s.base_stat, 0);

      // determine which Pokémon has higher total stats
      const isP1Winner = total1 > total2;
      const isP2Winner = total2 > total1;

      // render the comparison results and inject into DOM
      document.getElementById('compareResult').innerHTML = `
        <div class="compare-container">
          ${renderComparison(data1, total1, isP1Winner)}
          ${renderComparison(data2, total2, isP2Winner)}
        </div>
      `;
    })
    .catch(err => {
      alert(err.message); // show error message if fetch fails (e.g., invalid name)
    });
}

// HTML layout for a Pokémon's stat comparison card
function renderComparison(data, totalStat, isWinner = false) {
return `
<div class="pokemon-card ${isWinner ? 'winner-card' : ''}">
  <h2>${capitalizeFirstLetter(data.name)}</h2>
  <div class="card-content">
    <div class="image-section">
      <img src="${data.sprites.front_default}" class="poke_img" alt="${data.name}" />
    </div>
    <div class="stat-section">
      ${data.stats.map(stat => {
        const name = stat.stat.name;
        const value = stat.base_stat;
        return `
          <div class="stat">
            <strong>${capitalizeFirstLetter(name)}:</strong>
            <div class="stat-bar">
              <div class="stat-bar-fill ${statColorClass(name)}" style="width: ${Math.min(value, 100)}%;">
                ${value}
              </div>
            </div>
          </div>
        `;
      }).join('')}
      <div class="total-stat">Total Stats: ${totalStat}</div>
    </div>
  </div>
</div>
`;
}
