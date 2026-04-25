// ============================================
// QUANTUM BUILD — Profile Page Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html?redirect=profile.html';
        return;
    }

    loadProfile();
    loadOrders();
    loadWishlistTab();
    initProfileNav();

    // Check for hash
    if (window.location.hash === '#orders') switchTab('orders');
    if (window.location.hash === '#wishlist') switchTab('wishlist');
});

function initProfileNav() {
    document.querySelectorAll('.profile-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    document.querySelectorAll('.profile-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.profile-panel').forEach(p => p.classList.remove('active'));

    const navItem = document.querySelector(`[data-tab="${tab}"]`);
    const panel = document.getElementById(`panel-${tab}`);
    if (navItem) navItem.classList.add('active');
    if (panel) panel.classList.add('active');
}

async function loadProfile() {
    const user = getCurrentUser();
    if (!user) return;

    // Sidebar
    document.getElementById('profileAvatar').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;

    const badge = document.getElementById('profileBadge');
    if (user.isAdmin) {
        badge.textContent = 'ADMIN';
        badge.style.display = 'inline-block';
    }

    // Form
    document.getElementById('editName').value = user.name;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editAddress').value = user.deliveryAddress || '';
}

async function loadOrders() {
    const ordersEl = document.getElementById('ordersList');

    try {
        const response = await fetchWithAuth(`${API_BASE}/orders/myorders`);
        const orders = await response.json();

        if (!response.ok) throw new Error(orders.message || 'Failed to load orders');

        if (!orders || orders.length === 0) {
            ordersEl.innerHTML = `
                <div class="orders-empty">
                    <div class="orders-empty-icon">📦</div>
                    <h3>No orders yet</h3>
                    <p>Start shopping to see your orders here!</p>
                    <a href="parts.html" class="btn btn-secondary" style="margin-top: 16px;">Browse Parts</a>
                </div>
            `;
            return;
        }

        ordersEl.innerHTML = orders.map(order => renderOrderCard(order)).join('');

    } catch (err) {
        ordersEl.innerHTML = `
            <div class="orders-empty">
                <div class="orders-empty-icon">⚠️</div>
                <h3>Could not load orders</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}

function renderOrderCard(order) {
    const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    let statusClass = 'pending';
    let statusText = order.orderStatus || 'Pending';
    
    if (order.isCancelled || statusText === 'Cancelled') {
        statusClass = 'cancelled';
        statusText = 'Cancelled';
    } else if (statusText === 'Delivered' || order.isDelivered) {
        statusClass = 'delivered';
    } else if (statusText === 'Processing') {
        statusClass = 'processing';
    } else if (statusText === 'Shipped') {
        statusClass = 'shipped';
    } else if (statusText === 'Out for Delivery') {
        statusClass = 'out-for-delivery';
    }

    const items = order.orderItems.map(i =>
        `<span class="order-item-chip">${i.name} ×${i.qty}</span>`
    ).join('');

    const canCancel = (statusText === 'Pending' || statusText === 'Processing') && !order.isPaid && !order.isCancelled;

    return `
        <div class="order-card" id="order-${order._id}">
            <div class="order-header">
                <span class="order-id">#${order._id.slice(-8).toUpperCase()}</span>
                <span class="order-date">${date}</span>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            <div class="order-items-summary">${items}</div>
            <div class="order-footer">
                <span class="order-total">₹${order.totalPrice.toLocaleString('en-IN')}</span>
                <div style="display:flex;gap:8px;align-items:center;">
                    <a href="order-detail.html?id=${order._id}" class="btn-order-detail">View Details →</a>
                    ${canCancel ? `<button class="btn-cancel-order" onclick="cancelOrder('${order._id}')">✕ Cancel</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;

    const btn = document.querySelector(`#order-${orderId} .btn-cancel-order`);
    if (btn) { btn.disabled = true; btn.textContent = 'Cancelling...'; }

    try {
        await apiCancelOrder(orderId);
        if (typeof showNotification === 'function') showNotification('Order cancelled successfully.', 'info');
        loadOrders(); // refresh list
    } catch (err) {
        if (typeof showNotification === 'function') showNotification(err.message || 'Failed to cancel order', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '✕ Cancel'; }
    }
}

// ── Wishlist Tab ──────────────────────────────────────────────
async function loadWishlistTab() {
    const container = document.getElementById('wishlistGrid');
    if (!container) return;

    let list = [];
    try {
        const rawList = await apiGetWishlist();
        // Convert to local format for rendering
        list = rawList.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price,
            image: p.image,
            brand: p.brand,
            originalPrice: p.originalPrice
        }));
        saveWishlist(list); // Keep local cache in sync
    } catch(e) {
        list = getWishlist(); // fallback to cache
    }

    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="orders-empty">
                <div class="orders-empty-icon">🤍</div>
                <h3>Your wishlist is empty</h3>
                <p>Tap the ♥ on any part to save it here.</p>
                <a href="parts.html" class="btn btn-secondary" style="margin-top:16px;">Browse Parts</a>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(item => `
        <div class="wishlist-item-card" id="wl-${item.id}">
            <div class="wishlist-item-img-wrap">
                <img src="${item.image || ''}" alt="${item.name}" onerror="this.style.display='none'">
            </div>
            <div class="wishlist-item-body">
                <div class="wishlist-item-brand">${item.brand || ''}</div>
                <div class="wishlist-item-name">${item.name}</div>
                <div class="wishlist-item-price">₹${(item.price || 0).toLocaleString('en-IN')}
                    ${item.originalPrice ? `<span class="wishlist-original-price">₹${item.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                </div>
            </div>
            <div class="wishlist-item-actions">
                <button class="btn-add-cart" onclick="addToCart('${item.id}', 1, ${JSON.stringify({ name: item.name, price: item.price, image: item.image, brand: item.brand }).replace(/"/g, '&quot;')})">+ Cart</button>
                <button class="btn-wl-remove" onclick="removeFromWishlist('${item.id}')">✕</button>
            </div>
        </div>
    `).join('');
}

function removeFromWishlist(id) {
    toggleWishlist(id);
    loadWishlistTab();
}

// Profile Update Form
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const deliveryAddress = document.getElementById('editAddress').value.trim();
        const password = document.getElementById('editPassword').value;

        const updates = { name, email, deliveryAddress };
        if (password) updates.password = password;

        const btn = form.querySelector('.btn-auth');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            const data = await updateUserProfile(updates);
            document.getElementById('profileName').textContent = data.name;
            document.getElementById('profileEmail').textContent = data.email;
            document.getElementById('profileAvatar').textContent = data.name.charAt(0).toUpperCase();
            document.getElementById('editPassword').value = '';

            if (typeof showNotification === 'function') {
                showNotification('Profile updated successfully!', 'success');
            }
        } catch (err) {
            if (typeof showNotification === 'function') {
                showNotification(err.message || 'Update failed', 'error');
            }
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Changes';
        }
    });
});

