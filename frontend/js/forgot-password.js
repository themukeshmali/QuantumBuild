// ============================================================
// QUANTUM BUILD — Forgot Password Page Logic
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotForm');
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('submitBtn');
    const authAlert = document.getElementById('authAlert');

    // Redirect if already logged in
    if (isLoggedIn()) window.location.href = 'index.html';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearState();

        const email = emailInput.value.trim();

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            showFieldError('email', 'Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/users/forgotpassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Request failed');

            if (data.resetUrl) {
                authAlert.innerHTML = `✓ Link generated (Dev Mode): <br><br><a href="${data.resetUrl}" style="color:#fff;text-decoration:underline;word-break:break-all;">Click here to reset your password</a>`;
                authAlert.className = 'auth-alert success';
            } else {
                showAlert('✓ Reset link sent! Check your email inbox (and spam folder).', 'success');
            }
            form.style.display = 'none';

        } catch (err) {
            showAlert(err.message, 'error');
        } finally {
            setLoading(false);
        }
    });

    function showFieldError(field, msg) {
        document.getElementById(field)?.classList.add('error');
        const errEl = document.getElementById(field + 'Error');
        if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
    }

    function clearState() {
        document.querySelectorAll('.form-input').forEach(i => i.classList.remove('error'));
        document.querySelectorAll('.form-error').forEach(e => e.classList.remove('visible'));
        authAlert.className = 'auth-alert';
        authAlert.textContent = '';
    }

    function showAlert(msg, type) {
        authAlert.textContent = msg;
        authAlert.className = `auth-alert ${type}`;
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtn.classList.toggle('loading', loading);
    }
});
