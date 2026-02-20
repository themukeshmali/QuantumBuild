// ============================================
// QUANTUM BUILD — PC Parts Page JavaScript
// Search · Filters · Sort · Modal
// ============================================

let currentCat = 'all';
let currentSort = 'featured';
let currentSearch = '';
let selectedBrands = [];
let maxPrice = 170000;
let minRating = 0;

document.addEventListener('DOMContentLoaded', () => {
    readURLParams();
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

// ============ URL Params ============
function readURLParams() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    if (cat) currentCat = cat;
}

// ============ Build Category Tabs ============
function buildCategoryTabs() {
    const tabsEl = document.getElementById('catTabs');
    if (!tabsEl || typeof CATEGORY_CONFIG === 'undefined') return;

    tabsEl.innerHTML = CATEGORY_CONFIG.map(cat => {
        const count = cat.key === 'all' ? PARTS.length : PARTS.filter(p => p.category === cat.key).length;
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

    const brandCounts = {};
    PARTS.forEach(p => {
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
        renderParts();
    });
}

// ============ Sort ============
function initSort() {
    const sortEl = document.getElementById('partsSort');
    if (!sortEl) return;
    sortEl.addEventListener('change', () => {
        currentSort = sortEl.value;
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
            renderParts();
        }, 250);
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            currentSearch = '';
            clearBtn.classList.remove('visible');
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
        renderParts();
    });
}

// ============ Rating Filter ============
function initRatingFilter() {
    const radios = document.querySelectorAll('input[name="ratingFilter"]');
    radios.forEach(r => {
        r.addEventListener('change', () => {
            minRating = parseFloat(r.value);
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
function renderParts() {
    const grid = document.getElementById('partsGrid');
    const countEl = document.getElementById('partsCount');
    const emptyEl = document.getElementById('partsEmpty');
    if (!grid) return;

    let parts = getPartsByCategory(currentCat);

    // Search filter
    if (currentSearch) {
        parts = parts.filter(p => {
            const searchStr = `${p.name} ${p.brand} ${p.spec} ${p.compatibility || ''}`.toLowerCase();
            return searchStr.includes(currentSearch);
        });
    }

    // Brand filter
    if (selectedBrands.length > 0) {
        parts = parts.filter(p => selectedBrands.includes(p.brand));
    }

    // Price filter
    parts = parts.filter(p => p.price <= maxPrice);

    // Rating filter
    if (minRating > 0) {
        parts = parts.filter(p => p.rating >= minRating);
    }

    // Sort
    switch (currentSort) {
        case 'price-low': parts.sort((a, b) => a.price - b.price); break;
        case 'price-high': parts.sort((a, b) => b.price - a.price); break;
        case 'name': parts.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'brand': parts.sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name)); break;
        case 'popularity': parts.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)); break;
        case 'rating': parts.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews); break;
    }

    if (countEl) countEl.textContent = `${parts.length} Part${parts.length !== 1 ? 's' : ''}`;

    if (parts.length === 0) {
        grid.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
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

    // Trigger scroll reveal for new cards
    if (typeof initScrollReveal === 'function') initScrollReveal();
}

// ============ Create Part Card ============
function createPartCard(part) {
    const discount = part.originalPrice
        ? Math.round((1 - part.price / part.originalPrice) * 100)
        : 0;

    const stars = typeof getStarsHTML === 'function' ? getStarsHTML(part.rating) : '★★★★★';
    const catLabel = typeof getCategoryLabel === 'function' ? getCategoryLabel(part.category) : part.category;
    const catIcon = typeof getCategoryIcon === 'function' ? getCategoryIcon(part.category) : '📦';

    return `
    <div class="part-card reveal" data-cat="${part.category}" data-id="${part.id}">
      ${part.badge ? `<div class="card-badge">${part.badge}</div>` : ''}
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
      </div>
      <div class="part-card-body">
        <div class="part-brand">${part.brand}</div>
        <h3 class="part-name">${part.name}</h3>
        <p class="part-spec">${part.spec}</p>
        ${part.compatibility ? `<div class="part-compatibility"><strong>⚙ Compatible:</strong> ${part.compatibility}</div>` : ''}
        <div class="star-rating">
          ${stars}
          <span class="rating-text">(${part.reviews})</span>
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

// ============ Add to Cart ============
function addPartToCart(id) {
    const part = PARTS.find(p => p.id === id);
    if (!part) return;

    if (typeof addToCart === 'function') {
        addToCart(part.id);
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
    const part = PARTS.find(p => p.id === id);
    if (!part) return;

    const overlay = document.getElementById('partModal');
    const content = document.getElementById('modalContent');
    if (!overlay || !content) return;

    const discount = part.originalPrice
        ? Math.round((1 - part.price / part.originalPrice) * 100)
        : 0;

    const catLabel = typeof getCategoryLabel === 'function' ? getCategoryLabel(part.category) : part.category;
    const catIcon = typeof getCategoryIcon === 'function' ? getCategoryIcon(part.category) : '📦';

    content.innerHTML = `
        <div class="modal-img-wrap" style="--part-color: ${part.artColor};">
            <div class="part-img-placeholder" style="display:flex;">
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
                <div class="modal-spec-item">
                    <div class="modal-spec-label">Specifications</div>
                    <div class="modal-spec-value">${part.spec}</div>
                </div>
                <div class="modal-spec-item">
                    <div class="modal-spec-label">Category</div>
                    <div class="modal-spec-value">${catLabel}</div>
                </div>
                ${part.compatibility ? `
                <div class="modal-spec-item">
                    <div class="modal-spec-label">Compatibility</div>
                    <div class="modal-spec-value">${part.compatibility}</div>
                </div>` : ''}
                <div class="modal-spec-item">
                    <div class="modal-spec-label">Rating</div>
                    <div class="modal-spec-value">★ ${part.rating} (${part.reviews} reviews)</div>
                </div>
            </div>

            <div class="modal-price-row">
                <div class="modal-price">
                    ₹${part.price.toLocaleString('en-IN')}
                    ${part.originalPrice ? `<span class="original-price">₹${part.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                    ${discount ? ` <span class="part-discount">-${discount}%</span>` : ''}
                </div>
                <button class="modal-add-cart" onclick="addPartToCart('${part.id}'); closePartModal();">
                    Add to Cart
                </button>
            </div>
        </div>
    `;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePartModal() {
    const overlay = document.getElementById('partModal');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}
