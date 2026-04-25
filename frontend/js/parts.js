// ============================================
// QUANTUM BUILD — PC Parts Page JavaScript
// Search · Filters · Sort · Modal · Quick View
// API-first with static fallback · Pagination
// ============================================

let currentCat  = 'all';
let currentSort = 'featured';
let currentSearch = '';
let selectedBrands = [];
let maxPrice = 170000;
let minRating = 0;
let modalQty = 1;

// Pagination state
let currentPage = 1;
const PAGE_SIZE = 50;
let totalPages = 1;

// Live data from API (falls back to PARTS static array if API offline)
let liveParts = [];
let allStaticParts = []; // full static dataset for fallback
let allSystemParts = []; // full list for accurate counts during API mode
let partsLoaded = false;
let apiMode = false; // true when API is responding

document.addEventListener('DOMContentLoaded', async () => {
    readURLParams();
    // Show skeletons immediately while data loads
    if (typeof showSkeletons === 'function') showSkeletons('partsGrid', 12, 'part');
    await loadPartsData();
    buildCategoryTabs();
    buildBrandFilters();
    initCategoryTabs();
    initSort();
    initSearch();
    initPriceFilter();
    initRatingFilter();
    initSidebarToggle();
    initFilterReset();
    initModal();
    renderParts();
});

// ── Load data from API or fall back to static ─────────────────
async function loadPartsData(params = {}) {
    try {
        const queryParams = { pageSize: PAGE_SIZE, pageNumber: currentPage, broadCategory: 'PC parts', ...params };
        if (currentCat && currentCat !== 'all') queryParams.category = currentCat;
        if (currentSearch) queryParams.keyword = currentSearch;
        if (selectedBrands.length === 1) queryParams.brand = selectedBrands[0];
        if (maxPrice < 170000) queryParams.maxPrice = maxPrice;
        if (minRating > 0) queryParams.minRating = minRating;
        if (currentSort && currentSort !== 'featured') queryParams.sortBy = currentSort;

        const data = await apiGetProducts(queryParams);
        const raw = data.products || data || [];
        
        // Fetch all parts globally ONCE to ensure filter counts are accurate across all pages
        if (!allSystemParts.length) {
            const globalData = await apiGetProducts({ pageSize: 150, broadCategory: 'PC parts' }).catch(() => null);
            if (globalData && (globalData.products || globalData)) {
                allSystemParts = (globalData.products || globalData).map(normalizeProduct);
            }
        }

        if (raw.length > 0 || data.totalProducts !== undefined) {
            liveParts = raw.map(normalizeProduct);
            totalPages = data.pages || 1;
            apiMode = true;
            partsLoaded = true;
            return;
        }
    } catch {}
    // Backend not available — fallback to static data
    if (typeof PARTS !== 'undefined') {
        liveParts = PARTS.filter(p => !(p.category === 'Gaming PC' || p.category === 'PC' || p.partCategory === 'pc'));
    } else {
        liveParts = [];
    }
    allStaticParts = liveParts;
    apiMode = false;
    partsLoaded = true;
}

function getActiveParts() {
    return apiMode && allSystemParts.length > 0 ? allSystemParts : allStaticParts;
}



// ============ URL Params ============
function readURLParams() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    if (cat) currentCat = cat;
    // ?keyword= from global search bar (main.js handleNavSearch)
    const keyword = params.get('keyword');
    if (keyword) {
        currentSearch = keyword.toLowerCase();
        // Pre-fill the on-page search input once DOM is ready
        const input = document.getElementById('searchInput');
        if (input) input.value = keyword;
    }
}

// ============ Build Category Tabs ============
function buildCategoryTabs() {
    const tabsEl = document.getElementById('catTabs');
    if (!tabsEl || typeof CATEGORY_CONFIG === 'undefined') return;
    const parts = getActiveParts();
    tabsEl.innerHTML = CATEGORY_CONFIG.map(cat => {
        const count = cat.key === 'all' ? parts.length : parts.filter(p => (p.partCategory || p.category) === cat.key).length;
        return `<button class="cat-tab ${cat.key === currentCat ? 'active' : ''}" data-cat="${cat.key}" role="tab">
            <span class="tab-icon">${cat.icon}</span>
            ${cat.label}
            <span class="tab-count">${count}</span>
        </button>`;
    }).join('');
}

