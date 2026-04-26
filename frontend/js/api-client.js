// ============================================================
// QUANTUM BUILD — API Client (Shared)
// Single source of truth for backend URL + fetch helpers
// Loaded on every page via <script src="js/api-client.js">
// ============================================================

// ── Base URL ────────────────────────────────────────────────
// Dev: local backend | Production: absolute Render URL (required for Vercel split-deploy)
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://quantumbuild.onrender.com/api';

// ── Fetch Helpers ────────────────────────────────────────────

// NOTE: fetchWithAuth is defined in auth.js (loaded after api-client.js,
// but before page-specific scripts like home.js, cart.js, etc.).

/** Anonymous fetch with JSON headers */
async function fetchJSON(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed (${res.status})`);
    }
    return res.json();
}

// ── Product API ──────────────────────────────────────────────

/**
 * Fetch products from the backend API
 * @param {Object} params - Query params: keyword, category, pageSize, pageNumber, sortBy
 * @returns {Promise<{products, page, pages, totalProducts}>}
 */
async function apiGetProducts(params = {}) {
    const qs = new URLSearchParams();
    if (params.keyword)        qs.set('keyword',        params.keyword);
    if (params.category)       qs.set('category',       params.category);
    if (params.broadCategory)  qs.set('broadCategory',  params.broadCategory);
    if (params.pageSize)       qs.set('pageSize',       params.pageSize);
    if (params.pageNumber)     qs.set('pageNumber',     params.pageNumber);
    if (params.sortBy)         qs.set('sortBy',         params.sortBy);
    if (params.brand)      qs.set('brand',      params.brand);
    if (params.minPrice)   qs.set('minPrice',   params.minPrice);
    if (params.maxPrice)   qs.set('maxPrice',   params.maxPrice);
    if (params.minRating)  qs.set('minRating',  params.minRating);

    const timestamp = Date.now();
    const url = `${API_BASE}/products?${qs.toString()}&_t=${timestamp}`;
    return fetchJSON(url);
}

/** Fetch a single product by MongoDB _id or legacy string id */
async function apiGetProductById(id) {
    return fetchJSON(`${API_BASE}/products/${id}`);
}

/** Fetch top-rated products */
async function apiGetTopProducts() {
    return fetchJSON(`${API_BASE}/products/top`);
}

/** Fetch all part categories */
async function apiGetCategories() {
    return fetchJSON(`${API_BASE}/products/categories`);
}

/** Submit a product review */
async function apiSubmitReview(productId, rating, comment) {
    const res = await fetchWithAuth(`${API_BASE}/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Review submission failed');
    }
    return res.json();
}

// ── Order API ────────────────────────────────────────────────

/** Fetch orders for the logged-in user */
async function apiGetMyOrders() {
    const res = await fetchWithAuth(`${API_BASE}/orders/myorders`);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load orders');
    }
    return res.json();
}

/** Fetch a single order by ID */
async function apiGetOrderById(id) {
    const res = await fetchWithAuth(`${API_BASE}/orders/${id}`);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Order not found');
    }
    return res.json();
}

