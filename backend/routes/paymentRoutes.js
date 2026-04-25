// ============================================================
// QUANTUM BUILD — Razorpay Payment Routes
// POST /api/payment/razorpay/order   — create Razorpay order
// POST /api/payment/razorpay/verify  — verify payment signature
// GET  /api/payment/razorpay/key     — get public key
// ============================================================

import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware.js';
import {
    validate,
    validateRazorpayOrder,
    validateRazorpayVerify,
} from '../middleware/validateMiddleware.js';


const router = express.Router();

// Lazily instantiate Razorpay so server starts even without keys
const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// @desc    Create Razorpay order
// @route   POST /api/payment/razorpay/order
// @access  Private
router.post('/razorpay/order', protect, validateRazorpayOrder, validate, asyncHandler(async (req, res) => {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || amount < 100) {
        res.status(400);
        throw new Error('Invalid amount. Minimum order is ₹1.');
    }

    const razorpay = getRazorpay();

    // Safety cap for Razorpay test mode maximum limit (Rs 5,00,000 = 50000000 paise)
    let finalAmount = Math.round(amount);
    if (finalAmount > 50000000) {
        finalAmount = 50000000;
    }

    const options = {
        amount: finalAmount,
        currency,
        receipt: `qb_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(400);
        throw new Error(error.error?.description || 'Razorpay order creation failed');
    }
}));

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/razorpay/verify
// @access  Private
router.post('/razorpay/verify', protect, validateRazorpayVerify, validate, asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400);
        throw new Error('Missing payment verification fields');
    }

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        res.status(400);
        throw new Error('Payment verification failed — invalid signature');
    }

    res.json({ success: true, paymentId: razorpay_payment_id });
}));

// @desc    Get Razorpay public key (safe to expose)
// @route   GET /api/payment/razorpay/key
// @access  Private
router.get('/razorpay/key', protect, asyncHandler(async (req, res) => {
    if (!process.env.RAZORPAY_KEY_ID) {
        res.status(503);
        throw new Error('Payment gateway not configured');
    }
    res.json({ key: process.env.RAZORPAY_KEY_ID });
}));

export default router;
