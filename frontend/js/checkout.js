// ============================================
// QUANTUM BUILD — Checkout Page Logic
// Multi-step: Shipping → Payment → Review → Place Order
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Require login
    if (!isLoggedIn()) {
        window.location.href = 'login.html?redirect=checkout.html';
        return;
    }

    // Require cart items
    const cart = getCart();
    if (!cart || cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    initCheckout();
});

let currentStep = 1;

function initCheckout() {
    updateStepUI();
    renderOrderSummary();

    // Payment method selection
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            opt.querySelector('input[type="radio"]').checked = true;
        });
    });
}

function goToStep(step) {
    if (step < 1) step = 1;
    if (step > 4) step = 4;

    // Validate current step before moving forward
    if (step > currentStep) {
        if (currentStep === 1 && !validateShipping()) return;
        if (currentStep === 2 && !validatePayment()) return;
        if (currentStep === 3) {
            placeOrder();
            return;
        }
    }

    currentStep = step;
    updateStepUI();

    if (step === 3) renderReview();
}

function updateStepUI() {
    // Update step indicators
    document.querySelectorAll('.checkout-step').forEach((s, i) => {
        s.classList.remove('active', 'completed');
        if (i + 1 === currentStep) s.classList.add('active');
        if (i + 1 < currentStep) s.classList.add('completed');
    });

    // Show correct panel
    document.querySelectorAll('.checkout-panel').forEach(p => p.classList.remove('active'));
    const activePanel = document.getElementById(`step${currentStep}`);
    if (activePanel) activePanel.classList.add('active');
}

function validateShipping() {
    const fields = ['fullName', 'address', 'city', 'state', 'postalCode', 'phone'];
    let valid = true;

    fields.forEach(f => {
        const input = document.getElementById(f);
        const val = input.value.trim();
        input.classList.remove('error');

        if (!val) {
            input.classList.add('error');
            valid = false;
        }
    });

    // Phone validation
    const phone = document.getElementById('phone').value.trim();
    if (phone && !/^\d{10}$/.test(phone)) {
        document.getElementById('phone').classList.add('error');
        valid = false;
    }

    // Postal code validation
    const postal = document.getElementById('postalCode').value.trim();
    if (postal && !/^\d{6}$/.test(postal)) {
        document.getElementById('postalCode').classList.add('error');
        valid = false;
    }

    if (!valid && typeof showNotification === 'function') {
        showNotification('Please fill in all required fields', 'error');
    }

    return valid;
}

function validatePayment() {
    const selected = document.querySelector('.payment-option.selected');
    if (!selected) {
        if (typeof showNotification === 'function') {
            showNotification('Please select a payment method', 'error');
        }
        return false;
    }
    return true;
}

function renderReview() {
    const cart = getCart();
    const allProducts = [];
    if (typeof PRODUCTS !== 'undefined') allProducts.push(...PRODUCTS);
    if (typeof PARTS !== 'undefined') allProducts.push(...PARTS);

    const reviewItemsEl = document.getElementById('reviewItems');
    let subtotal = 0;

    reviewItemsEl.innerHTML = cart.map(item => {
        const product = allProducts.find(p =>
            String(p.id) === String(item.id) || p.name === item.name
        );
        const name = product ? product.name : (item.name || 'Product');
        const price = product ? product.price : (item.price || 0);
        const qty = item.qty || 1;
        subtotal += price * qty;

        return `
            <div class="review-item">
                <span class="review-item-name">${name}</span>
                <span class="review-item-qty">×${qty}</span>
                <span class="review-item-price">₹${(price * qty).toLocaleString('en-IN')}</span>
            </div>
        `;
    }).join('');

    // Shipping info
    const shippingInfo = document.getElementById('reviewShipping');
    shippingInfo.innerHTML = `
        ${document.getElementById('fullName').value}<br>
        ${document.getElementById('address').value}<br>
        ${document.getElementById('city').value}, ${document.getElementById('state').value} ${document.getElementById('postalCode').value}<br>
        📞 ${document.getElementById('phone').value}
    `;

    // Payment info
    const paymentEl = document.querySelector('.payment-option.selected .payment-name');
    document.getElementById('reviewPayment').textContent = paymentEl ? paymentEl.textContent : 'Not selected';
}

function renderOrderSummary() {
    const cart = getCart();
    const allProducts = [];
    if (typeof PRODUCTS !== 'undefined') allProducts.push(...PRODUCTS);
    if (typeof PARTS !== 'undefined') allProducts.push(...PARTS);

    let subtotal = 0;
    let itemCount = 0;

    cart.forEach(item => {
        const product = allProducts.find(p =>
            String(p.id) === String(item.id) || p.name === item.name
        );
        const price = product ? product.price : (item.price || 0);
        const qty = item.qty || 1;
        subtotal += price * qty;
        itemCount += qty;
    });

    const shipping = subtotal > 50000 ? 0 : 499;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    document.getElementById('coSubtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    document.getElementById('coShipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
    document.getElementById('coTax').textContent = `₹${tax.toLocaleString('en-IN')}`;
    document.getElementById('coTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
    document.getElementById('coItemCount').textContent = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
}

async function placeOrder() {
    const cart = getCart();
    const allProducts = [];
    if (typeof PRODUCTS !== 'undefined') allProducts.push(...PRODUCTS);
    if (typeof PARTS !== 'undefined') allProducts.push(...PARTS);

    const orderItems = cart.map(item => {
        const product = allProducts.find(p =>
            String(p.id) === String(item.id) || p.name === item.name
        );
        return {
            name: product ? product.name : (item.name || 'Product'),
            qty: item.qty || 1,
            image: product ? product.image : (item.image || '/assets/images/placeholder.png'),
            price: product ? product.price : (item.price || 0),
            product: String(item.id),
        };
    });

    let itemsTotal = 0;
    orderItems.forEach(i => itemsTotal += i.price * i.qty);
    const shippingPrice = itemsTotal > 50000 ? 0 : 499;
    const taxPrice = Math.round(itemsTotal * 0.18);
    const totalPrice = itemsTotal + shippingPrice + taxPrice;

    const paymentEl = document.querySelector('.payment-option.selected .payment-name');

    const orderData = {
        orderItems,
        shippingAddress: {
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            postalCode: document.getElementById('postalCode').value,
            country: 'India',
        },
        paymentMethod: paymentEl ? paymentEl.textContent : 'COD',
        itemsPrice: itemsTotal,
        shippingPrice,
        taxPrice,
        totalPrice,
    };

    const placeBtn = document.querySelector('#step3 .btn-next');
    if (placeBtn) {
        placeBtn.disabled = true;
        placeBtn.textContent = 'PLACING ORDER...';
    }

    try {
        const response = await fetchWithAuth(`${API_BASE}/orders`, {
            method: 'POST',
            body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Order failed');

        // Clear cart
        saveCart([]);
        updateCartCount();

        // Show success
        currentStep = 4;
        updateStepUI();
        document.getElementById('step4').classList.add('active');
        document.getElementById('orderId').textContent = data._id;
        document.getElementById('cartSummaryPanel').style.display = 'none';

    } catch (err) {
        if (typeof showNotification === 'function') {
            showNotification(err.message || 'Failed to place order', 'error');
        }
        if (placeBtn) {
            placeBtn.disabled = false;
            placeBtn.textContent = '✓ PLACE ORDER';
        }
    }
}
