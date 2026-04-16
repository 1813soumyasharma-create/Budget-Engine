console.log('%c BE ENGINE — Layout v2.0 Loaded ', 'background: #222; color: #ffca28; font-weight: bold;');

const token = localStorage.getItem('be_token');
const isPublicPage = window.location.pathname.endsWith('index.html'); // Only index.html is truly public

if (!token && !isPublicPage) {
    window.location.href = 'index.html';
}
const user = JSON.parse(localStorage.getItem('be_user') || '{}');

// Initialize theme as soon as possible
(function() {
    const savedTheme = localStorage.getItem('be_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();


function initLayout(activePage) {
    if (document.querySelector('.sidebar')) return; // Prevent duplicate injection

    const sidebarHtml = `
        <div class="sidebar">
            <div class="sidebar-brand">BE ENGINE</div>
            <div class="sidebar-nav">
                ${user.role === 'admin' ? `
                    <a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">DASHBOARD</a>
                    <a href="stock-management.html" class="${activePage === 'stock' ? 'active' : ''}">STOCK MANAGEMENT</a>
                    <a href="orders-management.html" class="${activePage === 'orders' ? 'active' : ''}">ORDERS</a>
                    <a href="vendor-profiles.html" class="${activePage === 'vendors' ? 'active' : ''}">VENDOR PROFILES</a>
                    <a href="income.html" class="${activePage === 'income' ? 'active' : ''}">INCOME</a>
                    <a href="expenses.html" class="${activePage === 'expenses' ? 'active' : ''}">EXPENSES</a>
                    <a href="tally.html" class="${activePage === 'tally' ? 'active' : ''}">TALLY SYNC</a>
                    <a href="settings.html" class="${activePage === 'settings' ? 'active' : ''}">SETTINGS</a>
                ` : `
                    <a href="vendors.html" class="${activePage === 'vendors' ? 'active' : ''}">PRODUCT CATALOG</a>
                `}
            </div>
            <div style="padding: 1.5rem; text-align: center; margin-top: auto;">
                <button class="btn-outline" style="width: 100%; border-color: var(--border-color); color: var(--text-muted);" onclick="logout()">LOGOUT</button>
            </div>
        </div>
    `;

    const headerHtml = `
        <div class="header-bar">
            <div class="header-brand">${user.firm_name || 'Budget Engine'}</div>
            <div class="header-user">
                <button class="theme-toggle" onclick="toggleTheme()" title="Toggle Theme">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                </button>
                <span class="data-font" style="font-size: 0.8rem;">${new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <span style="color: var(--accent-teal); font-weight: bold;">[ ${(user.username || 'Admin').toUpperCase()} ]</span>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertAdjacentHTML('afterbegin', headerHtml);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('be_theme', newTheme);
}


function logout() {
    localStorage.removeItem('be_token');
    localStorage.removeItem('be_user');
    window.location.href = 'index.html';
}

async function apiFetch(url, options = {}) {
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const res = await fetch(url, options);
    if (res.status === 401 || res.status === 403) {
        logout();
        throw new Error('Unauthorized');
    }
    return res;
}

function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

// Auth-aware export: fetches with JWT then triggers browser download
async function exportToExcel(type) {
    try {
        const token = localStorage.getItem('be_token');
        if (!token) {
            alert('CRITICAL: Your session check failed. Please log out and log back in.');
            return;
        }

        console.log(`[EXPORT] Preparing ${type} export link...`);
        
        const downloadUrl = `/api/${type}/export.xlsx?token=${encodeURIComponent(token)}`;
        
        // Method 2: Create a temporary anchor (Force Download)
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        // The browser might ignore this download name if the server sends one, but it helps
        a.download = `${type}_export.xlsx`;
        
        document.body.appendChild(a);
        
        console.log(`[EXPORT] Clicking download link: ${downloadUrl.slice(0, 50)}...`);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            console.log(`[EXPORT] Cleanup done.`);
        }, 500);
        
    } catch (e) {
        console.error('[EXPORT] Fatal error in layout.js:', e);
        alert('SYSTEM ERROR: ' + e.message);
    }
}

// Normalize tally_synced from DB (SQLite returns integers, JS fetch returns numbers)
// DB only stores 0 or 1 — there is no -1 state; map accordingly
function syncBadge(val) {
    // Coerce to number in case JSON returns string
    const v = Number(val);
    if (v === 1) return '<span class="badge badge-synced">✓ SYNCED</span>';
    return '<span class="badge badge-pending">⏳ PENDING</span>';
}