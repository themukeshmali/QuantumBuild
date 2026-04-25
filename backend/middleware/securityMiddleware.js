import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

// ── 1. Helmet — HTTP Security Headers ────────────────────────
export const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:    ["'self'"],
            scriptSrc:     ["'self'", "'unsafe-inline'", "checkout.razorpay.com", "cdn.razorpay.com"],
            // Allow inline onclick/onsubmit event handlers used in checkout.html and other pages
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc:      ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            fontSrc:       ["'self'", "fonts.gstatic.com", "data:"],
            imgSrc:        ["'self'", "data:", "res.cloudinary.com", "*.cloudinary.com", "maps.google.com", "maps.gstatic.com"],
            connectSrc:    ["'self'", "api.razorpay.com"],
            frameSrc:      ["'self'", "maps.google.com", "api.razorpay.com", "checkout.razorpay.com"],
            objectSrc:     ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// ── 2. MongoDB Sanitize — NoSQL Injection Prevention ─────────
export const mongoSanitizeMiddleware = mongoSanitize({ replaceWith: '_' });

// ── 3. XSS Sanitizer — Recursive Input Cleaning ──────────────
function sanitizeValue(value) {
    if (typeof value === 'string') {
        return xss(value, {
            whiteList: {},
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script', 'style'],
        });
    }
    if (Array.isArray(value))          return value.map(sanitizeValue);
    if (value && typeof value === 'object') {
        const out = {};
        for (const k of Object.keys(value)) out[k] = sanitizeValue(value[k]);
        return out;
    }
    return value;
}

export function xssSanitizer(req, res, next) {
    if (req.body)   req.body   = sanitizeValue(req.body);
    if (req.query)  req.query  = sanitizeValue(req.query);
    if (req.params) req.params = sanitizeValue(req.params);
    next();
}

// ── 4. Startup log ───────────────────────────────────────────
export function logSecurityConfig() {
    console.log('Security: helmet + XSS sanitizer + NoSQL sanitizer active'.green);
}