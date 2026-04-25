// ============================================
// QUANTUM BUILD — Home Page JavaScript
// API-first with static fallback
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    createParticles();
    initCounters();
    initPerfBars();
    await loadHomeData();
    renderFeaturedProducts();
    renderFeaturedParts();
});

// ── Live data ────────────────────────────────────────────────
let homePCs    = [];
let homeParts  = [];

async function loadHomeData() {
    try {
        const [pcsData, partsData] = await Promise.all([
            apiGetProducts({ pageSize: 8, broadCategory: 'Gaming PC' }).catch(() => null),
            apiGetProducts({ pageSize: 8, broadCategory: 'PC parts' }).catch(() => null),
        ]);

        if (pcsData && (pcsData.products || pcsData).length > 0) {
            homePCs = (pcsData.products || pcsData).map(normalizeProduct);
        } else {
            homePCs = typeof PRODUCTS !== 'undefined' ? PRODUCTS.slice(0, 8) : [];
        }

        if (partsData && (partsData.products || partsData).length > 0) {
            const allProducts = (partsData.products || partsData).map(normalizeProduct);
            // Pick one from each key category for the parts highlight section
            const cats = ['cpu', 'gpu', 'ram', 'headset'];
            homeParts = cats.map(cat =>
                allProducts.find(p => (p.partCategory || p.category || '').toLowerCase().includes(cat))
            ).filter(Boolean);
            if (homeParts.length < 4 && typeof PARTS !== 'undefined') {
                const featuredIds = ['cpu-1', 'gpu-1', 'ram-1', 'hs-1'];
                homeParts = PARTS.filter(p => featuredIds.includes(p.id));
            }
        } else {
            if (typeof PARTS !== 'undefined') {
                const featuredIds = ['cpu-1', 'gpu-1', 'ram-1', 'hs-1'];
                homeParts = PARTS.filter(p => featuredIds.includes(p.id));
            }
        }
    } catch {
        // Full fallback
        homePCs   = typeof PRODUCTS !== 'undefined' ? PRODUCTS.slice(0, 8) : [];
        if (typeof PARTS !== 'undefined') {
            const ids = ['cpu-1', 'gpu-1', 'ram-1', 'hs-1'];
            homeParts = PARTS.filter(p => ids.includes(p.id));
        }
    }
}

// ============ Featured Products ============
function renderFeaturedProducts() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    const featured = homePCs.length > 0 ? homePCs.slice(0, 8) :
        (typeof getFeaturedProducts === 'function' ? getFeaturedProducts() : []);

    grid.innerHTML = featured.map(p => createProductCard(p)).join('');
    setTimeout(() => initScrollReveal(), 100);
}

// ============ Featured Parts Highlight ============
function renderFeaturedParts() {
    const grid = document.getElementById('partsHighlightGrid');
    if (!grid) return;

    const parts = homeParts.length > 0 ? homeParts :
        (typeof PARTS !== 'undefined' ? PARTS.filter(p => ['cpu-1', 'gpu-1', 'ram-1', 'hs-1'].includes(p.id)) : []);

    grid.innerHTML = parts.map(part => `
        <div class="part-highlight-card reveal">
            <div class="part-highlight-img" style="--part-color: ${part.artColor || '#d4003a'};">
                ${part.image
                    ? `<img src="${part.image}" alt="${part.name}" style="max-width:100%;max-height:120px;object-fit:contain;" onerror="this.style.display='none'">`
                    : `<div class="part-art-icon">${part.artIcon || '📦'}</div>`
                }
            </div>
            <div class="part-highlight-body">
                <div class="part-highlight-brand">${part.brand}</div>
                <h3 class="part-highlight-name">${part.name}</h3>
                <p class="part-highlight-spec">${part.spec || part.specifications || ''}</p>
                <div class="part-highlight-footer">
                    <span class="part-highlight-price">₹${part.price.toLocaleString('en-IN')}</span>
                    <a href="parts.html?cat=${part.partCategory || part.category}" class="btn-link">View Category →</a>
                </div>
            </div>
        </div>
    `).join('');

    setTimeout(() => initScrollReveal(), 100);
}

// ============ Floating Particles ============
function createParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (8 + Math.random() * 12) + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.width = (1 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;

        const colors = ['var(--accent-red)', 'var(--neon-blue)', 'var(--neon-purple)'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;
        particle.style.boxShadow = `0 0 6px ${color === 'var(--accent-red)' ? 'rgba(255,0,64,0.5)' : color === 'var(--neon-blue)' ? 'rgba(0,229,255,0.5)' : 'rgba(179,71,255,0.5)'}`;
        container.appendChild(particle);
    }
}

// ============ Counter Animation ============
function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000;
    const start = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.floor(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
        else element.textContent = target.toLocaleString();
    }
    requestAnimationFrame(update);
}

// ============ Performance Bars ============
function initPerfBars() {
    const bars = document.querySelectorAll('.perf-bar-fill');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const width = entry.target.getAttribute('data-width');
                entry.target.style.width = width + '%';
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    bars.forEach(bar => observer.observe(bar));
}
