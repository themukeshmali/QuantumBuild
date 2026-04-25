// ============================================================
// QUANTUM BUILD — Dashboard API Layer + Auth Utilities
// ============================================================

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api';

// ============ Auth ============
function getToken() {
    try {
        const u = JSON.parse(localStorage.getItem('qb_user'));
        return u?.token || null;
    } catch { return null; }
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('qb_user')) || null;
    } catch { return null; }
}

function isAdmin() {
    const u = getCurrentUser();
    return u && u.isAdmin === true;
}

function saveUser(data) {
    localStorage.setItem('qb_user', JSON.stringify(data));
}

function clearUser() {
    localStorage.removeItem('qb_user');
}

function logout() {
    clearUser();
    window.location.href = 'index.html';
}

// ============ Fetch Wrapper ============
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
        clearUser();
        window.location.href = 'index.html';
        throw new Error('Session expired');
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
    }

    return data;
}

// ============ Auth ============
async function apiLogin(email, password) {
    const data = await apiFetch('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    return data;
}

// ============ Products ============
async function apiGetProducts(params = {}) {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/products${q ? '?' + q : ''}`);
}

async function apiGetProduct(id) {
    return apiFetch(`/products/${id}`);
}

async function apiCreateProduct(body = {}) {
    return apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

async function apiUpdateProduct(id, body) {
    return apiFetch(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

async function apiDeleteProduct(id) {
    return apiFetch(`/products/${id}`, { method: 'DELETE' });
}

async function apiGetTopProducts() {
    return apiFetch('/products/top');
}

async function apiGetCategories() {
    return apiFetch('/products/categories');
}

// ============ Orders ============
async function apiGetOrders() {
    return apiFetch('/orders');
}

async function apiGetOrder(id) {
    return apiFetch(`/orders/${id}`);
}

async function apiUpdateOrderStatus(id, status) {
    return apiFetch(`/orders/${id}/status`, { 
        method: 'PUT',
        body: JSON.stringify({ status })
    });
}

// ============ Users ============
async function apiGetUsers() {
    return apiFetch('/users');
}

async function apiGetUser(id) {
    return apiFetch(`/users/${id}`);
}

async function apiUpdateUser(id, body) {
    return apiFetch(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

async function apiDeleteUser(id) {
    return apiFetch(`/users/${id}`, { method: 'DELETE' });
}

// ============ Coupons ============
async function apiGetCoupons() {
    return apiFetch('/coupons');
}

async function apiCreateCoupon(body) {
    return apiFetch('/coupons', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

async function apiUpdateCoupon(id, body) {
    return apiFetch(`/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

async function apiDeleteCoupon(id) {
    return apiFetch(`/coupons/${id}`, { method: 'DELETE' });
}

// ============ Notification System ============
function notify(message, type = 'success') {
    const container = document.getElementById('notifContainer');
    if (!container) return;

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.innerHTML = `
        <span class="notification-icon">${icons[type] || icons.success}</span>
        <span class="notification-text">${message}</span>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('show'));
    });

    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 400);
    }, 3500);
}

// ============ Confirm Dialog ============
// Named qbConfirm to avoid shadowing native window.confirm()
function qbConfirm(message, title = 'Are you sure?', onConfirm) {
    const overlay = document.getElementById('confirmOverlay');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMsg = document.getElementById('confirmMsg');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (!overlay) return;

    confirmTitle.textContent = title;
    confirmMsg.textContent = message;
    overlay.classList.add('open');

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    const close = () => overlay.classList.remove('open');

    newConfirmBtn.addEventListener('click', () => {
        close();
        onConfirm();
    });
    newCancelBtn.addEventListener('click', close);
}

// ============ Helpers ============
function formatPrice(n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function shortId(id) {
    return '#' + String(id).slice(-8).toUpperCase();
}

function getStockBadge(qty) {
    if (qty <= 0) return '<span class="badge badge-out">Out of Stock</span>';
    if (qty <= 5) return `<span class="badge badge-low">Low (${qty})</span>`;
    return `<span class="badge badge-in">In Stock (${qty})</span>`;
}
