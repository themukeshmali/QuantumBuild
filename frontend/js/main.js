// ============================================
// QUANTUM BUILD — Main Shared JavaScript
// Navbar, Scroll Animations, Cart, Utilities
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initNavSearch();
    initScrollReveal();
    initBackToTop();
    updateCartCount();
    updateCartCount();
    updateWishlistCount();
    syncWishlist();
});

// ============ Wishlist Sync ============
async function syncWishlist() {
    if (typeof isLoggedIn === 'function' && isLoggedIn() && typeof apiGetWishlist === 'function') {
        try {
            const serverList = await apiGetWishlist();
            const formatted = serverList.map(p => ({
                id: p._id,
                name: p.name,
                price: p.price,
                image: p.image,
                brand: p.brand,
                originalPrice: p.originalPrice
            }));
            localStorage.setItem('qb_wishlist', JSON.stringify(formatted));
            updateWishlistCount();
        } catch (e) {
            console.error('Failed to sync wishlist:', e);
        }
    }
}

// ============ Global Search ============
function initNavSearch() {
    const form = document.getElementById('navSearch');
    const input = document.getElementById('navSearchInput');
    if (!form || !input) return;

    // Pre-fill if on parts/pcs page with keyword in URL
    const urlKeyword = new URLSearchParams(window.location.search).get('keyword');
    if (urlKeyword) input.value = urlKeyword;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleNavSearch(e);
    });

    // Keyboard shortcut — Ctrl+K or Cmd+K
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            input.focus();
            input.select();
        }
        if (e.key === 'Escape' && document.activeElement === input) {
            input.blur();
        }
    });
}

function handleNavSearch(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('navSearchInput');
    if (!input) return;
    const q = input.value.trim();
    if (!q) return;
    // Context-aware search: if already on pcs.html, search there; otherwise default to parts
    const currentPage = window.location.pathname.split('/').pop();
    const targetPage = currentPage === 'pcs.html' ? 'pcs.html' : 'parts.html';
    window.location.href = `${targetPage}?keyword=${encodeURIComponent(q)}`;
}

// ============ Navbar ============
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navOverlay = document.querySelector('.nav-overlay');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
            if (navOverlay) navOverlay.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
        });
    }

    // Close on overlay click
    if (navOverlay) {
        navOverlay.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
            navOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close on link click (mobile)
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navToggle.classList.remove('active');
                navLinks.classList.remove('open');
                if (navOverlay) navOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Set active link
    setActiveNavLink();
}

function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ============ Scroll Reveal ============
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => observer.observe(el));
}

// ============ Back to Top ============
function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============ Cart (localStorage) ============
function getCart() {
    try {
        return JSON.parse(localStorage.getItem('qb_cart')) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem('qb_cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId, qty = 1, productInfo = {}) {
    const cart = getCart();
    const existing = cart.find(item => String(item.id) === String(productId));

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id: productId, qty, ...productInfo });
    }

    saveCart(cart);
    showNotification('Added to cart!');
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => String(item.id) !== String(productId));
    saveCart(cart);
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

function updateCartCount() {
    const countElements = document.querySelectorAll('.cart-count');
    const count = getCartCount();
    countElements.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });

    // ── Inject Admin Dashboard link for admin users ──────────────
    try {
        const user = JSON.parse(localStorage.getItem('qb_user') || 'null');
        const adminLink = document.getElementById('nav-admin-link');
        const navLinks = document.querySelector('.nav-links');

        if (user && user.isAdmin && navLinks && !adminLink) {
            const li = document.createElement('a');
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            li.href = isLocal ? '../dashboard/index.html' : 'https://quantum-build-dashboard.vercel.app/';
            li.id = 'nav-admin-link';
            li.textContent = 'View Dashboard';
            li.style.cssText = 'color:var(--accent-red);font-weight:700;letter-spacing:.5px;margin-right:24px;text-decoration:none;';
            li.title = 'Admin Dashboard';
            navLinks.appendChild(li);
        }
        if ((!user || !user.isAdmin) && adminLink) {
            adminLink.remove();
        }
    } catch {}
}

