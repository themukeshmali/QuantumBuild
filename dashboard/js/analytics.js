// ============================================================
// QUANTUM BUILD — Analytics Panel
// Monthly revenue, payment method breakdown, top products
// ============================================================

let analyticsLoaded = false;

const AN_COLORS = ['#d4003a','#7c3aed','#10b981','#f59e0b','#3b82f6','#ec4899','#06b6d4','#84cc16'];

async function loadAnalyticsPanel(force = false) {
    if (analyticsLoaded && !force) return;
    analyticsLoaded = true;

    try {
        const [orders, productsData] = await Promise.all([
            apiGetOrders(),
            apiGetProducts({ pageSize: 1000 }),
        ]);

        const products = productsData.products || [];
        const paidOrders = orders.filter(o => o.isPaid);

        // ── KPI Cards ──────────────────────────────────────────
        const totalRevenue = paidOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
        const avgOrder = paidOrders.length ? totalRevenue / paidOrders.length : 0;
        const delivered = orders.filter(o => o.isDelivered).length;
        const pending = orders.filter(o => !o.isDelivered).length;

        document.getElementById('anRevenue').textContent = '₹' + Math.round(totalRevenue).toLocaleString('en-IN');
        document.getElementById('anAvgOrder').textContent = '₹' + Math.round(avgOrder).toLocaleString('en-IN');
        document.getElementById('anDelivered').textContent = delivered;
        document.getElementById('anPending').textContent = pending;

        // ── Monthly Revenue Chart ──────────────────────────────
        renderMonthlyRevenueChart(paidOrders);

        // ── Payment Method Breakdown ───────────────────────────
        renderPaymentMethodBreakdown(orders);

        // ── Top 10 Products by Revenue ─────────────────────────
        renderTopProducts(orders, products);

    } catch (err) {
        console.error('Analytics load error:', err);
        notify('Failed to load analytics: ' + err.message, 'error');
    }
}

// ── Monthly Revenue (last 6 months) ──────────────────────────
function renderMonthlyRevenueChart(paidOrders) {
    const container = document.getElementById('monthlyRevenueChart');
    if (!container) return;

    // Build a map: "YYYY-MM" → revenue
    const monthMap = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = 0;
    }

    paidOrders.forEach(o => {
        const d = new Date(o.createdAt || o.paidAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key in monthMap) monthMap[key] += (o.totalPrice || 0);
    });

    const entries = Object.entries(monthMap);
    const maxVal = Math.max(...entries.map(([, v]) => v), 1);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    container.innerHTML = entries.map(([key, val]) => {
        const [yr, mo] = key.split('-');
        const label = monthNames[parseInt(mo) - 1] + ' ' + yr.slice(2);
        const pct = Math.max(4, (val / maxVal) * 100);
        return `
            <div class="chart-bar-wrap">
                <div class="chart-bar-track">
                    <div class="chart-bar" style="height:0" data-target="${pct}" title="${label}: ₹${Math.round(val).toLocaleString('en-IN')}">
                        <div class="chart-bar-tooltip">₹${Math.round(val).toLocaleString('en-IN')}</div>
                    </div>
                </div>
                <div class="chart-label">${label}</div>
            </div>
        `;
    }).join('');

    requestAnimationFrame(() => {
        document.querySelectorAll('#monthlyRevenueChart .chart-bar').forEach(bar => {
            setTimeout(() => { bar.style.height = bar.dataset.target + '%'; }, 80);
        });
    });
}

// ── Payment Method Breakdown ──────────────────────────────────
function renderPaymentMethodBreakdown(orders) {
    const container = document.getElementById('paymentMethodBreakdown');
    if (!container) return;

    const counts = {};
    orders.forEach(o => {
        const m = o.paymentMethod || 'Other';
        counts[m] = (counts[m] || 0) + 1;
    });

    const total = orders.length || 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    if (!sorted.length) {
        container.innerHTML = '<div class="text-muted" style="text-align:center;padding:20px;font-size:0.82rem;">No data</div>';
        return;
    }

    container.innerHTML = sorted.map(([method, count], i) => {
        const pct = Math.round((count / total) * 100);
        const color = AN_COLORS[i % AN_COLORS.length];
        return `
            <div class="donut-legend-item">
                <div class="donut-legend-label">
                    <div class="donut-legend-dot" style="background:${color}"></div>
                    ${method}
                </div>
                <span class="donut-legend-value">${count} <span style="color:var(--text-muted);font-size:0.68rem;">(${pct}%)</span></span>
            </div>
        `;
    }).join('');
}

// ── Top 10 Products by Revenue ────────────────────────────────
function renderTopProducts(orders, products) {
    const container = document.getElementById('topProductsList');
    if (!container) return;

    // Tally revenue per product name from order items
    const revenueMap = {};
    orders.forEach(o => {
        (o.orderItems || []).forEach(item => {
            const key = item.name || 'Unknown';
            revenueMap[key] = (revenueMap[key] || 0) + ((item.price || 0) * (item.qty || 1));
        });
    });

    const sorted = Object.entries(revenueMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (!sorted.length) {
        container.innerHTML = '<div class="empty-state" style="padding:30px;"><div class="empty-state-icon">📦</div><div class="empty-state-text">No order data yet</div></div>';
        return;
    }

    const maxRev = sorted[0][1] || 1;

    container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:10px;padding:8px 0;">
            ${sorted.map(([name, rev], i) => {
                const pct = Math.round((rev / maxRev) * 100);
                const color = AN_COLORS[i % AN_COLORS.length];
                return `
                    <div style="display:flex;align-items:center;gap:14px;">
                        <div style="width:24px;height:24px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:0.62rem;font-weight:700;color:#fff;flex-shrink:0;">${i + 1}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                                <span style="font-size:0.82rem;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%;">${name}</span>
                                <span style="font-size:0.82rem;font-weight:700;color:${color};">₹${Math.round(rev).toLocaleString('en-IN')}</span>
                            </div>
                            <div style="height:5px;background:var(--bg-elevated);border-radius:99px;overflow:hidden;">
                                <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;transition:width 0.8s ease;"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}
