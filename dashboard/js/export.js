// ============================================================
// QUANTUM BUILD — Export Utilities (CSV + Bulk Actions)
// exportOrdersCSV, exportUsersCSV, exportProductsCSV
// bulkDeleteProducts, toggleSelectAllProducts
// ============================================================

// ── Generic CSV Download ──────────────────────────────────────
function downloadCSV(filename, rows) {
    const csv = rows.map(row =>
        row.map(cell => {
            const s = String(cell ?? '').replace(/"/g, '""');
            return `"${s}"`;
        }).join(',')
    ).join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── Export Orders CSV ─────────────────────────────────────────
async function exportOrdersCSV() {
    try {
        notify('Preparing orders export…', 'info');
        const orders = allOrders.length ? allOrders : await apiGetOrders();

        const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Date', 'Items', 'Payment Method', 'Paid', 'Paid At', 'Delivered', 'Delivered At', 'Subtotal', 'Shipping', 'Tax', 'Total'];
        const rows = orders.map(o => [
            o._id,
            o.user?.name || 'Guest',
            o.user?.email || '',
            o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '',
            (o.orderItems || []).map(i => `${i.name} x${i.qty}`).join('; '),
            o.paymentMethod || '',
            o.isPaid ? 'Yes' : 'No',
            o.paidAt ? new Date(o.paidAt).toLocaleDateString('en-IN') : '',
            o.isDelivered ? 'Yes' : 'No',
            o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString('en-IN') : '',
            o.itemsPrice || '',
            o.shippingPrice || '',
            o.taxPrice || '',
            o.totalPrice || '',
        ]);

        const today = new Date().toISOString().slice(0, 10);
        downloadCSV(`QuantumBuild_Orders_${today}.csv`, [headers, ...rows]);
        notify(`✓ Exported ${orders.length} orders to CSV`, 'success');
    } catch (err) {
        notify('Export failed: ' + err.message, 'error');
    }
}

// ── Export Users CSV ──────────────────────────────────────────
async function exportUsersCSV() {
    try {
        notify('Preparing users export…', 'info');
        const users = allUsers.length ? allUsers : await apiGetUsers();

        const headers = ['User ID', 'Name', 'Email', 'Role', 'Joined'];
        const rows = users.map(u => [
            u._id,
            u.name,
            u.email,
            u.isAdmin ? 'Admin' : 'User',
            u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '',
        ]);

        const today = new Date().toISOString().slice(0, 10);
        downloadCSV(`QuantumBuild_Users_${today}.csv`, [headers, ...rows]);
        notify(`✓ Exported ${users.length} users to CSV`, 'success');
    } catch (err) {
        notify('Export failed: ' + err.message, 'error');
    }
}

// ── Export Products CSV ───────────────────────────────────────
async function exportProductsCSV() {
    try {
        notify('Preparing products export…', 'info');
        const source = allProducts.length ? allProducts : (await apiGetProducts({ pageSize: 1000 })).products || [];

        const headers = ['Product ID', 'Name', 'Brand', 'Category', 'Part Category', 'Price (₹)', 'Original Price (₹)', 'Stock', 'Rating', 'Reviews'];
        const rows = source.map(p => [
            p._id,
            p.name,
            p.brand || '',
            p.category || '',
            p.partCategory || '',
            p.price || 0,
            p.originalPrice || '',
            p.countInStock ?? 0,
            p.rating || 0,
            p.numReviews || 0,
        ]);

        const today = new Date().toISOString().slice(0, 10);
        downloadCSV(`QuantumBuild_Products_${today}.csv`, [headers, ...rows]);
        notify(`✓ Exported ${source.length} products to CSV`, 'success');
    } catch (err) {
        notify('Export failed: ' + err.message, 'error');
    }
}

// ── Bulk Delete Products ──────────────────────────────────────
let selectedProductIds = new Set();

function toggleSelectAllProducts(masterCheckbox) {
    const checkboxes = document.querySelectorAll('.product-row-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = masterCheckbox.checked;
        if (masterCheckbox.checked) {
            selectedProductIds.add(cb.dataset.id);
        } else {
            selectedProductIds.delete(cb.dataset.id);
        }
    });
    updateBulkDeleteBtn();
}

function onProductCheckboxChange(checkbox) {
    if (checkbox.checked) {
        selectedProductIds.add(checkbox.dataset.id);
    } else {
        selectedProductIds.delete(checkbox.dataset.id);
        // Uncheck master if any row is unchecked
        const master = document.getElementById('selectAllProducts');
        if (master) master.checked = false;
    }
    updateBulkDeleteBtn();
}

function updateBulkDeleteBtn() {
    const btn = document.getElementById('bulkDeleteProductsBtn');
    if (!btn) return;
    if (selectedProductIds.size > 0) {
        btn.style.display = '';
        btn.textContent = `🗑 Delete ${selectedProductIds.size} Selected`;
    } else {
        btn.style.display = 'none';
    }
}

async function bulkDeleteProducts() {
    if (selectedProductIds.size === 0) return;

    qbConfirm(
        `Permanently delete ${selectedProductIds.size} selected product${selectedProductIds.size > 1 ? 's' : ''}? This cannot be undone.`,
        'Bulk Delete Products',
        async () => {
            const ids = [...selectedProductIds];
            let successCount = 0;
            let failCount = 0;

            for (const id of ids) {
                try {
                    await apiDeleteProduct(id);
                    successCount++;
                } catch {
                    failCount++;
                }
            }

            selectedProductIds.clear();
            updateBulkDeleteBtn();
            const master = document.getElementById('selectAllProducts');
            if (master) master.checked = false;

            productsLoaded = false;
            await loadProductsPanel(true);
            overviewLoaded = false;

            if (successCount > 0) notify(`✓ Deleted ${successCount} product${successCount > 1 ? 's' : ''}`, 'success');
            if (failCount > 0) notify(`⚠ ${failCount} product${failCount > 1 ? 's' : ''} could not be deleted`, 'error');
        }
    );
}
