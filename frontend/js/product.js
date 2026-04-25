// ============================================
// QUANTUM BUILD — Product Detail Page JavaScript
// API-first with static fallback
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadProduct();
});

async function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = 'pcs.html';
        return;
    }

    let product = null;

    // Try API first
    try {
        const raw = await apiGetProductById(productId);
        if (raw && raw._id) product = normalizeProduct(raw);
    } catch {
        // fall through to static data
    }

    // Fallback — search static arrays
    if (!product) {
        const staticData = [
            ...(typeof PRODUCTS !== 'undefined' ? PRODUCTS : []),
            ...(typeof PARTS    !== 'undefined' ? PARTS    : []),
        ];
        const found = staticData.find(p => String(p.id) === String(productId) || String(p._id) === String(productId));
        if (found) product = found;
    }

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

    // Update Main Image
    const mainImg = document.getElementById('productMainImage');
    if (mainImg) {
        if (product.image) {
            mainImg.src = product.image;
        } else if (product.images && product.images.length > 0) {
            mainImg.src = product.images[0];
        } else {
            mainImg.src = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'; // placeholder fallback
        }
        mainImg.alt = product.name;
    }

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
        addToCart(product.id || product._id, qty, {
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image || (product.images && product.images.length > 0 ? product.images[0] : ''),
            brand: product.brand,
            partCategory: product.partCategory,
            category: product.category,
        });
    });

    // Buy Now
    document.getElementById('buyNowBtn').addEventListener('click', () => {
        const qty = parseInt(document.getElementById('qtyInput').value);
        addToCart(product.id || product._id, qty, {
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image || (product.images && product.images.length > 0 ? product.images[0] : ''),
            brand: product.brand,
            partCategory: product.partCategory,
            category: product.category,
        });
        window.location.href = 'checkout.html';
    });

    // Specs Table
    renderSpecs(product);

    // Benchmarks
    renderBenchmarks(product);

    // Related Products
    renderRelated(product);

    // Thumbnail gallery
    renderThumbnails(product);

    // Reviews
    renderReviews(product);
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
        { label: 'Processor',    value: product.cpu },
        { label: 'Graphics Card',value: product.gpu },
        { label: 'Memory',       value: product.ram },
        { label: 'Storage',      value: product.storage },
        { label: 'Cooling',      value: product.cooling },
        { label: 'Power Supply', value: product.psu },
        { label: 'Category',     value: product.category },
        { label: 'Specifications', value: product.spec || product.specifications },
        { label: 'Compatibility',  value: product.compatibility },
    ].filter(s => s.value && s.value.trim && s.value.trim() !== '');

    if (specs.length === 0) {
        table.innerHTML = '<div class="spec-row"><div class="spec-label">No specifications available</div></div>';
        return;
    }

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
    if (!grid) return;

    // Guard: skip if no fps data at all (API products don't have fps benchmarks)
    const fps = product.fps || {};
    const hasFpsData = Object.values(fps).some(v => v > 0);
    if (!hasFpsData) {
        grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:0.9rem;">Benchmark data not available for this product.</div>';
        return;
    }

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
        const fpsVal = fps[game.key] || 0;
        const percent = Math.min(fpsVal / game.max, 1);
        const dashoffset = 283 - (283 * percent);

        return `
      <div class="bench-card">
        <div class="bench-game">${game.name}</div>
        <div class="bench-fps-ring" data-offset="${dashoffset}">
          <svg viewBox="0 0 100 100">
            <circle class="ring-bg" cx="50" cy="50" r="45"/>
            <circle class="ring-fill" cx="50" cy="50" r="45" style="stroke-dashoffset: ${dashoffset}"/>
          </svg>
          <div class="bench-fps">${fpsVal}<span> FPS</span></div>
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
    
    let images = [];
    if (product.images && product.images.length > 0) {
        images = product.images;
    } else if (product.image) {
        images = [product.image];
    }

    if (images.length <= 1) {
        thumbs.style.display = 'none';
        return;
    }

    thumbs.innerHTML = images.map((img, i) => `
    <button class="thumb-btn ${i === 0 ? 'active' : ''}" data-img="${img}" style="padding: 4px; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-hover); border-radius: 8px;">
      <img src="${img}" alt="Thumbnail ${i+1}" style="width: 60px; height: 60px; object-fit: contain;">
    </button>
  `).join('');

    // Click handlers
    thumbs.querySelectorAll('.thumb-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            thumbs.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mainImg = document.getElementById('productMainImage');
            if (mainImg) {
                mainImg.src = btn.dataset.img;
            }
        });
    });
}

// ============ Related Products ============
function renderRelated(product) {
    const grid = document.getElementById('relatedGrid');
    if (!grid) return;

    const allStatic = [
        ...(typeof PRODUCTS !== 'undefined' ? PRODUCTS : []),
        ...(typeof PARTS    !== 'undefined' ? PARTS    : []),
    ];
    const related = allStatic
        .filter(p => String(p.id) !== String(product.id) && String(p._id) !== String(product.id))
        .filter(p => p.category === product.category || p.partCategory === product.partCategory)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    // If no same-category matches, just grab random items
    const fallback = related.length === 0
        ? allStatic.filter(p => String(p.id) !== String(product.id)).sort(() => Math.random() - 0.5).slice(0, 3)
        : related;

    grid.innerHTML = fallback.map(p => createProductCard(p)).join('');
    setTimeout(() => initScrollReveal(), 100);
}

// ============ Reviews ============
function renderReviews(product) {
    const list = document.getElementById('reviewsList');
    const formWrapper = document.getElementById('reviewFormWrapper');
    const loginMsg = document.getElementById('loginToReviewMsg');
    const form = document.getElementById('reviewForm');
    
    if (!list) return;

    // Show/hide form based on login status
    if (isLoggedIn()) {
        if (loginMsg) loginMsg.style.display = 'none';
        if (formWrapper) formWrapper.style.display = 'block';
    } else {
        if (loginMsg) loginMsg.style.display = 'block';
        if (formWrapper) formWrapper.style.display = 'none';
    }

    // Render reviews list
    const reviews = product.rawReviews || product.reviews || []; // API returns 'reviews' array
    
    // Check if the current user already reviewed this product
    const user = isLoggedIn() ? getCurrentUser() : null;
    const hasReviewed = user && Array.isArray(reviews) && reviews.some(r => String(r.user) === String(user._id));
    
    if (hasReviewed && formWrapper) {
        formWrapper.innerHTML = '<div style="padding: 1rem; background: var(--accent-green-dim); color: var(--accent-green); border-radius: var(--radius-sm); border: 1px solid rgba(16,185,129,0.3); text-align: center;">You have already reviewed this product. Thank you!</div>';
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
        list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-sm);">No reviews yet. Be the first to review this product!</div>';
    } else {
        list.innerHTML = reviews.map(r => {
            const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
            return `
                <div style="padding: 1.5rem; background: var(--bg-surface); border-radius: var(--radius-sm); margin-bottom: 1rem; border: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <div>
                            <strong style="color: var(--text-primary); font-size: 1.05rem;">${r.name}</strong>
                            <div style="color: var(--accent-amber); font-size: 0.9rem; margin-top: 2px;">
                                ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                            </div>
                        </div>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">${date}</span>
                    </div>
                    <p style="color: var(--text-secondary); line-height: 1.5; margin-top: 0.5rem;">${r.comment}</p>
                </div>
            `;
        }).join('');
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitReviewBtn');
            const errorEl = document.getElementById('reviewError');
            const rating = document.getElementById('reviewRating').value;
            const comment = document.getElementById('reviewComment').value.trim();

            if (!rating || !comment) return;

            btn.disabled = true;
            btn.textContent = 'Submitting...';
            errorEl.style.display = 'none';

            try {
                await apiSubmitReview(product.id || product._id, Number(rating), comment);
                if (typeof showNotification === 'function') {
                    showNotification('Review submitted successfully!', 'success');
                }
                // Reload product to show new review
                setTimeout(() => window.location.reload(), 1000);
            } catch (err) {
                errorEl.textContent = err.message || 'Failed to submit review. Have you already reviewed this product or bought it?';
                errorEl.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Submit Review';
            }
        });
    }
}
