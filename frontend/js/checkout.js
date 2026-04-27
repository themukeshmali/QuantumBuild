// ============================================================
// QUANTUM BUILD — Checkout Page Logic (with Razorpay)
// Multi-step: Shipping → Payment → Review → Place Order
// COD uses direct API | UPI/Card/NetBanking use Razorpay
// ============================================================

// ── Coupon System ─────────────────────────────────────────────
let appliedCoupon = null; // { code, discount }

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
    showTestModeHint(); // Show test credentials if using rzp_test_ key

    // Payment method selection + UPI panel toggle
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            opt.querySelector('input[type="radio"]').checked = true;
            toggleUPIPanel();
        });
    });
}

// Show test-mode helper banner + auto-fill UPI when using a test Razorpay key
async function showTestModeHint() {
    try {
        const res = await fetchWithAuth(`${API_BASE}/payment/razorpay/key`);
        const data = await res.json();
        const key = data.key || '';
        if (key.startsWith('rzp_test_')) {
            const hint = document.getElementById('testModeHint');
            if (hint) hint.style.display = 'block';

            // Auto-fill UPI input with the working test UPI ID
            const upiInput = document.getElementById('upiId');
            if (upiInput && !upiInput.value) {
                upiInput.value = 'success@razorpay';
            }
        }
    } catch (e) {
        // Non-critical — silently ignore
    }
}

// Show/hide UPI ID input panel based on selection
function toggleUPIPanel() {
    const selected = document.querySelector('input[name="payment"]:checked');
    const panel = document.getElementById('upiInputPanel');
    if (!panel) return;
    if (selected && selected.value === 'UPI') {
        panel.style.display = 'block';
        panel.classList.add('upi-panel-visible');
    } else {
        panel.style.display = 'none';
        panel.classList.remove('upi-panel-visible');
    }
}

function goToStep(step) {
    if (step < 1) step = 1;
    if (step > 4) step = 4;

    // Validate current step before moving forward
    if (step > currentStep) {
        if (currentStep === 1 && !validateShipping()) return;
        if (currentStep === 2 && !validatePayment()) return;
        if (currentStep === 3) {
            handlePlaceOrder();
            return;
        }
    }

    currentStep = step;
    updateStepUI();

    if (step === 3) renderReview();
}

function updateStepUI() {
    document.querySelectorAll('.checkout-step').forEach((s, i) => {
        s.classList.remove('active', 'completed');
        if (i + 1 === currentStep) s.classList.add('active');
        if (i + 1 < currentStep) s.classList.add('completed');
    });

    document.querySelectorAll('.checkout-panel').forEach(p => p.classList.remove('active'));
    const activePanel = document.getElementById(`step${currentStep}`);
    if (activePanel) activePanel.classList.add('active');

    // Inject correct place-order button on step 3
    if (currentStep === 3) injectPlaceOrderButton();
}

// ── Payment Button Injection ─────────────────────────────
function injectPlaceOrderButton() {
    const wrap = document.getElementById('placeOrderBtnWrap');
    if (!wrap) return;

    const selected = document.querySelector('input[name="payment"]:checked');
    const method = selected ? selected.value : 'COD';

    if (method === 'COD') {
        wrap.innerHTML = `
            <button class="cod-place-btn btn-next" onclick="handlePlaceOrder()" id="placeOrderBtn">
                ✓ Place Order (Cash on Delivery)
            </button>`;
    } else if (method === 'UPI') {
        wrap.innerHTML = `
            <button class="upi-pay-btn" onclick="handlePlaceOrder()" id="placeOrderBtn">
                <span class="upi-pay-icon">📱</span>
                Pay via UPI
            </button>`;
    } else {
        wrap.innerHTML = `
            <button class="razorpay-pay-btn" onclick="handlePlaceOrder()" id="placeOrderBtn">
                <span class="rzp-icon">₹</span>
                Pay with Razorpay
            </button>`;
    }
}

