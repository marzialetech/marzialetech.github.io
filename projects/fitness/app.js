// ============ App State ============
let state = {
    currentDate: new Date().toISOString().split('T')[0],
    foods: [],
    recipes: [],
    dailyLogs: [],
    weightLogs: [],
    settings: null,
    targets: null,
    weightChart: null,
    isConnected: false
};

// Recipe editing state
let recipeEditState = {
    editId: null,
    items: [] // { food_id, servings, food }
};

// Temp storage for lookup results
let lookupResults = [];

// ============ Initialization ============
document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    initDateNav();
    initEventListeners();
    initAuth();
    
    // Auto-connect to Supabase (credentials are hardcoded in lib/supabase.js)
    if (window.__supabaseClient) {
        state.isConnected = true;
        try {
            await loadAllData();
        } catch (e) {
            console.warn('Error loading from Supabase, falling back to localStorage:', e);
            loadFromLocalStorage();
        }
    } else {
        loadFromLocalStorage();
    }
    
    // Check auth and update UI
    await updateAuthUI();
    updateUI();
    
    // Listen for auth changes (e.g. after GitHub redirect)
    if (window.db?.onAuthStateChange) {
        window.db.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await updateAuthUI();
                if (state.isConnected) await loadAllData();
                updateUI();
            } else if (event === 'SIGNED_OUT') {
                await updateAuthUI();
                updateUI();
            }
        });
    }
});

// ============ Tab Navigation ============
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// ============ Date Navigation ============
function initDateNav() {
    document.getElementById('prevDay').addEventListener('click', () => changeDate(-1));
    document.getElementById('nextDay').addEventListener('click', () => changeDate(1));
    updateDateDisplay();
}

function changeDate(delta) {
    const date = new Date(state.currentDate);
    date.setDate(date.getDate() + delta);
    state.currentDate = date.toISOString().split('T')[0];
    updateDateDisplay();
    loadDailyLogs();
}

function updateDateDisplay() {
    const today = new Date().toISOString().split('T')[0];
    const date = new Date(state.currentDate + 'T12:00:00');
    
    let display;
    if (state.currentDate === today) {
        display = 'Today';
    } else {
        display = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    document.getElementById('currentDate').textContent = display;
}

// ============ Event Listeners ============
function initEventListeners() {
    // Food logging
    document.getElementById('logFoodBtn').addEventListener('click', handleFoodLog);
    document.getElementById('foodInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') handleFoodLog();
    });
    
    // Food lookup
    document.getElementById('lookupFoodBtn').addEventListener('click', handleFoodLookup);
    document.getElementById('newFoodName').addEventListener('keypress', e => {
        if (e.key === 'Enter') handleFoodLookup();
    });
    
    // Add food form
    document.getElementById('addFoodForm').addEventListener('submit', handleAddFood);
    document.getElementById('cancelAddFood').addEventListener('click', () => {
        document.getElementById('manualAddForm').classList.add('hidden');
    });
    
    // Food search
    document.getElementById('foodSearch').addEventListener('input', e => {
        renderAllFoodsList(e.target.value);
    });
    
    // Weight logging
    document.getElementById('logWeightBtn').addEventListener('click', handleWeightLog);
    document.getElementById('weightInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') handleWeightLog();
    });
    
    // Loss rate slider
    document.getElementById('lossRateSlider').addEventListener('input', handleLossRateChange);
    
    // Run pace selector
    document.getElementById('runPace').addEventListener('change', updateRunCalculator);
    
    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', handleSettingsSave);
    
    // Supabase connection
    document.getElementById('saveSupabase').addEventListener('click', handleSupabaseConnect);
    const clearBtn = document.getElementById('clearSupabase');
    if (clearBtn) clearBtn.addEventListener('click', handleClearSupabase);
    
    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', e => {
        if (e.target === document.getElementById('modal')) closeModal();
    });
    
    // Auth
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const signInNoticeBtn = document.getElementById('signInNoticeBtn');
    if (signInBtn) signInBtn.addEventListener('click', handleSignIn);
    if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
    if (signInNoticeBtn) signInNoticeBtn.addEventListener('click', handleSignIn);
}

// ============ Auth ============

function initAuth() {
    if (typeof window !== 'undefined' && window.location.hash && window.__supabaseClient?.auth) {
        window.__supabaseClient.auth.getSession().then(() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        });
    }
}

async function updateAuthUI() {
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const userInfo = document.getElementById('userInfo');
    const signInNotice = document.getElementById('signInNotice');
    if (!signInBtn) return;
    
    const user = window.db?.getCurrentUser ? await window.db.getCurrentUser() : null;
    
    if (user) {
        signInBtn.classList.add('hidden');
        signOutBtn.classList.remove('hidden');
        userInfo.classList.remove('hidden');
        userInfo.textContent = user.user_metadata?.user_name || user.email || 'Signed in';
        if (signInNotice) signInNotice.classList.add('hidden');
    } else {
        signInBtn.classList.remove('hidden');
        signOutBtn.classList.add('hidden');
        userInfo.classList.add('hidden');
        if (signInNotice) {
            signInNotice.classList.toggle('hidden', !state.isConnected);
        }
    }
}

async function handleSignIn() {
    try {
        if (!window.db?.signInWithGitHub) {
            showToast('Connect Supabase first (Settings)', 'error');
            return;
        }
        await window.db.signInWithGitHub();
        showToast('Redirecting to GitHub...', 'success');
    } catch (error) {
        console.error('Sign in error:', error);
        showToast('Sign in failed: ' + (error.message || 'Unknown error'), 'error');
    }
}

async function handleSignOut() {
    try {
        if (window.db?.signOut) {
            await window.db.signOut();
            state.foods = [];
            state.recipes = [];
            state.dailyLogs = [];
            state.weightLogs = [];
            state.settings = null;
            loadFromLocalStorage();
            await updateAuthUI();
            updateUI();
            showToast('Signed out', 'success');
        }
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Sign out failed', 'error');
    }
}

// ============ Supabase Connection ============
async function connectToSupabase(url, key) {
    try {
        // Create client with user's credentials and set as the active client
        const client = window.supabase.createClient(url, key);
        window.__supabaseClient = client;
        
        // Test connection
        const { data, error } = await client.from('foods').select('count').limit(1);
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        state.isConnected = true;
        localStorage.setItem('supabaseUrl', url);
        localStorage.setItem('supabaseKey', key);
        
        document.getElementById('connectionStatus').textContent = 'Connected!';
        document.getElementById('connectionStatus').className = 'connection-status success';
        
        await updateAuthUI();
        await loadAllData();
        
        return true;
    } catch (error) {
        console.error('Supabase connection error:', error);
        state.isConnected = false;
        
        document.getElementById('connectionStatus').textContent = 'Connection failed: ' + error.message;
        document.getElementById('connectionStatus').className = 'connection-status error';
        
        // Fall back to localStorage
        loadFromLocalStorage();
        
        return false;
    }
}

async function handleSupabaseConnect() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();
    
    if (!url || !key) {
        showToast('Please enter both URL and key', 'error');
        return;
    }
    
    await connectToSupabase(url, key);
}

function handleClearSupabase() {
    // Remove saved credentials
    localStorage.removeItem('supabaseUrl');
    localStorage.removeItem('supabaseKey');
    
    // Clear form fields
    const urlInput = document.getElementById('supabaseUrl');
    const keyInput = document.getElementById('supabaseKey');
    if (urlInput) urlInput.value = '';
    if (keyInput) keyInput.value = '';
    
    // Disconnect
    window.__supabaseClient = null;
    state.isConnected = false;
    
    // Update status
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        statusEl.textContent = 'Cleared. Enter new URL and anon key, then click Connect.';
        statusEl.className = 'connection-status';
    }
    
    // Reload app data from localStorage only
    loadFromLocalStorage();
    updateAuthUI();
    updateUI();
    
    showToast('Credentials cleared', 'success');
}

