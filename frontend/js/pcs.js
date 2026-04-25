// ============================================
// QUANTUM BUILD — PCs Listing Page JavaScript
// Filters, Sort, Search, Dynamic Rendering
// API-first with static fallback
// ============================================

// Live products from API
let liveProducts = [];
let pcsLoaded = false;
let pcsApiMode = false;
let pcsCurrentPage = 1;
const PCS_PAGE_SIZE = 9;
let pcsTotalPages = 1;

document.addEventListener('DOMContentLoaded', async () => {
    // Show skeletons immediately while data loads
    if (typeof showSkeletons === 'function') showSkeletons('productsGrid', 9, 'product');
    await loadPcsData();
    initFilters();
    initMobileFilter();
    handleURLCategory();
    renderProducts();
});

// ── Load data from API or fall back to static ─────────────────
async function loadPcsData(params = {}) {
    try {
        const queryParams = { pageSize: PCS_PAGE_SIZE, pageNumber: pcsCurrentPage, broadCategory: 'Gaming PC', ...params };
        if (currentFilters.category !== 'All') queryParams.category = currentFilters.category;
        if (currentFilters.sort && currentFilters.sort !== 'featured') queryParams.sortBy = currentFilters.sort;
        if (currentFilters.priceMin > 0) queryParams.minPrice = currentFilters.priceMin;
        if (currentFilters.priceMax < 999999) queryParams.maxPrice = currentFilters.priceMax;
        if (currentFilters.gpu !== 'All') queryParams.brand = currentFilters.gpu; // Mapping GPU chip to brand search constraint
        if (currentFilters.search) queryParams.keyword = currentFilters.search;
        const data = await apiGetProducts(queryParams);
        const raw = data.products || data || [];
        if (raw.length > 0 || data.totalProducts !== undefined) {
            liveProducts = raw.map(normalizeProduct);
            pcsTotalPages = data.pages || 1;
            pcsApiMode = true;
            pcsLoaded = true;
            return;
        }
    } catch {}
    if (typeof PRODUCTS !== 'undefined') {
        liveProducts = PRODUCTS.filter(p => {
            const pcCats = ['Gaming PC', 'PC', 'Full Tower', 'Mid Tower', 'Mini PC', 'Small Form Factor'];
            return pcCats.includes(p.category) || p.partCategory === 'pc';
        });
    } else {
        liveProducts = [];
    }
    pcsApiMode = false;
    pcsLoaded = true;
}

// Current filter state
let currentFilters = {
    category: 'All',
    priceMin: 0,
    priceMax: 999999,
    gpu: 'All',
    search: '',
    sort: 'featured'
};

// ============ Initialize Filters ============
function initFilters() {
    // Category chips
    document.querySelectorAll('#categoryFilters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#categoryFilters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilters.category = chip.dataset.category;
            pcsCurrentPage = 1; pcsLoaded = false;
            renderProducts();
        });
    });

    // Price chips
    document.querySelectorAll('.price-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.price-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilters.priceMin = parseInt(chip.dataset.min);
            currentFilters.priceMax = parseInt(chip.dataset.max);
            pcsCurrentPage = 1; pcsLoaded = false;
            renderProducts();
        });
    });

    // GPU chips
    document.querySelectorAll('.gpu-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.gpu-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilters.gpu = chip.dataset.gpu;
            pcsCurrentPage = 1; pcsLoaded = false;
            renderProducts();
        });
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentFilters.search = e.target.value.toLowerCase();
                pcsCurrentPage = 1; pcsLoaded = false;
                renderProducts();
            }, 400);
        });
    }

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentFilters.sort = e.target.value;
            pcsCurrentPage = 1; pcsLoaded = false;
            renderProducts();
        });
    }

    // Reset button
    const resetBtn = document.getElementById('filterReset');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

// ============ URL Category Handling ============
function handleURLCategory() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    if (category) {
        currentFilters.category = category;
        document.querySelectorAll('#categoryFilters .filter-chip').forEach(c => {
            c.classList.remove('active');
            if (c.dataset.category === category) c.classList.add('active');
        });
    }
    // ?keyword= from navbar global search
    const keyword = params.get('keyword');
    if (keyword) {
        currentFilters.search = keyword.toLowerCase();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = keyword;
    }
}


