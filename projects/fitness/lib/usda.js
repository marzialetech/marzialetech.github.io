// USDA FoodData Central API Integration
// API Documentation: https://fdc.nal.usda.gov/api-guide.html

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

// Get a free API key at: https://fdc.nal.usda.gov/api-key-signup.html
let USDA_API_KEY = 'mZgQB65dsjZTiHW8C7bqdVC5bTIW2ZFOqI7V9Lj1';

/**
 * Set the USDA API key
 * @param {string} key - Your USDA FoodData Central API key
 */
function setApiKey(key) {
    USDA_API_KEY = key;
}

/**
 * Search for foods by name
 * @param {string} query - Food name to search
 * @param {number} pageSize - Number of results (default 10)
 * @returns {array} Array of food search results
 */
async function searchFoods(query, pageSize = 10) {
    try {
        const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                pageSize: pageSize,
                dataType: ['Survey (FNDDS)', 'SR Legacy', 'Foundation', 'Branded'],
                sortBy: 'dataType.keyword',
                sortOrder: 'asc'
            })
        });
        
        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.foods || [];
    } catch (error) {
        console.error('USDA search error:', error);
        return [];
    }
}

/**
 * Get detailed nutrition info for a specific food
 * @param {number} fdcId - USDA FDC ID
 * @returns {object} Food details with nutrients
 */
async function getFoodDetails(fdcId) {
    try {
        const response = await fetch(
            `${USDA_API_BASE}/food/${fdcId}?api_key=${USDA_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`USDA API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('USDA details error:', error);
        return null;
    }
}

/**
 * Extract macros from USDA food data
 * @param {object} foodData - USDA food data object
 * @returns {object} Normalized macro data
 */
function extractMacros(foodData) {
    const nutrients = foodData.foodNutrients || [];
    
    // USDA nutrient IDs
    const NUTRIENT_IDS = {
        calories: [1008, 2047, 2048], // Energy (kcal)
        protein: [1003],              // Protein
        carbs: [1005],                // Carbohydrate, by difference
        fat: [1004]                   // Total lipid (fat)
    };
    
    const getMacro = (ids) => {
        for (const id of ids) {
            const nutrient = nutrients.find(n => 
                n.nutrient?.id === id || n.nutrientId === id
            );
            if (nutrient) {
                return nutrient.amount || nutrient.value || 0;
            }
        }
        return 0;
    };
    
    // Get serving info
    let servingSize = 100;
    let servingUnit = 'g';
    
    if (foodData.servingSize) {
        servingSize = foodData.servingSize;
        servingUnit = foodData.servingSizeUnit || 'g';
    } else if (foodData.foodPortions && foodData.foodPortions.length > 0) {
        const portion = foodData.foodPortions[0];
        servingSize = portion.gramWeight || 100;
        servingUnit = portion.modifier || portion.measureUnit?.name || 'g';
    }
    
    return {
        name: foodData.description || foodData.lowercaseDescription || 'Unknown Food',
        serving_size: servingSize,
        serving_unit: servingUnit,
        calories: Math.round(getMacro(NUTRIENT_IDS.calories)),
        protein: Math.round(getMacro(NUTRIENT_IDS.protein) * 10) / 10,
        carbs: Math.round(getMacro(NUTRIENT_IDS.carbs) * 10) / 10,
        fat: Math.round(getMacro(NUTRIENT_IDS.fat) * 10) / 10
    };
}

/**
 * Search and return normalized food data
 * @param {string} query - Food name to search
 * @returns {array} Array of normalized food objects with macros
 */
async function searchAndNormalize(query) {
    const results = await searchFoods(query);
    
    return results.map(food => {
        const macros = extractMacros(food);
        return {
            ...macros,
            fdcId: food.fdcId,
            brandName: food.brandName || null,
            dataType: food.dataType
        };
    });
}

/**
 * Quick lookup - get first matching food's macros
 * @param {string} query - Food name
 * @returns {object|null} Food data or null if not found
 */
async function quickLookup(query) {
    const results = await searchAndNormalize(query);
    
    if (results.length > 0) {
        // Prefer non-branded items (Survey/SR Legacy data)
        const preferred = results.find(f => 
            f.dataType === 'Survey (FNDDS)' || f.dataType === 'SR Legacy'
        );
        return preferred || results[0];
    }
    
    return null;
}

// Export
window.usda = {
    setApiKey,
    searchFoods,
    getFoodDetails,
    extractMacros,
    searchAndNormalize,
    quickLookup
};