// ============ Data Loading ============
async function loadAllData() {
    try {
        if (state.isConnected && window.db) {
            // Load from Supabase
            state.foods = await window.db.getAllFoods() || [];
            state.recipes = await window.db.getAllRecipes() || [];
            state.weightLogs = await window.db.getWeightLogs() || [];
            state.settings = await window.db.getUserSettings();
        }
        
        await loadDailyLogs();
        updateUI();
    } catch (error) {
        console.error('Error loading data:', error);
        loadFromLocalStorage();
    }
}

async function loadDailyLogs() {
    try {
        if (state.isConnected && window.db) {
            state.dailyLogs = await window.db.getDailyLogs(state.currentDate) || [];
        } else {
            const allLogs = JSON.parse(localStorage.getItem('dailyLogs') || '[]');
            state.dailyLogs = allLogs.filter(l => l.date === state.currentDate);
        }
        updateDashboard();
    } catch (error) {
        console.error('Error loading daily logs:', error);
    }
}

function loadFromLocalStorage() {
    state.foods = JSON.parse(localStorage.getItem('foods') || '[]');
    state.recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
    state.weightLogs = JSON.parse(localStorage.getItem('weightLogs') || '[]');
    state.settings = JSON.parse(localStorage.getItem('settings') || 'null');
    
    const allLogs = JSON.parse(localStorage.getItem('dailyLogs') || '[]');
    state.dailyLogs = allLogs.filter(l => l.date === state.currentDate);
}

function saveToLocalStorage() {
    localStorage.setItem('foods', JSON.stringify(state.foods));
    localStorage.setItem('recipes', JSON.stringify(state.recipes));
    localStorage.setItem('weightLogs', JSON.stringify(state.weightLogs));
    if (state.settings) {
        localStorage.setItem('settings', JSON.stringify(state.settings));
    }
    
    // For daily logs, merge with existing
    const allLogs = JSON.parse(localStorage.getItem('dailyLogs') || '[]');
    const otherLogs = allLogs.filter(l => l.date !== state.currentDate);
    localStorage.setItem('dailyLogs', JSON.stringify([...otherLogs, ...state.dailyLogs]));
}

// ============ UI Updates ============
function updateUI() {
    updateTargets();
    updateDashboard();
    renderFoodRepository();
    renderFavorites();
    renderAllFoodsList();
    renderRecipes();
    updateWeightTab();
    updateSettingsForm();
}

function updateTargets() {
    state.targets = macros.calculateAllTargets(state.settings);
    
    // Update settings display
    document.getElementById('displayBMR').textContent = state.targets.bmr + ' cal';
    document.getElementById('displayTDEE').textContent = state.targets.tdee + ' cal';
    document.getElementById('displayCalories').textContent = state.targets.calories + ' cal';
    document.getElementById('displayProtein').textContent = state.targets.protein + 'g';
    document.getElementById('displayCarbs').textContent = state.targets.carbs + 'g';
    document.getElementById('displayFat').textContent = state.targets.fat + 'g';
}

function updateDashboard() {
    const consumed = macros.calculateDayTotals(state.dailyLogs);
    const targets = state.targets || macros.calculateAllTargets(state.settings);
    
    // Update macro values and progress bars
    updateMacroDisplay('cal', consumed.calories, targets.calories, '');
    updateMacroDisplay('protein', consumed.protein, targets.protein, 'g');
    updateMacroDisplay('carbs', consumed.carbs, targets.carbs, 'g');
    updateMacroDisplay('fat', consumed.fat, targets.fat, 'g');
    
    // Render today's log
    renderTodayLog();
    
    // Update suggestions
    updateSuggestions(consumed, targets);
    
    // Update run calculator
    updateRunCalculator();
}

function updateMacroDisplay(id, consumed, target, unit) {
    const value = document.getElementById(`${id}-value`);
    const progress = document.getElementById(`${id}-progress`);
    
    value.textContent = `${Math.round(consumed)}${unit} / ${Math.round(target)}${unit}`;
    
    const percent = Math.min(100, (consumed / target) * 100);
    progress.style.width = percent + '%';
    
    // Change color if over
    if (consumed > target) {
        progress.style.background = 'var(--danger)';
    } else {
        progress.style.background = '';
    }
}

