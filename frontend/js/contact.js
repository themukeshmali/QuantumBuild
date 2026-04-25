// ============================================
// QUANTUM BUILD — Contact Page JavaScript
// Form Validation & Submission
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initContactForm();
});

function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (validateForm()) {
            submitForm();
        }
    });

    // Real-time validation on blur
    const fields = ['name', 'email', 'subject', 'message'];
    fields.forEach(field => {
        const el = document.getElementById(field);
        if (el) {
            el.addEventListener('blur', () => validateField(field));
            el.addEventListener('input', () => {
                el.classList.remove('error');
                document.getElementById(field + 'Error').textContent = '';
            });
        }
    });
}

function validateForm() {
    let isValid = true;

    if (!validateField('name')) isValid = false;
    if (!validateField('email')) isValid = false;
    if (!validateField('subject')) isValid = false;
    if (!validateField('message')) isValid = false;

    return isValid;
}

function validateField(field) {
    const el = document.getElementById(field);
    const errorEl = document.getElementById(field + 'Error');
    let value = el.value.trim();
    let error = '';

    switch (field) {
        case 'name':
            if (!value) {
                error = 'Name is required';
            } else if (value.length < 2) {
                error = 'Name must be at least 2 characters';
            }
            break;

        case 'email':
            if (!value) {
                error = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                error = 'Please enter a valid email address';
            }
            break;

        case 'subject':
            if (!value) {
                error = 'Please select a subject';
            }
            break;

        case 'message':
            if (!value) {
                error = 'Message is required';
            } else if (value.length < 10) {
                error = 'Message must be at least 10 characters';
            }
            break;
    }

    if (error) {
        el.classList.add('error');
        errorEl.textContent = error;
        return false;
    } else {
        el.classList.remove('error');
        errorEl.textContent = '';
        return true;
    }
}

async function submitForm() {
    const btn = document.getElementById('submitBtn');
    const form = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');

    // Show loading state
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const contactData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        message: document.getElementById('message').value.trim(),
    };

    try {
        await apiSubmitContact(contactData);
        form.style.display = 'none';
        document.querySelector('.contact-form-wrap h2').style.display = 'none';
        success.style.display = 'block';

        if (typeof showNotification === 'function') {
            showNotification('Message sent successfully!');
        }
    } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Send Message';
        if (typeof showNotification === 'function') {
            showNotification(err.message || 'Failed to send message', 'error');
        }
    }
}
