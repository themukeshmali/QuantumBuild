// ============================================
// QUANTUM BUILD — Product Detail Page JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadProduct();
});

function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = 'pcs.html';
        return;
    }

    const product = getProductById(productId);
    if (!product) {
        window.location.href = 'pcs.html';
        return;
    }

    // Update page title
    document.title = `${product.name} — Quantum Build`;

    // Breadcrumb
    document.getElementById('breadcrumbName').textContent = product.name;

    // Badge
    const badge = document.getElementById('galleryBadge');
    if (product.badge) {
        badge.textContent = product.badge;
    } else {
        badge.style.display = 'none';
    }

    // Update PC label in gallery
    document.getElementById('phLabel').textContent = product.name.replace('Quantum ', '').toUpperCase();

    // Category
    document.getElementById('productCategory').textContent = product.category;

    // Title
    document.getElementById('productTitle').textContent = product.name;

    // Rating
    document.getElementById('productRating').innerHTML = `
    <span class="stars">${getStarsHTML(product.rating)}</span>
    <span class="rating-num">${product.rating} (${product.reviews} reviews)</span>
  `;

    // Description
    document.getElementById('productDescription').textContent = product.description;

    // Price
    document.getElementById('productPrice').textContent = formatPrice(product.price);

    if (product.originalPrice) {
        document.getElementById('productOriginalPrice').textContent = formatPrice(product.originalPrice);
        const discount = Math.round((1 - product.price / product.originalPrice) * 100);
        document.getElementById('productDiscount').textContent = `${discount}% OFF`;
    } else {
        document.getElementById('productOriginalPrice').style.display = 'none';
        document.getElementById('productDiscount').style.display = 'none';
    }

    // Quantity controls
    initQuantityControls();

    // Add to Cart
    document.getElementById('addToCartBtn').addEventListener('click', () => {
        const qty = parseInt(document.getElementById('qtyInput').value);
        addToCart(product.id, qty);
    });

    // Buy Now
    document.getElementById('buyNowBtn').addEventListener('click', () => {
        const qty = parseInt(document.getElementById('qtyInput').value);
        addToCart(product.id, qty);
        showNotification('Added to cart! Checkout coming soon.');
    });

    // Specs Table
    renderSpecs(product);

    // Benchmarks
    renderBenchmarks(product);

    // Related Products
    renderRelated(product);

    // Thumbnail gallery
    renderThumbnails(product);
}

// ============ Quantity Controls ============
function initQuantityControls() {
    const input = document.getElementById('qtyInput');
    const minus = document.getElementById('qtyMinus');
    const plus = document.getElementById('qtyPlus');

    minus.addEventListener('click', () => {
        let val = parseInt(input.value);
        if (val > 1) input.value = val - 1;
    });

    plus.addEventListener('click', () => {
        let val = parseInt(input.value);
        if (val < 10) input.value = val + 1;
    });
}

// ============ Specs Table ============
function renderSpecs(product) {
    const table = document.getElementById('specsTable');
    const specs = [
        { label: 'Processor', value: product.cpu },
        { label: 'Graphics Card', value: product.gpu },
        { label: 'Memory', value: product.ram },
        { label: 'Storage', value: product.storage },
        { label: 'Cooling', value: product.cooling },
        { label: 'Power Supply', value: product.psu },
        { label: 'Category', value: product.category },
    ];

    table.innerHTML = specs.map(s => `
    <div class="spec-row">
      <div class="spec-label">${s.label}</div>
      <div class="spec-value">${s.value}</div>
    </div>
  `).join('');
}

// ============ Benchmarks ============
function renderBenchmarks(product) {
    const grid = document.getElementById('benchmarksGrid');
    const games = [
        { key: 'cyberpunk', name: 'Cyberpunk 2077', max: 130 },
        { key: 'fortnite', name: 'Fortnite', max: 360 },
        { key: 'valorant', name: 'Valorant', max: 600 },
        { key: 'rdr2', name: 'Red Dead 2', max: 120 }
    ];

    // SVG gradient definition
    let html = `
    <svg width="0" height="0" style="position:absolute;">
      <defs>
        <linearGradient id="benchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ff0040"/>
          <stop offset="100%" stop-color="#ff6b35"/>
        </linearGradient>
      </defs>
    </svg>
  `;

    html += games.map(game => {
        const fps = product.fps[game.key] || 0;
        const percent = Math.min(fps / game.max, 1);
        const dashoffset = 283 - (283 * percent);

        return `
      <div class="bench-card">
        <div class="bench-game">${game.name}</div>
        <div class="bench-fps-ring" data-offset="${dashoffset}">
          <svg viewBox="0 0 100 100">
            <circle class="ring-bg" cx="50" cy="50" r="45"/>
            <circle class="ring-fill" cx="50" cy="50" r="45" style="stroke-dashoffset: ${dashoffset}"/>
          </svg>
          <div class="bench-fps">${fps}<span> FPS</span></div>
        </div>
      </div>
    `;
    }).join('');

    grid.innerHTML = html;

    // Animate rings on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.ring-fill').forEach(ring => {
                    const parent = ring.closest('.bench-fps-ring');
                    const offset = parent.dataset.offset;
                    ring.style.strokeDashoffset = offset;
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(grid);
}

// ============ Gallery Thumbnails ============
function renderThumbnails(product) {
    const thumbs = document.getElementById('galleryThumbs');
    const colors = [
        { name: 'Front', color: 'var(--accent-red)' },
        { name: 'Side', color: 'var(--neon-blue)' },
    ];

    thumbs.innerHTML = colors.map((c, i) => `
    <button class="thumb-btn ${i === 0 ? 'active' : ''}" data-view="${i}">
      ${c.name} View
    </button>
  `).join('');

    // Click handlers
    thumbs.querySelectorAll('.thumb-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            thumbs.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Change RGB colors based on view
            const strips = document.querySelectorAll('.ph-strip');
            const view = parseInt(btn.dataset.view);
            if (view === 1) {
                strips[0].style.background = 'var(--neon-blue)';
                strips[0].style.boxShadow = '0 0 15px var(--neon-blue)';
                strips[1].style.background = 'var(--neon-purple)';
                strips[1].style.boxShadow = '0 0 15px var(--neon-purple)';
            } else {
                strips[0].style.background = 'var(--accent-red)';
                strips[0].style.boxShadow = '0 0 15px var(--accent-red)';
                strips[1].style.background = 'var(--neon-blue)';
                strips[1].style.boxShadow = '0 0 15px var(--neon-blue)';
            }
        });
    });
}

// ============ Related Products ============
function renderRelated(product) {
    const grid = document.getElementById('relatedGrid');
    const related = PRODUCTS
        .filter(p => p.id !== product.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    grid.innerHTML = related.map(p => createProductCard(p)).join('');
    setTimeout(() => initScrollReveal(), 100);
}
