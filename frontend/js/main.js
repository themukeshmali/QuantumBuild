// ============================================
// QUANTUM BUILD — Main Shared JavaScript
// Navbar, Scroll Animations, Cart, Utilities
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initScrollReveal();
    initBackToTop();
    updateCartCount();
});

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

    // Style it inline for simplicity
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%) translateY(100px)',
        background: type === 'success' ? 'linear-gradient(135deg, #ff0040, #ff2d2d)' : '#333',
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
        boxShadow: '0 10px 40px rgba(255, 0, 64, 0.3)',
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

// ============ Utility: Generate Star HTML ============
function getStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let html = '';

    for (let i = 0; i < fullStars; i++) {
        html += '★';
    }
    if (halfStar) html += '★';
    for (let i = fullStars + (halfStar ? 1 : 0); i < 5; i++) {
        html += '☆';
    }

    return html;
}

// ============ Utility: Create Product Card HTML ============
function createProductCard(product) {
    const discount = product.originalPrice
        ? Math.round((1 - product.price / product.originalPrice) * 100)
        : 0;

    return `
    <div class="product-card reveal" data-category="${product.category}">
      ${product.badge ? `<div class="card-badge">${product.badge}</div>` : ''}
      <a href="product.html?id=${product.id}" class="card-image">
        <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
      </a>
      <div class="card-body">
        <div class="card-category">${product.category}</div>
        <h3 class="card-title">${product.name}</h3>
        <div class="card-specs">
          <span class="spec-tag">${product.gpu.split(' ').slice(1, 3).join(' ')}</span>
          <span class="spec-tag">${product.ram.split(' ')[0]}</span>
          <span class="spec-tag">${product.cpu.split(' ').slice(2, 4).join(' ')}</span>
        </div>
        <div class="star-rating">
          ${getStarsHTML(product.rating)}
          <span class="rating-text">(${product.reviews})</span>
        </div>
        <div class="card-footer">
          <div class="card-price">
            ${formatPrice(product.price)}
            ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
          </div>
          <a href="product.html?id=${product.id}" class="card-btn">View Details</a>
        </div>
      </div>
    </div>
  `;
}
