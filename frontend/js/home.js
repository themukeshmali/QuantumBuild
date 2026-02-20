// ============================================
// QUANTUM BUILD — Home Page JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    renderFeaturedProducts();
    initCounters();
    initPerfBars();
});

// ============ Floating Particles ============
function createParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    const count = 30;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (8 + Math.random() * 12) + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.width = (1 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;

        // Randomize particle color
        const colors = ['var(--accent-red)', 'var(--neon-blue)', 'var(--neon-purple)'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;
        particle.style.boxShadow = `0 0 6px ${color === 'var(--accent-red)' ? 'rgba(255,0,64,0.5)' : color === 'var(--neon-blue)' ? 'rgba(0,229,255,0.5)' : 'rgba(179,71,255,0.5)'}`;

        container.appendChild(particle);
    }
}

// ============ Featured Products ============
function renderFeaturedProducts() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    const featured = getFeaturedProducts();
    grid.innerHTML = featured.map(product => createProductCard(product)).join('');

    // Re-init scroll reveal for dynamically added cards
    setTimeout(() => initScrollReveal(), 100);
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

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);

        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target.toLocaleString();
        }
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