function renderTodayLog() {
    const container = document.getElementById('todayLog');
    
    if (state.dailyLogs.length === 0) {
        container.innerHTML = '<p class="empty-state">No foods logged yet. <a href="#" onclick="switchTab(\'log\')">Add something!</a></p>';
        return;
    }
    
    container.innerHTML = state.dailyLogs.map(log => {
        const food = log.food || state.foods.find(f => f.id === log.food_id);
        if (!food) return '';
        
        const servings = log.servings || 1;
        const cals = Math.round(food.calories * servings);
        const protein = Math.round(food.protein * servings);
        const carbs = Math.round(food.carbs * servings);
        const fat = Math.round(food.fat * servings);
        
        return `
            <div class="log-item" data-id="${log.id}">
                <div class="log-item-info">
                    <div class="log-item-name">${servings !== 1 ? servings + 'x ' : ''}${food.name}</div>
                    <div class="log-item-macros">${cals} cal | P: ${protein}g | C: ${carbs}g | F: ${fat}g</div>
                </div>
                <div class="log-item-actions">
                    <button class="btn small danger" onclick="deleteLog('${log.id}')">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

// ============ Food Logging ============
async function handleFoodLog() {
    const input = document.getElementById('foodInput').value.trim();
    if (!input) return;
    
    const parsed = parser.parseMultipleFoods(input);
    const matched = parser.matchAgainstSavedFoods(parsed, state.foods);
    
    // Show parse results
    const container = document.getElementById('parseResults');
    container.innerHTML = '';
    
    for (const item of matched) {
        if (item.bestMatch) {
            // Auto-log matched items
            await logFood(item.bestMatch.food.id, item.entry.quantity);
        } else {
            // Show unmatched for user action
            const div = document.createElement('div');
            div.className = 'parse-item unmatched';
            div.innerHTML = `
                <div class="parse-item-info">
                    <div class="parse-item-parsed">${item.entry.quantity}x ${item.entry.foodName}</div>
                    <div class="parse-item-match">Not found in your foods</div>
                </div>
                <button class="btn small primary" onclick="lookupAndAdd('${item.entry.foodName}')">Add</button>
            `;
            container.appendChild(div);
        }
    }
    
    // Clear input if all matched
    if (matched.every(m => m.bestMatch)) {
        document.getElementById('foodInput').value = '';
        showToast('Food logged!', 'success');
    }
    
    updateDashboard();
}

async function logFood(foodId, servings = 1) {
    const log = {
        date: state.currentDate,
        food_id: foodId,
        servings: servings,
        meal_type: getMealType()
    };
    
    try {
        if (state.isConnected && window.db) {
            const newLog = await window.db.addDailyLog(log);
            state.dailyLogs.push(newLog);
        } else {
            log.id = 'local_' + Date.now();
            log.food = state.foods.find(f => f.id === foodId);
            state.dailyLogs.push(log);
            saveToLocalStorage();
        }
        
        updateDashboard();
    } catch (error) {
        console.error('Error logging food:', error);
        showToast('Error logging food', 'error');
    }
}

async function deleteLog(logId) {
    try {
        if (state.isConnected && window.db) {
            await window.db.deleteDailyLog(logId);
        }
        
        state.dailyLogs = state.dailyLogs.filter(l => l.id !== logId);
        saveToLocalStorage();
        updateDashboard();
        showToast('Removed from log', 'success');
    } catch (error) {
        console.error('Error deleting log:', error);
        showToast('Error removing food', 'error');
    }
}

function getMealType() {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snack';
}

// ============ Food Repository ============
async function handleFoodLookup() {
    const name = document.getElementById('newFoodName').value.trim();
    if (!name) return;
    
    const container = document.getElementById('lookupResults');
    container.innerHTML = '<p>Searching USDA database...</p>';
    
    try {
        let results = await usda.searchAndNormalize(name);
        
        // If no results from USDA, try local fallback
        if (results.length === 0) {
            results = await searchLocalFoods(name);
        }
        
        lookupResults = results.slice(0, 5); // Store for later selection
        
        if (lookupResults.length === 0) {
            container.innerHTML = `
                <p>No results found. <button class="btn small primary" onclick="showManualAddForm('${escapeHtml(name)}')">Add manually</button></p>
            `;
            return;
        }
        
        container.innerHTML = lookupResults.map((food, index) => `
            <div class="lookup-item" onclick="selectLookupResultByIndex(${index})">
                <div>
                    <div class="lookup-item-name">${escapeHtml(food.name)}</div>
                    ${food.brandName ? `<div class="lookup-item-brand">${escapeHtml(food.brandName)}</div>` : ''}
                    ${food.isLocal ? '<div class="lookup-item-brand">From local database</div>' : ''}
                </div>
                <div class="lookup-item-macros">
                    ${food.calories} cal<br>
                    P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fat}g
                </div>
            </div>
        `).join('') + `
            <div style="margin-top: 12px;">
                <button class="btn small" onclick="showManualAddForm('${escapeHtml(name)}')">Add manually instead</button>
            </div>
        `;
    } catch (error) {
        console.error('Lookup error:', error);
        // Try local fallback on error
        try {
            const localResults = await searchLocalFoods(name);
            if (localResults.length > 0) {
                lookupResults = localResults.slice(0, 5);
                container.innerHTML = `
                    <p style="margin-bottom: 12px; color: var(--text-secondary);">USDA API unavailable. Showing local results:</p>
                ` + lookupResults.map((food, index) => `
                    <div class="lookup-item" onclick="selectLookupResultByIndex(${index})">
                        <div>
                            <div class="lookup-item-name">${escapeHtml(food.name)}</div>
                        </div>
                        <div class="lookup-item-macros">
                            ${food.calories} cal<br>
                            P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fat}g
                        </div>
                    </div>
                `).join('') + `
                    <div style="margin-top: 12px;">
                        <button class="btn small" onclick="showManualAddForm('${escapeHtml(name)}')">Add manually instead</button>
                    </div>
                `;
                return;
            }
        } catch (e) {}
        
        container.innerHTML = `
            <p>Error searching. <button class="btn small primary" onclick="showManualAddForm('${escapeHtml(name)}')">Add manually</button></p>
        `;
    }
}

// Search local common foods fallback
async function searchLocalFoods(query) {
    try {
        const response = await fetch('data/common-foods.json');
        const data = await response.json();
        const foods = data.foods || [];
        
        const queryLower = query.toLowerCase();
        return foods
            .filter(f => f.name.toLowerCase().includes(queryLower))
            .map(f => ({ ...f, isLocal: true }));
    } catch (e) {
        return [];
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function selectLookupResultByIndex(index) {
    const food = lookupResults[index];
    if (food) {
        selectLookupResult(food);
    }
}

function selectLookupResult(food) {
    document.getElementById('formFoodName').value = food.name;
    document.getElementById('formServingSize').value = food.serving_size;
    document.getElementById('formServingUnit').value = food.serving_unit;
    document.getElementById('formCalories').value = food.calories;
    document.getElementById('formProtein').value = food.protein;
    document.getElementById('formCarbs').value = food.carbs;
    document.getElementById('formFat').value = food.fat;
    
    document.getElementById('manualAddForm').classList.remove('hidden');
    document.getElementById('lookupResults').innerHTML = '';
}

function showManualAddForm(name = '') {
    document.getElementById('formFoodName').value = name;
    document.getElementById('formServingSize').value = 1;
    document.getElementById('formServingUnit').value = 'serving';
    document.getElementById('formCalories').value = 0;
    document.getElementById('formProtein').value = 0;
    document.getElementById('formCarbs').value = 0;
    document.getElementById('formFat').value = 0;
    
    document.getElementById('manualAddForm').classList.remove('hidden');
    document.getElementById('lookupResults').innerHTML = '';
}

async function handleAddFood(e) {
    e.preventDefault();
    
    const form = document.getElementById('addFoodForm');
    const editId = form.dataset.editId;
    
    const foodData = {
        name: document.getElementById('formFoodName').value,
        serving_size: parseFloat(document.getElementById('formServingSize').value),
        serving_unit: document.getElementById('formServingUnit').value,
        calories: parseFloat(document.getElementById('formCalories').value),
        protein: parseFloat(document.getElementById('formProtein').value),
        carbs: parseFloat(document.getElementById('formCarbs').value),
        fat: parseFloat(document.getElementById('formFat').value)
    };
    
    try {
        if (editId) {
            // Update existing food
        if (state.isConnected && window.db) {
            await window.db.updateFood(editId, foodData);
        }
            
            const index = state.foods.findIndex(f => f.id === editId);
            if (index !== -1) {
                state.foods[index] = { ...state.foods[index], ...foodData };
            }
            
            delete form.dataset.editId;
            document.getElementById('manualAddForm').querySelector('h2').textContent = 'Food Details';
            showToast('Food updated!', 'success');
        } else {
            // Add new food
            foodData.is_favorite = false;
            
        if (state.isConnected && window.db) {
            const newFood = await window.db.addFood(foodData);
                state.foods.push(newFood);
            } else {
                foodData.id = 'local_' + Date.now();
                state.foods.push(foodData);
            }
            
            showToast('Food added!', 'success');
        }
        
        saveToLocalStorage();
        document.getElementById('manualAddForm').classList.add('hidden');
        document.getElementById('newFoodName').value = '';
        form.reset();
        
        renderFoodRepository();
        renderFavorites();
        renderAllFoodsList();
    } catch (error) {
        console.error('Error saving food:', error);
        showToast('Error saving food', 'error');
    }
}

async function lookupAndAdd(name) {
    document.getElementById('newFoodName').value = name;
    switchTab('foods');
    handleFoodLookup();
}

function renderFoodRepository() {
    const container = document.getElementById('foodRepository');
    
    if (state.foods.length === 0) {
        container.innerHTML = '<p class="empty-state">No foods in your repository yet.</p>';
        return;
    }
    
    container.innerHTML = state.foods.map(food => `
        <div class="food-item" data-id="${food.id}">
            <button class="btn-favorite ${food.is_favorite ? 'active' : ''}" onclick="toggleFavorite('${food.id}')">
                ${food.is_favorite ? '★' : '☆'}
            </button>
            <div class="food-item-info">
                <div class="food-item-name">${food.name}</div>
                <div class="food-item-macros">
                    ${food.serving_size} ${food.serving_unit} | ${food.calories} cal | 
                    P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fat}g
                </div>
            </div>
            <div class="food-item-actions">
                <button class="btn small" onclick="editFood('${food.id}')">Edit</button>
                <button class="btn small danger" onclick="deleteFood('${food.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function toggleFavorite(foodId) {
    const food = state.foods.find(f => f.id === foodId);
    if (!food) return;
    
    food.is_favorite = !food.is_favorite;
    
    try {
        if (state.isConnected && window.db) {
            await window.db.toggleFavorite(foodId, food.is_favorite);
        }
        saveToLocalStorage();
        renderFoodRepository();
        renderFavorites();
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

async function deleteFood(foodId) {
    if (!confirm('Delete this food? It will also remove it from your logs.')) return;
    
    try {
        if (state.isConnected && window.db) {
            await window.db.deleteFood(foodId);
        }
        
        state.foods = state.foods.filter(f => f.id !== foodId);
        saveToLocalStorage();
        renderFoodRepository();
        renderFavorites();
        renderAllFoodsList();
        
        showToast('Food deleted', 'success');
    } catch (error) {
        console.error('Error deleting food:', error);
        showToast('Error deleting food', 'error');
    }
}

function editFood(foodId) {
    const food = state.foods.find(f => f.id === foodId);
    if (!food) return;
    
    document.getElementById('formFoodName').value = food.name;
    document.getElementById('formServingSize').value = food.serving_size;
    document.getElementById('formServingUnit').value = food.serving_unit;
    document.getElementById('formCalories').value = food.calories;
    document.getElementById('formProtein').value = food.protein;
    document.getElementById('formCarbs').value = food.carbs;
    document.getElementById('formFat').value = food.fat;
    
    // Change form to edit mode
    const form = document.getElementById('addFoodForm');
    form.dataset.editId = foodId;
    
    document.getElementById('manualAddForm').classList.remove('hidden');
    document.getElementById('manualAddForm').querySelector('h2').textContent = 'Edit Food';
}

// ============ Favorites & Quick Select ============
function renderFavorites() {
    const container = document.getElementById('favorites');
    const favorites = state.foods.filter(f => f.is_favorite);
    
    if (favorites.length === 0) {
        container.innerHTML = '<p class="empty-state">Star foods to add them here for quick logging.</p>';
        return;
    }
    
    container.innerHTML = favorites.map(food => `
        <button class="favorite-btn" onclick="quickLog('${food.id}')">
            <div class="favorite-btn-name">${food.name}</div>
            <div class="favorite-btn-cal">${food.calories} cal</div>
        </button>
    `).join('');
}

function renderAllFoodsList(filter = '') {
    const container = document.getElementById('allFoodsList');
    let foods = state.foods;
    
    if (filter) {
        const lower = filter.toLowerCase();
        foods = foods.filter(f => f.name.toLowerCase().includes(lower));
    }
    
    if (foods.length === 0) {
        container.innerHTML = '<p class="empty-state">No foods found.</p>';
        return;
    }
    
    container.innerHTML = foods.map(food => `
        <div class="food-item" onclick="quickLog('${food.id}')">
            <div class="food-item-info">
                <div class="food-item-name">${food.name}</div>
                <div class="food-item-macros">${food.calories} cal | P: ${food.protein}g</div>
            </div>
            <button class="btn small primary">+ Add</button>
        </div>
    `).join('');
}

function quickLog(foodId) {
    showServingsModal(foodId);
}

function showServingsModal(foodId) {
    const food = state.foods.find(f => f.id === foodId);
    if (!food) return;
    
    document.getElementById('modalTitle').textContent = 'Add ' + food.name;
    document.getElementById('modalBody').innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <p style="margin-bottom: 16px;">${food.serving_size} ${food.serving_unit} = ${food.calories} cal</p>
            <label style="display: block; margin-bottom: 8px;">How many servings?</label>
            <input type="number" id="modalServings" class="servings-input" value="1" min="0.25" step="0.25" style="width: 80px; text-align: center; font-size: 18px;">
            <button class="size-guide-btn" onclick="openPortionGuide()">
                <span>📏</span> Not sure? See portion size guide
            </button>
        </div>
        <button class="btn primary full-width" onclick="confirmLog('${foodId}')">Add to Log</button>
    `;
    
    document.getElementById('modal').classList.add('show');
    document.getElementById('modalServings').focus();
    document.getElementById('modalServings').select();
}

async function confirmLog(foodId) {
    const servings = parseFloat(document.getElementById('modalServings').value) || 1;
    await logFood(foodId, servings);
    closeModal();
    showToast('Food logged!', 'success');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// ============ Run Calculator ============

// MET values for running at different speeds (mph)
const RUNNING_METS = {
    5: 8.3,      // 12 min/mile
    5.5: 9.0,    // 11 min/mile
    6: 9.8,      // 10 min/mile
    6.5: 10.5,   // 9:15 min/mile
    7: 11.0,     // 8:30 min/mile
    8: 11.8,     // 7:30 min/mile
    9: 12.8      // 6:40 min/mile
};

function calculateRunningCalories(weightLbs, minutes, mph) {
    // Formula: Calories = MET × weight(kg) × time(hours)
    const weightKg = weightLbs * 0.453592;
    const hours = minutes / 60;
    const met = RUNNING_METS[mph] || 9.8;
    return met * weightKg * hours;
}

function calculateRunNeeded(excessCalories, weightLbs, mph) {
    // Reverse: minutes = calories / (MET × weight(kg) / 60)
    const weightKg = weightLbs * 0.453592;
    const met = RUNNING_METS[mph] || 9.8;
    const caloriesPerMinute = (met * weightKg) / 60;
    return excessCalories / caloriesPerMinute;
}

function updateRunCalculator() {
    const consumed = macros.calculateDayTotals(state.dailyLogs);
    const targets = state.targets || macros.calculateAllTargets(state.settings);
    const weight = state.settings?.current_weight || 150;
    const pace = parseFloat(document.getElementById('runPace')?.value || 6);
    
    // Calculate status
    const targetWithDeficit = targets.calories; // Already includes deficit
    const tdee = targets.tdee || targetWithDeficit + 500;
    const deficit = targets.deficit || 500;
    
    // Update status display
    const statusEl = document.getElementById('runCalcStatus');
    const diff = consumed.calories - targetWithDeficit;
    
    statusEl.innerHTML = `
        <div class="status-row">
            <span class="status-label">Consumed today</span>
            <span class="status-value">${Math.round(consumed.calories)} cal</span>
        </div>
        <div class="status-row">
            <span class="status-label">Target (with ${deficit} cal deficit)</span>
            <span class="status-value">${Math.round(targetWithDeficit)} cal</span>
        </div>
        <div class="status-row">
            <span class="status-label">Status</span>
            <span class="status-value ${diff > 0 ? 'over' : 'under'}">
                ${diff > 0 ? '+' : ''}${Math.round(diff)} cal ${diff > 0 ? 'over' : 'under'}
            </span>
        </div>
    `;
    
    // Calculate run needed
    const resultEl = document.getElementById('runResult');
    const timeEl = document.getElementById('runTime');
    const detailEl = document.getElementById('runDetail');
    const noteEl = document.getElementById('runNote');
    
    if (diff <= 0) {
        // Already at or under target
        resultEl.className = 'run-result no-run';
        timeEl.textContent = '0';
        detailEl.textContent = "You're already at your calorie target!";
        noteEl.textContent = diff < -200 
            ? `You have ${Math.abs(Math.round(diff))} cal room for a snack or rest day.`
            : 'Great job staying on track today.';
    } else {
        // Need to run off excess
        const minutes = calculateRunNeeded(diff, weight, pace);
        const miles = (pace * minutes) / 60;
        const caloriesBurned = Math.round(diff);
        
        resultEl.className = minutes > 60 ? 'run-result big-run' : 'run-result';
        timeEl.textContent = Math.round(minutes);
        detailEl.textContent = `~${miles.toFixed(1)} miles | Burns ${caloriesBurned} cal`;
        
        if (minutes > 90) {
            noteEl.textContent = "That's a long run! Consider eating less or splitting across days.";
        } else if (minutes > 60) {
            noteEl.textContent = "Solid long run. Make sure to hydrate!";
        } else if (minutes > 30) {
            noteEl.textContent = "A good moderate run will do the trick.";
        } else {
            noteEl.textContent = "Quick run! You're close to your target.";
        }
    }
}

// ============ Suggestions ============
function updateSuggestions(consumed, targets) {
    const container = document.getElementById('suggestions');
    const remaining = macros.calculateRemaining(targets, consumed);
    
    if (state.foods.length === 0) {
        container.innerHTML = '<p class="empty-state">Add foods to your repository to get suggestions.</p>';
        return;
    }
    
    // Find foods that fit remaining macros
    const suggestions = [];
    
    for (const food of state.foods) {
        // Skip if food would put us over on calories
        if (food.calories > remaining.calories + 50) continue;
        
        let reason = '';
        let score = 0;
        
        // Prioritize high protein if protein is low
        const proteinPercent = consumed.protein / targets.protein;
        const calPercent = consumed.calories / targets.calories;
        
        if (proteinPercent < calPercent && food.protein >= 10) {
            score += 10;
            reason = 'High protein';
        }
        
        // Good calorie fit
        if (food.calories <= remaining.calories * 0.5) {
            score += 5;
            if (!reason) reason = 'Fits your remaining calories';
        }
        
        // Balanced macros
        const proteinRatio = food.protein * 4 / food.calories;
        if (proteinRatio > 0.3) {
            score += 3;
        }
        
        if (score > 0) {
            suggestions.push({ food, reason, score });
        }
    }
    
    // Sort by score and take top 5
    suggestions.sort((a, b) => b.score - a.score);
    const topSuggestions = suggestions.slice(0, 5);
    
    if (topSuggestions.length === 0) {
        if (remaining.calories < 100) {
            container.innerHTML = '<p class="empty-state">You\'ve hit your calorie target for today!</p>';
        } else {
            container.innerHTML = '<p class="empty-state">No suggestions available.</p>';
        }
        return;
    }
    
    // Update intro text
    const introEl = document.getElementById('suggestionsIntro');
    introEl.textContent = `You have ${Math.round(remaining.calories)} cal and ${Math.round(remaining.protein)}g protein left:`;
    
    container.innerHTML = topSuggestions.map(({ food, reason }) => `
        <div class="suggestion-item">
            <div class="suggestion-info">
                <div class="suggestion-name">${food.name}</div>
                <div class="suggestion-reason">${reason} (${food.calories} cal, ${food.protein}g protein)</div>
            </div>
            <button class="btn small primary" onclick="quickLog('${food.id}')">+ Add</button>
        </div>
    `).join('');
}

// ============ Weight Tab ============
async function handleWeightLog() {
    const weight = parseFloat(document.getElementById('weightInput').value);
    if (!weight || weight < 50 || weight > 500) {
        showToast('Enter a valid weight', 'error');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
        if (state.isConnected && window.db) {
            await window.db.addWeightLog(today, weight);
        }
        
        // Update or add to local state
        const existing = state.weightLogs.find(w => w.date === today);
        if (existing) {
            existing.weight_lbs = weight;
        } else {
            state.weightLogs.push({ date: today, weight_lbs: weight });
        }
        state.weightLogs.sort((a, b) => a.date.localeCompare(b.date));
        
        // Sync current weight in settings
        if (!state.settings) {
            state.settings = {};
        }
        state.settings.current_weight = weight;
        
        if (state.isConnected && window.db) {
            await window.db.updateUserSettings({ current_weight: weight });
        }
        
        saveToLocalStorage();
        document.getElementById('weightInput').value = '';
        
        // Sync to settings form
        document.getElementById('settingWeight').value = weight;
        updateWeightSyncHint();
        
        updateWeightTab();
        updateTargets();
        updateDashboard(); // Update run calculator too
        
        showToast('Weight logged!', 'success');
    } catch (error) {
        console.error('Error logging weight:', error);
        showToast('Error logging weight', 'error');
    }
}

function updateWeightSyncHint() {
    const hintEl = document.getElementById('weightSyncHint');
    if (!hintEl) return;
    
    const latestLog = state.weightLogs.length > 0 
        ? state.weightLogs[state.weightLogs.length - 1] 
        : null;
    
    if (latestLog) {
        const date = new Date(latestLog.date + 'T12:00:00');
        const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        hintEl.innerHTML = `Last logged: ${latestLog.weight_lbs} lbs on ${formatted}`;
    } else {
        hintEl.innerHTML = `<a href="#" onclick="switchTab('weight'); return false;">Log your weight</a> to sync`;
    }
}

// Goal mode state
let goalMode = 'rate'; // 'rate' or 'date'

function setGoalMode(mode) {
    goalMode = mode;
    
    // Update tab UI
    document.querySelectorAll('.goal-mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    
    // Show/hide content
    document.getElementById('goalModeRate').classList.toggle('active', mode === 'rate');
    document.getElementById('goalModeDate').classList.toggle('active', mode === 'date');
    
    // Initialize date picker with reasonable default
    if (mode === 'date') {
        const targetDateInput = document.getElementById('targetDate');
        if (!targetDateInput.value) {
            // Default to 3 months from now
            const defaultDate = new Date();
            defaultDate.setMonth(defaultDate.getMonth() + 3);
            targetDateInput.value = defaultDate.toISOString().split('T')[0];
            updateGoalFromDate();
        }
    }
}

function handleLossRateChange() {
    const rate = parseFloat(document.getElementById('lossRateSlider').value);
    document.getElementById('lossRateValue').textContent = rate.toFixed(2);
    
    // Update deficit display
    const deficit = Math.round(rate * 3500 / 7);
    document.getElementById('dailyDeficit').textContent = deficit + ' cal';
    
    // Update projected loss
    const projectedLoss = macros.calculateProjectedLoss(rate);
    document.getElementById('projectedLoss').textContent = projectedLoss.toFixed(1) + ' lbs';
    
    // Calculate when you'll reach target weight
    updateReachDateByRate(rate);
    
    // Update settings
    if (state.settings) {
        state.settings.weekly_loss_rate = rate;
        
        if (state.isConnected && window.db) {
            window.db.updateUserSettings({ weekly_loss_rate: rate });
        }
        saveToLocalStorage();
    }
    
    updateTargets();
    updateGoalSummary();
    updateWeightChart();
}

function updateReachDateByRate(rate) {
    const currentWeight = state.settings?.current_weight;
    const targetWeight = state.settings?.target_weight;
    
    if (!currentWeight || !targetWeight || currentWeight <= targetWeight) {
        document.getElementById('reachDateByRate').textContent = 'Set weights in Settings';
        return;
    }
    
    const lbsToLose = currentWeight - targetWeight;
    const weeksNeeded = lbsToLose / rate;
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weeksNeeded * 7));
    
    const formatted = targetDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    document.getElementById('reachDateByRate').textContent = formatted;
}

function updateGoalFromDate() {
    const targetDateStr = document.getElementById('targetDate').value;
    if (!targetDateStr) return;
    
    const currentWeight = state.settings?.current_weight;
    const targetWeight = state.settings?.target_weight;
    const warningEl = document.getElementById('goalWarning');
    
    if (!currentWeight || !targetWeight) {
        document.getElementById('rateByDate').textContent = 'Set weights in Settings';
        warningEl.textContent = '';
        return;
    }
    
    if (currentWeight <= targetWeight) {
        document.getElementById('rateByDate').textContent = 'Already at target!';
        warningEl.textContent = '';
        return;
    }
    
    const targetDate = new Date(targetDateStr + 'T12:00:00');
    const today = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksUntilTarget = (targetDate - today) / msPerWeek;
    
    if (weeksUntilTarget <= 0) {
        document.getElementById('rateByDate').textContent = 'Pick a future date';
        warningEl.textContent = '';
        return;
    }
    
    const lbsToLose = currentWeight - targetWeight;
    const requiredRate = lbsToLose / weeksUntilTarget;
    
    document.getElementById('rateByDate').textContent = requiredRate.toFixed(2) + ' lbs/week';
    
    // Show warning if rate is too aggressive
    if (requiredRate > 2) {
        warningEl.textContent = `⚠️ This is aggressive (>${requiredRate.toFixed(1)} lbs/week). Consider a later date for sustainable loss.`;
    } else if (requiredRate > 1.5) {
        warningEl.textContent = 'This is a challenging but achievable pace.';
    } else {
        warningEl.textContent = '';
    }
    
    // Apply this rate
    const clampedRate = Math.min(2, Math.max(0.5, requiredRate));
    state.settings.weekly_loss_rate = requiredRate; // Store actual rate even if > 2
    
    // Update slider to clamped value
    document.getElementById('lossRateSlider').value = clampedRate;
    document.getElementById('lossRateValue').textContent = clampedRate.toFixed(2);
    
    // Update deficit
    const deficit = Math.round(requiredRate * 3500 / 7);
    document.getElementById('dailyDeficit').textContent = deficit + ' cal';
    
    // Update projected loss
    const projectedLoss = macros.calculateProjectedLoss(requiredRate);
    document.getElementById('projectedLoss').textContent = projectedLoss.toFixed(1) + ' lbs';
    
    if (state.isConnected && window.db) {
        window.db.updateUserSettings({ weekly_loss_rate: requiredRate });
    }
    saveToLocalStorage();
    
    updateTargets();
    updateGoalSummary();
    updateWeightChart();
}

function updateGoalSummary() {
    const container = document.getElementById('goalSummary');
    const currentWeight = state.settings?.current_weight;
    const targetWeight = state.settings?.target_weight;
    const rate = state.settings?.weekly_loss_rate || 1.0;
    
    if (!currentWeight || !targetWeight) {
        container.innerHTML = `
            <div class="goal-summary-weight">Set your weights</div>
            <div class="goal-summary-detail">Go to Settings to enter current and target weight</div>
        `;
        return;
    }
    
    const lbsToLose = currentWeight - targetWeight;
    
    if (lbsToLose <= 0) {
        container.innerHTML = `
            <div class="goal-summary-weight">You're at your goal! 🎉</div>
            <div class="goal-summary-detail">Current: ${currentWeight} lbs | Target: ${targetWeight} lbs</div>
        `;
        return;
    }
    
    const weeksNeeded = lbsToLose / rate;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weeksNeeded * 7));
    
    const formatted = targetDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    container.innerHTML = `
        <div class="goal-summary-weight">${currentWeight} → ${targetWeight} lbs</div>
        <div class="goal-summary-detail">${lbsToLose.toFixed(1)} lbs to lose • Target: ${formatted}</div>
    `;
}

function updateWeightTab() {
    const rate = state.settings?.weekly_loss_rate || 1.0;
    const clampedRate = Math.min(2, Math.max(0.5, rate));
    
    document.getElementById('lossRateSlider').value = clampedRate;
    document.getElementById('lossRateValue').textContent = clampedRate.toFixed(2);
    
    const deficit = Math.round(rate * 3500 / 7);
    document.getElementById('dailyDeficit').textContent = deficit + ' cal';
    
    const projectedLoss = macros.calculateProjectedLoss(rate);
    document.getElementById('projectedLoss').textContent = projectedLoss.toFixed(1) + ' lbs';
    
    updateReachDateByRate(rate);
    updateGoalSummary();
    renderWeightHistory();
    updateWeightChart();
}

function renderWeightHistory() {
    const container = document.getElementById('weightHistory');
    
    if (state.weightLogs.length === 0) {
        container.innerHTML = '<p class="empty-state">No weight entries yet.</p>';
        return;
    }
    
    // Show recent entries, newest first
    const recent = [...state.weightLogs].reverse().slice(0, 10);
    
    container.innerHTML = recent.map(log => {
        const date = new Date(log.date + 'T12:00:00');
        const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        return `
            <div class="weight-item">
                <span class="weight-item-date">${formatted}</span>
                <span class="weight-item-value">${log.weight_lbs} lbs</span>
            </div>
        `;
    }).join('');
}

function updateWeightChart() {
    const canvas = document.getElementById('weightChart');
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (state.weightChart) {
        state.weightChart.destroy();
    }
    
    // Get projection data
    const startWeight = state.settings?.current_weight || (state.weightLogs[state.weightLogs.length - 1]?.weight_lbs) || 180;
    const rate = state.settings?.weekly_loss_rate || 1.0;
    const projections = macros.projectWeight(startWeight, rate);
    
    // Format actual weight data
    const actualData = state.weightLogs.map(w => ({
        x: w.date,
        y: w.weight_lbs
    }));
    
    // Format projection data
    const projectedData = projections.map(p => ({
        x: p.date,
        y: p.weight
    }));
    
    state.weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Projected',
                    data: projectedData,
                    borderColor: '#4f46e5',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0
                },
                {
                    label: 'Actual',
                    data: actualData,
                    borderColor: '#10b981',
                    backgroundColor: '#10b981',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM'
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#e5e7eb'
                    }
                }
            }
        }
    });
}

// ============ Settings ============
function updateSettingsForm() {
    if (!state.settings) {
        state.settings = {};
    }
    
    // Use latest weight log if available, otherwise use settings
    const latestLog = state.weightLogs.length > 0 
        ? state.weightLogs[state.weightLogs.length - 1] 
        : null;
    
    const currentWeight = latestLog ? latestLog.weight_lbs : state.settings.current_weight;
    
    // Sync settings with latest weight
    if (latestLog && state.settings.current_weight !== latestLog.weight_lbs) {
        state.settings.current_weight = latestLog.weight_lbs;
        saveToLocalStorage();
    }
    
    document.getElementById('settingWeight').value = currentWeight || '';
    document.getElementById('settingTargetWeight').value = state.settings.target_weight || '';
    document.getElementById('settingHeight').value = state.settings.height_inches || '';
    document.getElementById('settingAge').value = state.settings.age || '';
    document.getElementById('settingSex').value = state.settings.sex || 'male';
    document.getElementById('settingActivity').value = state.settings.activity_level || 'moderate';
    
    updateWeightSyncHint();
}

async function handleSettingsSave(e) {
    e.preventDefault();
    
    const newWeight = parseFloat(document.getElementById('settingWeight').value) || null;
    const oldWeight = state.settings?.current_weight;
    
    const settings = {
        current_weight: newWeight,
        target_weight: parseFloat(document.getElementById('settingTargetWeight').value) || null,
        height_inches: parseFloat(document.getElementById('settingHeight').value) || null,
        age: parseInt(document.getElementById('settingAge').value) || null,
        sex: document.getElementById('settingSex').value,
        activity_level: document.getElementById('settingActivity').value,
        weekly_loss_rate: state.settings?.weekly_loss_rate || 1.0
    };
    
    try {
        // If weight changed, also log it to weight history
        if (newWeight && newWeight !== oldWeight) {
            const today = new Date().toISOString().split('T')[0];
            
            if (state.isConnected && window.db) {
                await window.db.addWeightLog(today, newWeight);
            }
            
            // Update or add to local state
            const existing = state.weightLogs.find(w => w.date === today);
            if (existing) {
                existing.weight_lbs = newWeight;
            } else {
                state.weightLogs.push({ date: today, weight_lbs: newWeight });
            }
            state.weightLogs.sort((a, b) => a.date.localeCompare(b.date));
        }
        
        if (state.isConnected && window.db) {
            state.settings = await window.db.updateUserSettings(settings);
        } else {
            state.settings = { ...state.settings, ...settings };
        }
        
        saveToLocalStorage();
        updateTargets();
        updateWeightTab();
        updateWeightSyncHint();
        updateDashboard();
        
        showToast('Settings saved!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings: ' + (error.message || 'Unknown error'), 'error');
    }
}

// ============ Toast Notifications ============
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============ Recipes ============

function calculateRecipeTotals(items) {
    return items.reduce((totals, item) => {
        const food = item.food || state.foods.find(f => f.id === item.food_id);
        if (food) {
            const servings = item.servings || 1;
            totals.calories += (food.calories || 0) * servings;
            totals.protein += (food.protein || 0) * servings;
            totals.carbs += (food.carbs || 0) * servings;
            totals.fat += (food.fat || 0) * servings;
        }
        return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function renderRecipes() {
    renderRecipesList();
    renderRecipesQuickList();
}

function renderRecipesList() {
    const container = document.getElementById('recipesList');
    
    if (state.recipes.length === 0) {
        container.innerHTML = '<p class="empty-state">No recipes yet. Create one to log multiple foods at once!</p>';
        return;
    }
    
    container.innerHTML = state.recipes.map(recipe => {
        const items = recipe.items || [];
        const totals = calculateRecipeTotals(items);
        const itemNames = items.map(i => {
            const food = i.food || state.foods.find(f => f.id === i.food_id);
            return food ? `${i.servings}x ${food.name}` : '';
        }).filter(Boolean).join(', ');
        
        return `
            <div class="recipe-list-item" data-id="${recipe.id}">
                <div class="recipe-list-info">
                    <div class="recipe-list-name">${recipe.name}</div>
                    <div class="recipe-list-items">${itemNames || 'No items'}</div>
                    <div class="recipe-list-macros">
                        ${Math.round(totals.calories)} cal | P: ${Math.round(totals.protein)}g | C: ${Math.round(totals.carbs)}g | F: ${Math.round(totals.fat)}g
                    </div>
                </div>
                <div class="recipe-list-actions">
                    <button class="btn small primary" onclick="logRecipe('${recipe.id}')">Log</button>
                    <button class="btn small" onclick="editRecipe('${recipe.id}')">Edit</button>
                    <button class="btn small danger" onclick="deleteRecipe('${recipe.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderRecipesQuickList() {
    const container = document.getElementById('recipesQuickList');
    
    if (state.recipes.length === 0) {
        container.innerHTML = '<p class="empty-state">No recipes yet. Create some in the "My Foods" tab!</p>';
        return;
    }
    
    container.innerHTML = state.recipes.map(recipe => {
        const items = recipe.items || [];
        const totals = calculateRecipeTotals(items);
        
        return `
            <div class="recipe-card" onclick="logRecipe('${recipe.id}')">
                <div class="recipe-card-name">${recipe.name}</div>
                <div class="recipe-card-meta">${items.length} item${items.length !== 1 ? 's' : ''}</div>
                <div class="recipe-card-macros">
                    ${Math.round(totals.calories)} cal | ${Math.round(totals.protein)}g protein
                </div>
            </div>
        `;
    }).join('');
}

function openRecipeModal(editId = null) {
    recipeEditState.editId = editId;
    recipeEditState.items = [];
    
    if (editId) {
        const recipe = state.recipes.find(r => r.id === editId);
        if (recipe) {
            document.getElementById('recipeName').value = recipe.name;
            recipeEditState.items = (recipe.items || []).map(item => ({
                food_id: item.food_id || item.food?.id,
                servings: item.servings,
                food: item.food || state.foods.find(f => f.id === item.food_id)
            }));
            document.getElementById('recipeModalTitle').textContent = 'Edit Recipe';
        }
    } else {
        document.getElementById('recipeName').value = '';
        document.getElementById('recipeModalTitle').textContent = 'Create Recipe';
    }
    
    // Populate food dropdown
    const select = document.getElementById('ingredientSelect');
    select.innerHTML = '<option value="">Select a food...</option>' + 
        state.foods.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    
    renderRecipeItems();
    updateRecipeTotals();
    document.getElementById('recipeModal').classList.add('show');
}

function closeRecipeModal() {
    document.getElementById('recipeModal').classList.remove('show');
    recipeEditState.editId = null;
    recipeEditState.items = [];
}

function addIngredient() {
    const select = document.getElementById('ingredientSelect');
    const servingsInput = document.getElementById('ingredientServings');
    
    const foodId = select.value;
    const servings = parseFloat(servingsInput.value) || 1;
    
    if (!foodId) {
        showToast('Select a food first', 'error');
        return;
    }
    
    const food = state.foods.find(f => f.id === foodId);
    if (!food) return;
    
    // Check if already added
    const existing = recipeEditState.items.find(i => i.food_id === foodId);
    if (existing) {
        existing.servings += servings;
    } else {
        recipeEditState.items.push({
            food_id: foodId,
            servings: servings,
            food: food
        });
    }
    
    // Reset inputs
    select.value = '';
    servingsInput.value = '1';
    
    renderRecipeItems();
    updateRecipeTotals();
}

function removeIngredient(foodId) {
    recipeEditState.items = recipeEditState.items.filter(i => i.food_id !== foodId);
    renderRecipeItems();
    updateRecipeTotals();
}

function renderRecipeItems() {
    const container = document.getElementById('recipeItems');
    
    if (recipeEditState.items.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding: 12px;">No ingredients added yet.</p>';
        return;
    }
    
    container.innerHTML = recipeEditState.items.map(item => {
        const food = item.food;
        const cals = Math.round(food.calories * item.servings);
        
        return `
            <div class="recipe-item-row">
                <div class="item-info">
                    <div class="item-name">${food.name}</div>
                    <div class="item-macros">${cals} cal</div>
                </div>
                <div class="item-qty">${item.servings}x</div>
                <button class="item-remove" onclick="removeIngredient('${item.food_id}')">&times;</button>
            </div>
        `;
    }).join('');
}

function updateRecipeTotals() {
    const totals = calculateRecipeTotals(recipeEditState.items);
    
    document.getElementById('recipeTotalCal').textContent = Math.round(totals.calories);
    document.getElementById('recipeTotalProtein').textContent = Math.round(totals.protein) + 'g';
    document.getElementById('recipeTotalCarbs').textContent = Math.round(totals.carbs) + 'g';
    document.getElementById('recipeTotalFat').textContent = Math.round(totals.fat) + 'g';
}

async function saveRecipe() {
    const name = document.getElementById('recipeName').value.trim();
    
    if (!name) {
        showToast('Enter a recipe name', 'error');
        return;
    }
    
    if (recipeEditState.items.length === 0) {
        showToast('Add at least one ingredient', 'error');
        return;
    }
    
    const items = recipeEditState.items.map(i => ({
        food_id: i.food_id,
        servings: i.servings
    }));
    
    try {
        if (recipeEditState.editId) {
            // Update existing
        if (state.isConnected && window.db) {
            const updated = await window.db.updateRecipe(recipeEditState.editId, name, items);
                const index = state.recipes.findIndex(r => r.id === recipeEditState.editId);
                if (index !== -1) state.recipes[index] = updated;
            } else {
                const index = state.recipes.findIndex(r => r.id === recipeEditState.editId);
                if (index !== -1) {
                    state.recipes[index] = {
                        ...state.recipes[index],
                        name,
                        items: recipeEditState.items
                    };
                }
            }
            showToast('Recipe updated!', 'success');
        } else {
            // Create new
            if (state.isConnected && window.db) {
                const newRecipe = await window.db.addRecipe(name, items);
                state.recipes.push(newRecipe);
            } else {
                state.recipes.push({
                    id: 'local_' + Date.now(),
                    name,
                    items: recipeEditState.items
                });
            }
            showToast('Recipe created!', 'success');
        }
        
        saveToLocalStorage();
        renderRecipes();
        closeRecipeModal();
    } catch (error) {
        console.error('Error saving recipe:', error);
        showToast('Error saving recipe', 'error');
    }
}

function editRecipe(recipeId) {
    openRecipeModal(recipeId);
}

async function deleteRecipe(recipeId) {
    if (!confirm('Delete this recipe?')) return;
    
    try {
        if (state.isConnected && window.db) {
            await window.db.deleteRecipe(recipeId);
        }
        
        state.recipes = state.recipes.filter(r => r.id !== recipeId);
        saveToLocalStorage();
        renderRecipes();
        showToast('Recipe deleted', 'success');
    } catch (error) {
        console.error('Error deleting recipe:', error);
        showToast('Error deleting recipe', 'error');
    }
}

async function logRecipe(recipeId) {
    const recipe = state.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const items = recipe.items || [];
    
    try {
        for (const item of items) {
            const foodId = item.food_id || item.food?.id;
            if (foodId) {
                await logFood(foodId, item.servings);
            }
        }
        
        showToast(`Logged ${recipe.name}!`, 'success');
    } catch (error) {
        console.error('Error logging recipe:', error);
        showToast('Error logging recipe', 'error');
    }
}

// ============ Portion Size Guide ============
const portionData = {
    volume: [
        {
            emoji: '🎾',
            size: '1 cup',
            comparison: 'Size of a tennis ball',
            examples: 'Rice, pasta, cereal, yogurt, cut fruit',
            shape: 'round'
        },
        {
            emoji: '⚾',
            size: '½ cup',
            comparison: 'Size of a baseball (half)',
            examples: 'Cooked vegetables, cottage cheese, ice cream',
            shape: 'round'
        },
        {
            emoji: '🏐',
            size: '1½ cups',
            comparison: 'Size of a small volleyball',
            examples: 'Large salad, popcorn serving',
            shape: 'round'
        },
        {
            emoji: '🥎',
            size: '¼ cup',
            comparison: 'Size of a golf ball',
            examples: 'Nuts, dried fruit, salad dressing',
            shape: 'round'
        },
        {
            emoji: '👍',
            size: '1 tbsp',
            comparison: 'Size of your thumb tip',
            examples: 'Peanut butter, mayo, oil, butter',
            shape: 'round'
        },
        {
            emoji: '🎲',
            size: '1 tsp',
            comparison: 'Size of a dice',
            examples: 'Sugar, honey, cooking oil',
            shape: 'square'
        }
    ],
    weight: [
        {
            emoji: '🃏',
            size: '3 oz',
            comparison: 'Size of a deck of cards',
            examples: 'Cooked meat, chicken, fish fillet',
            shape: 'square'
        },
        {
            emoji: '📱',
            size: '4 oz',
            comparison: 'Size of a smartphone',
            examples: 'Chicken breast, salmon fillet, steak',
            shape: 'square'
        },
        {
            emoji: '🧼',
            size: '6 oz',
            comparison: 'Size of 2 decks of cards',
            examples: 'Large chicken breast, fish portion',
            shape: 'square'
        },
        {
            emoji: '🖱️',
            size: '1 oz / 28g',
            comparison: 'Size of a computer mouse',
            examples: 'Cheese slice, handful of nuts',
            shape: 'square'
        },
        {
            emoji: '💡',
            size: '2 oz / 56g',
            comparison: 'Size of a light bulb',
            examples: 'Deli meat, small cheese portion',
            shape: 'round'
        }
    ],
    protein: [
        {
            emoji: '✋',
            size: 'Palm',
            comparison: 'Your palm (no fingers) = 3-4 oz',
            examples: 'Use your palm to estimate meat/fish portions',
            shape: 'round'
        },
        {
            emoji: '✊',
            size: 'Fist',
            comparison: 'Your fist = about 1 cup',
            examples: 'Use your fist for rice, pasta, vegetables',
            shape: 'round'
        },
        {
            emoji: '🥚',
            size: '1 egg',
            comparison: 'One large egg',
            examples: '70 cal, 6g protein, 5g fat',
            shape: 'round'
        },
        {
            emoji: '🍗',
            size: '1 thigh',
            comparison: 'Chicken thigh (bone-in)',
            examples: '~180 cal, 26g protein with skin',
            shape: 'round'
        },
        {
            emoji: '🥩',
            size: 'Steak',
            comparison: 'Typical restaurant steak = 8-12 oz',
            examples: 'Home portion should be 4-6 oz (palm-sized)',
            shape: 'square'
        },
        {
            emoji: '🐟',
            size: 'Fish fillet',
            comparison: 'Checkbook size = ~4 oz',
            examples: 'Salmon, tilapia, cod fillet',
            shape: 'square'
        }
    ]
};

let currentPortionCategory = 'volume';
let currentPortionIndex = 0;

function openPortionGuide() {
    currentPortionIndex = 0;
    currentPortionCategory = 'volume';
    renderPortionSlide();
    renderPortionDots();
    updatePortionCategoryButtons();
    document.getElementById('portionGuide').classList.add('show');
}

function closePortionGuide() {
    document.getElementById('portionGuide').classList.remove('show');
}

function renderPortionSlide() {
    const slides = portionData[currentPortionCategory];
    const slide = slides[currentPortionIndex];
    
    document.getElementById('portionSlide').innerHTML = `
        <div class="portion-visual ${slide.shape === 'square' ? 'square' : ''}">
            ${slide.emoji}
            <span class="portion-visual-label">${slide.size}</span>
        </div>
        <div class="portion-title">${slide.size}</div>
        <div class="portion-comparison">${slide.comparison}</div>
        <div class="portion-examples"><strong>Common foods:</strong> ${slide.examples}</div>
    `;
}

function renderPortionDots() {
    const slides = portionData[currentPortionCategory];
    const container = document.getElementById('portionDots');
    
    container.innerHTML = slides.map((_, i) => `
        <div class="portion-dot ${i === currentPortionIndex ? 'active' : ''}" onclick="goToPortion(${i})"></div>
    `).join('');
}

function updatePortionCategoryButtons() {
    document.querySelectorAll('.portion-cat').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === currentPortionCategory);
    });
}

