// Supabase Configuration - Your project credentials (anon key is safe to expose; RLS protects data)
const SUPABASE_URL = 'https://qvrrlfzogtuahmvsbvmu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cnJsZnpvZ3R1YWhtdnNidm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjY2OTQsImV4cCI6MjA4NTIwMjY5NH0.JmbIVK2JpeuPfkimIm00J63cAoIH7steTBpvgHnzDuU';

// Auto-initialize Supabase client on load
let supabaseClient = null;
try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.__supabaseClient = supabaseClient;
    }
} catch (e) {
    console.warn('Supabase client init failed:', e);
}

function getSupabase() {
    return window.__supabaseClient || supabaseClient;
}

// Get current user id for RLS (must be set on all inserts when using per-user data)
async function getCurrentUserId() {
    const client = getSupabase();
    if (!client || !client.auth) return null;
    const { data: { user } } = await client.auth.getUser();
    return user?.id || null;
}

/*
SQL Schema - Run this in Supabase SQL Editor:

-- Foods repository (your personal food database)
CREATE TABLE foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    serving_size DECIMAL NOT NULL DEFAULT 1,
    serving_unit TEXT NOT NULL DEFAULT 'serving',
    calories DECIMAL NOT NULL DEFAULT 0,
    protein DECIMAL NOT NULL DEFAULT 0,
    carbs DECIMAL NOT NULL DEFAULT 0,
    fat DECIMAL NOT NULL DEFAULT 0,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipes (saved combinations of foods)
CREATE TABLE recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe items (foods in each recipe)
CREATE TABLE recipe_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
    servings DECIMAL NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily food logs
CREATE TABLE daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
    servings DECIMAL NOT NULL DEFAULT 1,
    meal_type TEXT NOT NULL DEFAULT 'snack',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight logs
CREATE TABLE weight_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_lbs DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings
CREATE TABLE user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    current_weight DECIMAL,
    target_weight DECIMAL,
    height_inches DECIMAL,
    age INTEGER,
    sex TEXT DEFAULT 'male',
    activity_level TEXT DEFAULT 'moderate',
    weekly_loss_rate DECIMAL DEFAULT 1.0,
    protein_ratio DECIMAL DEFAULT 0.40,
    carbs_ratio DECIMAL DEFAULT 0.30,
    fat_ratio DECIMAL DEFAULT 0.30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO user_settings (id) VALUES (gen_random_uuid());

-- Enable Row Level Security (optional, for multi-user)
-- ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_daily_logs_date ON daily_logs(date);
CREATE INDEX idx_weight_logs_date ON weight_logs(date);
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);

*/

// ============ Foods API ============

async function getAllFoods() {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { data, error } = await client
        .from('foods')
        .select('*')
        .order('name');
    
    if (error) throw error;
    return data;
}

async function getFavoriteFoods() {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { data, error } = await client
        .from('foods')
        .select('*')
        .eq('is_favorite', true)
        .order('name');
    
    if (error) throw error;
    return data;
}

async function addFood(food) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const userId = await getCurrentUserId();
    if (userId) food.user_id = userId;
    const { data, error } = await client
        .from('foods')
        .insert([food])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function updateFood(id, updates) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { data, error } = await client
        .from('foods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function deleteFood(id) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { error } = await client
        .from('foods')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
}

async function toggleFavorite(id, isFavorite) {
    return updateFood(id, { is_favorite: isFavorite });
}

// ============ Daily Logs API ============

async function getDailyLogs(date) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { data, error } = await client
        .from('daily_logs')
        .select(`
            *,
            food:foods(*)
        `)
        .eq('date', date)
        .order('created_at');
    
    if (error) throw error;
    return data;
}

async function addDailyLog(log) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const userId = await getCurrentUserId();
    if (userId) log.user_id = userId;
    const { data, error } = await client
        .from('daily_logs')
        .insert([log])
        .select(`
            *,
            food:foods(*)
        `)
        .single();
    
    if (error) throw error;
    return data;
}

async function updateDailyLog(id, updates) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { data, error } = await client
        .from('daily_logs')
        .update(updates)
        .eq('id', id)
        .select(`
            *,
            food:foods(*)
        `)
        .single();
    
    if (error) throw error;
    return data;
}

async function deleteDailyLog(id) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { error } = await client
        .from('daily_logs')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
}

// ============ Weight Logs API ============

