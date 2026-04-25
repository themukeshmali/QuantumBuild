// ============================================================
// QUANTUM BUILD — Coupon Manager
// Coupons are managed via backend API
// ============================================================

let couponsLoaded = false;
let currentCoupons = [];

async function loadCouponsPanel(force = false) {
    if (couponsLoaded && !force) return;
    try {
        currentCoupons = await apiGetCoupons();
        couponsLoaded = true;
        renderCouponsGrid();
    } catch (e) {
        notify('Failed to load coupons', 'error');
    }
}

function renderCouponsGrid() {
    const grid = document.getElementById('couponsGrid');
    if (!grid) return;

    if (!currentCoupons.length) {
        grid.innerHTML = '<div class="empty-state" style="padding:40px;grid-column:1/-1;"><div class="empty-state-icon">🏷️</div><div class="empty-state-text">No coupons yet. Click + Add Coupon to create one.</div></div>';
        return;
    }

    grid.innerHTML = currentCoupons.map(coupon => `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:20px;position:relative;overflow:hidden;transition:border-color 0.15s;" onmouseover="this.style.borderColor='var(--border-hover)'" onmouseout="this.style.borderColor='var(--border)'">
            <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent-red),#ff2d5a);"></div>
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
                <div>
                    <div style="font-family:var(--font-mono);font-size:1.1rem;font-weight:700;color:var(--text-primary);letter-spacing:2px;">
                        ${coupon.code}
                        ${!coupon.isActive ? '<span style="font-size:0.7rem;color:var(--text-muted);background:var(--bg-elevated);padding:2px 6px;border-radius:4px;margin-left:8px;">INACTIVE</span>' : ''}
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${coupon.label || ''}</div>
                </div>
                <div style="background:var(--accent-red-dim);color:var(--accent-red);font-weight:700;font-size:1.1rem;padding:6px 12px;border-radius:var(--radius-sm);white-space:nowrap;">${coupon.discount}% OFF</div>
            </div>
            <div style="display:flex;gap:8px;margin-top:16px;">
                <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="copyToClipboard('${coupon.code}')">📋 Copy</button>
                <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="openCouponModal('${coupon._id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCoupon('${coupon._id}', '${coupon.code}')">🗑</button>
            </div>
        </div>
    `).join('');
}

function openCouponModal(id = null) {
    const overlay = document.getElementById('couponModalOverlay');
    const titleEl = document.getElementById('couponModalTitle');
    const errorEl = document.getElementById('couponFormError');

    document.getElementById('couponCode').value = '';
    document.getElementById('couponDiscount').value = '';
    document.getElementById('couponLabel').value = '';
    document.getElementById('couponEditCode').value = '';
    // Optional: Add an isActive checkbox to the HTML if you want to toggle status. Assuming we haven't yet, so we skip it.
    errorEl.classList.remove('visible');

    if (id) {
        const coupon = currentCoupons.find(c => c._id === id);
        if (coupon) {
            titleEl.textContent = 'Edit Coupon';
            document.getElementById('couponEditCode').value = id;
            document.getElementById('couponCode').value = coupon.code;
            document.getElementById('couponDiscount').value = coupon.discount;
            document.getElementById('couponLabel').value = coupon.label || '';
        }
    } else {
        titleEl.textContent = 'Add Coupon';
    }

    overlay.classList.add('open');
}

function closeCouponModal() {
    document.getElementById('couponModalOverlay').classList.remove('open');
    document.getElementById('couponCode').disabled = false;
}

async function saveCoupon() {
    const errorEl = document.getElementById('couponFormError');
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const discount = parseInt(document.getElementById('couponDiscount').value);
    const label = document.getElementById('couponLabel').value.trim();

    if (!code || !/^[A-Z0-9_]{2,20}$/.test(code)) {
        errorEl.textContent = 'Coupon code must be 2-20 uppercase letters/numbers.';
        errorEl.classList.add('visible');
        return;
    }
    if (!discount || discount < 1 || discount > 90) {
        errorEl.textContent = 'Discount must be between 1% and 90%.';
        errorEl.classList.add('visible');
        return;
    }

    const id = document.getElementById('couponEditCode').value;
    const btn = document.querySelector('#couponModalOverlay .btn-primary');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        if (id) {
            await apiUpdateCoupon(id, { code, discount, label });
            notify(`Coupon "${code}" updated!`, 'success');
        } else {
            await apiCreateCoupon({ code, discount, label });
            notify(`Coupon "${code}" created!`, 'success');
        }
        closeCouponModal();
        await loadCouponsPanel(true);
    } catch (e) {
        errorEl.textContent = e.message || 'Failed to save coupon';
        errorEl.classList.add('visible');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Coupon';
    }
}

function deleteCoupon(id, code) {
    qbConfirm(
        `Delete coupon "${code}"? Customers using this code will no longer get the discount.`,
        'Delete Coupon',
        async () => {
            try {
                await apiDeleteCoupon(id);
                notify(`Coupon "${code}" deleted`, 'success');
                loadCouponsPanel(true);
            } catch (e) {
                notify(e.message || 'Failed to delete coupon', 'error');
            }
        }
    );
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        notify(`Copied "${text}" to clipboard!`, 'success');
    }).catch(() => {
        notify('Copy failed — please copy manually.', 'error');
    });
}

// Close coupon modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('couponModalOverlay');
    if (overlay) {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeCouponModal();
        });
    }
});
