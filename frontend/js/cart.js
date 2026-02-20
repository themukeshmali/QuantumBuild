// ============================================
// QUANTUM BUILD — Cart Page Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartSummaryEl = document.getElementById('cartSummary');
    const cartEmptyEl = document.getElementById('cartEmpty');
    const cart = getCart();

    if (!cart || cart.length === 0) {
        cartItemsEl.style.display = 'none';
        cartSummaryEl.style.display = 'none';
        cartEmptyEl.style.display = 'block';
        return;
    }

    cartEmptyEl.style.display = 'none';
    cartItemsEl.style.display = 'flex';
    cartSummaryEl.style.display = 'block';

    // Build product lookup from both data sources
    const allProducts = [];
    if (typeof PRODUCTS !== 'undefined') allProducts.push(...PRODUCTS);
    if (typeof PARTS !== 'undefined') allProducts.push(...PARTS);

    let subtotal = 0;
    let originalTotal = 0;
    let itemCount = 0;

    cartItemsEl.innerHTML = cart.map(cartItem => {
        const product = allProducts.find(p =>
            String(p.id) === String(cartItem.id) || p.name === cartItem.name
        );

        const name = product ? product.name : (cartItem.name || 'Unknown Product');
        const brand = product ? product.brand : (cartItem.brand || '');
        const price = product ? product.price : (cartItem.price || 0);
        const originalPrice = product ? (product.originalPrice || product.price) : (cartItem.originalPrice || price);
        const qty = cartItem.qty || 1;
        const category = product ? (product.partCategory || product.category || '') : '';

        subtotal += price * qty;
        originalTotal += originalPrice * qty;
        itemCount += qty;

        const categoryIcons = {
            cpu: '🔲', gpu: '🎮', motherboard: '📟', ram: '💾', storage: '💿',
            psu: '⚡', case: '🖥️', cooling: '❄️', fans: '🌀', monitor: '🖥️',
            keyboard: '⌨️', mouse: '🖱️', headset: '🎧', thermal: '🧴', cables: '🔌',
            'Full Tower': '🖥️', 'Mid Tower': '🖥️', 'Mini PC': '🖥️', 'Small Form Factor': '🖥️'
        };
        const icon = categoryIcons[category] || '📦';

        return `
            <div class="cart-item" data-id="${cartItem.id}">
                <div class="cart-item-image">
                    <div class="cart-item-placeholder">${icon}</div>
                </div>
                <div class="cart-item-details">
                    <span class="cart-item-brand">${brand}</span>
                    <span class="cart-item-name">${name}</span>
                    <span class="cart-item-price">₹${price.toLocaleString('en-IN')}</span>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="changeQty('${cartItem.id}', -1)">−</button>
                        <span class="qty-value">${qty}</span>
                        <button class="qty-btn" onclick="changeQty('${cartItem.id}', 1)">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="removeItem('${cartItem.id}')">✕ Remove</button>
                </div>
            </div>
        `;
    }).join('');

    // Summary
    const shipping = subtotal > 50000 ? 0 : 499;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;
    const savings = originalTotal - subtotal;

    document.getElementById('summarySubtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    document.getElementById('summaryShipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`;
    document.getElementById('summaryTax').textContent = `₹${tax.toLocaleString('en-IN')}`;
    document.getElementById('summaryTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
    document.getElementById('summaryItemCount').textContent = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;

    const savingsEl = document.getElementById('summarySavings');
    if (savings > 0) {
        savingsEl.style.display = 'block';
        savingsEl.textContent = `🎉 You're saving ₹${savings.toLocaleString('en-IN')}!`;
    } else {
        savingsEl.style.display = 'none';
    }
}

function changeQty(productId, delta) {
    const cart = getCart();
    const item = cart.find(i => String(i.id) === String(productId));
    if (!item) return;

    item.qty = (item.qty || 1) + delta;
    if (item.qty <= 0) {
        removeItem(productId);
        return;
    }
    if (item.qty > 10) item.qty = 10;

    saveCart(cart);
    updateCartCount();
    renderCart();
}

function removeItem(productId) {
    removeFromCart(productId);
    updateCartCount();
    renderCart();
    if (typeof showNotification === 'function') {
        showNotification('Item removed from cart', 'info');
    }
}
