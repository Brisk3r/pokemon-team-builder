// This module is responsible for all communication with the PokéAPI.

const API_BASE_URL = 'https://pokeapi.co/api/v2';

// Caching to avoid re-fetching data on every click
const cache = new Map();

// Configuration for each generation
const GENERATION_CONFIG = {
    kanto: {
        title: 'Pokémon Leaf Green Team Builder',
        pokedexLimit: 151,
        pokedexOffset: 0,
        gameVersionForLocations: 'leafgreen'
    },
    johto: {
        title: 'Pokémon Gold/Silver Team Builder',
        pokedexLimit: 100,
        pokedexOffset: 151,
        gameVersionForLocations: 'gold'
    },
    hoenn: {
        title: 'Pokémon Ruby/Sapphire Team Builder',
        pokedexLimit: 135,
        pokedexOffset: 251,
        gameVersionForLocations: 'ruby'
    }
};

/**
 * Fetches and transforms all necessary data for a given generation.
 * @param {string} generationKey - e.g., 'kanto', 'johto'
 * @returns {Promise<Object>} An object containing the title and the formatted Pokémon data.
 */
export async function fetchGenerationData(generationKey) {
    if (cache.has(generationKey)) {
        return cache.get(generationKey);
    }

    const config = GENERATION_CONFIG[generationKey];
    if (!config) throw new Error(`Invalid generation key: ${generationKey}`);

    // 1. Fetch the list of Pokémon for the generation
    const pokedexUrl = `${API_BASE_URL}/pokemon?limit=${config.pokedexLimit}&offset=${config.pokedexOffset}`;
    const pokedexResponse = await fetch(pokedexUrl);
    const pokedexData = await pokedexResponse.json();

    // 2. Fetch detailed data for each Pokémon in parallel
    const pokemonPromises = pokedexData.results.map(p => fetch(p.url).then(res => res.json()));
    const detailedPokemonData = await Promise.all(pokemonPromises);

    // 3. Transform the raw API data into our app's format
    const transformedPokemon = detailedPokemonData.map(p => transformPokemonData(p, config.gameVersionForLocations));
    
    const result = {
        title: config.title,
        pokemon: transformedPokemon
    };
    
    cache.set(generationKey, result); // Save to cache
    return result;
}

/**
 * Transforms a single Pokémon's raw API data into the simple format our app uses.
 * @param {Object} apiPokemon - The raw data object from PokéAPI.
 * @param {string} gameVersion - The game version to check for locations (e.g., 'leafgreen').
 * @returns {Object} A simplified Pokémon object for our app.
 */
function transformPokemonData(apiPokemon, gameVersion) {
    // This is a simplified transformation. A real implementation would need
    // to fetch evolution chain data from p.species.url, which is another API call.
    // For simplicity, we'll leave evolution data static for now.
    
    return {
        id: apiPokemon.id,
        name: apiPokemon.name,
        type1: apiPokemon.types[0]?.type.name,
        type2: apiPokemon.types[1]?.type.name || null,
        locations: [], // Location data from the API is complex and would need its own function
        abilities: apiPokemon.abilities.map(a => a.ability.name),
        stats: {
            hp: apiPokemon.stats.find(s => s.stat.name === 'hp').base_stat,
            atk: apiPokemon.stats.find(s => s.stat.name === 'attack').base_stat,
            def: apiPokemon.stats.find(s => s.stat.name === 'defense').base_stat,
            spa: apiPokemon.stats.find(s => s.stat.name === 'special-attack').base_stat,
            spd: apiPokemon.stats.find(s => s.stat.name === 'special-defense').base_stat,
            spe: apiPokemon.stats.find(s => s.stat.name === 'speed').base_stat
        },
        evolvesTo: null, // This would require fetching from the species endpoint
        evoMethod: null
    };
}
