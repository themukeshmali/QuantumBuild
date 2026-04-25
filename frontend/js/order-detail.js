// ============================================================
// QUANTUM BUILD — Order Detail Page
// URL: /order-detail.html?id=<orderId>
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html?redirect=profile.html#orders';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');

    if (!orderId) {
        showError('No order ID provided.');
        return;
    }

    document.getElementById('breadcrumbId').textContent = `#${orderId.slice(-8).toUpperCase()}`;

    try {
        const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}`);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Order not found');
        }
        const order = await res.json();
        renderOrder(order);
    } catch (err) {
        showError(err.message);
    }
});

function renderOrder(o) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('orderContent').style.display = 'block';

    // Header
    document.getElementById('orderIdDisplay').textContent = `#${o._id.slice(-12).toUpperCase()}`;

    // Status badges
    const badges = document.getElementById('statusBadges');
    const currentStatus = o.orderStatus || (o.isDelivered ? 'Delivered' : (o.isPaid ? 'Processing' : 'Pending'));
    
    let statusClass = 'status-pending';
    if (currentStatus === 'Delivered') statusClass = 'status-delivered';
    else if (currentStatus === 'Cancelled') statusClass = 'status-cancelled';
    else if (currentStatus === 'Processing' || currentStatus === 'Shipped' || currentStatus === 'Out for Delivery') statusClass = 'status-paid';

    badges.innerHTML = `
        <span class="status-badge ${statusClass}">
            ${currentStatus}
        </span>
        <span class="status-badge ${o.isPaid ? 'status-paid' : 'status-unpaid'}">
            ${o.isPaid ? '✓ Paid' : '⏳ Unpaid'}
        </span>
        ${(!o.isPaid && !o.isCancelled && (currentStatus === 'Pending' || currentStatus === 'Processing'))
            ? `<button class="btn-cancel-order-detail" id="cancelOrderBtn" onclick="cancelOrderFromDetail('${o._id}')">✕ Cancel Order</button>`
            : ''}
    `;

    // Order items
    const itemsEl = document.getElementById('orderItems');
    itemsEl.innerHTML = (o.orderItems || []).map(item => `
        <div class="od-item-row">
            <img src="${item.image || ''}" alt="${item.name}" class="od-item-img"
                 onerror="this.style.background='rgba(255,255,255,0.04)';this.style.padding='8px';">
            <div style="flex:1;min-width:0;">
                <div class="od-item-name">${item.name}</div>
                <div class="od-item-qty">Qty: ${item.qty}</div>
            </div>
            <div class="od-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
        </div>
    `).join('');

    // Price summary
    const priceEl = document.getElementById('priceSummary');
    const discountRow = o.couponApplied ? `
        <div class="od-summary-row" style="color:var(--accent-green);">
            <span>Coupon (${o.couponApplied.code})</span>
            <span>-₹${(o.couponApplied.discountAmount || 0).toLocaleString('en-IN')}</span>
        </div>` : '';

    priceEl.innerHTML = `
        <div class="od-summary-row"><span>Subtotal</span><span>₹${(o.itemsPrice || 0).toLocaleString('en-IN')}</span></div>
        <div class="od-summary-row"><span>Shipping</span><span>${o.shippingPrice === 0 ? 'FREE' : '₹' + o.shippingPrice}</span></div>
        <div class="od-summary-row"><span>Tax (18% GST)</span><span>₹${(o.taxPrice || 0).toLocaleString('en-IN')}</span></div>
        ${discountRow}
        <div class="od-summary-row"><span>Total</span><span style="color:#d4003a;">₹${(o.totalPrice || 0).toLocaleString('en-IN')}</span></div>
    `;

    // Timeline
    const timelineEl = document.getElementById('orderTimeline');
    const statusMap = {
        'Pending': { icon: '📋', label: 'Order Placed' },
        'Processing': { icon: '📦', label: 'Processing & Packing' },
        'Shipped': { icon: '🚚', label: 'Shipped' },
        'Out for Delivery': { icon: '🛵', label: 'Out for Delivery' },
        'Delivered': { icon: '✅', label: 'Delivered' },
        'Cancelled': { icon: '❌', label: 'Cancelled' }
    };

    const history = o.statusHistory || [];
    const timelineHtml = history.map((h, i) => {
        const info = statusMap[h.status] || { icon: '•', label: h.status };
        const date = new Date(h.timestamp).toLocaleDateString('en-IN', { 
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
        });
        const isLatest = i === history.length - 1;
        return `
            <div class="od-timeline-step">
                <div class="od-timeline-dot done">${info.icon}</div>
                <div class="od-timeline-info">
                    <div class="od-timeline-title ${isLatest ? 'text-primary' : ''}">${info.label}</div>
                    <div class="od-timeline-date">${date}</div>
                </div>
            </div>
        `;
    }).join('');

    timelineEl.innerHTML = timelineHtml || '<div style="color:var(--text-muted); padding: 20px;">No history available</div>';

    // Shipping
    const ship = o.shippingAddress || {};
    document.getElementById('shippingInfo').innerHTML = `
        <span>${ship.fullName || ''}</span>
        <span>${ship.address || '—'}</span>
        <span>${ship.city || ''}${ship.postalCode ? ', ' + ship.postalCode : ''}</span>
        <span>${ship.country || 'India'}</span>
        <span>📞 ${ship.phone || ''}</span>
    `;

    // Payment
    const paidAt = o.paidAt ? new Date(o.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
    document.getElementById('paymentInfo').innerHTML = `
        <span>Method: <strong style="color:var(--text-primary)">${o.paymentMethod || '—'}</strong></span>
        ${o.isPaid ? `<span style="color:#10b981; font-size:0.78rem;">✓ Paid on ${paidAt}</span>` : `<span style="color:#f59e0b; font-size:0.78rem;">⏳ Payment pending</span>`}
        ${o.paymentResult?.id ? `<span style="font-size:0.72rem; color:var(--text-muted);">Ref: ${o.paymentResult.id}</span>` : ''}
    `;
}

function showError(msg) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMsg').textContent = msg;
}

async function cancelOrderFromDetail(orderId) {
    if (!confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
    const btn = document.getElementById('cancelOrderBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Cancelling...'; }
    try {
        await apiCancelOrder(orderId);
        if (typeof showNotification === 'function') showNotification('Order cancelled.', 'info');
        // Reload order to reflect status
        const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}`);
        const order = await res.json();
        renderOrder(order);
    } catch (err) {
        if (typeof showNotification === 'function') showNotification(err.message || 'Could not cancel order', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '✕ Cancel Order'; }
    }
}