async function getWeightLogs(startDate = null, endDate = null) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    let query = client
        .from('weight_logs')
        .select('*')
        .order('date');
    
    if (startDate) {
        query = query.gte('date', startDate);
    }
    if (endDate) {
        query = query.lte('date', endDate);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

async function addWeightLog(date, weight) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const userId = await getCurrentUserId();
    // With RLS, select only returns current user's rows
    const { data: existing } = await client
        .from('weight_logs')
        .select('id')
        .eq('date', date)
        .maybeSingle();
    
    if (existing) {
        const { data, error } = await client
            .from('weight_logs')
            .update({ weight_lbs: weight })
            .eq('id', existing.id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } else {
        const row = { date, weight_lbs: weight };
        if (userId) row.user_id = userId;
        const { data, error } = await client
            .from('weight_logs')
            .insert([row])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
}

async function getLatestWeight() {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { data, error } = await client
        .from('weight_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
}

// ============ User Settings API ============

async function getUserSettings() {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { data, error } = await client
        .from('user_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
    
    if (error) throw error;
    return data;
}

async function updateUserSettings(updates) {
    updates.updated_at = new Date().toISOString();
    
    // Get existing settings
    const existing = await getUserSettings();
    
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    if (existing) {
        const { data, error } = await client
            .from('user_settings')
            .update(updates)
            .eq('id', existing.id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } else {
        const userId = await getCurrentUserId();
        if (userId) updates.user_id = userId;
        const { data, error } = await client
            .from('user_settings')
            .insert([updates])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
}

// ============ Recipes API ============

async function getAllRecipes() {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { data, error } = await client
        .from('recipes')
        .select(`
            *,
            items:recipe_items(
                id,
                servings,
                food:foods(*)
            )
        `)
        .order('name');
    
    if (error) throw error;
    return data;
}

async function addRecipe(name, items) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const userId = await getCurrentUserId();
    const recipeRow = { name };
    if (userId) recipeRow.user_id = userId;
    // First create the recipe
    const { data: recipe, error: recipeError } = await client
        .from('recipes')
        .insert([recipeRow])
        .select()
        .single();
    
    if (recipeError) throw recipeError;
    
    // Then add the items
    const recipeItems = items.map(item => ({
        recipe_id: recipe.id,
        food_id: item.food_id,
        servings: item.servings
    }));
    
    const { error: itemsError } = await client
        .from('recipe_items')
        .insert(recipeItems);
    
    if (itemsError) throw itemsError;
    
    // Return the full recipe with items
    return getAllRecipes().then(recipes => recipes.find(r => r.id === recipe.id));
}

async function updateRecipe(id, name, items) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    // Update recipe name
    const { error: nameError } = await client
        .from('recipes')
        .update({ name })
        .eq('id', id);
    
    if (nameError) throw nameError;
    
    // Delete existing items
    const { error: deleteError } = await client
        .from('recipe_items')
        .delete()
        .eq('recipe_id', id);
    
    if (deleteError) throw deleteError;
    
    // Add new items
    const recipeItems = items.map(item => ({
        recipe_id: id,
        food_id: item.food_id,
        servings: item.servings
    }));
    
    const { error: itemsError } = await client
        .from('recipe_items')
        .insert(recipeItems);
    
    if (itemsError) throw itemsError;
    
    return getAllRecipes().then(recipes => recipes.find(r => r.id === id));
}

async function deleteRecipe(id) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    const { error } = await client
        .from('recipes')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
}

// ============ Auth API ============

async function getCurrentUser() {
    const client = getSupabase();
    if (!client || !client.auth) return null;
    const { data: { user } } = await client.auth.getUser();
    return user;
}

async function signInWithGitHub() {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not initialized');
    // Where to redirect after GitHub auth (must be in Supabase Auth → URL Configuration → Redirect URLs)
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : null;
    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'github',
        options: redirectTo ? { redirectTo } : {}
    });
    if (error) throw error;
    return data;
}

async function signOut() {
    const client = getSupabase();
    if (!client || !client.auth) return;
    await client.auth.signOut();
}

function onAuthStateChange(callback) {
    const client = getSupabase();
    if (!client || !client.auth) return () => {};
    const { data: { subscription } } = client.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
}

// Export for use in other modules
window.db = {
    // Foods
    getAllFoods,
    getFavoriteFoods,
    addFood,
    updateFood,
    deleteFood,
    toggleFavorite,
    
    // Recipes
    getAllRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    
    // Daily Logs
    getDailyLogs,
    addDailyLog,
    updateDailyLog,
    deleteDailyLog,
    
    // Weight Logs
    getWeightLogs,
    addWeightLog,
    getLatestWeight,
    
    // Settings
    getUserSettings,
    updateUserSettings,

    // Auth
    getCurrentUser,
    getCurrentUserId,
    signInWithGitHub,
    signOut,
    onAuthStateChange
};