// ============ Build Brand Filters ============
function buildBrandFilters() {
    const listEl = document.getElementById('brandList');
    if (!listEl) return;
    const parts = getActiveParts();
    const brandCounts = {};
    parts.forEach(p => {
        brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    });

    const sortedBrands = Object.keys(brandCounts).sort();
    listEl.innerHTML = sortedBrands.map(brand => `
        <label class="filter-checkbox">
            <input type="checkbox" value="${brand}" class="brand-check">
            <span class="checkmark"></span>
            ${brand}
            <span class="brand-count">${brandCounts[brand]}</span>
        </label>
    `).join('');

    listEl.querySelectorAll('.brand-check').forEach(cb => {
        cb.addEventListener('change', () => {
            selectedBrands = [...listEl.querySelectorAll('.brand-check:checked')].map(c => c.value);
            renderParts();
        });
    });
}

// ============ Category Tabs ============
function initCategoryTabs() {
    const tabsEl = document.getElementById('catTabs');
    if (!tabsEl) return;

    tabsEl.addEventListener('click', (e) => {
        const tab = e.target.closest('.cat-tab');
        if (!tab) return;

        tabsEl.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCat = tab.dataset.cat;
        currentPage = 1;
        partsLoaded = false;
        renderParts();
    });
}

// ============ Sort ============
function initSort() {
    const sortEl = document.getElementById('partsSort');
    if (!sortEl) return;
    sortEl.addEventListener('change', () => {
        currentSort = sortEl.value;
        currentPage = 1;
        partsLoaded = false;
        renderParts();
    });
}

// ============ Search ============
function initSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    if (!input) return;

    let debounceTimer;
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearch = input.value.trim().toLowerCase();
            if (clearBtn) clearBtn.classList.toggle('visible', currentSearch.length > 0);
            currentPage = 1;
            partsLoaded = false;
            renderParts();
        }, 400);
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            currentSearch = '';
            clearBtn.classList.remove('visible');
            currentPage = 1;
            partsLoaded = false;
            renderParts();
        });
    }
}

// ============ Price Filter ============
function initPriceFilter() {
    const slider = document.getElementById('priceRangeSlider');
    const maxDisplay = document.getElementById('priceMax');
    if (!slider) return;

    slider.addEventListener('input', () => {
        maxPrice = parseInt(slider.value);
        if (maxDisplay) maxDisplay.textContent = '₹' + maxPrice.toLocaleString('en-IN');
        currentPage = 1;
        partsLoaded = false;
        renderParts();
    });
}

// ============ Rating Filter ============
function initRatingFilter() {
    const radios = document.querySelectorAll('input[name="ratingFilter"]');
    radios.forEach(r => {
        r.addEventListener('change', () => {
            minRating = parseFloat(r.value);
            currentPage = 1;
            partsLoaded = false;
            renderParts();
        });
    });
}

// ============ Sidebar Toggle (Mobile) ============
function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('partsSidebar');
    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar on outside click
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // Filter group toggles
    document.querySelectorAll('.filter-title').forEach(title => {
        title.addEventListener('click', () => {
            const targetId = title.dataset.toggle;
            const list = document.getElementById(targetId);
            if (list) {
                list.classList.toggle('collapsed');
                title.classList.toggle('collapsed');
            }
        });
    });
}

// ============ Reset Filters ============
function initFilterReset() {
    const resetBtn = document.getElementById('filterResetBtn');
    if (!resetBtn) return;
    resetBtn.addEventListener('click', resetAllFilters);
}

function resetAllFilters() {
    currentSearch = '';
    selectedBrands = [];
    maxPrice = 170000;
    minRating = 0;
    currentPage = 1;
    partsLoaded = false;

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.classList.remove('visible');

    const slider = document.getElementById('priceRangeSlider');
    if (slider) {
        slider.value = 170000;
        const maxDisplay = document.getElementById('priceMax');
        if (maxDisplay) maxDisplay.textContent = '₹1,70,000';
    }

    document.querySelectorAll('.brand-check').forEach(cb => cb.checked = false);

    const ratingAll = document.querySelector('input[name="ratingFilter"][value="0"]');
    if (ratingAll) ratingAll.checked = true;

    renderParts();
}

