// ============================================================
// QUANTUM BUILD — Overview Dashboard Logic
// Stats, Revenue Chart, Category Breakdown, Widgets
// ============================================================

const CATEGORY_COLORS = [
    '#d4003a', '#7c3aed', '#10b981', '#f59e0b', '#3b82f6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7'
];

let overviewLoaded = false;
let lastOrderCount = 0;
let livePollingInterval = null;

function initLivePolling() {
    if (livePollingInterval) clearInterval(livePollingInterval);
    livePollingInterval = setInterval(async () => {
        try {
            const orders = await apiGetOrders();
            const currentCount = orders.length;
            const badge = document.getElementById('navBadgeOrders');
            if (badge) badge.textContent = currentCount;
            
            if (lastOrderCount > 0 && currentCount > lastOrderCount) {
                const newOrdersCount = currentCount - lastOrderCount;
                notify(`🔔 ${newOrdersCount} New Order${newOrdersCount > 1 ? 's' : ''} received!`, 'success');
                
                // Auto refresh if looking at orders or overview
                const active = document.querySelector('.panel.active');
                if (active) {
                    if (active.id === 'panel-orders' && typeof loadOrdersPanel === 'function') loadOrdersPanel(true);
                    if (active.id === 'panel-overview') loadOverview(true);
                }
            }
            lastOrderCount = currentCount;
        } catch (e) { /* silent poll fail */ }
    }, 30000); // 30 seconds
}

async function loadOverview(force = false) {
    if (overviewLoaded && !force) return;
    overviewLoaded = true;

    try {
        const [productsData, orders, users] = await Promise.all([
            apiGetProducts({ pageSize: 1000 }),
            apiGetOrders(),
            apiGetUsers(),
        ]);

        const products = productsData.products || [];

        // ── Stat Cards ──────────────────────────────────────
        animateCount('statProducts', products.length);
        animateCount('statOrders', orders.length);
        animateCount('statUsers', users.length);

        const revenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        animateRevenue('statRevenue', revenue);

        // ── Nav Badges ──────────────────────────────────────
        document.getElementById('navBadgeProducts').textContent = products.length;
        document.getElementById('navBadgeOrders').textContent = orders.length;
        lastOrderCount = orders.length;
        if (!livePollingInterval) initLivePolling();

        // ── Revenue Chart ───────────────────────────────────
        renderRevenueChart(orders.slice(0, 10).reverse());

        // ── Category Breakdown ──────────────────────────────
        renderCategoryBreakdown(products);

        // ── Recent Orders Widget ────────────────────────────
        renderRecentOrdersWidget(orders.slice(0, 6));

        // ── Low Stock Widget ────────────────────────────────
        renderLowStockWidget(products);

    } catch (err) {
        console.error('Overview load error:', err);
        notify('Failed to load dashboard data: ' + err.message, 'error');
    }
}

// ── Animated Number Counter ──────────────────────────────
function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 900;
    const start = performance.now();

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target).toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function animateRevenue(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 1000;
    const start = performance.now();

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = '₹' + Math.round(eased * target).toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ── Revenue Chart (Pure CSS/HTML) ────────────────────────
function renderRevenueChart(orders) {
    const container = document.getElementById('revenueChart');
    if (!container) return;

    if (!orders.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">No order data yet</div></div>';
        return;
    }

    const maxRevenue = Math.max(...orders.map(o => o.totalPrice || 0));
    if (maxRevenue === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">No revenue recorded</div></div>';
        return;
    }

    container.innerHTML = orders.map(order => {
        const pct = Math.max(4, ((order.totalPrice || 0) / maxRevenue) * 100);
        const label = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const id = shortId(order._id);
        return `
            <div class="chart-bar-wrap">
                <div class="chart-bar-track">
                    <div class="chart-bar" style="height:0" data-target="${pct}" title="${id}: ${formatPrice(order.totalPrice)}">
                        <div class="chart-bar-tooltip">${formatPrice(order.totalPrice)}</div>
                    </div>
                </div>
                <div class="chart-label">${label}</div>
            </div>
        `;
    }).join('');

    // Animate bars in
    requestAnimationFrame(() => {
        document.querySelectorAll('.chart-bar').forEach(bar => {
            const target = bar.dataset.target;
            setTimeout(() => {
                bar.style.height = target + '%';
            }, 100);
        });
    });
}

// ── Category Breakdown ────────────────────────────────────
function renderCategoryBreakdown(products) {
    const container = document.getElementById('categoryBreakdown');
    if (!container) return;

    const counts = {};
    products.forEach(p => {
        const cat = p.partCategory || p.category || 'Other';
        counts[cat] = (counts[cat] || 0) + 1;
    });

    const total = products.length;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (!sorted.length) {
        container.innerHTML = '<div class="text-muted" style="text-align:center;padding:20px;font-size:0.82rem;">No products</div>';
        return;
    }

    container.innerHTML = sorted.map(([cat, count], i) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
        return `
            <div class="donut-legend-item">
                <div class="donut-legend-label">
                    <div class="donut-legend-dot" style="background:${color}"></div>
                    ${cat}
                </div>
                <span class="donut-legend-value">${count} <span style="color:var(--text-muted);font-size:0.68rem;">(${pct}%)</span></span>
            </div>
        `;
    }).join('');
}

// ── Recent Orders Widget ──────────────────────────────────
function renderRecentOrdersWidget(orders) {
    const container = document.getElementById('recentOrdersWidget');
    if (!container) return;

    if (!orders.length) {
        container.innerHTML = '<div class="empty-state" style="padding:30px;"><div class="empty-state-icon">🛒</div><div class="empty-state-text">No orders yet</div></div>';
        return;
    }

    const rows = orders.map(o => `
        <tr>
            <td class="order-id">${shortId(o._id)}</td>
            <td>${o.user?.name || 'Guest'}</td>
            <td>${formatPrice(o.totalPrice)}</td>
            <td>${o.isPaid
                ? '<span class="badge badge-paid">Paid</span>'
                : '<span class="badge badge-warning">Unpaid</span>'
            }</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table class="mini-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

// ── Low Stock Widget ──────────────────────────────────────
function renderLowStockWidget(products) {
    const container = document.getElementById('lowStockWidget');
    if (!container) return;

    const low = products.filter(p => p.countInStock <= 5).sort((a, b) => a.countInStock - b.countInStock).slice(0, 6);

    if (!low.length) {
        container.innerHTML = `
            <div class="empty-state" style="padding:30px;">
                <div class="empty-state-icon">✅</div>
                <div class="empty-state-text">All products well-stocked</div>
            </div>
        `;
        return;
    }

    container.innerHTML = low.map(p => `
        <div class="stock-alert-item">
            <span class="stock-alert-name" title="${p.name}">${p.name}</span>
            ${getStockBadge(p.countInStock)}
        </div>
    `).join('');
}
