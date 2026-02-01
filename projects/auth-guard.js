// Auth Guard for /projects/ - Only allows admin access
// Admin email: jm@marziale.tech

const SUPABASE_URL = 'https://qvrrlfzogtuahmvsbvmu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cnJsZnpvZ3R1YWhtdnNidm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjY2OTQsImV4cCI6MjA4NTIwMjY5NH0.JmbIVK2JpeuPfkimIm00J63cAoIH7steTBpvgHnzDuU';
const ADMIN_EMAIL = 'jm@marziale.tech';

// Create login overlay
function createLoginOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
        <style>
            #auth-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #1a1a2e;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #fff;
            }
            #auth-overlay h1 {
                font-size: 2rem;
                margin-bottom: 1rem;
            }
            #auth-overlay p {
                color: #888;
                margin-bottom: 2rem;
            }
            #auth-overlay button {
                background: #4a90d9;
                color: #fff;
                border: none;
                padding: 1rem 2rem;
                font-size: 1rem;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            #auth-overlay button:hover {
                background: #3a7bc8;
            }
            #auth-overlay .error {
                color: #ff6b6b;
                margin-top: 1rem;
            }
            #auth-overlay .github-icon {
                width: 20px;
                height: 20px;
            }
        </style>
        <h1>🔒 Admin Access Required</h1>
        <p>This area is restricted to authorized users.</p>
        <button id="github-login-btn">
            <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Log in with GitHub
        </button>
        <p class="error" id="auth-error" style="display: none;"></p>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

// Initialize auth guard
(async function initAuthGuard() {
    // Wait for Supabase to load
    const waitForSupabase = () => new Promise((resolve) => {
        if (window.supabase) return resolve(window.supabase);
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => resolve(window.supabase);
        document.head.appendChild(script);
    });

    const supabaseLib = await waitForSupabase();
    const client = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Check current session from localStorage first
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    console.log('Auth guard: getSession result', sessionData, sessionError);
    let user = sessionData?.session?.user || null;
    
    // If we got a session from localStorage, also validate it's still valid
    if (user) {
        const { data: userData, error: userError } = await client.auth.getUser();
        console.log('Auth guard: getUser result', userData, userError);
        user = userData?.user || null;
    }

    const path = window.location.pathname || '';
    const isBibleProject = path.indexOf('/projects/bible') !== -1;

    if (user && (user.email === ADMIN_EMAIL || isBibleProject)) {
        // Admin or any logged-in user on bible - allow access
        console.log('Auth guard: Access granted for', user.email, isBibleProject ? '(bible)' : '(admin)');
        return;
    }

    console.log('Auth guard: No valid session, user:', user?.email || 'none');

    // Not allowed - show login overlay
    document.body.style.overflow = 'hidden';
    const overlay = createLoginOverlay();
    const errorEl = document.getElementById('auth-error');

    // Handle login button click
    document.getElementById('github-login-btn').addEventListener('click', async () => {
        try {
            const { error } = await client.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: window.location.href
                }
            });
            if (error) throw error;
        } catch (err) {
            errorEl.textContent = 'Login failed: ' + err.message;
            errorEl.style.display = 'block';
        }
    });

    // Listen for auth state changes (after OAuth redirect)
    const path = window.location.pathname || '';
    const isBibleProject = path.indexOf('/projects/bible') !== -1;
    client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            if (session.user.email === ADMIN_EMAIL || isBibleProject) {
                overlay.remove();
                document.body.style.overflow = '';
                console.log('Auth guard: Access granted after login', isBibleProject ? '(bible)' : '(admin)');
            } else {
                errorEl.textContent = `Access denied. ${session.user.email} is not an admin.`;
                errorEl.style.display = 'block';
                await client.auth.signOut();
            }
        }
    });
})();
