// ============================================
// QUANTUM BUILD — Admin Dashboard Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user || !user.isAdmin) {
        window.location.href = 'index.html';
        return;
    }

    initAdminNav();
    loadDashboard();
});

function initAdminNav() {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            switchAdminTab(tab);
        });
    });
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));

    const navItem = document.querySelector(`[data-tab="${tab}"]`);
    const panel = document.getElementById(`admin-${tab}`);
    if (navItem) navItem.classList.add('active');
    if (panel) panel.classList.add('active');

    if (tab === 'products') loadProducts();
    if (tab === 'orders') loadOrders();
    if (tab === 'users') loadUsers();
}

async function loadDashboard() {
    try {
        const [productsRes, ordersRes, usersRes] = await Promise.all([
            fetchWithAuth(`${API_BASE}/products`),
            fetchWithAuth(`${API_BASE}/orders`),
            fetchWithAuth(`${API_BASE}/users`),
        ]);

        const productsData = await productsRes.json();
        const orders = await ordersRes.json();
        const users = await usersRes.json();

        const products = productsData.products || productsData;

        document.getElementById('statProducts').textContent = Array.isArray(products) ? products.length : 0;
        document.getElementById('statOrders').textContent = Array.isArray(orders) ? orders.length : 0;
        document.getElementById('statUsers').textContent = Array.isArray(users) ? users.length : 0;

        let revenue = 0;
        if (Array.isArray(orders)) {
            orders.forEach(o => revenue += (o.totalPrice || 0));
        }
        document.getElementById('statRevenue').textContent = `₹${revenue.toLocaleString('en-IN')}`;
    } catch (err) {
        console.error('Dashboard load error:', err);
    }
}

async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">Loading...</td></tr>';

    try {
        const res = await fetchWithAuth(`${API_BASE}/products`);
        const data = await res.json();
        const products = data.products || data;

        if (!Array.isArray(products) || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">No products</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.brand || '—'}</td>
                <td>${p.category || p.partCategory || '—'}</td>
                <td>₹${(p.price || 0).toLocaleString('en-IN')}</td>
                <td>${p.countInStock ?? '—'}</td>
                <td>
                    <button class="table-action-btn danger" onclick="deleteProduct('${p._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">Error: ${err.message}</td></tr>`;
    }
}

async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">Loading...</td></tr>';

    try {
        const res = await fetchWithAuth(`${API_BASE}/orders`);
        const orders = await res.json();

        if (!Array.isArray(orders) || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">No orders yet</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(o => {
            const date = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const paid = o.isPaid ? '<span class="table-badge yes">Paid</span>' : '<span class="table-badge no">Unpaid</span>';
            const delivered = o.isDelivered ? '<span class="table-badge yes">Yes</span>' : '<span class="table-badge no">No</span>';

            return `
                <tr>
                    <td>#${o._id.slice(-8).toUpperCase()}</td>
                    <td>${o.user?.name || 'N/A'}</td>
                    <td>${date}</td>
                    <td>₹${(o.totalPrice || 0).toLocaleString('en-IN')}</td>
                    <td>${paid}</td>
                    <td>
                        ${!o.isDelivered ? `<button class="table-action-btn success" onclick="markDelivered('${o._id}')">Mark Delivered</button>` : delivered}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">Error: ${err.message}</td></tr>`;
    }
}

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">Loading...</td></tr>';

    try {
        const res = await fetchWithAuth(`${API_BASE}/users`);
        const users = await res.json();

        if (!Array.isArray(users) || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">No users</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => {
            const role = u.isAdmin ? '<span class="table-badge admin">Admin</span>' : '<span class="table-badge user">User</span>';
            return `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td>${role}</td>
                    <td>${new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                        ${!u.isAdmin ? `<button class="table-action-btn danger" onclick="deleteUserAdmin('${u._id}')">Delete</button>` : '—'}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;">Error: ${err.message}</td></tr>`;
    }
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try {
        const res = await fetchWithAuth(`${API_BASE}/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        showNotification('Product deleted', 'success');
        loadProducts();
        loadDashboard();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

async function markDelivered(id) {
    try {
        const res = await fetchWithAuth(`${API_BASE}/orders/${id}/deliver`, { method: 'PUT' });
        if (!res.ok) throw new Error('Failed to update');
        showNotification('Order marked as delivered', 'success');
        loadOrders();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}

async function deleteUserAdmin(id) {
    if (!confirm('Delete this user?')) return;
    try {
        const res = await fetchWithAuth(`${API_BASE}/users/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        showNotification('User removed', 'success');
        loadUsers();
        loadDashboard();
    } catch (err) {
        showNotification(err.message, 'error');
    }
}