// ============ Notifications ============
function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.qb-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `qb-notification qb-notification-${type}`;
    notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">&times;</button>
  `;

    const bgMap = {
        success: 'linear-gradient(135deg, #ff0040, #ff2d2d)',
        error:   'linear-gradient(135deg, #f97316, #ef4444)',
        info:    'linear-gradient(135deg, #3b82f6, #6366f1)',
    };
    const shadowMap = {
        success: '0 10px 40px rgba(255, 0, 64, 0.3)',
        error:   '0 10px 40px rgba(239, 68, 68, 0.3)',
        info:    '0 10px 40px rgba(59, 130, 246, 0.3)',
    };

    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%) translateY(100px)',
        background: bgMap[type] || bgMap.info,
        color: '#fff',
        padding: '14px 28px',
        borderRadius: '8px',
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: '1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: '9999',
        boxShadow: shadowMap[type] || shadowMap.info,
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        letterSpacing: '1px'
    });

    const closeBtn = notification.querySelector('button');
    Object.assign(closeBtn.style, {
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: '1.3rem',
        cursor: 'pointer',
        lineHeight: '1'
    });

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// ============ Utility: Format Price (Indian Rupee) ============
function formatPrice(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

// ============ Utility: Generate Star HTML ============
function getStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let html = '';

    for (let i = 0; i < fullStars; i++) {
        html += '<span class="star star-full">★</span>';
    }
    if (halfStar) html += '<span class="star star-half">✦</span>';
    for (let i = fullStars + (halfStar ? 1 : 0); i < 5; i++) {
        html += '<span class="star star-empty">☆</span>';
    }

    return html;
}

// ============ Utility: Create Product Card HTML ============
function createProductCard(product) {
    const discount = product.originalPrice
        ? Math.round((1 - product.price / product.originalPrice) * 100)
        : 0;

    // Supports both API shape (image: string) and static shape (images: [])
    const imgSrc = product.image
        || (product.images && product.images[0])
        || '/assets/images/parts/sample.png';

    const productId = product._id || product.id;
    const gpu     = product.gpu     || '';
    const ram     = product.ram     || '';
    const cpu     = product.cpu     || '';
    const reviews = product.numReviews ?? product.reviews ?? 0;

    return `
    <div class="product-card reveal" data-category="${product.category}">
      ${product.badge ? `<div class="card-badge">${product.badge}</div>` : ''}
      <a href="product.html?id=${productId}" class="card-image">
        <img src="${imgSrc}" alt="${product.name}" loading="lazy"
             onerror="this.style.display='none'">
      </a>
      <div class="card-body">
        <div class="card-category">${product.category}</div>
        <h3 class="card-title">${product.name}</h3>
        <div class="card-specs">
          ${gpu  ? `<span class="spec-tag">${gpu.split(' ').slice(1,3).join(' ')}</span>` : ''}
          ${ram  ? `<span class="spec-tag">${ram.split(' ')[0]}</span>` : ''}
          ${cpu  ? `<span class="spec-tag">${cpu.split(' ').slice(2,4).join(' ')}</span>` : ''}
          ${product.partCategory ? `<span class="spec-tag">${product.partCategory.toUpperCase()}</span>` : ''}
        </div>
        <div class="star-rating">
          ${getStarsHTML(product.rating || 0)}
          <span class="rating-text">(${reviews})</span>
        </div>
        <div class="card-footer">
          <div class="card-price">
            ${formatPrice(product.price)}
            ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
            ${discount ? `<span class="card-discount">-${discount}%</span>` : ''}
          </div>
          <a href="product.html?id=${productId}" class="card-btn">View Details</a>
        </div>
      </div>
    </div>
  `;
}

// ============ Wishlist ============
function getWishlist() {
    try {
        return JSON.parse(localStorage.getItem('qb_wishlist')) || [];
    } catch {
        return [];
    }
}

function saveWishlist(list) {
    localStorage.setItem('qb_wishlist', JSON.stringify(list));
    updateWishlistCount();
}

async function toggleWishlist(id, productInfo = {}) {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return false;
    }

    let list = getWishlist();
    const idx = list.findIndex(item => String(item.id) === String(id));
    let added = false;
    
    if (idx === -1) {
        list.push({ id, ...productInfo });
        added = true;
        showNotification('Added to Wishlist ❤️', 'success');
    } else {
        list.splice(idx, 1);
        showNotification('Removed from Wishlist', 'info');
    }
    
    saveWishlist(list); // Optimistic UI update
    
    // Sync with backend
    if (typeof apiToggleWishlist === 'function') {
        try {
            await apiToggleWishlist(id);
        } catch (e) {
            console.error('Failed to update wishlist on server:', e);
            showNotification('Failed to save to server', 'error');
        }
    }
    
    return added;
}

function isWishlisted(id) {
    return getWishlist().some(item => String(item.id) === String(id));
}

function updateWishlistCount() {
    const count = getWishlist().length;
    document.querySelectorAll('.wishlist-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

// ============ Skeleton Screens ============
/**
 * Renders n shimmer skeleton cards into a grid element.
 * Call this BEFORE fetching API data to avoid content flash.
 * @param {string} gridId - ID of the grid container
 * @param {number} count  - Number of skeletons to render
 * @param {'part'|'product'} type - Card type
 */
function showSkeletons(gridId, count = 8, type = 'part') {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    if (type === 'part') {
        grid.innerHTML = Array.from({ length: count }, () => `
            <div class="skeleton-card">
                <div class="skeleton skeleton-img"></div>
                <div class="skeleton-body">
                    <div class="skeleton skeleton-line w-40"></div>
                    <div class="skeleton skeleton-line h-20 w-80"></div>
                    <div class="skeleton skeleton-line w-60"></div>
                    <div class="skeleton skeleton-line w-40"></div>
                    <div style="display:flex;justify-content:space-between;margin-top:8px;">
                        <div class="skeleton skeleton-line h-16" style="width:45%;"></div>
                        <div class="skeleton skeleton-line h-16" style="width:45%;"></div>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        grid.innerHTML = Array.from({ length: count }, () => `
            <div class="skeleton-product-card">
                <div class="skeleton skeleton-product-img"></div>
                <div class="skeleton-product-body">
                    <div class="skeleton skeleton-line w-60"></div>
                    <div class="skeleton skeleton-line h-20 w-80"></div>
                    <div class="skeleton skeleton-line w-40"></div>
                    <div style="display:flex;justify-content:space-between;margin-top:4px;">
                        <div class="skeleton skeleton-line h-16" style="width:40%;"></div>
                        <div class="skeleton skeleton-line h-16" style="width:40%;"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}