function getSelectedPaymentMethod() {
    const el = document.querySelector('.payment-option.selected .payment-name');
    return el ? el.textContent.trim() : 'Cash on Delivery';
}

function getSelectedPaymentValue() {
    const el = document.querySelector('input[name="payment"]:checked');
    return el ? el.value : 'COD';
}

// ── Validation ───────────────────────────────────────────
function validateShipping() {
    const fields = ['fullName', 'address', 'city', 'state', 'postalCode', 'phone'];
    let valid = true;

    fields.forEach(f => {
        const input = document.getElementById(f);
        if (!input) return;
        const val = input.value.trim();
        input.classList.remove('error');
        if (!val) { input.classList.add('error'); valid = false; }
    });

    const phone = document.getElementById('phone')?.value.trim();
    if (phone && !/^\d{10}$/.test(phone)) {
        document.getElementById('phone').classList.add('error');
        valid = false;
    }

    const postal = document.getElementById('postalCode')?.value.trim();
    if (postal && !/^\d{6}$/.test(postal)) {
        document.getElementById('postalCode').classList.add('error');
        valid = false;
    }

    if (!valid && typeof showNotification === 'function') {
        showNotification('Please fill in all required shipping fields', 'error');
    }
    return valid;
}

function validatePayment() {
    const selected = document.querySelector('.payment-option.selected');
    if (!selected) {
        if (typeof showNotification === 'function') showNotification('Please select a payment method', 'error');
        return false;
    }

    // UPI ID validation
    const paymentValue = getSelectedPaymentValue();
    if (paymentValue === 'UPI') {
        const upiInput = document.getElementById('upiId');
        const upiId = upiInput ? upiInput.value.trim() : '';
        // Valid UPI ID format: anything@bankname
        const upiRegex = /^[a-zA-Z0-9.\-_+]+@[a-zA-Z]{3,}$/;
        if (!upiId) {
            if (upiInput) { upiInput.classList.add('error'); upiInput.focus(); }
            if (typeof showNotification === 'function') showNotification('Please enter your UPI ID (e.g. name@upi)', 'error');
            return false;
        }
        if (!upiRegex.test(upiId)) {
            if (upiInput) { upiInput.classList.add('error'); upiInput.focus(); }
            if (typeof showNotification === 'function') showNotification('Invalid UPI ID format. Example: yourname@okaxis', 'error');
            return false;
        }
        if (upiInput) upiInput.classList.remove('error');
    }

    return true;
}

