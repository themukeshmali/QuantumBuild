// ============================================================
// QUANTUM BUILD — Rate Limiting Middleware
// ============================================================

import rateLimit from 'express-rate-limit';

// General API rate limit — 100 req / 15 min per IP
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again in 15 minutes.' },
});

// Strict login rate limit — 10 attempts / 15 min
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please wait 15 minutes before trying again.' },
    skipSuccessfulRequests: true,
});

// Forgot password rate limit — 5 requests / 1 hour
export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many password reset requests. Please wait an hour before trying again.' },
});
