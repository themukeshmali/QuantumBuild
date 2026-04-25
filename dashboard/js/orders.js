// ============================================================
// QUANTUM BUILD — Orders Panel
// List, filter, mark delivered, expandable detail rows
// ============================================================

let allOrders = [];
let filteredOrders = [];
let orderFilter = 'all';
let orderSearchTerm = '';
let ordersLoaded = false;

// ── Load Orders ───────────────────────────────────────────
async function loadOrdersPanel(force = false) {
    if (ordersLoaded && !force) return;
    ordersLoaded = true;

    const tbody = document.getElementById('ordersTbody');
    tbody.innerHTML = `<tr><td colspan="7"><div class="loading-state"><span class="spinner spinner-lg"></span> Loading orders...</div></td></tr>`;

    try {
        allOrders = await apiGetOrders();

        document.getElementById('navBadgeOrders').textContent = allOrders.length;

        // Init search
        const searchInput = document.getElementById('orderSearch');
        searchInput.removeEventListener('input', onOrderSearch);
        searchInput.addEventListener('input', onOrderSearch);

        // Init filter chips
        document.querySelectorAll('#panel-orders .chip').forEach(chip => {
            chip.onclick = () => {
                document.querySelectorAll('#panel-orders .chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                orderFilter = chip.dataset.filter;
                applyOrderFilters();
            };
        });

        applyOrderFilters();

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7">
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">${err.message}</div>
            </div>
        </td></tr>`;
        notify('Failed to load orders: ' + err.message, 'error');
    }
}

function onOrderSearch(e) {
    orderSearchTerm = e.target.value.toLowerCase().trim();
    applyOrderFilters();
}

function applyOrderFilters() {
    filteredOrders = allOrders.filter(o => {
        const matchFilter = (() => {
            if (orderFilter === 'paid') return o.isPaid;
            if (orderFilter === 'unpaid') return !o.isPaid;
            if (orderFilter === 'delivered') return o.isDelivered;
            if (orderFilter === 'pending') return !o.isDelivered;
            return true;
        })();

        const matchSearch = !orderSearchTerm ||
            o._id.toLowerCase().includes(orderSearchTerm) ||
            (o.user?.name || '').toLowerCase().includes(orderSearchTerm) ||
            (o.user?.email || '').toLowerCase().includes(orderSearchTerm);

        return matchFilter && matchSearch;
    });

    document.getElementById('ordersSubtitle').textContent =
        `Showing ${filteredOrders.length} of ${allOrders.length} order${allOrders.length !== 1 ? 's' : ''}`;

    renderOrdersTable();
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTbody');

    if (!filteredOrders.length) {
        tbody.innerHTML = `<tr><td colspan="7">
            <div class="empty-state">
                <div class="empty-state-icon">🛒</div>
                <div class="empty-state-text">No orders match your filter</div>
            </div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = filteredOrders.map(o => {
        const payBadge = o.isPaid
            ? `<span class="badge badge-paid">✓ Paid</span>`
            : `<span class="badge badge-warning">Unpaid</span>`;

        let statusClass = 'pending';
        if (o.orderStatus === 'Cancelled') statusClass = 'out';
        else if (o.orderStatus === 'Delivered') statusClass = 'in';
        else if (o.orderStatus === 'Processing' || o.orderStatus === 'Shipped') statusClass = 'low';

        const delivBadge = `<span class="badge badge-${statusClass}">${o.orderStatus || 'Pending'}</span>`;

        const statuses = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
        const statusOptions = statuses.map(s => 
            `<option value="${s}" ${s === o.orderStatus ? 'selected' : ''}>${s}</option>`
        ).join('');

        const delivAction = `
            <select class="status-dropdown" onchange="updateOrderStatus('${o._id}', this.value)" style="padding:4px 8px; border-radius:4px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-primary); font-size:0.8rem;">
                ${statusOptions}
            </select>
        `;

        return `
            <tr class="order-main-row" data-order-id="${o._id}">
                <td>
                    <button class="order-expand-btn" onclick="toggleOrderDetail('${o._id}')"
                        style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.85rem;margin-right:6px;"
                        title="View order details">▶</button>
                    <span class="order-id">${shortId(o._id)}</span>
                </td>
                <td>
                    <div style="font-weight:500;color:var(--text-primary);">${o.user?.name || 'Guest'}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted);">${o.user?.email || ''}</div>
                </td>
                <td>${formatDate(o.createdAt)}</td>
                <td style="font-weight:600;color:var(--text-primary);">${formatPrice(o.totalPrice)}</td>
                <td>${payBadge}</td>
                <td>${delivBadge}</td>
                <td>
                    <div class="table-actions">
                        ${delivAction}
                    </div>
                </td>
            </tr>
            <tr class="order-detail-row" id="detail-${o._id}" style="display:none;">
                <td colspan="7">
                    <div class="order-detail-panel">
                        ${renderOrderDetailPanel(o)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderOrderDetailPanel(o) {
    const items = (o.orderItems || []).map(item => `
        <div class="order-item-row">
            <span>${item.name}</span>
            <span class="text-mono">× ${item.qty}</span>
            <span style="font-weight:600;color:var(--text-primary);">${formatPrice(item.price)}</span>
        </div>
    `).join('');

    const shipping = o.shippingAddress;
    const shippingHtml = shipping
        ? `${shipping.address}, ${shipping.city}, ${shipping.postalCode}, ${shipping.country}`
        : '—';

    return `
        <div class="order-detail-grid">
            <div class="order-detail-section">
                <h4>Order Items</h4>
                ${items || '<div style="color:var(--text-muted);font-size:0.82rem;">No items</div>'}
                <div style="margin-top:12px;display:flex;flex-direction:column;gap:4px;">
                    <div class="order-item-row">
                        <span style="color:var(--text-muted);">Tax</span>
                        <span></span>
                        <span>${formatPrice(o.taxPrice)}</span>
                    </div>
                    <div class="order-item-row">
                        <span style="color:var(--text-muted);">Shipping</span>
                        <span></span>
                        <span>${formatPrice(o.shippingPrice)}</span>
                    </div>
                    <div class="order-item-row" style="font-weight:700;color:var(--text-primary);">
                        <span>Total</span>
                        <span></span>
                        <span>${formatPrice(o.totalPrice)}</span>
                    </div>
                </div>
            </div>
            <div class="order-detail-section">
                <h4>Shipping Address</h4>
                <p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.6;">${shippingHtml}</p>
                <div style="margin-top:16px;">
                    <h4>Payment</h4>
                    <p style="font-size:0.82rem;color:var(--text-secondary);">
                        Method: <strong style="color:var(--text-primary);">${o.paymentMethod || '—'}</strong>
                    </p>
                    ${o.isPaid && o.paidAt ? `<p style="font-size:0.72rem;color:var(--accent-green);">Paid on ${formatDate(o.paidAt)}</p>` : ''}
                    ${o.isDelivered && o.deliveredAt ? `<p style="font-size:0.72rem;color:var(--accent-green);">Delivered on ${formatDate(o.deliveredAt)}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

function toggleOrderDetail(orderId) {
    const detailRow = document.getElementById(`detail-${orderId}`);
    const mainRow = document.querySelector(`[data-order-id="${orderId}"]`);
    const btn = mainRow?.querySelector('.order-expand-btn');

    if (!detailRow) return;

    const isOpen = detailRow.style.display !== 'none';
    detailRow.style.display = isOpen ? 'none' : 'table-row';
    if (btn) btn.textContent = isOpen ? '▶' : '▼';
}

// ── Update Order Status ────────────────────────────────────────
async function updateOrderStatus(id, status) {
    qbConfirm(
        `Update this order's status to "${status}"?`,
        'Update Order Status',
        async () => {
            try {
                await apiUpdateOrderStatus(id, status);
                notify(`Order marked as ${status}!`, 'success');
                ordersLoaded = false;
                await loadOrdersPanel(true);
                overviewLoaded = false;
            } catch (err) {
                notify('Failed to update order: ' + err.message, 'error');
                // Reload to reset the dropdown
                loadOrdersPanel(true);
            }
        }
    );
}
