// Base URL for the PokéAPI
const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';

// Defines the Pokémon ID ranges for each generation
const GENERATION_RANGES = {
    kanto: { limit: 151, offset: 0, title: "Pokémon Leaf Green Builder" },
    johto: { limit: 100, offset: 151, title: "Pokémon Gold/Silver Builder" },
    hoenn: { limit: 135, offset: 251, title: "Pokémon Ruby/Sapphire Builder" },
};

/**
 * Transforms the raw data from the PokéAPI into a simplified format our app can use.
 * @param {object} rawData - The raw data object for a single Pokémon from PokéAPI.
 * @returns {object} A simplified Pokémon object.
 */
function transformPokemonData(rawData) {
    // Helper to extract stat values safely
    const getStat = (name) => rawData.stats.find(s => s.stat.name === name)?.base_stat || 0;

    return {
        id: rawData.id,
        name: rawData.name,
        types: rawData.types.map(t => t.type.name),
        abilities: rawData.abilities.map(a => a.ability.name),
        stats: {
            hp: getStat('hp'),
            atk: getStat('attack'),
            def: getStat('defense'),
            spa: getStat('special-attack'),
            spd: getStat('special-defense'),
            spe: getStat('speed'),
        },
        // Note: Location and evolution data are not provided by this basic API call
        // and would require more complex fetching from other endpoints (species, encounters).
        // For this version, we will leave them blank.
        locations: [], 
        evolvesTo: null,
        evoMethod: null,
    };
}

/**
 * Fetches detailed data for a single Pokémon.
 * @param {string} url - The URL of the Pokémon resource.
 * @returns {Promise<object|null>} A promise that resolves to the simplified Pokémon data, or null on error.
 */
async function fetchPokemonDetails(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const rawData = await response.json();
        return transformPokemonData(rawData);
    } catch (error) {
        console.error(`Failed to fetch details from ${url}:`, error);
        return null; // Return null for failed requests
    }
}

/**
 * Main function to fetch all Pokémon data for a selected generation.
 * It caches the results in sessionStorage to speed up subsequent loads.
 * @param {string} generationKey - The key for the generation (e.g., 'kanto').
 * @returns {Promise<{title: string, pokemon: object[]}>} A promise that resolves to an object containing the title and Pokémon list.
 */
export async function fetchGenerationData(generationKey) {
    const cacheKey = `pokemon-data-${generationKey}`;
    const cachedData = sessionStorage.getItem(cacheKey);

    // If we have cached data, parse and return it immediately
    if (cachedData) {
        console.log(`Loading ${generationKey} data from cache.`);
        return JSON.parse(cachedData);
    }

    console.log(`Fetching new ${generationKey} data from PokéAPI.`);
    const generationInfo = GENERATION_RANGES[generationKey];
    if (!generationInfo) {
        throw new Error(`Invalid generation key: ${generationKey}`);
    }

    try {
        // 1. Fetch the list of Pokémon for the generation
        const listResponse = await fetch(`${POKEAPI_BASE_URL}pokemon?limit=${generationInfo.limit}&offset=${generationInfo.offset}`);
        if (!listResponse.ok) throw new Error('Failed to fetch Pokémon list.');
        const pokemonList = await listResponse.json();

        // 2. Create an array of promises to fetch details for each Pokémon in parallel
        const detailPromises = pokemonList.results.map(pokemon => fetchPokemonDetails(pokemon.url));

        // 3. Wait for all detail fetches to complete
        const resolvedDetails = await Promise.all(detailPromises);
        
        // 4. Filter out any null results from failed fetches
        const pokemon = resolvedDetails.filter(p => p !== null);

        // 5. Prepare the final data object
        const finalData = {
            title: generationInfo.title,
            pokemon: pokemon,
        };

        // 6. Cache the new data in sessionStorage before returning
        sessionStorage.setItem(cacheKey, JSON.stringify(finalData));

        return finalData;

    } catch (error) {
        console.error(`Could not fetch data for generation ${generationKey}:`, error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

