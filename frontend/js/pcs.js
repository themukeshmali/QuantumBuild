// ============================================
// QUANTUM BUILD — PCs Listing Page JavaScript
// Filters, Sort, Search, Dynamic Rendering
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initMobileFilter();
    handleURLCategory();
    renderProducts();
});

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
            renderProducts();
        });
    });

    // GPU chips
    document.querySelectorAll('.gpu-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.gpu-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilters.gpu = chip.dataset.gpu;
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
                renderProducts();
            }, 300);
        });
    }

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentFilters.sort = e.target.value;
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
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    const countEl = document.getElementById('pcsCount');
    if (!grid) return;

    let filtered = [...PRODUCTS];

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
        filtered = filtered.filter(p => p.gpu.includes(currentFilters.gpu));
    }

    // Apply search
    if (currentFilters.search) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(currentFilters.search) ||
            p.description.toLowerCase().includes(currentFilters.search) ||
            p.cpu.toLowerCase().includes(currentFilters.search) ||
            p.gpu.toLowerCase().includes(currentFilters.search)
        );
    }

    // Apply sort
    switch (currentFilters.sort) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        default:
            // Featured order (default)
            break;
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

    // Reset UI
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('[data-category="All"], .price-chip[data-min="0"][data-max="999999"], .gpu-chip[data-gpu="All"]').forEach(c => c.classList.add('active'));

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'featured';

    renderProducts();
}
