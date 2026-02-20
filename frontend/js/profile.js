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
    initProfileNav();

    // Check for #orders hash
    if (window.location.hash === '#orders') {
        switchTab('orders');
    }
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

        ordersEl.innerHTML = orders.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            let statusClass = 'pending';
            let statusText = 'Processing';
            if (order.isDelivered) {
                statusClass = 'delivered';
                statusText = 'Delivered';
            } else if (order.isPaid) {
                statusClass = 'processing';
                statusText = 'Shipped';
            }

            const items = order.orderItems.map(i =>
                `<span class="order-item-chip">${i.name} ×${i.qty}</span>`
            ).join('');

            return `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">#${order._id.slice(-8).toUpperCase()}</span>
                        <span class="order-date">${date}</span>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-items-summary">${items}</div>
                    <div class="order-footer">
                        <span class="order-total">₹${order.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            `;
        }).join('');

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

// Profile Update Form
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const password = document.getElementById('editPassword').value;

        const updates = { name, email };
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
