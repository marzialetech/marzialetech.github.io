// Natural Language Food Parser
// Parses input like "2 eggs, chicken breast 6oz, rice 1 cup"

/**
 * Common unit conversions to standardize input
 */
const UNIT_ALIASES = {
    'oz': 'oz',
    'ounce': 'oz',
    'ounces': 'oz',
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'lb': 'lb',
    'lbs': 'lb',
    'pound': 'lb',
    'pounds': 'lb',
    'cup': 'cup',
    'cups': 'cup',
    'c': 'cup',
    'tbsp': 'tbsp',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'tsp': 'tsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'slice': 'slice',
    'slices': 'slice',
    'piece': 'piece',
    'pieces': 'piece',
    'serving': 'serving',
    'servings': 'serving',
    'scoop': 'scoop',
    'scoops': 'scoop',
    'ml': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'l': 'l',
    'liter': 'l',
    'liters': 'l'
};

/**
 * Parse a single food entry string
 * @param {string} input - Single food entry like "2 eggs" or "chicken breast 6oz"
 * @returns {object} { quantity, unit, foodName }
 */
function parseFoodEntry(input) {
    input = input.trim().toLowerCase();
    
    // Default values
    let quantity = 1;
    let unit = 'serving';
    let foodName = input;
    
    // Pattern 1: "2 eggs" or "2x eggs" (quantity at start)
    const startQuantityMatch = input.match(/^(\d+\.?\d*)\s*x?\s+(.+)$/);
    if (startQuantityMatch) {
        quantity = parseFloat(startQuantityMatch[1]);
        foodName = startQuantityMatch[2];
    }
    
    // Pattern 2: "chicken 6oz" or "rice 1 cup" (quantity + unit at end)
    const endQuantityMatch = foodName.match(/^(.+?)\s+(\d+\.?\d*)\s*(oz|ounce|ounces|g|gram|grams|cup|cups|tbsp|tsp|slice|slices|ml|l|lb|lbs|serving|servings|scoop|scoops|piece|pieces)s?$/i);
    if (endQuantityMatch) {
        foodName = endQuantityMatch[1];
        quantity = parseFloat(endQuantityMatch[2]);
        unit = UNIT_ALIASES[endQuantityMatch[3].toLowerCase()] || endQuantityMatch[3];
    }
    
    // Pattern 3: "1 cup rice" (quantity + unit at start)
    const startUnitMatch = foodName.match(/^(\d+\.?\d*)\s*(oz|ounce|ounces|g|gram|grams|cup|cups|tbsp|tsp|slice|slices|ml|l|lb|lbs|serving|servings|scoop|scoops|piece|pieces)s?\s+(.+)$/i);
    if (startUnitMatch) {
        quantity = parseFloat(startUnitMatch[1]);
        unit = UNIT_ALIASES[startUnitMatch[2].toLowerCase()] || startUnitMatch[2];
        foodName = startUnitMatch[3];
    }
    
    // Clean up food name
    foodName = foodName.trim();
    
    return {
        quantity,
        unit,
        foodName,
        original: input
    };
}

/**
 * Parse multiple food entries from text input
 * @param {string} input - Full text input with multiple foods
 * @returns {array} Array of parsed food entries
 */
function parseMultipleFoods(input) {
    // Split by common delimiters: comma, newline, "and", semicolon
    const entries = input
        .split(/[,;\n]|\band\b/i)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    
    return entries.map(parseFoodEntry);
}

/**
 * Fuzzy match a food name against a list of foods
 * @param {string} query - Search query
 * @param {array} foods - Array of food objects with 'name' property
 * @param {number} threshold - Minimum match score (0-1)
 * @returns {array} Sorted array of { food, score } matches
 */
function fuzzyMatchFoods(query, foods, threshold = 0.3) {
    query = query.toLowerCase();
    
    const matches = foods.map(food => {
        const name = food.name.toLowerCase();
        const score = calculateSimilarity(query, name);
        return { food, score };
    });
    
    return matches
        .filter(m => m.score >= threshold)
        .sort((a, b) => b.score - a.score);
}

/**
 * Calculate string similarity (Dice coefficient with word matching)
 * @param {string} s1 - First string
 * @param {string} s2 - Second string
 * @returns {number} Similarity score 0-1
 */
function calculateSimilarity(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    
    // Exact match
    if (s1 === s2) return 1;
    
    // Contains match (high score if query is substring)
    if (s2.includes(s1)) return 0.9;
    if (s1.includes(s2)) return 0.8;
    
    // Word-based matching
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    let matchedWords = 0;
    for (const w1 of words1) {
        if (words2.some(w2 => w2.includes(w1) || w1.includes(w2))) {
            matchedWords++;
        }
    }
    
    if (matchedWords > 0) {
        return matchedWords / Math.max(words1.length, words2.length);
    }
    
    // Character-level bigram similarity (Dice coefficient)
    const bigrams1 = getBigrams(s1);
    const bigrams2 = getBigrams(s2);
    
    const intersection = bigrams1.filter(b => bigrams2.includes(b)).length;
    return (2 * intersection) / (bigrams1.length + bigrams2.length);
}

/**
 * Get character bigrams from a string
 * @param {string} str - Input string
 * @returns {array} Array of bigrams
 */
function getBigrams(str) {
    const bigrams = [];
    for (let i = 0; i < str.length - 1; i++) {
        bigrams.push(str.slice(i, i + 2));
    }
    return bigrams;
}

/**
 * Match parsed entries against saved foods
 * @param {array} parsedEntries - Array of parsed food entries
 * @param {array} savedFoods - Array of saved food objects
 * @returns {array} Array of { entry, matches, bestMatch }
 */
function matchAgainstSavedFoods(parsedEntries, savedFoods) {
    return parsedEntries.map(entry => {
        const matches = fuzzyMatchFoods(entry.foodName, savedFoods);
        return {
            entry,
            matches: matches.slice(0, 5), // Top 5 matches
            bestMatch: matches.length > 0 && matches[0].score > 0.5 ? matches[0] : null
        };
    });
}

// Export
window.parser = {
    parseFoodEntry,
    parseMultipleFoods,
    fuzzyMatchFoods,
    matchAgainstSavedFoods,
    calculateSimilarity
};
