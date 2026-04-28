// ============================================================
// QUANTUM BUILD — Forgot Password (OTP Flow)
// Step 1: Enter Email  → POST /api/users/forgotpassword
// Step 2: Enter OTP    → POST /api/users/verifyotp
// Step 3: New Password → PUT  /api/users/resetpassword
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (isLoggedIn()) { window.location.href = 'index.html'; return; }

    // ── DOM refs ──────────────────────────────────────────────
    const authAlert   = document.getElementById('authAlert');
    const devOtpHint  = document.getElementById('devOtpHint');
    const devOtpValue = document.getElementById('devOtpValue');

    // Step 1
    const emailForm   = document.getElementById('emailForm');
    const emailInput  = document.getElementById('email');
    const sendOtpBtn  = document.getElementById('sendOtpBtn');

    // Step 2
    const otpForm     = document.getElementById('otpForm');
    const emailDisplay= document.getElementById('emailDisplay');
    const otpCells    = Array.from(document.querySelectorAll('.otp-cell'));
    const verifyOtpBtn= document.getElementById('verifyOtpBtn');
    const resendText  = document.getElementById('resendText');
    const resendBtnWrap= document.getElementById('resendBtnWrap');
    const resendBtn   = document.getElementById('resendBtn');
    const countdownEl = document.getElementById('countdown');
    const backToEmailBtn = document.getElementById('backToEmailBtn');

    // Step 3
    const resetForm   = document.getElementById('resetForm');
    const pwInput     = document.getElementById('password');
    const confirmInput= document.getElementById('confirmPassword');
    const resetBtn    = document.getElementById('resetBtn');
    const strengthBar = document.getElementById('strengthBar');
    const strengthLabel= document.getElementById('strengthLabel');

    // ── State ────────────────────────────────────────────────
    let currentEmail = '';
    let sessionToken = '';
    let countdownTimer = null;

    // ── Step Navigation ──────────────────────────────────────
    function goToStep(n) {
        document.querySelectorAll('.step').forEach((s, i) => {
            s.classList.toggle('active', i + 1 === n);
        });
        // Update dots
        [1, 2, 3].forEach(i => {
            const dot = document.getElementById('dot' + i);
            dot.classList.remove('active', 'done');
            if (i < n) dot.classList.add('done'), dot.textContent = '✓';
            else if (i === n) dot.classList.add('active'), dot.textContent = i;
            else dot.textContent = i;
        });
        // Update lines
        [1, 2].forEach(i => {
            document.getElementById('line' + i).classList.toggle('done', n > i);
        });
        // Update subtitle
        const subtitles = [
            'Enter your email to receive a one-time code.',
            'Enter the 6-digit code sent to your email.',
            'Choose a strong new password.',
        ];
        document.getElementById('stepSubtitle').textContent = subtitles[n - 1];
        clearAlert();
    }

    // ── Alert helpers ────────────────────────────────────────
    function showAlert(msg, type) {
        authAlert.textContent = msg;
        authAlert.className = `auth-alert ${type}`;
    }
    function clearAlert() {
        authAlert.className = 'auth-alert';
        authAlert.textContent = '';
    }
    function setLoading(btn, loading) {
        btn.disabled = loading;
        btn.classList.toggle('loading', loading);
    }
    function showFieldError(fieldId, errId, msg) {
        document.getElementById(fieldId)?.classList.add('error');
        const errEl = document.getElementById(errId);
        if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
    }
    function clearFieldErrors() {
        document.querySelectorAll('.form-input, .otp-cell').forEach(el => el.classList.remove('error', 'error-cell'));
        document.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
    }

    // ─────────────────────────────────────────────────────────
    // STEP 1: Send OTP
    // ─────────────────────────────────────────────────────────
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFieldErrors();
        clearAlert();

        const email = emailInput.value.trim();
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            showFieldError('email', 'emailError', 'Please enter a valid email address');
            return;
        }

        setLoading(sendOtpBtn, true);
        try {
            const res = await fetch(`${API_BASE}/users/forgotpassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

            currentEmail = email;

            // Dev mode: show OTP on page
            if (data.otp) {
                devOtpValue.textContent = data.otp;
                devOtpHint.style.display = 'block';
            }

            emailDisplay.textContent = email;
            goToStep(2);
            startCountdown(60);
            otpCells[0].focus();

        } catch (err) {
            showAlert(err.message, 'error');
        } finally {
            setLoading(sendOtpBtn, false);
        }
    });

    // ─────────────────────────────────────────────────────────
    // STEP 2: OTP Input Logic
    // ─────────────────────────────────────────────────────────
    otpCells.forEach((cell, idx) => {
        cell.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (!cell.value && idx > 0) {
                    otpCells[idx - 1].value = '';
                    otpCells[idx - 1].classList.remove('filled');
                    otpCells[idx - 1].focus();
                }
                cell.classList.remove('filled');
            }
        });

        cell.addEventListener('input', () => {
            // Only allow digits
            cell.value = cell.value.replace(/\D/g, '').slice(-1);
            cell.classList.toggle('filled', !!cell.value);
            if (cell.value && idx < otpCells.length - 1) {
                otpCells[idx + 1].focus();
            }
        });

        cell.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            pasted.split('').slice(0, 6).forEach((ch, i) => {
                if (otpCells[i]) {
                    otpCells[i].value = ch;
                    otpCells[i].classList.toggle('filled', !!ch);
                }
            });
            otpCells[Math.min(pasted.length, 5)].focus();
        });
    });

    function getOtpValue() {
        return otpCells.map(c => c.value).join('');
    }

    function startCountdown(seconds) {
        clearInterval(countdownTimer);
        resendText.style.display = '';
        resendBtnWrap.style.display = 'none';
        let remaining = seconds;
        countdownEl.textContent = remaining;
        countdownTimer = setInterval(() => {
            remaining--;
            countdownEl.textContent = remaining;
            if (remaining <= 0) {
                clearInterval(countdownTimer);
                resendText.style.display = 'none';
                resendBtnWrap.style.display = '';
            }
        }, 1000);
    }

    resendBtn.addEventListener('click', async () => {
        resendBtn.disabled = true;
        clearAlert();
        try {
            const res = await fetch(`${API_BASE}/users/forgotpassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');

            if (data.otp) {
                devOtpValue.textContent = data.otp;
                devOtpHint.style.display = 'block';
            }

            showAlert('✓ New OTP sent! Check your email.', 'success');
            otpCells.forEach(c => { c.value = ''; c.classList.remove('filled', 'error-cell'); });
            otpCells[0].focus();
            startCountdown(60);
        } catch (err) {
            showAlert(err.message, 'error');
            resendBtn.disabled = false;
        }
    });

    backToEmailBtn.addEventListener('click', () => {
        clearInterval(countdownTimer);
        devOtpHint.style.display = 'none';
        otpCells.forEach(c => { c.value = ''; c.classList.remove('filled', 'error-cell'); });
        goToStep(1);
    });

    // Verify OTP submit
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert();
        const otp = getOtpValue();

        if (otp.length < 6) {
            otpCells.forEach(c => c.classList.add('error-cell'));
            showAlert('Please enter the complete 6-digit OTP', 'error');
            return;
        }

        setLoading(verifyOtpBtn, true);
        try {
            const res = await fetch(`${API_BASE}/users/verifyotp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Invalid OTP');

            sessionToken = data.sessionToken;
            clearInterval(countdownTimer);
            devOtpHint.style.display = 'none';
            goToStep(3);
            pwInput.focus();

        } catch (err) {
            otpCells.forEach(c => c.classList.add('error-cell'));
            showAlert(err.message, 'error');
        } finally {
            setLoading(verifyOtpBtn, false);
        }
    });

    // ─────────────────────────────────────────────────────────
    // STEP 3: New Password
    // ─────────────────────────────────────────────────────────
    document.getElementById('pwToggle').addEventListener('click', () => {
        const isPass = pwInput.type === 'password';
        pwInput.type = isPass ? 'text' : 'password';
        document.getElementById('pwToggle').textContent = isPass ? '🙈' : '👁';
    });

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
        strengthBar.style.width = levels[score].width;
        strengthBar.style.background = levels[score].color;
        strengthLabel.textContent = levels[score].label;
        strengthLabel.style.color = levels[score].color;
    });

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFieldErrors();
        clearAlert();

        const password = pwInput.value;
        const confirm  = confirmInput.value;
        let valid = true;

        if (!password || password.length < 8) {
            showFieldError('password', 'passwordError', 'Password must be at least 8 characters');
            valid = false;
        }
        if (password !== confirm) {
            showFieldError('confirmPassword', 'confirmError', 'Passwords do not match');
            valid = false;
        }
        if (!valid) return;

        setLoading(resetBtn, true);
        try {
            const res = await fetch(`${API_BASE}/users/resetpassword`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Reset failed');

            // Auto-login
            if (data.token) saveUserInfo(data);

            showAlert('✓ Password reset successfully! Redirecting...', 'success');
            resetForm.style.display = 'none';
            setTimeout(() => window.location.href = 'index.html', 1800);

        } catch (err) {
            showAlert(err.message, 'error');
            if (err.message.toLowerCase().includes('session')) {
                setTimeout(() => goToStep(1), 2000);
            }
        } finally {
            setLoading(resetBtn, false);
        }
    });
});