// ============ Render Parts ============
async function renderParts() {
    const grid = document.getElementById('partsGrid');
    const countEl = document.getElementById('partsCount');
    const emptyEl = document.getElementById('partsEmpty');
    if (!grid) return;

    // Show loading
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">⏳ Loading parts...</div>';

    if (apiMode) {
        // API mode: re-fetch with current filters + page
        await loadPartsData();
    }

    let parts = apiMode ? liveParts : getActiveParts();

    if (!apiMode) {
        // Static fallback: filter client-side
        if (currentCat && currentCat !== 'all') {
            parts = parts.filter(p => (p.partCategory || p.category) === currentCat);
        }
        if (currentSearch) {
            parts = parts.filter(p => {
                const searchStr = `${p.name} ${p.brand} ${p.spec} ${p.compatibility || ''} ${p.description || ''}`.toLowerCase();
                return searchStr.includes(currentSearch);
            });
        }
        if (selectedBrands.length > 0) {
            parts = parts.filter(p => selectedBrands.includes(p.brand));
        }
        parts = parts.filter(p => p.price <= maxPrice);
        if (minRating > 0) {
            parts = parts.filter(p => p.rating >= minRating);
        }
        // Client-side sort for static fallback
        switch (currentSort) {
            case 'price-low': parts.sort((a, b) => a.price - b.price); break;
            case 'price-high': parts.sort((a, b) => b.price - a.price); break;
            case 'name': parts.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'brand': parts.sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name)); break;
            case 'popularity': parts.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)); break;
            case 'rating': parts.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews); break;
        }
        // Client-side pagination for static fallback
        totalPages = Math.max(1, Math.ceil(parts.length / PAGE_SIZE));
        parts = parts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    }

    const totalShown = apiMode ? (totalPages * PAGE_SIZE) : (typeof PARTS !== 'undefined' ? PARTS.length : parts.length);
    if (countEl) countEl.textContent = `${parts.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–${(currentPage - 1) * PAGE_SIZE + parts.length} Parts`;

    if (parts.length === 0) {
        grid.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        renderPagination();
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    grid.innerHTML = parts.map(createPartCard).join('');

    // Init image fallback for each card
    grid.querySelectorAll('.part-img-real').forEach(img => {
        img.addEventListener('error', function () {
            const parent = this.closest('.part-img-wrap');
            if (parent) {
                const placeholder = parent.querySelector('.part-img-placeholder');
                if (placeholder) placeholder.style.display = 'flex';
                this.style.display = 'none';
            }
        });
        if (!img.src || img.src.endsWith('/')) {
            img.dispatchEvent(new Event('error'));
        }
    });

    renderPagination();
    // Trigger scroll reveal for new cards
    if (typeof initScrollReveal === 'function') initScrollReveal();
}

// ============ Create Part Card ============
function createPartCard(part) {
    const discount = part.originalPrice
        ? Math.round((1 - part.price / part.originalPrice) * 100)
        : 0;

    const reviewCount = part.numReviews ?? part.reviews ?? 0;
    const stars = typeof getStarsHTML === 'function' ? getStarsHTML(part.rating) : '★★★★★';
    const catLabel = typeof getCategoryLabel === 'function' ? getCategoryLabel(part.category) : part.category;
    const catIcon = typeof getCategoryIcon === 'function' ? getCategoryIcon(part.category) : '📦';
    const wishlisted = typeof isWishlisted === 'function' ? isWishlisted(part.id) : false;

    return `
    <div class="part-card" data-cat="${part.category}" data-id="${part.id}">
      ${part.badge ? `<div class="card-badge">${part.badge}</div>` : ''}
      <button class="wishlist-btn ${wishlisted ? 'active' : ''}" onclick="handleWishlistToggle('${part.id}', this, event)" title="${wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}" aria-label="Toggle wishlist">
        ${wishlisted ? '❤️' : '🤍'}
      </button>
      <div class="part-cat-tag">${catLabel}</div>
      <div class="part-img-wrap" style="--part-color: ${part.artColor};">
        <img
          class="part-img-real"
          src="${part.image}"
          alt="${part.name}"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        >
        <div class="part-img-placeholder" style="display:none;">
          <div class="part-art-icon">${part.artIcon || catIcon}</div>
          <div class="part-art-label">${catLabel}</div>
        </div>
        <div class="part-img-overlay" onclick="openPartModal('${part.id}')">
          <button class="quick-view-btn">⚡ Quick View</button>
        </div>
      </div>
      <div class="part-card-body">
        <div class="part-brand">${part.brand}</div>
        <h3 class="part-name">${part.name}</h3>
        <p class="part-spec">${part.spec}</p>
        ${part.compatibility ? `<div class="part-compatibility"><strong>⚙ Compatible:</strong> ${part.compatibility}</div>` : ''}
        <div class="star-rating" title="${part.rating}/5 based on ${reviewCount} reviews">
          ${stars}
          <span class="rating-text">(${reviewCount})</span>
        </div>
        <div class="part-footer">
          <div class="part-price-block">
            <span class="part-price">₹${part.price.toLocaleString('en-IN')}</span>
            ${part.originalPrice ? `<span class="part-original-price">₹${part.originalPrice.toLocaleString('en-IN')}</span>` : ''}
            ${discount ? `<span class="part-discount">-${discount}%</span>` : ''}
          </div>
          <div class="part-card-actions">
            <button class="btn-view-details" onclick="openPartModal('${part.id}')">Details</button>
            <button class="btn-add-cart" onclick="addPartToCart('${part.id}')">+ Cart</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============ Wishlist Toggle (card button) ============
function handleWishlistToggle(id, btn, e) {
    e.stopPropagation();
    const part = getActiveParts().find(p => p.id === id || p._id === id);
    if (!part) return;
    const added = toggleWishlist(id, {
        name: part.name, price: part.price, image: part.image,
        brand: part.brand, category: part.category, partCategory: part.partCategory,
        originalPrice: part.originalPrice,
    });
    btn.className = `wishlist-btn ${added ? 'active' : ''}`;
    btn.title = added ? 'Remove from Wishlist' : 'Add to Wishlist';
    btn.textContent = added ? '❤️' : '🤍';
}

// ============ Pagination ============
function renderPagination() {
    let container = document.getElementById('partsPagination');
    if (!container) {
        container = document.createElement('div');
        container.id = 'partsPagination';
        container.className = 'pagination';
        const grid = document.getElementById('partsGrid');
        if (grid) grid.parentNode.insertBefore(container, grid.nextSibling);
    }

    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = `<button class="page-btn" onclick="goToPartsPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;

    const delta = 2;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPartsPage(${i})">${i}</button>`;
        } else if (i === currentPage - delta - 1 || i === currentPage + delta + 1) {
            html += `<span class="page-ellipsis">…</span>`;
        }
    }

    html += `<button class="page-btn" onclick="goToPartsPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next ›</button>`;
    container.innerHTML = html;
}

function goToPartsPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    partsLoaded = false; // allow re-fetch
    renderParts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ Add to Cart ============
function addPartToCart(id) {
    const part = getActiveParts().find(p => p.id === id || p._id === id);
    if (!part) return;
    if (typeof addToCart === 'function') {
        addToCart(part.id || part._id, 1, {
            name: part.name,
            price: part.price,
            originalPrice: part.originalPrice,
            image: part.image,
            brand: part.brand,
            partCategory: part.partCategory || part.category,
            category: part.category,
        });
    } else if (typeof showNotification === 'function') {
        showNotification(`${part.name} added to cart!`);
    }
}

// ============ Product Detail Modal ============
function initModal() {
    const overlay = document.getElementById('partModal');
    const closeBtn = document.getElementById('modalClose');
    if (!overlay) return;

    if (closeBtn) {
        closeBtn.addEventListener('click', closePartModal);
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePartModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePartModal();
    });
}

function openPartModal(id) {
    const part = getActiveParts().find(p => p.id === id || p._id === id);
    if (!part) return;

    const overlay = document.getElementById('partModal');
    const content = document.getElementById('modalContent');
    if (!overlay || !content) return;

    modalQty = 1;

    const discount = part.originalPrice
        ? Math.round((1 - part.price / part.originalPrice) * 100)
        : 0;

    const catLabel = typeof getCategoryLabel === 'function' ? getCategoryLabel(part.category) : part.category;
    const catIcon = typeof getCategoryIcon === 'function' ? getCategoryIcon(part.category) : '📦';

    // Build specs grid dynamically from part properties
    let specsHTML = '';
    specsHTML += `<div class="modal-spec-item">
        <div class="modal-spec-label">Specifications</div>
        <div class="modal-spec-value">${part.spec}</div>
    </div>`;
    specsHTML += `<div class="modal-spec-item">
        <div class="modal-spec-label">Category</div>
        <div class="modal-spec-value">${catLabel}</div>
    </div>`;
    if (part.compatibility) {
        specsHTML += `<div class="modal-spec-item">
            <div class="modal-spec-label">Compatibility</div>
            <div class="modal-spec-value">${part.compatibility}</div>
        </div>`;
    }
    if (part.cores) {
        specsHTML += `<div class="modal-spec-item">
            <div class="modal-spec-label">Cores</div>
            <div class="modal-spec-value">${part.cores}</div>
        </div>`;
    }
    if (part.socket) {
        specsHTML += `<div class="modal-spec-item">
            <div class="modal-spec-label">Socket</div>
            <div class="modal-spec-value">${part.socket}</div>
        </div>`;
    }
    if (part.vram) {
        specsHTML += `<div class="modal-spec-item">
            <div class="modal-spec-label">VRAM</div>
            <div class="modal-spec-value">${part.vram}</div>
        </div>`;
    }
    if (part.speed) {
        specsHTML += `<div class="modal-spec-item">
            <div class="modal-spec-label">Speed</div>
            <div class="modal-spec-value">${part.speed}</div>
        </div>`;
    }
    if (part.wattage) {
        specsHTML += `<div class="modal-spec-item">
            <div class="modal-spec-label">Wattage</div>
            <div class="modal-spec-value">${part.wattage}</div>
        </div>`;
    }
    if (part.formFactor) {
        specsHTML += `<div class="modal-spec-item">
            <div class="modal-spec-label">Form Factor</div>
            <div class="modal-spec-value">${part.formFactor}</div>
        </div>`;
    }
    if (part.size) {
        specsHTML += `<div class="modal-spec-item">
            <div class="modal-spec-label">Size</div>
            <div class="modal-spec-value">${part.size}</div>
        </div>`;
    }
    specsHTML += `<div class="modal-spec-item">
        <div class="modal-spec-label">Rating</div>
        <div class="modal-spec-value">★ ${part.rating} (${part.reviews} reviews)</div>
    </div>`;
    specsHTML += `<div class="modal-spec-item">
        <div class="modal-spec-label">Popularity</div>
        <div class="modal-spec-value">${part.popularity || '-'}/100</div>
    </div>`;

    content.innerHTML = `
        <div class="modal-img-wrap" style="--part-color: ${part.artColor};">
            <img 
                class="part-img-real modal-img-real" 
                src="${encodeURI(part.image)}" 
                alt="${part.name}" 
                style="width: 100%; height: 100%; object-fit: contain; min-height: 250px; position: absolute; top: 0; left: 0; z-index: 2;"
                onload="this.style.display='block'; this.nextElementSibling.style.display='none';"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >
            <div class="part-img-placeholder" style="display:none; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;">
                <div class="part-art-icon">${part.artIcon || catIcon}</div>
                <div class="part-art-label">${catLabel}</div>
            </div>
        </div>
        <div class="modal-body">
            ${part.badge ? `<span class="modal-badge">${part.badge}</span>` : ''}
            <div class="modal-brand">${part.brand}</div>
            <h2 class="modal-name">${part.name}</h2>
            <p class="modal-desc">${part.description || part.spec}</p>

            <div class="modal-specs">
                ${specsHTML}
            </div>

            <div class="modal-qty-wrap">
                <span class="modal-qty-label">Quantity</span>
                <div class="qty-control">
                    <button class="qty-btn" onclick="changeModalQty(-1)">−</button>
                    <span class="qty-value" id="modalQtyValue">1</span>
                    <button class="qty-btn" onclick="changeModalQty(1)">+</button>
                </div>
            </div>

            <div class="modal-price-row">
                <div class="modal-price">
                    ₹${part.price.toLocaleString('en-IN')}
                    ${part.originalPrice ? `<span class="original-price">₹${part.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                    ${discount ? ` <span class="part-discount">-${discount}%</span>` : ''}
                </div>
                <button class="modal-add-cart" onclick="addPartToCartQty('${part.id}'); closePartModal();">
                    🛒 Add to Cart
                </button>
            </div>
        </div>
    `;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function changeModalQty(delta) {
    modalQty = Math.max(1, Math.min(10, modalQty + delta));
    const el = document.getElementById('modalQtyValue');
    if (el) el.textContent = modalQty;
}

function addPartToCartQty(id) {
    const part = getActiveParts().find(p => p.id === id || p._id === id);
    if (!part) return;
    if (typeof addToCart === 'function') {
        addToCart(part.id || part._id, modalQty, {
            name: part.name,
            price: part.price,
            originalPrice: part.originalPrice,
            image: part.image,
            brand: part.brand,
            partCategory: part.partCategory || part.category,
            category: part.category,
        });
    }
    if (typeof showNotification === 'function') {
        showNotification(`${modalQty}× ${part.name} added to cart!`);
    }
}

function closePartModal() {
    const overlay = document.getElementById('partModal');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    modalQty = 1;
}
