// ============================================
// QUANTUM BUILD — Auth Utilities
// Login, Register, Logout, Token Management
// ============================================

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

// ============ Token Management ============
function getToken() {
    const userInfo = localStorage.getItem('qb_user');
    if (userInfo) {
        try {
            return JSON.parse(userInfo).token;
        } catch (e) { return null; }
    }
    return null;
}

function getCurrentUser() {
    const userInfo = localStorage.getItem('qb_user');
    if (userInfo) {
        try {
            return JSON.parse(userInfo);
        } catch (e) { return null; }
    }
    return null;
}

function isLoggedIn() {
    return !!getToken();
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.isAdmin === true;
}

function saveUserInfo(userInfo) {
    localStorage.setItem('qb_user', JSON.stringify(userInfo));
}

function clearUserInfo() {
    localStorage.removeItem('qb_user');
}

// ============ API Calls ============
async function loginUser(email, password) {
    const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Login failed');
    }

    saveUserInfo(data);
    return data;
}

async function registerUser(name, email, password) {
    const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }

    saveUserInfo(data);
    return data;
}

async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        clearUserInfo();
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        throw new Error('Session expired');
    }

    return response;
}

async function getUserProfile() {
    const response = await fetchWithAuth(`${API_BASE}/users/profile`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
    return data;
}

async function updateUserProfile(updates) {
    const response = await fetchWithAuth(`${API_BASE}/users/profile`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update profile');

    // Update stored user info (keep token)
    const currentUser = getCurrentUser();
    saveUserInfo({ ...currentUser, ...data });
    return data;
}

function logout() {
    clearUserInfo();
    window.location.href = 'index.html';
}

// ============ Navbar Auth State ============
function updateNavbarAuth() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const user = getCurrentUser();
    const cartLink = navActions.querySelector('.nav-cart');

    // Remove old auth elements
    navActions.querySelectorAll('.nav-auth-link, .nav-user-menu').forEach(el => el.remove());

    if (user) {
        // Logged-in state: user dropdown
        const userMenu = document.createElement('div');
        userMenu.className = 'nav-user-menu';
        userMenu.innerHTML = `
            <button class="nav-user-btn" id="navUserBtn">
                <span class="nav-user-avatar">${user.name.charAt(0).toUpperCase()}</span>
                <span class="nav-user-name">${user.name.split(' ')[0]}</span>
                <span class="nav-user-arrow">▾</span>
            </button>
            <div class="nav-dropdown" id="navDropdown">
                <a href="profile.html" class="dropdown-item">👤 My Profile</a>
                <a href="profile.html#orders" class="dropdown-item">📦 My Orders</a>
                ${user.isAdmin ? '<a href="admin.html" class="dropdown-item dropdown-admin">⚡ Admin Panel</a>' : ''}
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item dropdown-logout" onclick="logout(); return false;">🚪 Logout</a>
            </div>
        `;

        if (cartLink) {
            cartLink.after(userMenu);
        } else {
            navActions.appendChild(userMenu);
        }

        // Toggle dropdown
        const btn = userMenu.querySelector('#navUserBtn');
        const dropdown = userMenu.querySelector('#navDropdown');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        document.addEventListener('click', () => dropdown.classList.remove('open'));
    } else {
        // Logged-out state: Login link
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.className = 'nav-auth-link';
        loginLink.textContent = 'Login';

        if (cartLink) {
            cartLink.after(loginLink);
        } else {
            navActions.appendChild(loginLink);
        }
    }
}

// Auto-init navbar auth on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavbarAuth();
});
