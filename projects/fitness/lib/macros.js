// Macro and TDEE Calculations

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor formula
 * @param {number} weightLbs - Weight in pounds
 * @param {number} heightInches - Height in inches
 * @param {number} age - Age in years
 * @param {string} sex - 'male' or 'female'
 * @returns {number} BMR in calories/day
 */
function calculateBMR(weightLbs, heightInches, age, sex) {
    const weightKg = weightLbs * 0.453592;
    const heightCm = heightInches * 2.54;
    
    if (sex === 'female') {
        return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }
    // Male or default
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
}

/**
 * Activity level multipliers for TDEE
 */
const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Light exercise 1-3 days/week
    moderate: 1.55,      // Moderate exercise 3-5 days/week
    active: 1.725,       // Hard exercise 6-7 days/week
    very_active: 1.9     // Very hard exercise, physical job
};

/**
 * Calculate Total Daily Energy Expenditure
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - Activity level key
 * @returns {number} TDEE in calories/day
 */
function calculateTDEE(bmr, activityLevel) {
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
    return Math.round(bmr * multiplier);
}

/**
 * Calculate daily calorie target for weight loss
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {number} weeklyLossRate - Pounds to lose per week (0.5 - 2)
 * @returns {number} Daily calorie target
 */
function calculateDailyCalories(tdee, weeklyLossRate) {
    // 1 lb of fat ≈ 3500 calories
    const dailyDeficit = (weeklyLossRate * 3500) / 7;
    const target = Math.round(tdee - dailyDeficit);
    
    // Never go below 1200 calories for safety
    return Math.max(target, 1200);
}

/**
 * Calculate macro targets in grams
 * @param {number} calories - Daily calorie target
 * @param {object} ratios - { protein: 0.4, carbs: 0.3, fat: 0.3 }
 * @returns {object} { protein, carbs, fat } in grams
 */
function calculateMacroTargets(calories, ratios = { protein: 0.4, carbs: 0.3, fat: 0.3 }) {
    // Calories per gram: Protein=4, Carbs=4, Fat=9
    return {
        protein: Math.round((calories * ratios.protein) / 4),
        carbs: Math.round((calories * ratios.carbs) / 4),
        fat: Math.round((calories * ratios.fat) / 9)
    };
}

/**
 * Calculate all daily targets from user settings
 * @param {object} settings - User settings object
 * @returns {object} { bmr, tdee, calories, protein, carbs, fat, deficit }
 */
function calculateAllTargets(settings) {
    if (!settings || !settings.current_weight || !settings.height_inches || !settings.age) {
        // Return defaults if settings incomplete
        return {
            bmr: 1800,
            tdee: 2200,
            calories: 1700,
            protein: 170,
            carbs: 128,
            fat: 57,
            deficit: 500
        };
    }
    
    const bmr = calculateBMR(
        settings.current_weight,
        settings.height_inches,
        settings.age,
        settings.sex || 'male'
    );
    
    const tdee = calculateTDEE(bmr, settings.activity_level || 'moderate');
    const weeklyLossRate = settings.weekly_loss_rate || 1.0;
    const calories = calculateDailyCalories(tdee, weeklyLossRate);
    
    const ratios = {
        protein: settings.protein_ratio || 0.4,
        carbs: settings.carbs_ratio || 0.3,
        fat: settings.fat_ratio || 0.3
    };
    
    const macros = calculateMacroTargets(calories, ratios);
    
    return {
        bmr: Math.round(bmr),
        tdee,
        calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        deficit: tdee - calories
    };
}

/**
 * Calculate totals from a list of daily logs
 * @param {array} logs - Array of daily log entries with food data
 * @returns {object} { calories, protein, carbs, fat }
 */
function calculateDayTotals(logs) {
    return logs.reduce((totals, log) => {
        if (log.food) {
            const servings = log.servings || 1;
            totals.calories += (log.food.calories || 0) * servings;
            totals.protein += (log.food.protein || 0) * servings;
            totals.carbs += (log.food.carbs || 0) * servings;
            totals.fat += (log.food.fat || 0) * servings;
        }
        return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

/**
 * Calculate remaining macros for the day
 * @param {object} targets - Daily targets
 * @param {object} consumed - Consumed totals
 * @returns {object} { calories, protein, carbs, fat } remaining
 */
function calculateRemaining(targets, consumed) {
    return {
        calories: Math.max(0, targets.calories - consumed.calories),
        protein: Math.max(0, targets.protein - consumed.protein),
        carbs: Math.max(0, targets.carbs - consumed.carbs),
        fat: Math.max(0, targets.fat - consumed.fat)
    };
}

/**
 * Project weight over time
 * @param {number} startWeight - Starting weight in lbs
 * @param {number} weeklyLossRate - Lbs to lose per week
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date (default: end of year)
 * @returns {array} Array of { date, weight } projections
 */
function projectWeight(startWeight, weeklyLossRate, startDate = new Date(), endDate = null) {
    if (!endDate) {
        endDate = new Date(startDate.getFullYear(), 11, 31); // Dec 31
    }
    
    const projections = [];
    const dailyLoss = weeklyLossRate / 7;
    let currentDate = new Date(startDate);
    let currentWeight = startWeight;
    
    while (currentDate <= endDate) {
        projections.push({
            date: currentDate.toISOString().split('T')[0],
            weight: Math.round(currentWeight * 10) / 10
        });
        
        currentDate.setDate(currentDate.getDate() + 7); // Weekly points
        currentWeight -= weeklyLossRate;
        
        // Don't project below a reasonable weight
        if (currentWeight < 100) break;
    }
    
    return projections;
}

/**
 * Calculate projected total weight loss
 * @param {number} weeklyLossRate - Lbs to lose per week
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Total projected weight loss in lbs
 */
function calculateProjectedLoss(weeklyLossRate, startDate = new Date(), endDate = null) {
    if (!endDate) {
        endDate = new Date(startDate.getFullYear(), 11, 31);
    }
    
    const weeks = (endDate - startDate) / (7 * 24 * 60 * 60 * 1000);
    return Math.round(weeks * weeklyLossRate * 10) / 10;
}

// Export
window.macros = {
    calculateBMR,
    calculateTDEE,
    calculateDailyCalories,
    calculateMacroTargets,
    calculateAllTargets,
    calculateDayTotals,
    calculateRemaining,
    projectWeight,
    calculateProjectedLoss,
    ACTIVITY_MULTIPLIERS
};