// ============ Mobile Filter ============
function initMobileFilter() {
    const toggleBtn = document.getElementById('filterToggle');
    const sidebar = document.getElementById('filterSidebar');
    const closeBtn = document.getElementById('filterClose');
    const overlay = document.getElementById('navOverlay');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
        });
    }

    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

// ============ Render Products ============
async function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    const countEl = document.getElementById('pcsCount');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">⏳ Loading...</div>';

    if (pcsApiMode) {
        await loadPcsData();
    }

    let filtered = [...liveProducts];

    if (!pcsApiMode) {
        // Apply category filter
        if (currentFilters.category !== 'All') {
            filtered = filtered.filter(p => p.category === currentFilters.category);
        }
        // Apply price filter
        filtered = filtered.filter(p =>
            p.price >= currentFilters.priceMin && p.price <= currentFilters.priceMax
        );
        // Apply GPU filter
        if (currentFilters.gpu !== 'All') {
            filtered = filtered.filter(p => (p.gpu || '').includes(currentFilters.gpu));
        }
        // Apply search
        if (currentFilters.search) {
            filtered = filtered.filter(p =>
                (p.name || '').toLowerCase().includes(currentFilters.search) ||
                (p.description || '').toLowerCase().includes(currentFilters.search) ||
                (p.cpu || '').toLowerCase().includes(currentFilters.search) ||
                (p.gpu || '').toLowerCase().includes(currentFilters.search)
            );
        }
        // Apply sort
        switch (currentFilters.sort) {
            case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
            case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
            case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'rating': filtered.sort((a, b) => b.rating - a.rating); break;
        }
        // Client-side pagination
        pcsTotalPages = Math.max(1, Math.ceil(filtered.length / PCS_PAGE_SIZE));
        filtered = filtered.slice((pcsCurrentPage - 1) * PCS_PAGE_SIZE, pcsCurrentPage * PCS_PAGE_SIZE);
    }

    // Update count
    if (countEl) {
        countEl.textContent = `${filtered.length} Product${filtered.length !== 1 ? 's' : ''}`;
    }

    // Show/hide results
    if (filtered.length === 0) {
        grid.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
    } else {
        grid.style.display = '';
        if (noResults) noResults.style.display = 'none';
        grid.innerHTML = filtered.map(product => createProductCard(product)).join('');
        // Re-init scroll reveal for new cards
        setTimeout(() => initScrollReveal(), 50);
    }

    renderPCSPagination();
}

// ============ Pagination ============
function renderPCSPagination() {
    let container = document.getElementById('pcsPagination');
    if (!container) {
        container = document.createElement('div');
        container.id = 'pcsPagination';
        container.className = 'pagination';
        const grid = document.getElementById('productsGrid');
        if (grid) grid.parentNode.insertBefore(container, grid.nextSibling);
    }

    if (pcsTotalPages <= 1) { container.innerHTML = ''; return; }

    let html = `<button class="page-btn" onclick="goToPCSPage(${pcsCurrentPage - 1})" ${pcsCurrentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;
    const delta = 2;
    for (let i = 1; i <= pcsTotalPages; i++) {
        if (i === 1 || i === pcsTotalPages || (i >= pcsCurrentPage - delta && i <= pcsCurrentPage + delta)) {
            html += `<button class="page-btn ${i === pcsCurrentPage ? 'active' : ''}" onclick="goToPCSPage(${i})">${i}</button>`;
        } else if (i === pcsCurrentPage - delta - 1 || i === pcsCurrentPage + delta + 1) {
            html += `<span class="page-ellipsis">…</span>`;
        }
    }
    html += `<button class="page-btn" onclick="goToPCSPage(${pcsCurrentPage + 1})" ${pcsCurrentPage === pcsTotalPages ? 'disabled' : ''}>Next ›</button>`;
    container.innerHTML = html;
}

function goToPCSPage(page) {
    if (page < 1 || page > pcsTotalPages) return;
    pcsCurrentPage = page;
    pcsLoaded = false;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ Reset Filters ============
function resetFilters() {
    currentFilters = {
        category: 'All',
        priceMin: 0,
        priceMax: 999999,
        gpu: 'All',
        search: '',
        sort: 'featured'
    };
    pcsCurrentPage = 1;
    pcsLoaded = false;

    // Reset UI
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('[data-category="All"], .price-chip[data-min="0"][data-max="999999"], .gpu-chip[data-gpu="All"]').forEach(c => c.classList.add('active'));

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'featured';

    renderProducts();
}