function nextPortion() {
    const slides = portionData[currentPortionCategory];
    currentPortionIndex = (currentPortionIndex + 1) % slides.length;
    renderPortionSlide();
    renderPortionDots();
}

function prevPortion() {
    const slides = portionData[currentPortionCategory];
    currentPortionIndex = (currentPortionIndex - 1 + slides.length) % slides.length;
    renderPortionSlide();
    renderPortionDots();
}

function goToPortion(index) {
    currentPortionIndex = index;
    renderPortionSlide();
    renderPortionDots();
}

function showPortionCategory(category) {
    currentPortionCategory = category;
    currentPortionIndex = 0;
    renderPortionSlide();
    renderPortionDots();
    updatePortionCategoryButtons();
}

// Make functions available globally
window.switchTab = switchTab;
window.deleteLog = deleteLog;
window.toggleFavorite = toggleFavorite;
window.deleteFood = deleteFood;
window.editFood = editFood;
window.quickLog = quickLog;
window.confirmLog = confirmLog;
window.closeModal = closeModal;
window.lookupAndAdd = lookupAndAdd;
window.showManualAddForm = showManualAddForm;
window.selectLookupResult = selectLookupResult;
window.selectLookupResultByIndex = selectLookupResultByIndex;
window.openPortionGuide = openPortionGuide;
window.closePortionGuide = closePortionGuide;
window.nextPortion = nextPortion;
window.prevPortion = prevPortion;
window.goToPortion = goToPortion;
window.showPortionCategory = showPortionCategory;
window.openRecipeModal = openRecipeModal;
window.closeRecipeModal = closeRecipeModal;
window.addIngredient = addIngredient;
window.removeIngredient = removeIngredient;
window.saveRecipe = saveRecipe;
window.editRecipe = editRecipe;
window.deleteRecipe = deleteRecipe;
window.logRecipe = logRecipe;
window.setGoalMode = setGoalMode;
window.updateGoalFromDate = updateGoalFromDate;