/** Create a new order */
async function apiCreateOrder(orderData) {
    const res = await fetchWithAuth(`${API_BASE}/orders`, {
        method: 'POST',
        body: JSON.stringify(orderData),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create order');
    }
    return res.json();
}

/** Cancel an order (only if unpaid and not delivered) */
async function apiCancelOrder(id) {
    const res = await fetchWithAuth(`${API_BASE}/orders/${id}/cancel`, {
        method: 'PUT',
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to cancel order');
    }
    return res.json();
}

/** Validate Coupon */
async function apiValidateCoupon(code) {
    const res = await fetchWithAuth(`${API_BASE}/coupons/validate`, {
        method: 'POST',
        body: JSON.stringify({ code }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid coupon code');
    }
    return res.json();
}

// ── User API ─────────────────────────────────────────────────

/** Login */
async function apiLogin(email, password) {
    return fetchJSON(`${API_BASE}/users/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

/** Register */
async function apiRegister(name, email, password) {
    return fetchJSON(`${API_BASE}/users`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
}

/** Forgot password */
async function apiForgotPassword(email) {
    return fetchJSON(`${API_BASE}/users/forgotpassword`, {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

/** Reset password */
async function apiResetPassword(token, password) {
    return fetchJSON(`${API_BASE}/users/resetpassword/${token}`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
    });
}

/** Get profile */
async function apiGetProfile() {
    const res = await fetchWithAuth(`${API_BASE}/users/profile`);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load profile');
    }
    return res.json();
}

/** Update profile */
async function apiUpdateProfile(updateData) {
    const res = await fetchWithAuth(`${API_BASE}/users/profile`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Update failed');
    }
    return res.json();
}

/** Get user wishlist */
async function apiGetWishlist() {
    const res = await fetchWithAuth(`${API_BASE}/users/wishlist`);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load wishlist');
    }
    return res.json();
}

/** Toggle item in wishlist */
async function apiToggleWishlist(productId) {
    const res = await fetchWithAuth(`${API_BASE}/users/wishlist`, {
        method: 'POST',
        body: JSON.stringify({ productId }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update wishlist');
    }
    return res.json();
}

// ── Contact API ──────────────────────────────────────────────
async function apiSubmitContact(contactData) {
    return fetchJSON(`${API_BASE}/contact`, {
        method: 'POST',
        body: JSON.stringify(contactData),
    });
}

// ── Backend Availability Check ────────────────────────────────
let _backendAvailable = null;

async function isBackendAvailable() {
    if (_backendAvailable !== null) return _backendAvailable;
    try {
        const res = await fetch(`${API_BASE}/products?pageSize=1`, { signal: AbortSignal.timeout(3000) });
        _backendAvailable = res.ok;
    } catch {
        _backendAvailable = false;
    }
    return _backendAvailable;
}

// ── Normalize Product ─────────────────────────────────────────
// Converts a MongoDB product to the shape the UI expects
function normalizeProduct(p) {
    let imgPath = p.image || '';
    if (imgPath.startsWith('/assets/')) {
        imgPath = imgPath.substring(1);
    }

    const catArtIcons = {
        cpu: '⚡', gpu: '🎯', motherboard: '🖥️', ram: '💡', storage: '💾', psu: '🔌', case: '🗃️', cooling: '❄️', fans: '🌀', headset: '🎧', thermal: '🧴', cables: '🔗'
    };
    const catArtColors = {
        cpu: '#1a3a6e', gpu: '#0d2e0d', motherboard: '#1a2e1a', ram: '#1a1a5c', storage: '#1a2a1a', psu: '#1a1a3a', case: '#1a1a2e', cooling: '#1a2e3a', fans: '#2e1a2e', headset: '#1a1a2e', thermal: '#2e2e2e', cables: '#2e1a1a'
    };
    const pCat = p.partCategory || p.category || '';

    return {
        id:            p._id || p.id,
        _id:           p._id || p.id,
        name:          p.name,
        brand:         p.brand,
        category:      p.category,
        partCategory:  pCat,
        price:         p.price,
        originalPrice: p.originalPrice || null,
        image:         imgPath,
        description:   p.description,
        rating:        p.rating || 0,
        reviews:       p.numReviews || p.reviews || 0,
        numReviews:    p.numReviews || p.reviews || 0,
        countInStock:  p.countInStock ?? 0,
        badge:         p.badge || null,
        specifications: p.specifications || p.spec || '',
        spec:          p.specifications || p.spec || '',
        compatibility: p.compatibility || '',
        // Parts-specific fields (from static data, kept for backwards compat)
        artColor:      p.artColor || catArtColors[pCat] || '#d4003a',
        artIcon:       p.artIcon || catArtIcons[pCat] || '📦',
        popularity:    p.popularity || 0,
        // PC-specific
        cpu:           p.cpu || '',
        gpu:           p.gpu || '',
        ram:           p.ram || '',
        storage:       p.storage || '',
        cooling:       p.cooling || '',
        psu:           p.psu || '',
        fps:           p.fps || {},
    };
}