// ── Review Step ──────────────────────────────────────────
function renderReview() {
    const cart = getCart();
    const allProducts = [];
    if (typeof PRODUCTS !== 'undefined') allProducts.push(...PRODUCTS);
    if (typeof PARTS !== 'undefined') allProducts.push(...PARTS);

    const reviewItemsEl = document.getElementById('reviewItems');
    let subtotal = 0;

    reviewItemsEl.innerHTML = cart.map(item => {
        const product = allProducts.find(p => String(p.id) === String(item.id) || p.name === item.name);
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

    const shippingInfo = document.getElementById('reviewShipping');
    shippingInfo.innerHTML = `
        ${document.getElementById('fullName').value}<br>
        ${document.getElementById('address').value}<br>
        ${document.getElementById('city').value}, ${document.getElementById('state').value} ${document.getElementById('postalCode').value}<br>
        📞 ${document.getElementById('phone').value}
    `;

    const paymentEl = document.querySelector('.payment-option.selected .payment-name');
    let paymentLabel = paymentEl ? paymentEl.textContent.trim() : 'Not selected';

    // Append UPI ID to review if UPI was selected
    if (getSelectedPaymentValue() === 'UPI') {
        const upiId = document.getElementById('upiId')?.value.trim();
        if (upiId) paymentLabel += ` — ${upiId}`;
    }
    document.getElementById('reviewPayment').textContent = paymentLabel;
}

function renderOrderSummary() {
    const cart = getCart();
    const allProducts = [];
    if (typeof PRODUCTS !== 'undefined') allProducts.push(...PRODUCTS);
    if (typeof PARTS !== 'undefined') allProducts.push(...PARTS);

    let subtotal = 0, itemCount = 0;
    cart.forEach(item => {
        const product = allProducts.find(p => String(p.id) === String(item.id) || p.name === item.name);
        const price = product ? product.price : (item.price || 0);
        const qty = item.qty || 1;
        subtotal += price * qty;
        itemCount += qty;
    });

    const shipping = subtotal > 50000 ? 0 : 499;
    const tax = Math.round(subtotal * 0.18);
    const discountAmt = appliedCoupon ? Math.round((subtotal + tax) * appliedCoupon.discount / 100) : 0;
    const total = subtotal + shipping + tax - discountAmt;

    document.getElementById('coSubtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    document.getElementById('coShipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`;
    document.getElementById('coTax').textContent = `₹${tax.toLocaleString('en-IN')}`;
    document.getElementById('coTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
    document.getElementById('coItemCount').textContent = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;

    // Coupon discount row
    const discountRow = document.getElementById('coDiscountRow');
    if (discountRow) {
        if (appliedCoupon && discountAmt > 0) {
            discountRow.style.display = 'flex';
            document.getElementById('coDiscount').textContent = `-₹${discountAmt.toLocaleString('en-IN')}`;
        } else {
            discountRow.style.display = 'none';
        }
    }
}

// ── Build Order Data ──────────────────────────────────────
function buildOrderData(paymentResult = null) {
    const cart = getCart();
    const allProducts = [];
    if (typeof PRODUCTS !== 'undefined') allProducts.push(...PRODUCTS);
    if (typeof PARTS !== 'undefined') allProducts.push(...PARTS);

    // Helper: check if an id looks like a MongoDB ObjectId (24 hex chars)
    const isObjectId = id => /^[a-f\d]{24}$/i.test(String(id));

    const orderItems = cart.map(item => {
        const product = allProducts.find(p => String(p.id) === String(item.id) || p.name === item.name);
        return {
            name: product ? product.name : (item.name || 'Product'),
            qty: item.qty || 1,
            image: product ? product.image : (item.image || ''),
            price: product ? product.price : (item.price || 0),
            // Only include product ref when it is a real DB ObjectId
            ...(isObjectId(item.id) ? { product: item.id } : {}),
        };
    });

    let itemsTotal = 0;
    orderItems.forEach(i => itemsTotal += i.price * i.qty);
    const shippingPrice = itemsTotal > 50000 ? 0 : 499;
    const taxPrice = Math.round(itemsTotal * 0.18);
    const discountAmt = appliedCoupon ? Math.round((itemsTotal + taxPrice) * appliedCoupon.discount / 100) : 0;
    const totalPrice = itemsTotal + shippingPrice + taxPrice - discountAmt;

    const paymentEl = document.querySelector('.payment-option.selected .payment-name');
    const method = paymentEl ? paymentEl.textContent.trim() : 'COD';

    return {
        orderItems,
        shippingAddress: {
            fullName: document.getElementById('fullName').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            postalCode: document.getElementById('postalCode').value,
            phone: document.getElementById('phone').value,
            country: 'India',
        },
        paymentMethod: method,
        itemsPrice: itemsTotal,
        shippingPrice,
        taxPrice,
        totalPrice,
        ...(appliedCoupon ? { couponCode: appliedCoupon.code, discount: discountAmt } : {}),
        ...(paymentResult && { paymentResult, isPaid: true, paidAt: new Date().toISOString() }),
    };
}

// ── Coupon Apply / Remove ─────────────────────────────────
async function applyCoupon() {
    const input = document.getElementById('couponInput');
    const msgEl = document.getElementById('couponMsg');
    const applyBtn = document.getElementById('couponApplyBtn');
    if (!input || !msgEl || !applyBtn) return;

    const code = input.value.trim().toUpperCase();
    if (!code) return;

    applyBtn.disabled = true;
    applyBtn.textContent = '...';

    try {
        const coupon = await apiValidateCoupon(code);
        
        appliedCoupon = { code: coupon.code, discount: coupon.discount };
        msgEl.textContent = `✅ ${coupon.label || coupon.code} applied!`;
        msgEl.className = 'coupon-msg success';
        input.disabled = true;
        
        applyBtn.textContent = 'Remove';
        applyBtn.onclick = removeCoupon;
        applyBtn.className = 'btn-coupon-remove';
        
        renderOrderSummary();
    } catch (e) {
        msgEl.textContent = `❌ ${e.message}`;
        msgEl.className = 'coupon-msg error';
    } finally {
        applyBtn.disabled = false;
        if (!appliedCoupon) applyBtn.textContent = 'Apply';
    }
}

function removeCoupon() {
    appliedCoupon = null;
    const input = document.getElementById('couponInput');
    const msgEl = document.getElementById('couponMsg');
    if (input) { input.value = ''; input.disabled = false; }
    if (msgEl) { msgEl.textContent = ''; msgEl.className = 'coupon-msg'; }
    const applyBtn = document.getElementById('couponApplyBtn');
    if (applyBtn) {
        applyBtn.textContent = 'Apply';
        applyBtn.onclick = applyCoupon;
        applyBtn.className = 'btn-coupon-apply';
    }
    renderOrderSummary();
}

// ── Place Order Router ────────────────────────────────────
async function handlePlaceOrder() {
    const method = getSelectedPaymentValue();

    if (method === 'COD') {
        await placeCODOrder();
    } else {
        await initiateRazorpay();
    }
}

// ── COD Order ─────────────────────────────────────────────
async function placeCODOrder() {
    const btn = document.getElementById('placeOrderBtn');
    setPlaceBtnLoading(true);

    try {
        const orderData = buildOrderData();
        const response = await fetchWithAuth(`${API_BASE}/orders`, {
            method: 'POST',
            body: JSON.stringify(orderData),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Order failed');

        onOrderSuccess(data._id);

    } catch (err) {
        if (typeof showNotification === 'function') {
            showNotification(err.message || 'Failed to place order', 'error');
        }
        setPlaceBtnLoading(false);
    }
}

// ── Razorpay Order ────────────────────────────────────────
async function initiateRazorpay() {
    setPlaceBtnLoading(true);

    try {
        // 1. Create Razorpay order on backend
        const orderData = buildOrderData();
        const realAmountPaise = Math.round(orderData.totalPrice * 100); // Razorpay uses paise

        // Get Razorpay key first to detect test mode
        const rzpKey = await getRazorpayKey();
        const isTestMode = rzpKey && rzpKey.startsWith('rzp_test_');

        // ⚠️ TEST MODE SAFETY CAP:
        // Razorpay test gateway rejects amounts > ₹50,000 for UPI/most methods.
        // In test mode we send ₹1 (100 paise) so the flow completes successfully.
        // Real money is NEVER charged in test mode regardless.
        const amountPaise = isTestMode ? 100 : realAmountPaise;

        const rzpOrderRes = await fetchWithAuth(`${API_BASE}/payment/razorpay/order`, {
            method: 'POST',
            body: JSON.stringify({ amount: amountPaise, currency: 'INR' }),
        });

        const rzpOrder = await rzpOrderRes.json();
        if (!rzpOrderRes.ok) throw new Error(rzpOrder.message || 'Could not create payment order');

        // 2. Load Razorpay script dynamically (if not already loaded)
        await loadRazorpayScript();

        // 3. Detect payment method
        const paymentValue = getSelectedPaymentValue();
        const isUPI = paymentValue === 'UPI';
        const upiId = isUPI ? (document.getElementById('upiId')?.value.trim() || '') : '';

        // 4. Open Razorpay checkout
        const user = getCurrentUser();

        // We store rzp reference so we can close it before async processing
        // (prevents the blank-page redirect that happens when handler is async)
        let rzpInstance = null;

        const options = {
            key: rzpKey,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            name: 'Quantum Build',
            description: isTestMode
                ? `TEST MODE — Order for ${orderData.orderItems.length} item(s) (₹${orderData.totalPrice.toLocaleString('en-IN')})`
                : `Order for ${orderData.orderItems.length} item(s)`,
            order_id: rzpOrder.id,
            prefill: {
                name: document.getElementById('fullName')?.value || user?.name || '',
                email: user?.email || '',
                contact: document.getElementById('phone')?.value || '',
                ...(isUPI && upiId ? { vpa: upiId } : {}),
            },
            // Explicitly enable payment methods using Razorpay config blocks
            config: {
                display: {
                    blocks: {
                        upi: {
                            name: "Pay via UPI",
                            instruments: [{ method: "upi" }]
                        },
                        card: {
                            name: "Pay via Card",
                            instruments: [{ method: "card" }]
                        },
                        netbanking: {
                            name: "Pay via Netbanking",
                            instruments: [{ method: "netbanking" }]
                        },
                        wallet: {
                            name: "Pay via Wallet",
                            instruments: [{ method: "wallet" }]
                        }
                    },
                    sequence: ['block.upi', 'block.card', 'block.netbanking', 'block.wallet'],
                    preferences: { show_default_blocks: true }
                }
            },
            theme: { color: '#d4003a' },
            modal: {
                ondismiss: () => {
                    setPlaceBtnLoading(false);
                    if (typeof showNotification === 'function') {
                        showNotification('Payment cancelled. Your cart is still saved.', 'warning');
                    }
                },
                // Prevent Razorpay from redirecting to about:blank after OTP
                escape: false,
                animation: true,
            },
            // ⚠️ CRITICAL: handler must be synchronous.
            // If handler is async, Razorpay SDK doesn't await it and
            // immediately redirects the page to about:blank (blank page bug).
            // Instead, we close the modal first and then run async logic.
            handler: function(response) {
                // Close the Razorpay modal immediately to prevent blank page
                if (rzpInstance) {
                    rzpInstance.close();
                }
                // Run the async verification as a separate promise chain
                // Pass actual order total (not test capped amount) for the DB record
                verifyAndCreateOrder(orderData, response);
            },
        };

        rzpInstance = new window.Razorpay(options);

        // Listen for payment failure events to show proper error messages
        rzpInstance.on('payment.failed', function(response) {
            setPlaceBtnLoading(false);
            const reason = response.error?.description || response.error?.reason || 'Payment failed';
            if (typeof showNotification === 'function') {
                showNotification(`Payment failed: ${reason}`, 'error');
            }
        });

        rzpInstance.open();

    } catch (err) {
        if (typeof showNotification === 'function') {
            showNotification(err.message || 'Payment initialization failed', 'error');
        }
        setPlaceBtnLoading(false);
    }
}

async function verifyAndCreateOrder(orderData, rzpResponse) {
    try {
        // Verify payment signature
        const verifyRes = await fetchWithAuth(`${API_BASE}/payment/razorpay/verify`, {
            method: 'POST',
            body: JSON.stringify({
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
            }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) throw new Error('Payment verification failed');

        // Create the order with payment result merged into the existing orderData
        const fullOrderData = {
            ...orderData,
            isPaid: true,
            paidAt: new Date().toISOString(),
            paymentResult: {
                id: rzpResponse.razorpay_payment_id,
                status: 'completed',
                update_time: new Date().toISOString(),
                email_address: getCurrentUser()?.email || '',
            },
        };
        const orderRes = await fetchWithAuth(`${API_BASE}/orders`, {
            method: 'POST',
            body: JSON.stringify(fullOrderData),
        });

        const order = await orderRes.json();
        if (!orderRes.ok) throw new Error(order.message || 'Order creation failed');

        onOrderSuccess(order._id);

    } catch (err) {
        if (typeof showNotification === 'function') {
            showNotification(err.message || 'Order creation failed after payment. Contact support.', 'error');
        }
        setPlaceBtnLoading(false);
    }
}

// ── Success ───────────────────────────────────────────────
function onOrderSuccess(orderId) {
    // Clear cart
    saveCart([]);
    updateCartCount();

    // Show success step
    currentStep = 4;
    updateStepUI();
    document.getElementById('step4').classList.add('active');
    document.getElementById('orderId').textContent = orderId;

    // Link to order detail
    const viewBtn = document.getElementById('viewOrderBtn');
    if (viewBtn) viewBtn.href = `order-detail.html?id=${orderId}`;

    document.getElementById('cartSummaryPanel').style.display = 'none';
}

// ── Helpers ───────────────────────────────────────────────
function setPlaceBtnLoading(loading) {
    const btn = document.getElementById('placeOrderBtn');
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
        btn.dataset.origText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-spinner" style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;"></span> Processing...';
    } else {
        if (btn.dataset.origText) btn.innerHTML = btn.dataset.origText;
    }
}

function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Razorpay. Check your connection.'));
        document.head.appendChild(script);
    });
}

async function getRazorpayKey() {
    try {
        const res = await fetchWithAuth(`${API_BASE}/payment/razorpay/key`);
        const data = await res.json();
        return data.key;
    } catch {
        return window.RAZORPAY_KEY || '';
    }
}

// ── UPI Helpers ───────────────────────────────────────────

/**
 * Prefill the UPI ID input with a template suffix
 * Called by the bank shortcut buttons
 */
function prefillUPI(template) {
    const input = document.getElementById('upiId');
    if (!input) return;
    input.value = template;
    input.focus();
    // Move cursor to start so user can type their name
    input.setSelectionRange(0, template.indexOf('@'));
}

/**
 * Client-side UPI ID format validation with immediate visual feedback.
 * Real verification happens server-side via Razorpay at payment time.
 */
function verifyUPIId() {
    const input  = document.getElementById('upiId');
    const msgEl  = document.getElementById('upiVerifyMsg');
    const btn    = document.querySelector('.upi-verify-btn');
    if (!input || !msgEl) return;

    const upiId = input.value.trim().toLowerCase();

    // Basic format check: <user>@<handle>  e.g. john@okaxis
    const upiRegex = /^[a-zA-Z0-9.\-_+]{2,}@[a-zA-Z]{3,}$/;

    if (!upiId) {
        msgEl.textContent = 'Please enter your UPI ID';
        msgEl.className = 'upi-verify-msg error';
        input.classList.add('error');
        return;
    }

    if (!upiRegex.test(upiId)) {
        msgEl.textContent = '✗ Invalid format — use: yourname@upihandle';
        msgEl.className = 'upi-verify-msg error';
        input.classList.add('error');
        return;
    }

    // Valid — show success state
    input.classList.remove('error');
    input.classList.add('verified');
    msgEl.textContent = '✓ UPI ID looks good! Payment will be confirmed on the next screen.';
    msgEl.className = 'upi-verify-msg success';

    if (btn) {
        btn.textContent  = '✓ Verified';
        btn.disabled     = true;
        btn.classList.add('verified');
    }
}

// Live formatter: lowercase + strip spaces as user types
document.addEventListener('DOMContentLoaded', () => {
    const upiInput = document.getElementById('upiId');
    if (!upiInput) return;
    upiInput.addEventListener('input', () => {
        const pos = upiInput.selectionStart;
        upiInput.value = upiInput.value.replace(/\s/g, '').toLowerCase();
        upiInput.setSelectionRange(pos, pos);

        // Reset verify state on edit
        const msgEl = document.getElementById('upiVerifyMsg');
        const btn   = document.querySelector('.upi-verify-btn');
        upiInput.classList.remove('verified');
        if (msgEl)  { msgEl.textContent = ''; msgEl.className = 'upi-verify-msg'; }
        if (btn)    { btn.textContent = 'Verify'; btn.disabled = false; btn.classList.remove('verified'); }
    });
});

