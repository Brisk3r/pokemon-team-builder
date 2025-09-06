/**
 * pokeapi-service.js
 * * This new, simplified service has one job: fetch the pre-built JSON data file
 * for the selected generation. This is much faster and more reliable than
 * making hundreds of live API calls.
 */

// An object mapping our selection keys to the pre-built JSON files
const GENERATION_FILES = {
    kanto: 'leafgreen-data.json', // We assume you named the output file this
    johto: 'crystal-data.json',  // When you're ready, you would generate and add these
    hoenn: 'emerald-data.json',  // files as well.
};

/**
 * Fetches and returns the pre-built data for a given generation.
 * @param {string} generationKey - The key for the generation (e.g., 'kanto').
 * @returns {Promise<object>} A promise that resolves to the entire data object.
 */
export async function fetchGenerationData(generationKey) {
    const fileName = GENERATION_FILES[generationKey];
    if (!fileName) {
        throw new Error(`Invalid generation key: ${generationKey}`);
    }

    console.log(`Loading pre-built data from ${fileName}`);
    
    try {
        const response = await fetch(fileName); // Fetch the local file
        if (!response.ok) {
            throw new Error(`Could not find the data file: ${fileName}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Failed to load data from ${fileName}:`, error);
        // Re-throw the error so the main application can handle it
        throw error;
    }
}

