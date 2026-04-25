// ============================================================
// QUANTUM BUILD — Reset Password Logic
// Token comes from URL: /reset-password.html?token=xxx
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    const form = document.getElementById('resetForm');
    const invalidBlock = document.getElementById('invalidToken');
    const submitBtn = document.getElementById('submitBtn');
    const authAlert = document.getElementById('authAlert');
    const pwInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const strengthBar = document.getElementById('strengthBar');
    const strengthLabel = document.getElementById('strengthLabel');

    if (!token) {
        form.style.display = 'none';
        invalidBlock.style.display = 'block';
        return;
    }

    // Password toggle
    document.getElementById('pwToggle').addEventListener('click', () => {
        const isPass = pwInput.type === 'password';
        pwInput.type = isPass ? 'text' : 'password';
        document.getElementById('pwToggle').textContent = isPass ? '🙈' : '👁';
    });

    // Strength meter
    pwInput.addEventListener('input', () => {
        const val = pwInput.value;
        let score = 0;
        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        const levels = [
            { width: '0%', color: 'transparent', label: '' },
            { width: '25%', color: '#ef4444', label: 'Weak' },
            { width: '50%', color: '#f59e0b', label: 'Fair' },
            { width: '75%', color: '#3b82f6', label: 'Good' },
            { width: '100%', color: '#10b981', label: 'Strong' },
        ];
        const level = levels[score];
        strengthBar.style.width = level.width;
        strengthBar.style.background = level.color;
        strengthLabel.textContent = level.label;
        strengthLabel.style.color = level.color;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearState();

        const password = pwInput.value;
        const confirm = confirmInput.value;
        let valid = true;

        if (!password || password.length < 8) {
            showFieldError('password', 'Password must be at least 8 characters');
            valid = false;
        }
        if (password !== confirm) {
            showFieldError('confirm', 'Passwords do not match');
            valid = false;
        }
        if (!valid) return;

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/users/resetpassword/${token}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Reset failed');

            // Auto-login with returned token
            if (data.token) saveUserInfo(data);

            showAlert('✓ Password reset successfully! Redirecting...', 'success');
            form.style.display = 'none';
            setTimeout(() => window.location.href = 'index.html', 1500);

        } catch (err) {
            if (err.message.toLowerCase().includes('invalid') || err.message.toLowerCase().includes('expired')) {
                form.style.display = 'none';
                invalidBlock.style.display = 'block';
            } else {
                showAlert(err.message, 'error');
            }
        } finally {
            setLoading(false);
        }
    });

    function showFieldError(field, msg) {
        const fieldId = field === 'confirm' ? 'confirmPassword' : field;
        document.getElementById(fieldId)?.classList.add('error');
        const errEl = document.getElementById(field === 'confirm' ? 'confirmError' : field + 'Error');
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
