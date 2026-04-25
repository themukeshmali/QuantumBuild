// ============================================================
// QUANTUM BUILD — Input Validation Middleware (express-validator)
// Usage: add validators array to route, then use validate()
// ============================================================

import { body, param, validationResult } from 'express-validator';

// ── Validation Handler ────────────────────────────────────
// Reads express-validator errors and sends a 400 with the first message
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        const first = errors.array()[0];
        return res.json({ message: first.msg, field: first.path, errors: errors.array() });
    }
    next();
};

// ── User Validators ───────────────────────────────────────

export const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

export const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),
];

export const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),
];

export const validateResetPassword = [
    param('token')
        .notEmpty().withMessage('Reset token is required'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const validateUpdateProfile = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('password')
        .optional()
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

// ── Product Validators ────────────────────────────────────

export const validateCreateProduct = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ max: 200 }).withMessage('Product name too long'),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('countInStock')
        .notEmpty().withMessage('Stock quantity is required')
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

    body('category')
        .trim()
        .notEmpty().withMessage('Category is required'),

    body('brand')
        .trim()
        .notEmpty().withMessage('Brand is required'),

    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 2000 }).withMessage('Description too long'),
];

export const validateUpdateProduct = [
    param('id')
        .isMongoId().withMessage('Invalid product ID'),

    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('countInStock')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

// ── Order Validators ──────────────────────────────────────

export const validateCreateOrder = [
    body('orderItems')
        .isArray({ min: 1 }).withMessage('Order must have at least one item'),

    body('orderItems.*.name')
        .trim()
        .notEmpty().withMessage('Each order item must have a name'),

    body('orderItems.*.qty')
        .isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),

    body('orderItems.*.price')
        .isFloat({ min: 0 }).withMessage('Item price must be a positive number'),

    body('shippingAddress.address')
        .trim()
        .notEmpty().withMessage('Shipping address is required'),

    body('shippingAddress.city')
        .trim()
        .notEmpty().withMessage('City is required'),

    body('shippingAddress.postalCode')
        .trim()
        .notEmpty().withMessage('Postal code is required'),

    body('paymentMethod')
        .trim()
        .notEmpty().withMessage('Payment method is required'),

    body('totalPrice')
        .isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
];

// ── Payment Validators ────────────────────────────────────

export const validateRazorpayOrder = [
    body('amount')
        .isInt({ min: 100 }).withMessage('Amount must be at least ₹1 (100 paise)'),

    body('currency')
        .optional()
        .isIn(['INR', 'USD', 'EUR']).withMessage('Unsupported currency'),
];

export const validateRazorpayVerify = [
    body('razorpay_order_id')
        .notEmpty().withMessage('Razorpay order ID is required'),

    body('razorpay_payment_id')
        .notEmpty().withMessage('Razorpay payment ID is required'),

    body('razorpay_signature')
        .notEmpty().withMessage('Razorpay signature is required'),
];
